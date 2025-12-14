<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class UserController extends Controller
{
    /**
     * Generate a unique user ID with date, course, and number - short format
     * Format: COURSE_CODE(2) + DATE(MMDD) + ROLE(1) + SEQ(2)
     * Example: TA1129T01, TR1129I01 (TA course, Nov 29, Trainee #1)
     */
    private function generateUserId($courseId, $role): string
    {
        $course = Course::find($courseId);
        
        // Get course code (2 uppercase letters max)
        $courseCode = 'TA';
        if ($course) {
            if (!empty($course->code)) {
                $courseCode = strtoupper(substr($course->code, 0, 2));
            } elseif (!empty($course->name)) {
                // Extract first 2 letters from course name
                $courseCode = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $course->name), 0, 2));
            }
        }
        
        // Get date in MMDD format (month and day only)
        $date = date('md'); // e.g., 1129 for Nov 29
        
        // Get role prefix (single letter)
        $rolePrefix = match($role) {
            'trainee' => 'T',
            'instructor' => 'I',
            'doctor' => 'D',
            'admin' => 'A',
            default => 'U',
        };
        
        // Find the next sequence number for this course, role, and date
        $todayUsers = User::where('course_id', $courseId)
            ->where('role', $role)
            ->whereDate('created_at', today())
            ->count();
        
        $sequence = $todayUsers + 1;
        $userId = $courseCode . $date . $rolePrefix . str_pad($sequence, 2, '0', STR_PAD_LEFT);
        
        // Ensure uniqueness
        $counter = 1;
        while (User::where('user_id', $userId)->exists()) {
            $sequence = $todayUsers + 1 + $counter;
            $userId = $courseCode . $date . $rolePrefix . str_pad($sequence, 2, '0', STR_PAD_LEFT);
            $counter++;
        }
        
        return $userId;
    }

    public function index(Request $request)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            $users = User::query();

            // Super admins can see all users, regular admins see only their course
            if ($currentUser && $currentUser->role === 'super_admin') {
                // Super admin sees all users - no course filter
            } elseif ($courseId) {
                $users->where('course_id', $courseId);
            }

            if ($request->has('role')) {
                $users->where('role', $request->role);
            }
            
            if ($request->has('course_id')) {
                $users->where('course_id', $request->course_id);
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $users->where(function($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                          ->orWhere('email', 'like', "%{$search}%")
                          ->orWhere('user_id', 'like', "%{$search}%")
                          ->orWhere('phone', 'like', "%{$search}%")
                          ->orWhere('department', 'like', "%{$search}%");
                });
            }

            $usersList = $users->with(['subjects', 'course'])->get()->map(function ($user) {
                $subjects = [];
                try {
                    if ($user->relationLoaded('subjects') && $user->subjects) {
                        $subjects = $user->subjects->toArray();
                    }
                } catch (\Exception $e) {
                    \Log::warning('Error accessing subjects for user ' . $user->id . ': ' . $e->getMessage());
                    $subjects = [];
                }
                
                return [
                    'id' => $user->id,
                    'user_id' => $user->user_id ?? $user->id, // Use user_id if available, fallback to id
                    'name' => $user->name ?? '',
                    'email' => $user->email ?? '',
                    'role' => $user->role ?? '',
                    'phone' => $user->phone ?? null,
                    'department' => $user->department ?? null,
                    'avatar' => $user->avatar ?? null,
                    'passport_picture' => $user->passport_picture ?? null,
                    'course_id' => $user->course_id ?? null,
                    'course_name' => $user->course->name ?? null,
                    'subjects' => $subjects,
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $usersList,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading users: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load users: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            // First validate basic fields
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255',
                'role' => 'required|in:admin,instructor,doctor,trainee',
                'phone' => 'nullable|string',
                'department' => 'nullable|string',
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
            ]);

            // Validate password based on role
            $role = $validated['role'];
            $passwordRules = $role === 'trainee' ? 'nullable|string|min:8' : 'required|string|min:8';
            
            $passwordValidated = $request->validate([
                'password' => $passwordRules,
            ]);

            $currentUser = $request->user();
            
            // Super admins can specify course_id, regular admins use their assigned course
            $courseId = null;
            if ($currentUser->role === 'super_admin' && $request->has('course_id')) {
                $courseId = $request->course_id;
                // Validate that the course exists
                if (!Course::find($courseId)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid course ID provided.',
                    ], 422);
                }
            } else {
                $courseId = CourseHelper::getCurrentCourseId($currentUser);
            }
            
            if (!$courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be assigned to a course or specify a course ID to register users.',
                ], 422);
            }
            
            // Generate user ID based on course and date
            $userId = $this->generateUserId($courseId, $validated['role']);
            
            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'user_id' => $userId,
                'role' => $validated['role'],
                'phone' => $validated['phone'] ?? null,
                'department' => $validated['department'] ?? null,
                'course_id' => $courseId, // Assign to current course
            ];

            // Only set password if provided (not required for trainees)
            if (isset($passwordValidated['password']) && !empty($passwordValidated['password'])) {
                $userData['password'] = Hash::make($passwordValidated['password']);
            } elseif ($validated['role'] !== 'trainee') {
                // Password is required for non-trainee roles
                return response()->json([
                    'success' => false,
                    'message' => 'Password is required for this role.',
                ], 422);
            } else {
                // For trainees, set a random password (they won't use it anyway)
                $userData['password'] = Hash::make(uniqid('trainee_', true));
            }

            $user = User::create($userData);

            // Handle supportive documents upload for doctors
            if ($request->has('supportive_documents') && is_array($request->supportive_documents)) {
                $documentPaths = [];
                foreach ($request->supportive_documents as $document) {
                    if ($document && $document->isValid()) {
                        $fileName = time() . '_' . uniqid() . '_' . $document->getClientOriginalName();
                        $filePath = $document->storeAs('supportive_documents', $fileName, 'public');
                        $documentPaths[] = $filePath;
                    }
                }
                if (!empty($documentPaths)) {
                    $user->supportive_documents = json_encode($documentPaths);
                    $user->save();
                }
            }

            // Attach subjects if provided and user is instructor
            if ($validated['role'] === 'instructor' && isset($validated['subject_ids']) && !empty($validated['subject_ids'])) {
                $user->subjects()->attach($validated['subject_ids']);
            }

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load('subjects'),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, User $user)
    {
        try {
            // Check if user belongs to the same course
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            if ($courseId && $user->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. User does not belong to your course.',
                ], 403);
            }
            
            return response()->json([
                'success' => true,
                'data' => $user->load('subjects'),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load user: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, User $user)
    {
        try {
            // Check if user belongs to the same course
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            if ($courseId && $user->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. User does not belong to your course.',
                ], 403);
            }
            
            // Pre-process JSON strings from FormData before validation
            $requestData = $request->all();
            
            // Handle JSON strings for skills (when sent via FormData)
            if ($request->has('skills') && is_string($request->input('skills'))) {
                $skillsJson = json_decode($request->input('skills'), true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($skillsJson)) {
                    $requestData['skills'] = $skillsJson;
                }
            }
            
            // Handle JSON strings for relatives (when sent via FormData)
            if ($request->has('relatives')) {
                if (is_string($request->input('relatives'))) {
                    // Handle JSON string from FormData
                    $relativesJson = json_decode($request->input('relatives'), true);
                    if (json_last_error() === JSON_ERROR_NONE && is_array($relativesJson)) {
                        // Filter out empty relatives
                        $filteredRelatives = array_filter($relativesJson, function($rel) {
                            return !empty($rel['name']) && trim($rel['name']) !== '';
                        });
                        $requestData['relatives'] = !empty($filteredRelatives) ? array_values($filteredRelatives) : [];
                    } else {
                        $requestData['relatives'] = [];
                    }
                } elseif (is_array($request->input('relatives'))) {
                    // Handle direct array from JSON request
                    $filteredRelatives = array_filter($request->input('relatives'), function($rel) {
                        return !empty($rel['name']) && trim($rel['name']) !== '';
                    });
                    $requestData['relatives'] = !empty($filteredRelatives) ? array_values($filteredRelatives) : [];
                } else {
                    $requestData['relatives'] = [];
                }
            } else {
                // If relatives is not provided, set to empty array
                $requestData['relatives'] = [];
            }
            
            // Merge the processed data back into the request
            $request->merge($requestData);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255',
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|in:admin,instructor,doctor,trainee',
                'phone' => 'nullable|string',
                'department' => 'nullable|string',
                'avatar' => 'nullable|string',
                'passport_picture' => 'nullable|image|max:2048', // 2MB max for passport pictures
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
                // Extended fields
                'date_of_birth' => 'nullable|date',
                'gender' => 'nullable|string|max:255',
                'tribe' => 'nullable|string|max:255',
                'religion' => 'nullable|string|max:255',
                'blood_group' => 'nullable|string|max:255',
                'national_id' => 'nullable|string|max:255',
                'birth_region' => 'nullable|string|max:255',
                'birth_district' => 'nullable|string|max:255',
                'birth_street' => 'nullable|string|max:255',
                'phone_2' => 'nullable|string|max:255',
                'profession' => 'nullable|string|max:255',
                'university' => 'nullable|string|max:255',
                'employment' => 'nullable|string|max:255',
                'other_education_level' => 'nullable|string|max:255',
                'other_education_university' => 'nullable|string|max:255',
                'skills' => 'nullable|array',
                'marital_status' => 'nullable|string|max:255',
                'spouse_name' => 'nullable|string|max:255',
                'spouse_phone' => 'nullable|string|max:255',
                'father_name' => 'nullable|string|max:255',
                'father_phone' => 'nullable|string|max:255',
                'mother_name' => 'nullable|string|max:255',
                'mother_phone' => 'nullable|string|max:255',
                'number_of_children' => 'nullable|integer|min:0',
                'relatives' => 'nullable|array',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            }
            
            // Set relatives to null if empty array (to clear existing relatives)
            if (isset($validated['relatives']) && empty($validated['relatives'])) {
                $validated['relatives'] = null;
            }

            // Handle passport picture upload
            if ($request->hasFile('passport_picture')) {
                // Delete old passport picture if exists
                if ($user->passport_picture && Storage::disk('public')->exists($user->passport_picture)) {
                    Storage::disk('public')->delete($user->passport_picture);
                }
                
                $file = $request->file('passport_picture');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('passport_pictures', $fileName, 'public');
                $validated['passport_picture'] = $filePath;
            }

            // Handle supportive documents upload for doctors
            if ($request->has('supportive_documents') && is_array($request->supportive_documents)) {
                // Delete old documents if they exist
                if ($user->supportive_documents) {
                    $oldDocuments = json_decode($user->supportive_documents, true);
                    if (is_array($oldDocuments)) {
                        foreach ($oldDocuments as $oldDoc) {
                            if (Storage::disk('public')->exists($oldDoc)) {
                                Storage::disk('public')->delete($oldDoc);
                            }
                        }
                    }
                }
                
                $documentPaths = [];
                foreach ($request->supportive_documents as $document) {
                    if ($document && $document->isValid()) {
                        $fileName = time() . '_' . uniqid() . '_' . $document->getClientOriginalName();
                        $filePath = $document->storeAs('supportive_documents', $fileName, 'public');
                        $documentPaths[] = $filePath;
                    }
                }
                if (!empty($documentPaths)) {
                    $validated['supportive_documents'] = json_encode($documentPaths);
                }
            }

            // Remove subject_ids from validated array before updating user
            $subjectIds = $validated['subject_ids'] ?? null;
            unset($validated['subject_ids']);

            $user->update($validated);

            // Update subjects if provided and user is instructor
            if (($user->role === 'instructor' || ($request->has('role') && $request->role === 'instructor')) && $subjectIds !== null) {
                $user->subjects()->sync($subjectIds);
            } elseif (($user->role === 'instructor' || ($request->has('role') && $request->role === 'instructor')) && $subjectIds === null && $request->has('subject_ids')) {
                // If subject_ids is explicitly set to empty array
                $user->subjects()->sync([]);
            }

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->load('subjects'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
                'user_id' => $user->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, User $user)
    {
        // Check if user belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $user->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. User does not belong to your course.',
            ], 403);
        }
        
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }

    public function downloadPassportPicture(Request $request, User $user)
    {
        // Check if user belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $user->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. User does not belong to your course.',
            ], 403);
        }

        if (!$user->passport_picture) {
            return response()->json([
                'success' => false,
                'message' => 'User does not have a passport picture.',
            ], 404);
        }

        $filePath = storage_path('app/public/' . $user->passport_picture);
        
        if (!file_exists($filePath)) {
            return response()->json([
                'success' => false,
                'message' => 'Passport picture file not found.',
            ], 404);
        }

        // Extract filename from path
        $fileName = basename($user->passport_picture);
        
        return response()->download($filePath, $fileName, [
            'Content-Type' => 'image/jpeg',
        ]);
    }

    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set headers - Required fields first, then optional extended fields
        $headers = [
            'Name', // Required
            'Email', // Required
            'Phone', // Optional
            'Department', // Optional
            'Role', // Required (trainee, instructor, doctor, admin)
            'User ID (Optional - will be auto-generated if empty)', // Optional
            // Extended fields (all optional)
            'Date of Birth (YYYY-MM-DD)', // Tarehe ya Kuzaliwa
            'Gender (male/female/other)', // Jinsia
            'Tribe', // Kabila
            'Religion', // Dini
            'Blood Group', // Kundi la Damu
            'National ID', // National I.D
            'Birth Region', // Mahali Ulikozaliwa, Mkoa
            'Birth District', // Wilaya
            'Birth Street/Ward', // Mtaa
            'Phone 2', // Namba za Simu (2)
            'Profession', // Taaluma
            'University', // Chuo
            'Employment', // Ajira
            'Other Education Level', // Kiwango Kingine cha Elimu
            'Other Education University', // Chuo
            'Skill 1', // Ujuzi 1
            'Skill 1 University', // Chuo
            'Skill 2', // Ujuzi 2
            'Skill 2 University', // Chuo
            'Marital Status (single/married/divorced/widowed)', // Hali ya Ndoa
            'Spouse Name', // Mke/Mme
            'Spouse Phone', // Simu No
            'Father Name', // Baba
            'Father Phone', // Simu No
            'Mother Name', // Mama
            'Mother Phone', // Simu No
            'Number of Children', // Idadi ya Watoto wa Mkurufunzi
            'Relative 1 Name', // Ndugu wa Karibu wa Mkurufunzi
            'Relative 1 Relationship', // Mahusiano
            'Relative 1 Phone', // Simu No
            'Relative 2 Name',
            'Relative 2 Relationship',
            'Relative 2 Phone',
            'Relative 3 Name',
            'Relative 3 Relationship',
            'Relative 3 Phone',
        ];
        
        $sheet->fromArray($headers, null, 'A1');
        
        // Style header row
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'wrapText' => true,
        ];
        $lastColumn = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex(count($headers));
        $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(30);
        
        // Set column widths
        $columnWidths = [
            'A' => 25, 'B' => 30, 'C' => 20, 'D' => 25, 'E' => 15, 'F' => 30,
            'G' => 18, 'H' => 20, 'I' => 20, 'J' => 20, 'K' => 15, 'L' => 20,
            'M' => 20, 'N' => 20, 'O' => 20, 'P' => 20, 'Q' => 20, 'R' => 25,
            'S' => 30, 'T' => 25, 'U' => 25, 'V' => 20, 'W' => 25, 'X' => 20,
            'Y' => 25, 'Z' => 20, 'AA' => 20, 'AB' => 20, 'AC' => 20, 'AD' => 20,
            'AE' => 20, 'AF' => 20, 'AG' => 20, 'AH' => 20, 'AI' => 20, 'AJ' => 20,
            'AK' => 20, 'AL' => 20, 'AM' => 20, 'AN' => 20, 'AO' => 20, 'AP' => 20,
        ];
        foreach ($columnWidths as $col => $width) {
            $sheet->getColumnDimension($col)->setWidth($width);
        }
        
        // Add example row with empty values for optional fields
        $exampleRow = array_fill(0, count($headers), '');
        $exampleRow[0] = 'John Doe';
        $exampleRow[1] = 'john.doe@example.com';
        $exampleRow[2] = '+255 712 345 678';
        $exampleRow[3] = 'Field Operations';
        $exampleRow[4] = 'trainee';
        // Leave other fields empty as examples
        
        $sheet->fromArray([$exampleRow], null, 'A2');
        
        // Add note
        $sheet->setCellValue('A4', 'Note: Role must be one of: trainee, instructor, doctor, admin. All fields except Name, Email, and Role are optional.');
        $sheet->mergeCells('A4:' . $lastColumn . '4');
        $sheet->getStyle('A4')->getFont()->setItalic(true);
        $sheet->getStyle('A4')->getFont()->getColor()->setRGB('666666');
        
        $writer = new Xlsx($spreadsheet);
        
        $filename = 'user_import_template.xlsx';
        $tempFile = tempnam(sys_get_temp_dir(), $filename);
        $writer->save($tempFile);
        
        return response()->download($tempFile, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    public function importFromExcel(Request $request)
    {
        try {
            $validated = $request->validate([
                'users_file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
                'course_id' => 'nullable|exists:courses,id',
            ]);

            $currentUser = $request->user();
            $courseId = $validated['course_id'] ?? CourseHelper::getCurrentCourseId($currentUser);
            
            // Super admin can specify course_id, regular admin uses their course
            if (!$courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course ID is required. You must be assigned to a course or specify a course ID.',
                ], 422);
            }

            $file = $request->file('users_file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();
            
            $importedUsers = 0;
            $errors = [];
            $totalRows = count($rows);
            
            \Log::info('Excel import started', [
                'total_rows' => $totalRows,
                'course_id' => $courseId,
            ]);
            
            // Find the first data row (skip header row which typically has "Name" in first column)
            $startRow = 1; // Default: start from row 2 (index 1) to skip header
            for ($i = 0; $i < min(3, $totalRows); $i++) {
                $firstCell = strtolower(trim($rows[$i][0] ?? ''));
                // If we find "name" in first cell, the next row should be data
                if ($firstCell === 'name') {
                    $startRow = $i + 1;
                    break;
                }
            }
            
            \Log::info('Excel import - starting from row', ['start_row_index' => $startRow]);
            
            // Process rows starting from the detected start row
            for ($i = $startRow; $i < $totalRows; $i++) {
                $row = $rows[$i];
                
                // Skip completely empty rows
                $rowHasData = false;
                foreach ($row as $cell) {
                    if (!empty(trim($cell ?? ''))) {
                        $rowHasData = true;
                        break;
                    }
                }
                
                if (!$rowHasData) {
                    continue;
                }
                
                // Skip rows where name or email is missing (required fields)
                $name = trim($row[0] ?? '');
                $email = trim($row[1] ?? '');
                
                if (empty($name) || empty($email)) {
                    $errors[] = "Row " . ($i + 1) . ": Missing required fields (Name or Email).";
                    continue;
                }
                
                // Required fields
                $phone = trim($row[2] ?? '');
                $department = trim($row[3] ?? '');
                $role = strtolower(trim($row[4] ?? 'trainee'));
                $userId = trim($row[5] ?? '');
                
                // Extended fields (all optional)
                $dateOfBirth = !empty($row[6]) ? trim($row[6]) : null;
                $gender = !empty($row[7]) ? strtolower(trim($row[7])) : null;
                $tribe = !empty($row[8]) ? trim($row[8]) : null;
                $religion = !empty($row[9]) ? trim($row[9]) : null;
                $bloodGroup = !empty($row[10]) ? trim($row[10]) : null;
                $nationalId = !empty($row[11]) ? trim($row[11]) : null;
                $birthRegion = !empty($row[12]) ? trim($row[12]) : null;
                $birthDistrict = !empty($row[13]) ? trim($row[13]) : null;
                $birthStreet = !empty($row[14]) ? trim($row[14]) : null;
                $phone2 = !empty($row[15]) ? trim($row[15]) : null;
                $profession = !empty($row[16]) ? trim($row[16]) : null;
                $university = !empty($row[17]) ? trim($row[17]) : null;
                $employment = !empty($row[18]) ? trim($row[18]) : null;
                $otherEducationLevel = !empty($row[19]) ? trim($row[19]) : null;
                $otherEducationUniversity = !empty($row[20]) ? trim($row[20]) : null;
                $skill1 = !empty($row[21]) ? trim($row[21]) : null;
                $skill1University = !empty($row[22]) ? trim($row[22]) : null;
                $skill2 = !empty($row[23]) ? trim($row[23]) : null;
                $skill2University = !empty($row[24]) ? trim($row[24]) : null;
                $maritalStatus = !empty($row[25]) ? strtolower(trim($row[25])) : null;
                $spouseName = !empty($row[26]) ? trim($row[26]) : null;
                $spousePhone = !empty($row[27]) ? trim($row[27]) : null;
                $fatherName = !empty($row[28]) ? trim($row[28]) : null;
                $fatherPhone = !empty($row[29]) ? trim($row[29]) : null;
                $motherName = !empty($row[30]) ? trim($row[30]) : null;
                $motherPhone = !empty($row[31]) ? trim($row[31]) : null;
                $numberOfChildren = !empty($row[32]) ? (int)trim($row[32]) : null;
                $relative1Name = !empty($row[33]) ? trim($row[33]) : null;
                $relative1Relationship = !empty($row[34]) ? trim($row[34]) : null;
                $relative1Phone = !empty($row[35]) ? trim($row[35]) : null;
                $relative2Name = !empty($row[36]) ? trim($row[36]) : null;
                $relative2Relationship = !empty($row[37]) ? trim($row[37]) : null;
                $relative2Phone = !empty($row[38]) ? trim($row[38]) : null;
                $relative3Name = !empty($row[39]) ? trim($row[39]) : null;
                $relative3Relationship = !empty($row[40]) ? trim($row[40]) : null;
                $relative3Phone = !empty($row[41]) ? trim($row[41]) : null;
                
                // Validate role
                if (!in_array($role, ['trainee', 'instructor', 'doctor', 'admin'])) {
                    $errors[] = "Row " . ($i + 1) . ": Invalid role '{$role}'. Must be trainee, instructor, doctor, or admin.";
                    continue;
                }
                
                // Validate email
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $errors[] = "Row " . ($i + 1) . ": Invalid email '{$email}'.";
                    continue;
                }
                
                // Validate gender if provided
                if ($gender && !in_array($gender, ['male', 'female', 'other'])) {
                    $errors[] = "Row " . ($i + 1) . ": Invalid gender '{$gender}'. Must be male, female, or other.";
                    continue;
                }
                
                // Validate marital status if provided
                if ($maritalStatus && !in_array($maritalStatus, ['single', 'married', 'divorced', 'widowed'])) {
                    $errors[] = "Row " . ($i + 1) . ": Invalid marital status '{$maritalStatus}'. Must be single, married, divorced, or widowed.";
                    continue;
                }
                
                // Validate date of birth if provided
                $dateOfBirthFormatted = null;
                if ($dateOfBirth) {
                    try {
                        $dateOfBirthFormatted = \Carbon\Carbon::parse($dateOfBirth)->format('Y-m-d');
                    } catch (\Exception $e) {
                        $errors[] = "Row " . ($i + 1) . ": Invalid date of birth format '{$dateOfBirth}'. Use YYYY-MM-DD format.";
                        continue;
                    }
                }
                
                // Generate user_id if not provided
                if (empty($userId)) {
                    $userId = $this->generateUserId($courseId, $role);
                } else {
                    // Check if provided user_id already exists
                    if (User::where('user_id', $userId)->exists()) {
                        $errors[] = "Row " . ($i + 1) . ": User ID '{$userId}' already exists.";
                        continue;
                    }
                }
                
                // Build skills array
                $skills = [];
                if ($skill1) {
                    $skills[] = ['skill' => $skill1, 'university' => $skill1University ?: null];
                }
                if ($skill2) {
                    $skills[] = ['skill' => $skill2, 'university' => $skill2University ?: null];
                }
                
                // Build relatives array
                $relatives = [];
                if ($relative1Name) {
                    $relatives[] = [
                        'name' => $relative1Name,
                        'relationship' => $relative1Relationship ?: null,
                        'phone' => $relative1Phone ?: null,
                    ];
                }
                if ($relative2Name) {
                    $relatives[] = [
                        'name' => $relative2Name,
                        'relationship' => $relative2Relationship ?: null,
                        'phone' => $relative2Phone ?: null,
                    ];
                }
                if ($relative3Name) {
                    $relatives[] = [
                        'name' => $relative3Name,
                        'relationship' => $relative3Relationship ?: null,
                        'phone' => $relative3Phone ?: null,
                    ];
                }
                
                // Create user
                $userData = [
                    'name' => $name,
                    'email' => $email,
                    'user_id' => $userId,
                    'role' => $role,
                    'phone' => $phone ?: null,
                    'department' => $department ?: null,
                    'course_id' => $courseId,
                    // Extended fields
                    'date_of_birth' => $dateOfBirthFormatted,
                    'gender' => $gender,
                    'tribe' => $tribe,
                    'religion' => $religion,
                    'blood_group' => $bloodGroup,
                    'national_id' => $nationalId,
                    'birth_region' => $birthRegion,
                    'birth_district' => $birthDistrict,
                    'birth_street' => $birthStreet,
                    'phone_2' => $phone2,
                    'profession' => $profession,
                    'university' => $university,
                    'employment' => $employment,
                    'other_education_level' => $otherEducationLevel,
                    'other_education_university' => $otherEducationUniversity,
                    'skills' => !empty($skills) ? $skills : null,
                    'marital_status' => $maritalStatus,
                    'spouse_name' => $spouseName,
                    'spouse_phone' => $spousePhone,
                    'father_name' => $fatherName,
                    'father_phone' => $fatherPhone,
                    'mother_name' => $motherName,
                    'mother_phone' => $motherPhone,
                    'number_of_children' => $numberOfChildren,
                    'relatives' => !empty($relatives) ? $relatives : null,
                ];
                
                // Set password based on role
                if ($role === 'trainee') {
                    $userData['password'] = Hash::make(uniqid('trainee_', true));
                } else {
                    // For other roles, set a temporary password that needs to be changed
                    $userData['password'] = Hash::make('temp_password_' . uniqid());
                }
                
                User::create($userData);
                $importedUsers++;
            }

            \Log::info('Excel import completed', [
                'imported' => $importedUsers,
                'errors_count' => count($errors),
                'total_rows_processed' => $totalRows - $startRow,
                'start_row_index' => $startRow,
            ]);

            if ($importedUsers === 0 && empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No users were imported. Please check that your Excel file has data rows starting from row 3 (skip header row 1 and example row 2). Ensure Name and Email columns are filled.',
                    'data' => [
                        'imported' => 0,
                        'errors' => ['No valid user data found in the Excel file. Make sure you have data in rows starting from row 3, with Name in column A and Email in column B.'],
                    ],
                ], 422);
            }

            $message = "Successfully imported {$importedUsers} user(s).";
            if (!empty($errors)) {
                $message .= " " . count($errors) . " error(s) occurred: " . implode('; ', array_slice($errors, 0, 5)); // Limit to first 5 errors
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'imported' => $importedUsers,
                    'errors' => $errors,
                ],
            ]);
        } catch (\Exception $e) {
            \Log::error('Error importing users from Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to import users: ' . $e->getMessage(),
            ], 500);
        }
    }
}

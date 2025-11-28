<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class UserController extends Controller
{
    /**
     * Generate a unique user ID based on course and date
     * Format: COURSE_CODE-YYYYMMDD-XXX (e.g., TAWA-20241118-001)
     */
    private function generateUserId($courseId, $role): string
    {
        $course = Course::find($courseId);
        $courseCode = $course ? strtoupper(substr($course->code ?? $course->name, 0, 4)) : 'TAWA';
        
        // Get date in YYYYMMDD format
        $date = date('Ymd');
        
        // Get role prefix
        $rolePrefix = match($role) {
            'trainee' => 'TR',
            'instructor' => 'IN',
            'doctor' => 'DR',
            'admin' => 'AD',
            default => 'US',
        };
        
        // Find the next sequence number for today
        $todayUsers = User::where('course_id', $courseId)
            ->whereDate('created_at', today())
            ->where('role', $role)
            ->count();
        
        $sequence = str_pad($todayUsers + 1, 3, '0', STR_PAD_LEFT);
        
        $userId = "{$courseCode}-{$date}-{$rolePrefix}{$sequence}";
        
        // Ensure uniqueness
        $counter = 1;
        while (User::where('user_id', $userId)->exists()) {
            $sequence = str_pad($todayUsers + 1 + $counter, 3, '0', STR_PAD_LEFT);
            $userId = "{$courseCode}-{$date}-{$rolePrefix}{$sequence}";
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
                'email' => 'required|string|email|max:255|unique:users',
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
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:255',
                'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
                'password' => 'sometimes|string|min:8',
                'role' => 'sometimes|in:admin,instructor,doctor,trainee',
                'phone' => 'nullable|string',
                'department' => 'nullable|string',
                'avatar' => 'nullable|string',
                'subject_ids' => 'nullable|array',
                'subject_ids.*' => 'exists:subjects,id',
            ]);

            if (isset($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
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

    public function downloadTemplate()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Set headers
        $headers = [
            'Name',
            'Email',
            'Phone',
            'Department',
            'Role',
            'User ID (Optional - will be auto-generated if empty)',
        ];
        
        $sheet->fromArray($headers, null, 'A1');
        
        // Style header row
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '4472C4']
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ];
        $sheet->getStyle('A1:F1')->applyFromArray($headerStyle);
        
        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(20);
        $sheet->getColumnDimension('D')->setWidth(25);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(30);
        
        // Add example row
        $exampleRow = [
            'John Doe',
            'john.doe@example.com',
            '+255 712 345 678',
            'Field Operations',
            'trainee',
            '',
        ];
        $sheet->fromArray($exampleRow, null, 'A2');
        
        // Add note
        $sheet->setCellValue('A4', 'Note: Role must be one of: trainee, instructor, doctor, admin');
        $sheet->mergeCells('A4:F4');
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
            
            // Skip header row (row 1) and example row (row 2)
            for ($i = 2; $i < count($rows); $i++) {
                $row = $rows[$i];
                
                // Skip empty rows
                if (empty($row[0]) || empty($row[1])) {
                    continue;
                }
                
                $name = trim($row[0] ?? '');
                $email = trim($row[1] ?? '');
                $phone = trim($row[2] ?? '');
                $department = trim($row[3] ?? '');
                $role = strtolower(trim($row[4] ?? 'trainee'));
                $userId = trim($row[5] ?? '');
                
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
                
                // Check if email already exists
                if (User::where('email', $email)->exists()) {
                    $errors[] = "Row " . ($i + 1) . ": Email '{$email}' already exists.";
                    continue;
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
                
                // Create user
                $userData = [
                    'name' => $name,
                    'email' => $email,
                    'user_id' => $userId,
                    'role' => $role,
                    'phone' => $phone ?: null,
                    'department' => $department ?: null,
                    'course_id' => $courseId,
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

            $message = "Successfully imported {$importedUsers} user(s).";
            if (!empty($errors)) {
                $message .= " Errors: " . implode(' ', array_slice($errors, 0, 10)); // Limit to first 10 errors
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

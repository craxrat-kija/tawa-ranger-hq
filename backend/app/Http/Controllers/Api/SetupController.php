<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class SetupController extends Controller
{
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
        $sheet->setCellValue('A4', 'Note: Role must be one of: trainee, instructor, doctor');
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

    public function setup(Request $request)
    {
        // Allow multiple admins - each admin gets their own course and isolated data
        // Check if email already exists
        $emailExists = User::where('email', $request->adminEmail)->exists();
        
        if ($emailExists) {
            return response()->json([
                'success' => false,
                'message' => 'An account with this email already exists. Please use a different email or login.',
            ], 400);
        }

        $validated = $request->validate([
            // Admin fields
            'adminName' => 'required|string|max:255',
            'adminEmail' => 'required|string|email|max:255|unique:users,email',
            'adminPassword' => 'required|string|min:8',
            'adminPhone' => 'nullable|string',
            'adminDepartment' => 'nullable|string',
            
            // Course fields
            'courseCode' => 'required|string|max:50|regex:/^[A-Z0-9]+$/|unique:courses,code',
            'courseName' => 'required|string|max:255',
            'courseType' => 'required|string',
            'courseDuration' => 'required|string',
            'courseDescription' => 'nullable|string',
            'startDate' => 'required|date',
            'location' => 'nullable|string|max:255',
            
            // Excel file
            'users_file' => 'nullable|file|mimes:xlsx,xls|max:10240', // 10MB max
        ]);

        try {
            // Start transaction for creating course and admin
            DB::beginTransaction();
            
            try {
                // Create new course with code (each admin gets their own course)
                $course = Course::create([
                    'code' => strtoupper($validated['courseCode']),
                    'name' => $validated['courseName'],
                    'type' => $validated['courseType'],
                    'duration' => $validated['courseDuration'],
                    'description' => $validated['courseDescription'] ?? null,
                    'start_date' => $validated['startDate'],
                    'location' => $validated['location'] ?? null,
                    'status' => 'upcoming',
                    'trainees' => 0,
                    'content' => null,
                ]);

                // Create admin user linked to the course (each admin has their own isolated course)
                $admin = User::create([
                    'name' => $validated['adminName'],
                    'email' => $validated['adminEmail'],
                    'password' => Hash::make($validated['adminPassword']),
                    'role' => 'admin',
                    'phone' => $validated['adminPhone'] ?? null,
                    'department' => $validated['adminDepartment'] ?? null,
                    'course_id' => $course->id, // Each admin is assigned to their own course
                ]);

                // Process Excel file if provided
                $importedUsers = 0;
                $errors = [];
                
                if ($request->hasFile('users_file')) {
                    try {
                        $file = $request->file('users_file');
                        $spreadsheet = IOFactory::load($file->getRealPath());
                        $worksheet = $spreadsheet->getActiveSheet();
                        $rows = $worksheet->toArray();
                        
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
                            if (!in_array($role, ['trainee', 'instructor', 'doctor'])) {
                                $errors[] = "Row " . ($i + 1) . ": Invalid role '{$role}'. Must be trainee, instructor, or doctor.";
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
                                $date = date('Ymd');
                                $rolePrefix = $role === 'trainee' ? 'TR' : ($role === 'instructor' ? 'IN' : 'DR');
                                $courseCode = $course->code;
                                $counter = 1;
                                
                                do {
                                    $sequence = str_pad($counter, 3, '0', STR_PAD_LEFT);
                                    $userId = "{$courseCode}-{$date}-{$rolePrefix}{$sequence}";
                                    $counter++;
                                } while (User::where('user_id', $userId)->exists());
                            } else {
                                // Check if provided user_id already exists
                                if (User::where('user_id', $userId)->exists()) {
                                    $errors[] = "Row " . ($i + 1) . ": User ID '{$userId}' already exists.";
                                    continue;
                                }
                            }
                            
                            // Create user without password (admin will set it later)
                            User::create([
                                'name' => $name,
                                'email' => $email,
                                'user_id' => $userId,
                                'password' => Hash::make('temp_password_' . uniqid()), // Temporary password
                                'role' => $role,
                                'phone' => $phone ?: null,
                                'department' => $department ?: null,
                                'course_id' => $course->id,
                            ]);
                            
                            $importedUsers++;
                        }
                    } catch (\Exception $e) {
                        $errors[] = "Error processing Excel file: " . $e->getMessage();
                    }
                }

                DB::commit();

                $message = 'New admin and course created successfully.';
                if ($importedUsers > 0) {
                    $message .= " {$importedUsers} user(s) imported from Excel.";
                }
                if (!empty($errors)) {
                    $message .= " Errors: " . implode(' ', $errors);
                }

                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'data' => [
                        'admin' => [
                            'id' => $admin->id,
                            'name' => $admin->name,
                            'email' => $admin->email,
                        ],
                        'course' => [
                            'id' => $course->id,
                            'code' => $course->code,
                            'name' => $course->name,
                        ],
                        'imported_users' => $importedUsers,
                        'errors' => $errors,
                    ],
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin and course: ' . $e->getMessage(),
            ], 500);
        }
    }


    public function checkSetup()
    {
        // Always return true - setup is always available for new admins
        // Each admin can create their own course through setup
        $isSetup = User::where('role', 'admin')->exists();
        
        return response()->json([
            'success' => true,
            'is_setup' => $isSetup,
            'can_setup' => true, // Always allow new admin/course creation
        ]);
    }
}

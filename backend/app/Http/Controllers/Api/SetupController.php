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
        
        // Set headers - Required fields first, then optional extended fields
        $headers = [
            'Name', // Required
            'Email', // Required
            'Phone', // Optional
            'Department', // Optional
            'Role', // Required (trainee, instructor, doctor)
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
        $sheet->setCellValue('A4', 'Note: Role must be one of: trainee, instructor, doctor. All fields except Name, Email, and Role are optional.');
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

    public function setup(Request $request)
    {
        // Allow multiple admins - each admin gets their own course and isolated data
        // Email no longer needs to be unique

        $validated = $request->validate([
            // Admin fields
            'adminName' => 'required|string|max:255',
            'adminEmail' => 'required|string|email|max:255',
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
                            
                            // Required fields
                            $name = trim($row[0] ?? '');
                            $email = trim($row[1] ?? '');
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
                            if (!in_array($role, ['trainee', 'instructor', 'doctor'])) {
                                $errors[] = "Row " . ($i + 1) . ": Invalid role '{$role}'. Must be trainee, instructor, or doctor.";
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

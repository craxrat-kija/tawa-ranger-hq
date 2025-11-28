<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class SetupController extends Controller
{
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

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'New admin and course created successfully. You can now login.',
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

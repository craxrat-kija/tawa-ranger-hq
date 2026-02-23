<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Prevent trainees from logging in
        if ($user->role === 'trainee') {
            throw ValidationException::withMessages([
                'email' => ['Trainees do not have access to the login system. Please contact your administrator.'],
            ]);
        }

        // Prevent super_admin from logging in through regular login
        if ($user->role === 'super_admin') {
            throw ValidationException::withMessages([
                'email' => ['Super admins must use the dedicated super admin portal. Please use /super-admin'],
            ]);
        }

        // Check course enrollments
        $enrolledCourses = $user->enrolledCourses;

        // If user has multiple courses and no specific course_id provided in login
        if ($enrolledCourses->count() > 1 && !$request->has('course_id')) {
            return response()->json([
                'success' => true,
                'requires_course_selection' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ],
                    'courses' => $enrolledCourses->map(function ($course) {
                        return [
                            'id' => $course->id,
                            'name' => $course->name,
                            'code' => $course->code,
                        ];
                    }),
                ],
            ]);
        }

        // If a specific course_id was selected or only one course exists
        $selectedCourse = null;
        if ($request->has('course_id')) {
            $selectedCourse = $enrolledCourses->firstWhere('id', $request->course_id);
            if (!$selectedCourse) {
                throw ValidationException::withMessages([
                    'course_id' => ['You are not enrolled in the selected course.'],
                ]);
            }
        } elseif ($enrolledCourses->count() === 1) {
            $selectedCourse = $enrolledCourses->first();
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'user_id' => $user->user_id ?? $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'department' => $user->department,
                    'avatar' => $user->avatar,
                    'course_id' => $selectedCourse ? $selectedCourse->id : null,
                    'course_name' => $selectedCourse ? $selectedCourse->name : null,
                    'enrolled_courses' => $enrolledCourses->map(function ($course) {
                        return [
                            'id' => $course->id,
                            'name' => $course->name,
                            'code' => $course->code,
                        ];
                    }),
                ],
                'token' => $token,
            ],
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,instructor,doctor,trainee,super_admin',
            'phone' => 'nullable|string',
            'department' => 'nullable|string',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'phone' => $request->phone,
            'department' => $request->department,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'department' => $user->department,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    public function superAdminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Only allow super_admin to login through this endpoint
        if ($user->role !== 'super_admin') {
            throw ValidationException::withMessages([
                'email' => ['This login page is only for Super Administrators. Please use the regular login page.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'user_id' => $user->user_id ?? $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'department' => $user->department,
                    'avatar' => $user->avatar,
                    'course_id' => null, // Super admin is not tied to a single course
                    'enrolled_courses' => \App\Models\Course::all()->map(function ($course) {
                        return [
                            'id' => $course->id,
                            'name' => $course->name,
                            'code' => $course->code,
                        ];
                    }),
                ],
                'token' => $token,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        $enrolledCourses = $user->enrolledCourses;

        return response()->json([
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'user_id' => $user->user_id ?? $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'department' => $user->department,
                    'avatar' => $user->avatar,
                    'enrolled_courses' => $enrolledCourses,
                ],
            ],
        ]);
    }
}

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
            'user_id' => 'required|string',
            'password' => 'required',
        ]);

        // Try to find user by user_id first, then fallback to email for backward compatibility
        $user = User::where('user_id', $request->user_id)
                    ->orWhere('email', $request->user_id)
                    ->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'user_id' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Prevent trainees from logging in
        if ($user->role === 'trainee') {
            throw ValidationException::withMessages([
                'user_id' => ['Trainees do not have access to the login system. Please contact your administrator.'],
            ]);
        }

        // Load course relationship to get course name
        $user->load('course');

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
                    'course_id' => $user->course_id,
                    'course_name' => $user->course->name ?? null,
                ],
                'token' => $token,
            ],
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,instructor,doctor,trainee',
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
        $user = $request->user()->load('course');
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
                    'course_id' => $user->course_id,
                    'course_name' => $user->course->name ?? null,
                ],
            ],
        ]);
    }
}

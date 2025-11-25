<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        try {
            $users = User::query();

            if ($request->has('role')) {
                $users->where('role', $request->role);
            }

            $usersList = $users->with('subjects')->get()->map(function ($user) {
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
                    'name' => $user->name ?? '',
                    'email' => $user->email ?? '',
                    'role' => $user->role ?? '',
                    'phone' => $user->phone ?? null,
                    'department' => $user->department ?? null,
                    'avatar' => $user->avatar ?? null,
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

            $userData = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $validated['role'],
                'phone' => $validated['phone'] ?? null,
                'department' => $validated['department'] ?? null,
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

    public function show(User $user)
    {
        try {
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

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}

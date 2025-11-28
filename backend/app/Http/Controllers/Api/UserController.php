<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Course;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

            // Filter by course_id - only show users from the same course
            if ($courseId) {
                $users->where('course_id', $courseId);
            }

            if ($request->has('role')) {
                $users->where('role', $request->role);
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
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            if (!$courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be assigned to a course to register users.',
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
}

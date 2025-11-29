<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;
use App\Helpers\CourseHelper;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $courses = Course::with('instructor');

        if ($request->has('status')) {
            $courses->where('status', $request->status);
        }

        if ($request->has('instructor_id')) {
            $courses->where('instructor_id', $request->instructor_id);
        }

        // Limit admins to their assigned course for isolation
        // But allow instructors to see courses where they are the instructor
        if ($user && $user->role !== 'super_admin' && $user->role !== 'instructor') {
            $courseId = CourseHelper::getCurrentCourseId($user);
            if ($courseId) {
                $courses->where('id', $courseId);
            } else {
                $courses->whereRaw('1 = 0');
            }
        }
        
        // For instructors, if no instructor_id is specified, show courses where they are the instructor
        if ($user && $user->role === 'instructor' && !$request->has('instructor_id')) {
            $courses->where('instructor_id', $user->id);
        }

        $coursesList = $courses->get();

        // If user is authenticated, add enrollment status
        if ($request->user()) {
            $user = $request->user();
            $enrolledCourseIds = $user->enrolledCourses()->pluck('courses.id')->toArray();
            
            $coursesList = $coursesList->map(function ($course) use ($enrolledCourseIds) {
                $courseArray = $course->toArray();
                $courseArray['is_enrolled'] = in_array($course->id, $enrolledCourseIds);
                // Don't include content in list view, only in detail view
                unset($courseArray['content']);
                return $courseArray;
            });
        } else {
            // Remove content from list for unauthenticated users
            $coursesList = $coursesList->map(function ($course) {
                $courseArray = $course->toArray();
                unset($courseArray['content']);
                return $courseArray;
            });
        }

        return response()->json([
            'success' => true,
            'data' => $coursesList,
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();

        if (!$currentUser || $currentUser->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only super administrators can create courses.',
            ], 403);
        }
        
        $validated = $request->validate([
            'code' => 'required|string|max:50|regex:/^[A-Z0-9]+$/|unique:courses,code',
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'duration' => 'required|string',
            'instructor_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'status' => 'sometimes|in:active,completed,upcoming',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'location' => 'nullable|string|max:255',
        ]);

        // Ensure code is uppercase
        $validated['code'] = strtoupper($validated['code']);
        $course = Course::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully',
            'data' => $course->load('instructor'),
        ], 201);
    }

    public function show(Request $request, Course $course)
    {
        if (!$this->userCanAccessCourse($request->user(), $course) && !$this->userIsCourseEnrolled($request->user(), $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Course does not belong to you.',
            ], 403);
        }

        $courseData = $course->load('instructor')->toArray();
        
        // Check if user is enrolled (only enrolled users can see content)
        $isEnrolled = false;
        if ($request->user()) {
            $isEnrolled = $request->user()->enrolledCourses()->where('courses.id', $course->id)->exists();
        }
        
        // Only include content if user is enrolled or is admin/super_admin
        if (!$isEnrolled && $request->user()?->role !== 'admin' && $request->user()?->role !== 'super_admin') {
            unset($courseData['content']);
        }
        
        $courseData['is_enrolled'] = $isEnrolled;
        
        return response()->json([
            'success' => true,
            'data' => $courseData,
        ]);
    }

    public function update(Request $request, Course $course)
    {
        if (!$this->userCanAccessCourse($request->user(), $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only manage your assigned course.',
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'duration' => 'sometimes|string',
            'instructor_id' => 'sometimes|exists:users,id',
            'start_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,completed,upcoming',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'trainees' => 'sometimes|integer|min:0',
        ]);

        $course->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'data' => $course->load('instructor'),
        ]);
    }

    public function destroy(Request $request, Course $course)
    {
        if (!$this->userCanAccessCourse($request->user(), $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only delete your assigned course.',
            ], 403);
        }

        $course->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course deleted successfully',
        ]);
    }

    /**
     * Enroll the authenticated user in a course
     */
    public function enroll(Request $request, Course $course)
    {
        $user = $request->user();

        // Check if already enrolled
        if ($user->enrolledCourses()->where('courses.id', $course->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'You are already enrolled in this course',
            ], 400);
        }

        $user->enrolledCourses()->attach($course->id, [
            'enrolled_at' => now(),
        ]);

        // Update course trainees count
        $course->increment('trainees');

        return response()->json([
            'success' => true,
            'message' => 'Successfully enrolled in course',
            'data' => $course->load('instructor'),
        ]);
    }

    /**
     * Unenroll the authenticated user from a course
     */
    public function unenroll(Request $request, Course $course)
    {
        $user = $request->user();

        // Check if enrolled
        if (!$user->enrolledCourses()->where('courses.id', $course->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'You are not enrolled in this course',
            ], 400);
        }

        $user->enrolledCourses()->detach($course->id);

        // Update course trainees count
        if ($course->trainees > 0) {
            $course->decrement('trainees');
        }

        return response()->json([
            'success' => true,
            'message' => 'Successfully unenrolled from course',
        ]);
    }

    /**
     * Get courses enrolled by the authenticated user
     */
    public function myCourses(Request $request)
    {
        $user = $request->user();
        $courses = $user->enrolledCourses()
            ->with('instructor')
            ->get()
            ->map(function ($course) {
                $courseArray = $course->toArray();
                $courseArray['is_enrolled'] = true;
                $courseArray['enrolled_at'] = $course->pivot->enrolled_at;
                return $courseArray;
            });

        return response()->json([
            'success' => true,
            'data' => $courses,
        ]);
    }

    /**
     * Get available courses (not enrolled by the authenticated user)
     */
    public function availableCourses(Request $request)
    {
        $user = $request->user();
        $enrolledCourseIds = $user->enrolledCourses()->pluck('courses.id')->toArray();

        $courses = Course::with('instructor')
            ->whereNotIn('id', $enrolledCourseIds)
            ->get()
            ->map(function ($course) {
                $courseArray = $course->toArray();
                $courseArray['is_enrolled'] = false;
                // Don't include content in list view
                unset($courseArray['content']);
                return $courseArray;
            });

        return response()->json([
            'success' => true,
            'data' => $courses,
        ]);
    }

    /**
     * Enroll a user to a course (Admin only)
     */
    public function enrollUser(Request $request, Course $course, User $user)
    {
        // Check if user is admin or super_admin
        if ($request->user()->role !== 'admin' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can enroll users.',
            ], 403);
        }

        if (!$this->userCanAccessCourse($request->user(), $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Course does not belong to you.',
            ], 403);
        }

        // Check if already enrolled
        if ($user->enrolledCourses()->where('courses.id', $course->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'User is already enrolled in this course',
            ], 400);
        }

        $user->enrolledCourses()->attach($course->id, [
            'enrolled_at' => now(),
        ]);

        // Update user's course_id if they don't have one (for course isolation)
        if (!$user->course_id) {
            $user->update(['course_id' => $course->id]);
        }

        // Update course trainees count
        $course->increment('trainees');

        return response()->json([
            'success' => true,
            'message' => 'User enrolled successfully',
            'data' => $course->load('instructor'),
        ]);
    }

    /**
     * Unenroll a user from a course (Admin only)
     */
    public function unenrollUser(Request $request, Course $course, User $user)
    {
        // Check if user is admin or super_admin
        if ($request->user()->role !== 'admin' && $request->user()->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can unenroll users.',
            ], 403);
        }

        if (!$this->userCanAccessCourse($request->user(), $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Course does not belong to you.',
            ], 403);
        }

        // Check if enrolled
        if (!$user->enrolledCourses()->where('courses.id', $course->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'User is not enrolled in this course',
            ], 400);
        }

        $user->enrolledCourses()->detach($course->id);

        // Update course trainees count
        if ($course->trainees > 0) {
            $course->decrement('trainees');
        }

        return response()->json([
            'success' => true,
            'message' => 'User unenrolled successfully',
        ]);
    }

    /**
     * Get enrolled users for a course (Admin, Super Admin, and Instructors)
     */
    public function enrolledUsers(Request $request, Course $course)
    {
        $user = $request->user();
        
        // Check if user is admin, super_admin, or instructor
        if (!in_array($user->role, ['admin', 'super_admin', 'instructor'])) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins and instructors can view enrolled users.',
            ], 403);
        }

        // For instructors, check if they are the instructor of this course
        if ($user->role === 'instructor') {
            if ($course->instructor_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. You are not the instructor of this course.',
                ], 403);
            }
        } elseif (!$this->userCanAccessCourse($user, $course)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Course does not belong to you.',
            ], 403);
        }

        $users = $course->enrolledUsers()
            ->get()
            ->map(function ($user) use ($course) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'phone' => $user->phone,
                    'department' => $user->department,
                    'enrolled_at' => $user->pivot->enrolled_at,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $users,
        ]);
    }
    private function userCanAccessCourse(?User $user, Course $course): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->role === 'super_admin') {
            return true;
        }

        return $user->course_id === $course->id;
    }

    private function userIsCourseEnrolled(?User $user, Course $course): bool
    {
        if (!$user) {
            return false;
        }

        if ($this->userCanAccessCourse($user, $course)) {
            return true;
        }

        return $user->enrolledCourses()->where('courses.id', $course->id)->exists();
    }
}

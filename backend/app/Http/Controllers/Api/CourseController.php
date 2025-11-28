<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\User;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $courses = Course::with('instructor');

        if ($request->has('status')) {
            $courses->where('status', $request->status);
        }

        if ($request->has('instructor_id')) {
            $courses->where('instructor_id', $request->instructor_id);
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
        ]);

        // Ensure code is uppercase
        $validated['code'] = strtoupper($validated['code']);

        $course = Course::create($validated);

        // If admin created the course and doesn't have a course_id, assign them to this new course
        if ($currentUser && $currentUser->role === 'admin' && !$currentUser->course_id) {
            $currentUser->update(['course_id' => $course->id]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully',
            'data' => $course->load('instructor'),
        ], 201);
    }

    public function show(Request $request, Course $course)
    {
        $courseData = $course->load('instructor')->toArray();
        
        // Check if user is enrolled (only enrolled users can see content)
        $isEnrolled = false;
        if ($request->user()) {
            $isEnrolled = $request->user()->enrolledCourses()->where('courses.id', $course->id)->exists();
        }
        
        // Only include content if user is enrolled or is admin
        if (!$isEnrolled && $request->user()?->role !== 'admin') {
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
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|string',
            'duration' => 'sometimes|string',
            'instructor_id' => 'sometimes|exists:users,id',
            'start_date' => 'sometimes|date',
            'status' => 'sometimes|in:active,completed,upcoming',
            'description' => 'nullable|string',
            'content' => 'nullable|string',
            'trainees' => 'sometimes|integer|min:0',
        ]);

        $course->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Course updated successfully',
            'data' => $course->load('instructor'),
        ]);
    }

    public function destroy(Course $course)
    {
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
        // Check if user is admin
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can enroll users.',
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
        // Check if user is admin
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can unenroll users.',
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
     * Get enrolled users for a course (Admin only)
     */
    public function enrolledUsers(Request $request, Course $course)
    {
        // Check if user is admin
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can view enrolled users.',
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
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $subjects = Subject::query();

        // Admins can view all subjects across all courses
        // Only filter by course for non-admin roles
        if ($currentUser && $currentUser->role === 'admin') {
            // Regular admins can see all subjects
            // No course filter applied
        } elseif ($courseId) {
            $subjects->where('course_id', $courseId);
        } elseif ($request->has('course_id')) {
            $subjects->where('course_id', $request->course_id);
        }

        if ($request->has('instructor_id')) {
            $subjects->whereHas('instructors', function ($query) use ($request) {
                $query->where('users.id', $request->instructor_id)
                      ->where('users.role', 'instructor');
            });
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $subjects->where(function($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
            });
        }

        return response()->json([
            'success' => true,
            'data' => $subjects->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to create subjects.',
            ], 403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);
        
        $validated['course_id'] = $courseId;

        // Make code unique per course
        if ($request->has('code') && $request->code) {
            $exists = Subject::where('code', $request->code)
                ->where('course_id', $courseId)
                ->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject code already exists for this course',
                ], 422);
            }
        }

        $subject = Subject::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subject created successfully',
            'data' => $subject,
        ], 201);
    }

    public function show(Request $request, Subject $subject)
    {
        // Check if subject belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $subject->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Subject does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $subject->load('instructors'),
        ]);
    }

    public function update(Request $request, Subject $subject)
    {
        // Check if subject belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $subject->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Subject does not belong to your course.',
            ], 403);
        }
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'code' => 'nullable|string|max:255',
            'description' => 'nullable|string',
        ]);

        // Make code unique per course
        if ($request->has('code') && $request->code) {
            $exists = Subject::where('code', $request->code)
                ->where('course_id', $subject->course_id)
                ->where('id', '!=', $subject->id)
                ->exists();
            if ($exists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subject code already exists for this course',
                ], 422);
            }
        }

        $subject->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Subject updated successfully',
            'data' => $subject,
        ]);
    }

    public function destroy(Request $request, Subject $subject)
    {
        // Check if subject belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $subject->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Subject does not belong to your course.',
            ], 403);
        }
        
        $subject->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subject deleted successfully',
        ]);
    }
}

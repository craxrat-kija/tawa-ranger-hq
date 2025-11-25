<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
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

        return response()->json([
            'success' => true,
            'data' => $courses->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string',
            'duration' => 'required|string',
            'instructor_id' => 'nullable|exists:users,id',
            'start_date' => 'required|date',
            'status' => 'sometimes|in:active,completed,upcoming',
            'description' => 'nullable|string',
        ]);

        $course = Course::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Course created successfully',
            'data' => $course->load('instructor'),
        ], 201);
    }

    public function show(Course $course)
    {
        return response()->json([
            'success' => true,
            'data' => $course->load('instructor'),
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
}

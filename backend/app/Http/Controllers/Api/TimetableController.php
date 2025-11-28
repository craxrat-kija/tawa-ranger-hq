<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Timetable;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $timetable = Timetable::query();

        // Always filter by current user's course_id for isolation
        if ($courseId) {
            $timetable->where('course_id', $courseId);
        } elseif ($request->has('course_id')) {
            $timetable->where('course_id', $request->course_id);
        }

        if ($request->has('date')) {
            $timetable->whereDate('date', $request->date);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $timetable->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        return response()->json([
            'success' => true,
            'data' => $timetable->orderBy('date')->orderBy('time')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to create timetable entries.',
            ], 403);
        }
        
        $validated = $request->validate([
            'date' => 'required|date',
            'time' => 'required|string',
            'subject' => 'required|string|max:255',
            'instructor' => 'required|string|max:255',
            'location' => 'required|string|max:255',
        ]);

        $validated['course_id'] = $courseId;
        $timetable = Timetable::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Schedule created successfully',
            'data' => $timetable,
        ], 201);
    }

    public function show(Request $request, Timetable $timetable)
    {
        // Check if timetable belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $timetable->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Timetable entry does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $timetable,
        ]);
    }

    public function update(Request $request, Timetable $timetable)
    {
        // Check if timetable belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $timetable->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Timetable entry does not belong to your course.',
            ], 403);
        }
        
        $validated = $request->validate([
            'date' => 'sometimes|date',
            'time' => 'sometimes|string',
            'subject' => 'sometimes|string|max:255',
            'instructor' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
        ]);

        $timetable->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated successfully',
            'data' => $timetable,
        ]);
    }

    public function destroy(Request $request, Timetable $timetable)
    {
        // Check if timetable belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $timetable->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Timetable entry does not belong to your course.',
            ], 403);
        }
        
        $timetable->delete();

        return response()->json([
            'success' => true,
            'message' => 'Schedule deleted successfully',
        ]);
    }
}

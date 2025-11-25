<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use Illuminate\Http\Request;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $assessments = Assessment::with(['subject', 'instructor']);

        if ($request->has('instructor_id')) {
            $assessments->where('instructor_id', $request->instructor_id);
        }

        if ($request->has('subject_id')) {
            $assessments->where('subject_id', $request->subject_id);
        }

        return response()->json([
            'success' => true,
            'data' => $assessments->orderBy('date', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:quiz,assignment,exam,practical,project,other',
            'date' => 'required|date',
            'max_score' => 'required|numeric|min:0',
            'weight' => 'nullable|numeric|min:0|max:100',
        ]);

        $validated['instructor_id'] = $request->user()->id;

        $assessment = Assessment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assessment created successfully',
            'data' => $assessment->load(['subject', 'instructor']),
        ], 201);
    }

    public function show(Assessment $assessment)
    {
        return response()->json([
            'success' => true,
            'data' => $assessment->load(['subject', 'instructor', 'grades.trainee']),
        ]);
    }

    public function update(Request $request, Assessment $assessment)
    {
        // Only allow instructor who created it or admin to update
        if ($assessment->instructor_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'subject_id' => 'sometimes|exists:subjects,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'type' => 'sometimes|in:quiz,assignment,exam,practical,project,other',
            'date' => 'sometimes|date',
            'max_score' => 'sometimes|numeric|min:0',
            'weight' => 'nullable|numeric|min:0|max:100',
        ]);

        $assessment->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Assessment updated successfully',
            'data' => $assessment->load(['subject', 'instructor']),
        ]);
    }

    public function destroy(Request $request, Assessment $assessment)
    {
        // Only allow instructor who created it or admin to delete
        if ($assessment->instructor_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $assessment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Assessment deleted successfully',
        ]);
    }
}

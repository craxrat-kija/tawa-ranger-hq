<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Grade;
use App\Models\Assessment;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $grades = Grade::with(['assessment.subject', 'assessment.instructor', 'trainee', 'grader']);

        // Always filter by current user's course_id for isolation
        if ($courseId) {
            $grades->where('course_id', $courseId);
        } elseif ($request->has('course_id')) {
            $grades->where('course_id', $request->course_id);
        }

        if ($request->has('assessment_id')) {
            $grades->where('assessment_id', $request->assessment_id);
        }

        if ($request->has('trainee_id')) {
            $grades->where('trainee_id', $request->trainee_id);
        }

        if ($request->has('instructor_id')) {
            $grades->whereHas('assessment', function ($query) use ($request) {
                $query->where('instructor_id', $request->instructor_id);
            });
        }

        return response()->json([
            'success' => true,
            'data' => $grades->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'assessment_id' => 'required|exists:assessments,id',
            'trainee_id' => 'required|exists:users,id',
            'score' => 'required|numeric|min:0',
            'comments' => 'nullable|string',
        ]);

        // Verify assessment exists and get max_score
        $assessment = Assessment::findOrFail($validated['assessment_id']);
        
        // Verify score doesn't exceed max_score
        if ($validated['score'] > $assessment->max_score) {
            return response()->json([
                'success' => false,
                'message' => "Score cannot exceed maximum score of {$assessment->max_score}",
            ], 422);
        }

        // Check if grade already exists
        $existingGrade = Grade::where('assessment_id', $validated['assessment_id'])
            ->where('trainee_id', $validated['trainee_id'])
            ->first();

        if ($existingGrade) {
            return response()->json([
                'success' => false,
                'message' => 'Grade already exists for this trainee and assessment',
            ], 422);
        }

        $validated['graded_by'] = $request->user()->id;
        $validated['course_id'] = $assessment->course_id;

        $grade = Grade::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Grade recorded successfully',
            'data' => $grade->load(['assessment.subject', 'trainee', 'grader']),
        ], 201);
    }

    public function show(Request $request, Grade $grade)
    {
        // Check if grade belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $grade->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Grade does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $grade->load(['assessment.subject', 'trainee', 'grader']),
        ]);
    }

    public function update(Request $request, Grade $grade)
    {
        // Check if grade belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $grade->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Grade does not belong to your course.',
            ], 403);
        }
        
        // Only allow instructor who created the assessment, grader, or admin to update
        $assessment = $grade->assessment;
        $canEdit = $assessment->instructor_id === $request->user()->id 
            || $grade->graded_by === $request->user()->id 
            || $request->user()->role === 'admin';

        if (!$canEdit) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'score' => 'sometimes|numeric|min:0',
            'comments' => 'nullable|string',
        ]);

        // Verify score doesn't exceed max_score
        if (isset($validated['score']) && $validated['score'] > $assessment->max_score) {
            return response()->json([
                'success' => false,
                'message' => "Score cannot exceed maximum score of {$assessment->max_score}",
            ], 422);
        }

        $grade->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Grade updated successfully',
            'data' => $grade->load(['assessment.subject', 'trainee', 'grader']),
        ]);
    }

    public function destroy(Request $request, Grade $grade)
    {
        // Check if grade belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $grade->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Grade does not belong to your course.',
            ], 403);
        }
        
        // Only allow instructor who created the assessment, grader, or admin to delete
        $assessment = $grade->assessment;
        $canDelete = $assessment->instructor_id === $request->user()->id 
            || $grade->graded_by === $request->user()->id 
            || $request->user()->role === 'admin';

        if (!$canDelete) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $grade->delete();

        return response()->json([
            'success' => true,
            'message' => 'Grade deleted successfully',
        ]);
    }
}

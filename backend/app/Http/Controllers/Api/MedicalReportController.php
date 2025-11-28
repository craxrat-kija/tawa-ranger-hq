<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalReport;
use App\Models\Patient;
use App\Models\Notification;
use App\Models\User;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class MedicalReportController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $reports = MedicalReport::with('patient');
        
        // Admins can view all reports, others are filtered by course
        if ($currentUser->role !== 'admin' && $courseId) {
            $reports->where('course_id', $courseId);
        }

        if ($request->has('patient_id')) {
            $reports->where('patient_id', $request->patient_id);
        }

        return response()->json([
            'success' => true,
            'data' => $reports->orderBy('date', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to create medical reports.',
            ], 403);
        }
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'diagnosis' => 'required|string|max:255',
            'symptoms' => 'nullable|string',
            'treatment' => 'nullable|string',
            'notes' => 'nullable|string',
            'doctor' => 'required|string|max:255',
            'blood_pressure' => 'nullable|string',
            'temperature' => 'nullable|string',
            'heart_rate' => 'nullable|string',
            'weight' => 'nullable|string',
            'vital_signs' => 'nullable|array',
            'date' => 'nullable|date',
        ]);

        // Handle vital_signs nested object if provided
        if ($request->has('vital_signs') && is_array($request->vital_signs)) {
            $vitalSigns = $request->vital_signs;
            if (!isset($validated['blood_pressure']) && isset($vitalSigns['bloodPressure'])) {
                $validated['blood_pressure'] = $vitalSigns['bloodPressure'];
            }
            if (!isset($validated['temperature']) && isset($vitalSigns['temperature'])) {
                $validated['temperature'] = $vitalSigns['temperature'];
            }
            if (!isset($validated['heart_rate']) && isset($vitalSigns['heartRate'])) {
                $validated['heart_rate'] = $vitalSigns['heartRate'];
            }
            if (!isset($validated['weight']) && isset($vitalSigns['weight'])) {
                $validated['weight'] = $vitalSigns['weight'];
            }
        }

        // Verify patient belongs to the same course
        $patient = Patient::findOrFail($validated['patient_id']);
        if ($patient->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Patient does not belong to your course.',
            ], 403);
        }

        $report = MedicalReport::create([
            'patient_id' => $validated['patient_id'],
            'date' => $validated['date'] ?? now(),
            'diagnosis' => $validated['diagnosis'],
            'symptoms' => $validated['symptoms'] ?? null,
            'treatment' => $validated['treatment'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'doctor' => $validated['doctor'],
            'blood_pressure' => $validated['blood_pressure'] ?? null,
            'temperature' => $validated['temperature'] ?? null,
            'heart_rate' => $validated['heart_rate'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'course_id' => $courseId,
        ]);

        // Create notification for admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'activity',
                'title' => 'Medical Report Created',
                'message' => "Dr. {$validated['doctor']} created a medical report for {$patient->full_name} - Diagnosis: {$validated['diagnosis']}",
                'action_url' => "/admin/activities?type=report&id={$report->id}",
                'metadata' => [
                    'report_id' => $report->id,
                    'patient_id' => $patient->id,
                    'patient_name' => $patient->full_name,
                    'doctor_name' => $validated['doctor'],
                    'diagnosis' => $validated['diagnosis'],
                    'course_id' => $courseId,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Medical report created successfully',
            'data' => $report->load('patient'),
        ], 201);
    }

    public function show(Request $request, MedicalReport $medicalReport)
    {
        // Admins can view all reports, others must belong to their course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($currentUser->role !== 'admin' && $courseId && $medicalReport->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Medical report does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $medicalReport->load('patient'),
        ]);
    }

    public function update(Request $request, MedicalReport $medicalReport)
    {
        // Check if report belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $medicalReport->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Medical report does not belong to your course.',
            ], 403);
        }
        
        $validated = $request->validate([
            'diagnosis' => 'sometimes|string|max:255',
            'symptoms' => 'nullable|string',
            'treatment' => 'nullable|string',
            'notes' => 'nullable|string',
            'doctor' => 'sometimes|string|max:255',
            'blood_pressure' => 'nullable|string',
            'temperature' => 'nullable|string',
            'heart_rate' => 'nullable|string',
            'weight' => 'nullable|string',
        ]);

        $medicalReport->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Medical report updated successfully',
            'data' => $medicalReport->load('patient'),
        ]);
    }

    public function destroy(Request $request, MedicalReport $medicalReport)
    {
        // Check if report belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $medicalReport->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Medical report does not belong to your course.',
            ], 403);
        }
        
        $medicalReport->delete();

        return response()->json([
            'success' => true,
            'message' => 'Medical report deleted successfully',
        ]);
    }
}

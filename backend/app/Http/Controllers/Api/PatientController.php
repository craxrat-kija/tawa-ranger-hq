<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Notification;
use App\Models\User;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $patients = Patient::query();

        // Admins can view all patients, others are filtered by course
        if ($currentUser->role !== 'admin' && $courseId) {
            $patients->where('course_id', $courseId);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $patients->where(function ($query) use ($search) {
                $query->where('full_name', 'like', '%' . $search . '%')
                      ->orWhere('email', 'like', '%' . $search . '%')
                      ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        return response()->json([
            'success' => true,
            'data' => $patients->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to register patients.',
            ], 403);
        }
        
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:patients',
            'phone' => 'required|string',
            'blood_type' => 'nullable|string',
            'allergies' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'emergency_contact' => 'required|string',
        ]);

        $patient = Patient::create([
            ...$validated,
            'registered_date' => now(),
            'course_id' => $courseId,
        ]);

        // Create notification for admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'activity',
                'title' => 'Patient Registered',
                'message' => "Patient {$patient->full_name} was registered by Dr. {$currentUser->name}",
                'action_url' => "/admin/activities?type=patient&id={$patient->id}",
                'metadata' => [
                    'patient_id' => $patient->id,
                    'patient_name' => $patient->full_name,
                    'doctor_id' => $currentUser->id,
                    'doctor_name' => $currentUser->name,
                    'course_id' => $courseId,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Patient registered successfully',
            'data' => $patient,
        ], 201);
    }

    public function show(Request $request, Patient $patient)
    {
        // Admins can view all patients, others must belong to their course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($currentUser->role !== 'admin' && $courseId && $patient->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Patient does not belong to your course.',
            ], 403);
        }
        
        $patient->load(['medicalReports', 'attendanceRecords']);
        
        return response()->json([
            'success' => true,
            'data' => $patient,
        ]);
    }

    public function update(Request $request, Patient $patient)
    {
        // Check if patient belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $patient->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Patient does not belong to your course.',
            ], 403);
        }
        
        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:patients,email,' . $patient->id,
            'phone' => 'sometimes|string',
            'blood_type' => 'nullable|string',
            'allergies' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'emergency_contact' => 'sometimes|string',
        ]);

        $patient->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Patient updated successfully',
            'data' => $patient,
        ]);
    }

    public function destroy(Request $request, Patient $patient)
    {
        // Check if patient belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $patient->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Patient does not belong to your course.',
            ], 403);
        }
        
        $patient->delete();

        return response()->json([
            'success' => true,
            'message' => 'Patient deleted successfully',
        ]);
    }
}

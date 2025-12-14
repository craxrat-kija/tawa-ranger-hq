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
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId) {
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
        
        // If user_id is provided, fetch user data
        $user = null;
        if ($request->has('user_id') && $request->user_id) {
            $user = User::find($request->user_id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found.',
                ], 404);
            }
        }

        // Validate based on whether user_id is provided
        if ($user) {
            // If user exists, use their data and only validate patient-specific fields
            $validated = $request->validate([
                'user_id' => 'nullable|exists:users,id',
                'blood_type' => 'nullable|string',
                'allergies' => 'nullable|string',
                'medical_history' => 'nullable|string',
                'emergency_contact' => 'required|string',
                // Medical Examination Fields
                'blood_pressure' => 'nullable|string',
                'malaria_test' => 'nullable|string',
                'sugar_test' => 'nullable|string',
                'hepatitis_test' => 'nullable|string',
                'pregnancy_test' => 'nullable|string',
                'weight' => 'nullable|string',
                'height' => 'nullable|string',
                'hb_hemoglobin' => 'nullable|string',
                'hiv_status' => 'nullable|string',
                // Medical History Fields
                'chronic_illnesses' => 'nullable|string',
                'trauma_history' => 'nullable|string',
            ]);

            // Check if patient already exists for this user
            $existingPatient = Patient::where('email', $user->email)->first();
            if ($existingPatient) {
                return response()->json([
                    'success' => false,
                    'message' => 'A patient record already exists for this user.',
                ], 422);
            }

            $patient = Patient::create([
                'full_name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'blood_type' => $validated['blood_type'] ?? null,
                'allergies' => $validated['allergies'] ?? null,
                'medical_history' => $validated['medical_history'] ?? null,
                'emergency_contact' => $validated['emergency_contact'],
                'registered_date' => now(),
                'course_id' => $courseId,
                // Medical Examination Fields
                'blood_pressure' => $validated['blood_pressure'] ?? null,
                'malaria_test' => $validated['malaria_test'] ?? null,
                'sugar_test' => $validated['sugar_test'] ?? null,
                'hepatitis_test' => $validated['hepatitis_test'] ?? null,
                'pregnancy_test' => $validated['pregnancy_test'] ?? null,
                'weight' => $validated['weight'] ?? null,
                'height' => $validated['height'] ?? null,
                'hb_hemoglobin' => $validated['hb_hemoglobin'] ?? null,
                'hiv_status' => $validated['hiv_status'] ?? null,
                // Medical History Fields
                'chronic_illnesses' => $validated['chronic_illnesses'] ?? null,
                'trauma_history' => $validated['trauma_history'] ?? null,
            ]);
        } else {
            // Traditional patient creation (backwards compatibility)
            $validated = $request->validate([
                'full_name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:patients',
                'phone' => 'required|string',
                'blood_type' => 'nullable|string',
                'allergies' => 'nullable|string',
                'medical_history' => 'nullable|string',
                'emergency_contact' => 'required|string',
                // Medical Examination Fields
                'blood_pressure' => 'nullable|string',
                'malaria_test' => 'nullable|string',
                'sugar_test' => 'nullable|string',
                'hepatitis_test' => 'nullable|string',
                'pregnancy_test' => 'nullable|string',
                'weight' => 'nullable|string',
                'height' => 'nullable|string',
                'hb_hemoglobin' => 'nullable|string',
                'hiv_status' => 'nullable|string',
                // Medical History Fields
                'chronic_illnesses' => 'nullable|string',
                'trauma_history' => 'nullable|string',
            ]);

            $patient = Patient::create([
                ...$validated,
                'registered_date' => now(),
                'course_id' => $courseId,
            ]);
        }

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
            // Medical Examination Fields
            'blood_pressure' => 'nullable|string',
            'malaria_test' => 'nullable|string',
            'sugar_test' => 'nullable|string',
            'hepatitis_test' => 'nullable|string',
            'pregnancy_test' => 'nullable|string',
            'weight' => 'nullable|string',
            'height' => 'nullable|string',
            'hb_hemoglobin' => 'nullable|string',
            'hiv_status' => 'nullable|string',
            // Medical History Fields
            'chronic_illnesses' => 'nullable|string',
            'trauma_history' => 'nullable|string',
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

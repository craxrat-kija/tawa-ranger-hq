<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalReport;
use App\Models\Patient;
use App\Models\AttendanceRecord;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ActivityLogController extends Controller
{
    public function doctorActivities(Request $request)
    {
        // Only admins can access this
        $user = $request->user();
        
        if ($user->role !== 'admin' && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admins can view doctor activities.',
            ], 403);
        }

        $activities = collect();

        // Get all patient registrations by doctors
        $patientRegistrations = Patient::with('course')
            ->select('id', 'full_name', 'email', 'registered_date', 'course_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($patient) {
                return [
                    'id' => 'patient_' . $patient->id,
                    'type' => 'patient_registration',
                    'title' => 'Patient Registered',
                    'description' => "Patient {$patient->full_name} was registered",
                    'doctor_name' => 'System', // We don't track who registered, but we can add this later
                    'patient_name' => $patient->full_name,
                    'patient_email' => $patient->email,
                    'course_name' => $patient->course->name ?? 'N/A',
                    'timestamp' => $patient->created_at,
                    'action_url' => "/admin/activities?type=patient&id={$patient->id}",
                ];
            });

        // Get all medical reports
        $medicalReports = MedicalReport::with(['patient.course'])
            ->select('id', 'patient_id', 'doctor', 'diagnosis', 'date', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($report) {
                return [
                    'id' => 'report_' . $report->id,
                    'type' => 'medical_report',
                    'title' => 'Medical Report Created',
                    'description' => "Medical report for {$report->patient->full_name} - Diagnosis: {$report->diagnosis}",
                    'doctor_name' => $report->doctor,
                    'patient_name' => $report->patient->full_name,
                    'diagnosis' => $report->diagnosis,
                    'course_name' => $report->patient->course->name ?? 'N/A',
                    'timestamp' => $report->created_at,
                    'action_url' => "/admin/activities?type=report&id={$report->id}",
                ];
            });

        // Get all attendance records
        $attendanceRecords = AttendanceRecord::with(['patient.course'])
            ->select('id', 'patient_id', 'date', 'status', 'notes', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($attendance) {
                return [
                    'id' => 'attendance_' . $attendance->id,
                    'type' => 'attendance_record',
                    'title' => 'Attendance Recorded',
                    'description' => "Attendance recorded for {$attendance->patient->full_name} - Status: {$attendance->status}",
                    'doctor_name' => 'System', // We can track this if needed
                    'patient_name' => $attendance->patient->full_name,
                    'status' => $attendance->status,
                    'course_name' => $attendance->patient->course->name ?? 'N/A',
                    'timestamp' => $attendance->created_at,
                    'action_url' => "/admin/activities?type=attendance&id={$attendance->id}",
                ];
            });

        // Combine all activities and sort by timestamp
        $activities = $patientRegistrations
            ->concat($medicalReports)
            ->concat($attendanceRecords)
            ->sortByDesc('timestamp')
            ->values();

        // Apply filters if provided
        if ($request->has('type')) {
            $activities = $activities->filter(function ($activity) use ($request) {
                return $activity['type'] === $request->type;
            })->values();
        }

        if ($request->has('doctor')) {
            $activities = $activities->filter(function ($activity) use ($request) {
                return stripos($activity['doctor_name'], $request->doctor) !== false;
            })->values();
        }

        if ($request->has('course_id')) {
            $activities = $activities->filter(function ($activity) use ($request) {
                // This would need course_id in the activity data
                return true; // Placeholder
            })->values();
        }

        // Pagination
        $perPage = $request->get('per_page', 50);
        $page = $request->get('page', 1);
        $total = $activities->count();
        $items = $activities->slice(($page - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'data' => $items,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => ceil($total / $perPage),
            ],
        ]);
    }
}


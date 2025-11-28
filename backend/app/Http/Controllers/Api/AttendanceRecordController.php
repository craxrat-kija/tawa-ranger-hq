<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use App\Models\Patient;
use App\Models\Notification;
use App\Models\User;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class AttendanceRecordController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $records = AttendanceRecord::with('patient');
        
        // Admins can view all records, others are filtered by course
        if ($currentUser->role !== 'admin' && $courseId) {
            $records->where('course_id', $courseId);
        }

        if ($request->has('patient_id')) {
            $records->where('patient_id', $request->patient_id);
        }

        if ($request->has('date')) {
            $records->where('date', $request->date);
        }

        if ($request->has('status')) {
            $records->where('status', $request->status);
        }

        return response()->json([
            'success' => true,
            'data' => $records->orderBy('date', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to record attendance.',
            ], 403);
        }
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date' => 'required|date',
            'status' => 'required|in:Present,Absent,Late,Excused',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        // Verify patient belongs to the same course
        $patient = Patient::findOrFail($validated['patient_id']);
        if ($patient->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Patient does not belong to your course.',
            ], 403);
        }

        $validated['course_id'] = $courseId;
        $record = AttendanceRecord::create($validated);

        // Create notification for admins
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'type' => 'activity',
                'title' => 'Attendance Recorded',
                'message' => "Attendance recorded for {$patient->full_name} - Status: {$validated['status']}",
                'action_url' => "/admin/activities?type=attendance&id={$record->id}",
                'metadata' => [
                    'attendance_id' => $record->id,
                    'patient_id' => $patient->id,
                    'patient_name' => $patient->full_name,
                    'status' => $validated['status'],
                    'doctor_id' => $currentUser->id,
                    'doctor_name' => $currentUser->name,
                    'course_id' => $courseId,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'data' => $record->load('patient'),
        ], 201);
    }

    public function show(Request $request, AttendanceRecord $attendanceRecord)
    {
        // Admins can view all records, others must belong to their course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($currentUser->role !== 'admin' && $courseId && $attendanceRecord->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Attendance record does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $attendanceRecord->load('patient'),
        ]);
    }

    public function update(Request $request, AttendanceRecord $attendanceRecord)
    {
        // Check if record belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $attendanceRecord->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Attendance record does not belong to your course.',
            ], 403);
        }
        
        $validated = $request->validate([
            'date' => 'sometimes|date',
            'status' => 'sometimes|in:Present,Absent,Late,Excused',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $attendanceRecord->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Attendance record updated successfully',
            'data' => $attendanceRecord->load('patient'),
        ]);
    }

    public function destroy(Request $request, AttendanceRecord $attendanceRecord)
    {
        // Check if record belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $attendanceRecord->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Attendance record does not belong to your course.',
            ], 403);
        }
        
        $attendanceRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted successfully',
        ]);
    }
}

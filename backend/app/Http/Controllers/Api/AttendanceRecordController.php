<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AttendanceRecord;
use Illuminate\Http\Request;

class AttendanceRecordController extends Controller
{
    public function index(Request $request)
    {
        $records = AttendanceRecord::with('patient')->orderBy('date', 'desc');

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
            'data' => $records->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'date' => 'required|date',
            'status' => 'required|in:Present,Absent,Late,Excused',
            'check_in_time' => 'nullable|string',
            'check_out_time' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $record = AttendanceRecord::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Attendance recorded successfully',
            'data' => $record->load('patient'),
        ], 201);
    }

    public function show(AttendanceRecord $attendanceRecord)
    {
        return response()->json([
            'success' => true,
            'data' => $attendanceRecord->load('patient'),
        ]);
    }

    public function update(Request $request, AttendanceRecord $attendanceRecord)
    {
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

    public function destroy(AttendanceRecord $attendanceRecord)
    {
        $attendanceRecord->delete();

        return response()->json([
            'success' => true,
            'message' => 'Attendance record deleted successfully',
        ]);
    }
}

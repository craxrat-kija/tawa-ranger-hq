<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalReport;
use App\Models\Patient;
use Illuminate\Http\Request;

class MedicalReportController extends Controller
{
    public function index(Request $request)
    {
        $reports = MedicalReport::with('patient')->orderBy('date', 'desc');

        if ($request->has('patient_id')) {
            $reports->where('patient_id', $request->patient_id);
        }

        return response()->json([
            'success' => true,
            'data' => $reports->get(),
        ]);
    }

    public function store(Request $request)
    {
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
        ]);

        $report = MedicalReport::create([
            ...$validated,
            'date' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Medical report created successfully',
            'data' => $report->load('patient'),
        ], 201);
    }

    public function show(MedicalReport $medicalReport)
    {
        return response()->json([
            'success' => true,
            'data' => $medicalReport->load('patient'),
        ]);
    }

    public function update(Request $request, MedicalReport $medicalReport)
    {
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

    public function destroy(MedicalReport $medicalReport)
    {
        $medicalReport->delete();

        return response()->json([
            'success' => true,
            'message' => 'Medical report deleted successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use App\Models\User;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MedicalRecordController extends Controller
{
    public function index(Request $request)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            $query = MedicalRecord::with(['user', 'doctor', 'course']);
            
            // Filter by course if not admin/super_admin
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId) {
                $query->where('course_id', $courseId);
            }
            
            // Filter by user_id if provided
            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }
            
            // Filter by doctor_id if provided
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->doctor_id);
            }
            
            // Get latest record per user if requested
            if ($request->has('latest') && $request->latest === 'true') {
                $records = $query->orderBy('record_date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->groupBy('user_id')
                    ->map(function ($group) {
                        return $group->first();
                    })
                    ->values();
            } else {
                $records = $query->orderBy('record_date', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->get();
            }
            
            return response()->json([
                'success' => true,
                'data' => $records,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading medical records: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load medical records: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            if (!$courseId && $currentUser->role !== 'admin' && $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be assigned to a course to create medical records.',
                ], 403);
            }
            
            // Validate user exists if user_id provided
            if ($request->has('user_id')) {
                $user = User::find($request->user_id);
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found.',
                    ], 404);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID is required.',
                ], 422);
            }
            
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'course_id' => 'nullable|exists:courses,id',
                // Personal Particulars
                'emergency_contact' => 'nullable|string',
                // Medical Examination Fields
                'blood_type' => 'nullable|string',
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
                'allergies' => 'nullable|string',
                'medical_history' => 'nullable|string',
                'chronic_illnesses' => 'nullable|string',
                'trauma_history' => 'nullable|string',
                'record_date' => 'nullable|date',
            ]);
            
            // Set course_id if not provided
            if (!isset($validated['course_id'])) {
                $validated['course_id'] = $courseId;
            }
            
            // Set doctor_id to current user if they are a doctor
            if ($currentUser->role === 'doctor') {
                $validated['doctor_id'] = $currentUser->id;
            }
            
            // Set record_date if not provided
            if (!isset($validated['record_date'])) {
                $validated['record_date'] = now();
            }
            
            // Handle attachments upload
            if ($request->has('attachments') && is_array($request->attachments)) {
                $attachmentPaths = [];
                foreach ($request->attachments as $attachment) {
                    if ($attachment && $attachment->isValid()) {
                        // Validate file type (PDF only)
                        if ($attachment->getMimeType() !== 'application/pdf' && $attachment->getClientOriginalExtension() !== 'pdf') {
                            continue; // Skip non-PDF files
                        }
                        
                        $fileName = time() . '_' . uniqid() . '_' . $attachment->getClientOriginalName();
                        $filePath = $attachment->storeAs('medical_record_attachments', $fileName, 'public');
                        $attachmentPaths[] = $filePath;
                    }
                }
                if (!empty($attachmentPaths)) {
                    $validated['attachments'] = json_encode($attachmentPaths);
                }
            }
            
            $medicalRecord = MedicalRecord::create($validated);
            $medicalRecord->load(['user', 'doctor', 'course']);
            
            return response()->json([
                'success' => true,
                'message' => 'Medical record created successfully',
                'data' => $medicalRecord,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating medical record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create medical record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(Request $request, MedicalRecord $medicalRecord)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId && $medicalRecord->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Medical record does not belong to your course.',
                ], 403);
            }
            
            $medicalRecord->load(['user', 'doctor', 'course']);
            
            return response()->json([
                'success' => true,
                'data' => $medicalRecord,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading medical record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load medical record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, MedicalRecord $medicalRecord)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId && $medicalRecord->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Medical record does not belong to your course.',
                ], 403);
            }
            
            $validated = $request->validate([
                'user_id' => 'sometimes|exists:users,id',
                'course_id' => 'nullable|exists:courses,id',
                // Personal Particulars
                'emergency_contact' => 'nullable|string',
                // Medical Examination Fields
                'blood_type' => 'nullable|string',
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
                'allergies' => 'nullable|string',
                'medical_history' => 'nullable|string',
                'chronic_illnesses' => 'nullable|string',
                'trauma_history' => 'nullable|string',
                'record_date' => 'nullable|date',
            ]);
            
            // Handle attachments upload
            if ($request->has('attachments') && is_array($request->attachments)) {
                // Delete old attachments if they exist
                if ($medicalRecord->attachments) {
                    $oldAttachments = json_decode($medicalRecord->attachments, true);
                    if (is_array($oldAttachments)) {
                        foreach ($oldAttachments as $oldAttachment) {
                            if (Storage::disk('public')->exists($oldAttachment)) {
                                Storage::disk('public')->delete($oldAttachment);
                            }
                        }
                    }
                }
                
                $attachmentPaths = [];
                foreach ($request->attachments as $attachment) {
                    if ($attachment && $attachment->isValid()) {
                        // Validate file type (PDF only)
                        if ($attachment->getMimeType() !== 'application/pdf' && $attachment->getClientOriginalExtension() !== 'pdf') {
                            continue; // Skip non-PDF files
                        }
                        
                        $fileName = time() . '_' . uniqid() . '_' . $attachment->getClientOriginalName();
                        $filePath = $attachment->storeAs('medical_record_attachments', $fileName, 'public');
                        $attachmentPaths[] = $filePath;
                    }
                }
                if (!empty($attachmentPaths)) {
                    $validated['attachments'] = json_encode($attachmentPaths);
                }
            }
            
            $medicalRecord->update($validated);
            $medicalRecord->load(['user', 'doctor', 'course']);
            
            return response()->json([
                'success' => true,
                'message' => 'Medical record updated successfully',
                'data' => $medicalRecord,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating medical record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update medical record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(Request $request, MedicalRecord $medicalRecord)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId && $medicalRecord->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Medical record does not belong to your course.',
                ], 403);
            }
            
            $medicalRecord->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Medical record deleted successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting medical record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete medical record: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function getLatestByUser(Request $request, $userId)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            $query = MedicalRecord::where('user_id', $userId)
                ->with(['user', 'doctor', 'course']);
            
            // Filter by course if not admin/super_admin
            if ($currentUser->role !== 'admin' && $currentUser->role !== 'super_admin' && $courseId) {
                $query->where('course_id', $courseId);
            }
            
            $latestRecord = $query->orderBy('record_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->first();
            
            if (!$latestRecord) {
                return response()->json([
                    'success' => true,
                    'data' => null,
                    'message' => 'No medical record found for this user',
                ]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $latestRecord,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading latest medical record: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load medical record: ' . $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DisciplineIssue;
use App\Models\User;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DisciplineIssueController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            $issues = DisciplineIssue::with(['user', 'course', 'reportedBy', 'approvedBy']);
            
            // Filter by course_id if provided in request (for super admin filtering)
            if ($request->has('course_id')) {
                $issues->where('course_id', $request->course_id);
            } elseif ($currentUser && $currentUser->role === 'super_admin') {
                // Super admin sees all issues - no course filter when no course_id param
            } elseif ($courseId) {
                // Regular admins see only their course
                $issues->where('course_id', $courseId);
            }
            
            // Filter by user if provided
            if ($request->has('user_id')) {
                $issues->where('user_id', $request->user_id);
            }
            
            // Filter by status if provided
            if ($request->has('status')) {
                $issues->where('status', $request->status);
            }
            
            // Filter by severity if provided
            if ($request->has('severity')) {
                $issues->where('severity', $request->severity);
            }
            
            // Filter by approval_status if provided
            if ($request->has('approval_status')) {
                $issues->where('approval_status', $request->approval_status);
            }
            
            // Search functionality
            if ($request->has('search')) {
                $search = $request->search;
                $issues->where(function($query) use ($search) {
                    $query->where('title', 'like', "%{$search}%")
                          ->orWhere('description', 'like', "%{$search}%");
                });
            }
            
            $issues = $issues->orderBy('approval_status', 'asc') // pending first
                             ->orderBy('incident_date', 'desc')
                             ->orderBy('created_at', 'desc')
                             ->get();
            
            // Map issues to ensure relationships are properly serialized
            $issuesData = $issues->map(function ($issue) {
                return [
                    'id' => $issue->id,
                    'user_id' => $issue->user_id,
                    'course_id' => $issue->course_id,
                    'reported_by' => $issue->reported_by,
                    'title' => $issue->title,
                    'description' => $issue->description,
                    'severity' => $issue->severity,
                    'status' => $issue->status,
                    'approval_status' => $issue->approval_status,
                    'incident_date' => $issue->incident_date,
                    'document_path' => $issue->document_path,
                    'resolution_notes' => $issue->resolution_notes,
                    'resolved_at' => $issue->resolved_at,
                    'approved_by' => $issue->approved_by,
                    'approved_at' => $issue->approved_at,
                    'rejection_reason' => $issue->rejection_reason,
                    'created_at' => $issue->created_at,
                    'updated_at' => $issue->updated_at,
                    'user' => $issue->user ? [
                        'id' => $issue->user->id,
                        'name' => $issue->user->name,
                        'email' => $issue->user->email,
                        'user_id' => $issue->user->user_id,
                    ] : null,
                    'course' => $issue->course ? [
                        'id' => $issue->course->id,
                        'name' => $issue->course->name,
                        'code' => $issue->course->code,
                    ] : null,
                    'reportedBy' => $issue->reportedBy ? [
                        'id' => $issue->reportedBy->id,
                        'name' => $issue->reportedBy->name,
                        'email' => $issue->reportedBy->email,
                    ] : null,
                    'approvedBy' => $issue->approvedBy ? [
                        'id' => $issue->approvedBy->id,
                        'name' => $issue->approvedBy->name,
                        'email' => $issue->approvedBy->email,
                    ] : null,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $issuesData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading discipline issues: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load discipline issues: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Super admins can specify course_id, regular admins use their assigned course
            if ($currentUser->role === 'super_admin' && $request->has('course_id')) {
                $courseId = $request->course_id;
            }
            
            if (!$courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'You must be assigned to a course to create discipline issues.',
                ], 403);
            }
            
            $validated = $request->validate([
                'user_id' => 'required|exists:users,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'severity' => 'required|in:low,medium,high,critical',
                'incident_date' => 'required|date',
                'document' => 'nullable|file|max:10240', // 10MB max
            ]);
            
            // Verify user belongs to the course (for non-super admins)
            if ($currentUser->role !== 'super_admin') {
                $user = User::find($validated['user_id']);
                if (!$user || $user->course_id !== $courseId) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User does not belong to your course.',
                    ], 403);
                }
            }
            
            $documentPath = null;
            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $documentPath = $file->storeAs('discipline_documents', $fileName, 'public');
            }
            
            $issue = DisciplineIssue::create([
                'user_id' => $validated['user_id'],
                'course_id' => $courseId,
                'reported_by' => $currentUser->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'severity' => $validated['severity'],
                'incident_date' => $validated['incident_date'],
                'document_path' => $documentPath,
                'status' => 'pending',
                'approval_status' => $currentUser->role === 'super_admin' ? 'approved' : 'pending', // Auto-approve if created by super admin
            ]);
            
            return response()->json([
                'success' => true,
                'message' => $currentUser->role === 'super_admin' 
                    ? 'Discipline issue created and approved successfully' 
                    : 'Discipline issue created successfully. Waiting for super admin approval.',
                'data' => $issue->load(['user', 'course', 'reportedBy', 'approvedBy']),
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'super_admin' && $courseId && $disciplineIssue->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Issue does not belong to your course.',
                ], 403);
            }
            
            return response()->json([
                'success' => true,
                'data' => $disciplineIssue->load(['user', 'course', 'reportedBy']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'super_admin' && $courseId && $disciplineIssue->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Issue does not belong to your course.',
                ], 403);
            }
            
            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'severity' => 'sometimes|in:low,medium,high,critical',
                'status' => 'sometimes|in:pending,investigating,resolved,dismissed',
                'incident_date' => 'sometimes|date',
                'resolution_notes' => 'nullable|string',
                'document' => 'nullable|file|max:10240', // 10MB max
            ]);
            
            // Handle document upload
            if ($request->hasFile('document')) {
                // Delete old document if exists
                if ($disciplineIssue->document_path && Storage::disk('public')->exists($disciplineIssue->document_path)) {
                    Storage::disk('public')->delete($disciplineIssue->document_path);
                }
                
                $file = $request->file('document');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $validated['document_path'] = $file->storeAs('discipline_documents', $fileName, 'public');
            }
            
            // Set resolved_at if status is resolved
            if (isset($validated['status']) && $validated['status'] === 'resolved' && !$disciplineIssue->resolved_at) {
                $validated['resolved_at'] = now();
            } elseif (isset($validated['status']) && $validated['status'] !== 'resolved') {
                $validated['resolved_at'] = null;
            }
            
            $disciplineIssue->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Discipline issue updated successfully',
                'data' => $disciplineIssue->load(['user', 'course', 'reportedBy', 'approvedBy']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'super_admin' && $courseId && $disciplineIssue->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Issue does not belong to your course.',
                ], 403);
            }
            
            // Delete document if exists
            if ($disciplineIssue->document_path && Storage::disk('public')->exists($disciplineIssue->document_path)) {
                Storage::disk('public')->delete($disciplineIssue->document_path);
            }
            
            $disciplineIssue->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Discipline issue deleted successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download the document attached to a discipline issue.
     */
    public function downloadDocument(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            $courseId = CourseHelper::getCurrentCourseId($currentUser);
            
            // Check access
            if ($currentUser->role !== 'super_admin' && $courseId && $disciplineIssue->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Issue does not belong to your course.',
                ], 403);
            }
            
            if (!$disciplineIssue->document_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No document attached to this issue.',
                ], 404);
            }
            
            $filePath = storage_path('app/public/' . $disciplineIssue->document_path);
            
            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document file not found.',
                ], 404);
            }
            
            $fileName = basename($disciplineIssue->document_path);
            
            return response()->download($filePath, $fileName);
        } catch (\Exception $e) {
            \Log::error('Error downloading discipline document: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to download document: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a discipline issue (Super Admin only)
     */
    public function approve(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            
            // Only super admins can approve
            if ($currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super administrators can approve discipline issues.',
                ], 403);
            }
            
            if ($disciplineIssue->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This issue has already been processed.',
                ], 422);
            }
            
            $disciplineIssue->update([
                'approval_status' => 'approved',
                'approved_by' => $currentUser->id,
                'approved_at' => now(),
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Discipline issue approved successfully',
                'data' => $disciplineIssue->load(['user', 'course', 'reportedBy', 'approvedBy']),
            ]);
        } catch (\Exception $e) {
            \Log::error('Error approving discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a discipline issue (Super Admin only)
     */
    public function reject(Request $request, DisciplineIssue $disciplineIssue)
    {
        try {
            $currentUser = $request->user();
            
            // Only super admins can reject
            if ($currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super administrators can reject discipline issues.',
                ], 403);
            }
            
            if ($disciplineIssue->approval_status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This issue has already been processed.',
                ], 422);
            }
            
            $validated = $request->validate([
                'rejection_reason' => 'required|string|max:1000',
            ]);
            
            $disciplineIssue->update([
                'approval_status' => 'rejected',
                'approved_by' => $currentUser->id,
                'approved_at' => now(),
                'rejection_reason' => $validated['rejection_reason'],
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Discipline issue rejected successfully',
                'data' => $disciplineIssue->load(['user', 'course', 'reportedBy', 'approvedBy']),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error rejecting discipline issue: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject discipline issue: ' . $e->getMessage(),
            ], 500);
        }
    }
}

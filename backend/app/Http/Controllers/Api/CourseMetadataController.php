<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseMetadata;
use Illuminate\Http\Request;

class CourseMetadataController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $query = CourseMetadata::query();
            
            // Filter by type if provided
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }
            
            $metadata = $query->orderBy('type')->orderBy('value')->get();
            
            return response()->json([
                'success' => true,
                'data' => $metadata,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading course metadata: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load course metadata: ' . $e->getMessage(),
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
            
            // Only super admins can create course metadata
            if (!$currentUser || $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super administrators can create course metadata.',
                ], 403);
            }
            
            $validated = $request->validate([
                'type' => 'required|in:name,course_type,location,course_code',
                'value' => 'required|string|max:255',
                'description' => 'nullable|string',
            ]);
            
            $metadata = CourseMetadata::create($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Course metadata created successfully',
                'data' => $metadata,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating course metadata: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create course metadata: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(CourseMetadata $courseMetadata)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $courseMetadata,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error loading course metadata: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to load course metadata: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, CourseMetadata $courseMetadata)
    {
        try {
            $currentUser = $request->user();
            
            // Only super admins can update course metadata
            if (!$currentUser || $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super administrators can update course metadata.',
                ], 403);
            }
            
            $validated = $request->validate([
                'type' => 'sometimes|in:name,course_type,location',
                'value' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
            ]);
            
            $courseMetadata->update($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Course metadata updated successfully',
                'data' => $courseMetadata,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error updating course metadata: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update course metadata: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, CourseMetadata $courseMetadata)
    {
        try {
            $currentUser = $request->user();
            
            // Only super admins can delete course metadata
            if (!$currentUser || $currentUser->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only super administrators can delete course metadata.',
                ], 403);
            }
            
            $courseMetadata->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Course metadata deleted successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting course metadata: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course metadata: ' . $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $materials = Material::with('uploader');

        // Admins and instructors can view all materials across all courses
        // Only filter by course for other roles (doctors, trainees)
        if ($currentUser && in_array($currentUser->role, ['admin', 'instructor'])) {
            // Admins and instructors can see all materials
            // No course filter applied
        } elseif ($courseId) {
            $materials->where('course_id', $courseId);
        } elseif ($request->has('course_id')) {
            // Fallback to request parameter if user has no course (shouldn't happen)
            $materials->where('course_id', $request->course_id);
        }

        if ($request->has('subject')) {
            $materials->where('subject', $request->subject);
        }

        if ($request->has('type')) {
            $materials->where('type', $request->type);
        }

        if ($request->has('search')) {
            $materials->where('name', 'like', '%' . $request->search . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $materials->get(),
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to upload materials.',
            ], 403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subject' => 'required|string',
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('materials', $fileName, 'public');
        $fileSize = $this->formatFileSize($file->getSize());

        $fileType = $this->getFileType($file->getClientOriginalExtension());

        $material = Material::create([
            'name' => $validated['name'],
            'type' => $fileType,
            'subject' => $validated['subject'],
            'course_id' => $courseId, // Use current user's course
            'file_path' => $filePath,
            'file_size' => $fileSize,
            'uploaded_by' => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Material uploaded successfully',
            'data' => $material->load('uploader'),
        ], 201);
    }

    public function show(Request $request, Material $material)
    {
        // Admins and instructors can access all materials
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        // Only check course restriction for non-admin and non-instructor roles
        if ($currentUser && !in_array($currentUser->role, ['admin', 'instructor', 'super_admin'])) {
            if ($courseId && $material->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Material does not belong to your course.',
                ], 403);
            }
        }
        
        return response()->json([
            'success' => true,
            'data' => $material->load('uploader'),
        ]);
    }

    public function download(Request $request, Material $material)
    {
        // Admins and instructors can download all materials
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        // Only check course restriction for non-admin and non-instructor roles
        if ($currentUser && !in_array($currentUser->role, ['admin', 'instructor', 'super_admin'])) {
            if ($courseId && $material->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Material does not belong to your course.',
                ], 403);
            }
        }
        
        if (!Storage::disk('public')->exists($material->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        return Storage::disk('public')->download($material->file_path, $material->name);
    }

    public function destroy(Request $request, Material $material)
    {
        // Admins and instructors can delete all materials
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        // Only check course restriction for non-admin and non-instructor roles
        if ($currentUser && !in_array($currentUser->role, ['admin', 'instructor', 'super_admin'])) {
            if ($courseId && $material->course_id !== $courseId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied. Material does not belong to your course.',
                ], 403);
            }
        }
        
        Storage::disk('public')->delete($material->file_path);
        $material->delete();

        return response()->json([
            'success' => true,
            'message' => 'Material deleted successfully',
        ]);
    }

    private function getFileType($extension)
    {
        $extension = strtolower($extension);
        if ($extension === 'pdf') return 'pdf';
        if (in_array($extension, ['ppt', 'pptx', 'key'])) return 'presentation';
        if (in_array($extension, ['mp4', 'avi', 'mov', 'wmv'])) return 'video';
        if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) return 'image';
        return 'document';
    }

    private function formatFileSize($bytes)
    {
        if ($bytes === 0) return '0 Bytes';
        $k = 1024;
        $sizes = ['Bytes', 'KB', 'MB', 'GB'];
        $i = floor(log($bytes) / log($k));
        return round($bytes / pow($k, $i) * 100) / 100 . ' ' . $sizes[$i];
    }
}

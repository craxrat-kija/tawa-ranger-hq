<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $gallery = Gallery::with('uploader');
        
        // Admins can view all galleries across all courses
        // Only filter by course for non-admin roles
        if ($currentUser && $currentUser->role === 'admin') {
            // Regular admins can see all galleries
            // No course filter applied
        } elseif ($courseId) {
            $gallery->where('course_id', $courseId);
        }
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $gallery->where('title', 'like', "%{$search}%");
        }
        
        $gallery = $gallery->orderBy('date', 'desc')->get();

        // Add full URL for each image
        $baseUrl = $request->getSchemeAndHttpHost();
        $gallery->transform(function ($item) use ($baseUrl) {
            // Use request host to ensure correct port is included
            $item->image_url = $baseUrl . '/storage/' . $item->image_path;
            return $item;
        });

        return response()->json([
            'success' => true,
            'data' => $gallery,
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to upload gallery photos.',
            ], 403);
        }
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'image' => 'required|image|max:5120', // 5MB max
        ]);

        $file = $request->file('image');
        $fileName = time() . '_' . $file->getClientOriginalName();
        $filePath = $file->storeAs('gallery', $fileName, 'public');

        $gallery = Gallery::create([
            'title' => $validated['title'],
            'image_path' => $filePath,
            'date' => now(),
            'uploaded_by' => $request->user()->id,
            'course_id' => $courseId,
        ]);

        $gallery->load('uploader');
        $baseUrl = $request->getSchemeAndHttpHost();
        $gallery->image_url = $baseUrl . '/storage/' . $gallery->image_path;

        return response()->json([
            'success' => true,
            'message' => 'Photo uploaded successfully',
            'data' => $gallery,
        ], 201);
    }

    public function show(Request $request, Gallery $gallery)
    {
        // Check if gallery belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $gallery->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Gallery item does not belong to your course.',
            ], 403);
        }
        
        $gallery->load('uploader');
        $baseUrl = $request->getSchemeAndHttpHost();
        $gallery->image_url = $baseUrl . '/storage/' . $gallery->image_path;

        return response()->json([
            'success' => true,
            'data' => $gallery,
        ]);
    }

    public function destroy(Request $request, Gallery $gallery)
    {
        // Check if gallery belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $gallery->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Gallery item does not belong to your course.',
            ], 403);
        }
        
        Storage::disk('public')->delete($gallery->image_path);
        $gallery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully',
        ]);
    }
}

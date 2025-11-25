<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gallery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class GalleryController extends Controller
{
    public function index(Request $request)
    {
        $gallery = Gallery::with('uploader')->orderBy('date', 'desc')->get();

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
        $gallery->load('uploader');
        $baseUrl = $request->getSchemeAndHttpHost();
        $gallery->image_url = $baseUrl . '/storage/' . $gallery->image_path;

        return response()->json([
            'success' => true,
            'data' => $gallery,
        ]);
    }

    public function destroy(Gallery $gallery)
    {
        Storage::disk('public')->delete($gallery->image_path);
        $gallery->delete();

        return response()->json([
            'success' => true,
            'message' => 'Photo deleted successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller
{
    public function index(Request $request)
    {
        $materials = Material::with('uploader');

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

    public function show(Material $material)
    {
        return response()->json([
            'success' => true,
            'data' => $material->load('uploader'),
        ]);
    }

    public function download(Material $material)
    {
        if (!Storage::disk('public')->exists($material->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found',
            ], 404);
        }

        return Storage::disk('public')->download($material->file_path, $material->name);
    }

    public function destroy(Material $material)
    {
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

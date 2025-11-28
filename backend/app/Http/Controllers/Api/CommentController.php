<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'commentable_type' => 'required|string|in:patient,medical_report,attendance_record',
            'commentable_id' => 'required|integer',
        ]);

        $comments = Comment::where('commentable_type', $request->commentable_type)
            ->where('commentable_id', $request->commentable_id)
            ->with('user:id,name,email,role')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'commentable_type' => 'required|string|in:patient,medical_report,attendance_record',
            'commentable_id' => 'required|integer',
            'comment' => 'required|string|max:5000',
        ]);

        // Verify the commentable entity exists
        $modelClass = match($validated['commentable_type']) {
            'patient' => \App\Models\Patient::class,
            'medical_report' => \App\Models\MedicalReport::class,
            'attendance_record' => \App\Models\AttendanceRecord::class,
        };

        $commentable = $modelClass::find($validated['commentable_id']);
        if (!$commentable) {
            return response()->json([
                'success' => false,
                'message' => 'The item you are trying to comment on does not exist.',
            ], 404);
        }

        $comment = Comment::create([
            'user_id' => $user->id,
            'commentable_type' => $validated['commentable_type'],
            'commentable_id' => $validated['commentable_id'],
            'comment' => $validated['comment'],
        ]);

        $comment->load('user:id,name,email,role');

        return response()->json([
            'success' => true,
            'message' => 'Comment added successfully',
            'data' => $comment,
        ], 201);
    }

    public function update(Request $request, Comment $comment)
    {
        $user = $request->user();

        // Only the comment author can update
        if ($comment->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only edit your own comments.',
            ], 403);
        }

        $validated = $request->validate([
            'comment' => 'required|string|max:5000',
        ]);

        $comment->update($validated);
        $comment->load('user:id,name,email,role');

        return response()->json([
            'success' => true,
            'message' => 'Comment updated successfully',
            'data' => $comment,
        ]);
    }

    public function destroy(Request $request, Comment $comment)
    {
        $user = $request->user();

        // Only the comment author or admin can delete
        if ($comment->user_id !== $user->id && $user->role !== 'admin' && $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. You can only delete your own comments.',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'success' => true,
            'message' => 'Comment deleted successfully',
        ]);
    }
}





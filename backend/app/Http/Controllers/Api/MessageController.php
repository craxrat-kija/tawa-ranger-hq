<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Helpers\CourseHelper;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        $messages = Message::with('user');
        
        // Always filter by current user's course_id for isolation
        if ($courseId) {
            $messages->where('course_id', $courseId);
        }
        
        $messages = $messages->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if (!$courseId) {
            return response()->json([
                'success' => false,
                'message' => 'You must be assigned to a course to post messages.',
            ], 403);
        }
        
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
            'course_id' => $courseId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message posted successfully',
            'data' => $message->load('user'),
        ], 201);
    }

    public function show(Request $request, Message $message)
    {
        // Check if message belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $message->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Message does not belong to your course.',
            ], 403);
        }
        
        return response()->json([
            'success' => true,
            'data' => $message->load('user'),
        ]);
    }

    public function update(Request $request, Message $message)
    {
        // Check if message belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $message->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Message does not belong to your course.',
            ], 403);
        }
        
        // Only allow users to update their own messages
        if ($message->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Message updated successfully',
            'data' => $message->load('user'),
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        // Check if message belongs to the same course
        $currentUser = $request->user();
        $courseId = CourseHelper::getCurrentCourseId($currentUser);
        
        if ($courseId && $message->course_id !== $courseId) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Message does not belong to your course.',
            ], 403);
        }
        
        // Only allow users to delete their own messages or admins
        if ($message->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $message->delete();

        return response()->json([
            'success' => true,
            'message' => 'Message deleted successfully',
        ]);
    }
}

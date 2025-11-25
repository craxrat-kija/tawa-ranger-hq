<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $messages = Message::with('user')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $messages,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = Message::create([
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Message posted successfully',
            'data' => $message->load('user'),
        ], 201);
    }

    public function show(Message $message)
    {
        return response()->json([
            'success' => true,
            'data' => $message->load('user'),
        ]);
    }

    public function update(Request $request, Message $message)
    {
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

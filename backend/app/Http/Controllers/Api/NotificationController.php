<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        $notifications = Notification::forUser($user->id)
            ->recent(50)
            ->get();

        $unreadCount = Notification::forUser($user->id)->unread()->count();

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function unread(Request $request)
    {
        $user = $request->user();
        
        $notifications = Notification::forUser($user->id)
            ->unread()
            ->recent(20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    public function markAsRead(Request $request, Notification $notification)
    {
        $user = $request->user();
        
        // Ensure the notification belongs to the user
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'data' => $notification,
        ]);
    }

    public function markAllAsRead(Request $request)
    {
        $user = $request->user();
        
        Notification::forUser($user->id)
            ->unread()
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }

    public function destroy(Request $request, Notification $notification)
    {
        $user = $request->user();
        
        // Ensure the notification belongs to the user
        if ($notification->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    public function count(Request $request)
    {
        $user = $request->user();
        
        $unreadCount = Notification::forUser($user->id)->unread()->count();

        return response()->json([
            'success' => true,
            'unread_count' => $unreadCount,
        ]);
    }
}


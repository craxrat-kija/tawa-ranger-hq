<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminPermission;
use App\Models\User;
use Illuminate\Http\Request;

class AdminPermissionController extends Controller
{
    /**
     * Get all admins with their permissions
     */
    public function index(Request $request)
    {
        // Get the authenticated user ID and fetch fresh from database to ensure we have the latest role
        $authUser = $request->user();
        $user = User::find($authUser->id); // Fetch fresh from database
        
        // Only super admins can view permissions
        if (!$user || $user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admins can view permissions.',
            ], 403);
        }

        $admins = User::where('role', 'admin')
            ->with('adminPermissions', 'course')
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'user_id' => $admin->user_id,
                    'course_id' => $admin->course_id,
                    'course_name' => $admin->course?->name,
                    'permissions' => $admin->adminPermissions ? [
                        'can_manage_users' => $admin->adminPermissions->can_manage_users,
                        'can_manage_subjects' => $admin->adminPermissions->can_manage_subjects,
                        'can_manage_materials' => $admin->adminPermissions->can_manage_materials,
                        'can_manage_gallery' => $admin->adminPermissions->can_manage_gallery,
                        'can_manage_timetable' => $admin->adminPermissions->can_manage_timetable,
                        'can_manage_reports' => $admin->adminPermissions->can_manage_reports,
                        'can_manage_chat' => $admin->adminPermissions->can_manage_chat,
                        'can_manage_assessments' => $admin->adminPermissions->can_manage_assessments,
                        'can_manage_results' => $admin->adminPermissions->can_manage_results,
                        'can_manage_activities' => $admin->adminPermissions->can_manage_activities,
                        'can_view_doctor_dashboard' => $admin->adminPermissions->can_view_doctor_dashboard,
                    ] : null,
                ];
            });

        return response()->json([
            'success' => true,
            'data' => $admins,
        ]);
    }

    /**
     * Update permissions for a specific admin
     */
    public function update(Request $request, $adminId)
    {
        // Get the authenticated user ID and fetch fresh from database to ensure we have the latest role
        $authUser = $request->user();
        $user = User::find($authUser->id); // Fetch fresh from database
        
        // Only super admins can update permissions
        if (!$user || $user->role !== 'super_admin') {
            \Log::warning('Permission update denied', [
                'user_id' => $authUser->id,
                'user_role' => $user?->role ?? 'null',
                'expected' => 'super_admin',
                'admin_id' => $adminId,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only super admins can update permissions.',
            ], 403);
        }

        // Verify the user is an admin
        $admin = User::where('id', $adminId)->where('role', 'admin')->first();
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'User not found or is not an admin.',
            ], 404);
        }

        $validated = $request->validate([
            'can_manage_users' => 'boolean',
            'can_manage_subjects' => 'boolean',
            'can_manage_materials' => 'boolean',
            'can_manage_gallery' => 'boolean',
            'can_manage_timetable' => 'boolean',
            'can_manage_reports' => 'boolean',
            'can_manage_chat' => 'boolean',
            'can_manage_assessments' => 'boolean',
            'can_manage_results' => 'boolean',
            'can_manage_activities' => 'boolean',
            'can_view_doctor_dashboard' => 'boolean',
        ]);

        // Create or update permissions
        $permissions = AdminPermission::updateOrCreate(
            ['admin_id' => $adminId],
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Permissions updated successfully.',
            'data' => $permissions,
        ]);
    }

    /**
     * Get permissions for the current admin
     */
    public function myPermissions(Request $request)
    {
        $user = $request->user();
        
        // Refresh user to get latest data
        $user->refresh();
        
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Only admins have permissions.',
            ], 403);
        }

        // Load permissions relationship
        $permissions = $user->load('adminPermissions')->adminPermissions;

        // If no permissions exist, return all false (default)
        if (!$permissions) {
            return response()->json([
                'success' => true,
                'data' => [
                    'can_manage_users' => false,
                    'can_manage_subjects' => false,
                    'can_manage_materials' => false,
                    'can_manage_gallery' => false,
                    'can_manage_timetable' => false,
                    'can_manage_reports' => false,
                    'can_manage_chat' => false,
                    'can_manage_assessments' => false,
                    'can_manage_results' => false,
                    'can_manage_activities' => false,
                    'can_view_doctor_dashboard' => false,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'can_manage_users' => (bool) $permissions->can_manage_users,
                'can_manage_subjects' => (bool) $permissions->can_manage_subjects,
                'can_manage_materials' => (bool) $permissions->can_manage_materials,
                'can_manage_gallery' => (bool) $permissions->can_manage_gallery,
                'can_manage_timetable' => (bool) $permissions->can_manage_timetable,
                'can_manage_reports' => (bool) $permissions->can_manage_reports,
                'can_manage_chat' => (bool) $permissions->can_manage_chat,
                'can_manage_assessments' => (bool) $permissions->can_manage_assessments,
                'can_manage_results' => (bool) $permissions->can_manage_results,
                'can_manage_activities' => (bool) $permissions->can_manage_activities,
                'can_view_doctor_dashboard' => (bool) $permissions->can_view_doctor_dashboard,
            ],
        ]);
    }
}

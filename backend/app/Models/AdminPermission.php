<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminPermission extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'can_manage_users',
        'can_manage_subjects',
        'can_manage_materials',
        'can_manage_gallery',
        'can_manage_timetable',
        'can_manage_reports',
        'can_manage_chat',
        'can_manage_assessments',
        'can_manage_results',
        'can_manage_activities',
        'can_view_doctor_dashboard',
    ];

    protected $casts = [
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
    ];

    /**
     * Get the admin user that owns these permissions
     */
    public function admin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}

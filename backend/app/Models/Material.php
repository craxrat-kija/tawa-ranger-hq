<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Material extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'subject',
        'course_id',
        'file_path',
        'file_size',
        'uploaded_by',
    ];

    // Relationships
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}

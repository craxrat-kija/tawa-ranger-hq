<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Timetable extends Model
{
    use HasFactory;

    protected $table = 'timetable';

    protected $fillable = [
        'date',
        'time',
        'subject',
        'instructor',
        'location',
        'course_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}

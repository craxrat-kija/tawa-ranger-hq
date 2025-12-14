<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseMetadata extends Model
{
    protected $fillable = [
        'type',
        'value',
        'description',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}

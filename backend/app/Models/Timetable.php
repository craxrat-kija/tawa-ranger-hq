<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
    ];

    protected $casts = [
        'date' => 'date',
    ];
}

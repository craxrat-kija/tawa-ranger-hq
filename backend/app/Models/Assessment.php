<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Assessment extends Model
{
    protected $fillable = [
        'subject_id',
        'instructor_id',
        'title',
        'description',
        'type',
        'date',
        'max_score',
        'weight',
    ];

    protected $casts = [
        'date' => 'date',
        'max_score' => 'decimal:2',
        'weight' => 'decimal:2',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function instructor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'instructor_id');
    }

    public function grades(): HasMany
    {
        return $this->hasMany(Grade::class);
    }
}

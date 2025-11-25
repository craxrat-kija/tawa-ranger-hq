<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    public function instructors(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_subject');
    }

    public function assessments(): HasMany
    {
        return $this->hasMany(Assessment::class);
    }
}

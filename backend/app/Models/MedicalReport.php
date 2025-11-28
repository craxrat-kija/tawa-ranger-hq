<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MedicalReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'date',
        'diagnosis',
        'symptoms',
        'treatment',
        'notes',
        'doctor',
        'blood_pressure',
        'temperature',
        'heart_rate',
        'weight',
        'course_id',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    // Relationships
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }
}

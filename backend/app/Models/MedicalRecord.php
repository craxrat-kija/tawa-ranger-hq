<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'doctor_id',
        // Personal Particulars
        'emergency_contact',
        // Medical Examination Fields
        'blood_type',
        'blood_pressure',
        'malaria_test',
        'sugar_test',
        'hepatitis_test',
        'pregnancy_test',
        'weight',
        'height',
        'hb_hemoglobin',
        'hiv_status',
        // Medical History Fields
        'allergies',
        'medical_history',
        'chronic_illnesses',
        'trauma_history',
        'attachments',
        'record_date',
    ];

    protected function casts(): array
    {
        return [
            'record_date' => 'date',
        ];
    }

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'email',
        'phone',
        'blood_type',
        'allergies',
        'medical_history',
        'emergency_contact',
        'registered_date',
    ];

    protected function casts(): array
    {
        return [
            'registered_date' => 'date',
        ];
    }

    // Relationships
    public function medicalReports()
    {
        return $this->hasMany(MedicalReport::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }
}

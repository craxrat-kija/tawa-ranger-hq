<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('medical_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->onDelete('set null');
            $table->foreignId('doctor_id')->nullable()->constrained('users')->onDelete('set null');
            
            // Personal Particulars
            $table->string('emergency_contact')->nullable();
            
            // Medical Examination Fields
            $table->string('blood_type')->nullable();
            $table->string('blood_pressure')->nullable();
            $table->string('malaria_test')->nullable();
            $table->string('sugar_test')->nullable();
            $table->string('hepatitis_test')->nullable();
            $table->string('pregnancy_test')->nullable();
            $table->string('weight')->nullable();
            $table->string('height')->nullable();
            $table->string('hb_hemoglobin')->nullable();
            $table->string('hiv_status')->nullable();
            
            // Medical History Fields
            $table->text('allergies')->nullable();
            $table->text('medical_history')->nullable();
            $table->text('chronic_illnesses')->nullable();
            $table->text('trauma_history')->nullable();
            
            $table->date('record_date')->default(now());
            $table->timestamps();
            
            // Index for faster queries
            $table->index('user_id');
            $table->index('record_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medical_records');
    }
};

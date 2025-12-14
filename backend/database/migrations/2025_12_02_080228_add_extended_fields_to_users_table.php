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
        Schema::table('users', function (Blueprint $table) {
            // Personal Information
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->string('tribe')->nullable();
            $table->string('religion')->nullable();
            $table->string('blood_group')->nullable();
            $table->string('national_id')->nullable();
            
            // Place of Birth
            $table->string('birth_region')->nullable();
            $table->string('birth_district')->nullable();
            $table->string('birth_street')->nullable();
            
            // Contact Information
            $table->string('phone_2')->nullable();
            
            // Education and Employment
            $table->string('profession')->nullable();
            $table->string('university')->nullable();
            $table->text('employment')->nullable();
            $table->string('other_education_level')->nullable();
            $table->string('other_education_university')->nullable();
            
            // Skills (stored as JSON for multiple entries)
            $table->json('skills')->nullable(); // [{"skill": "Skill 1", "university": "University 1"}, ...]
            
            // Marital Status
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->string('spouse_name')->nullable();
            $table->string('spouse_phone')->nullable();
            
            // Parents
            $table->string('father_name')->nullable();
            $table->string('father_phone')->nullable();
            $table->string('mother_name')->nullable();
            $table->string('mother_phone')->nullable();
            
            // Children
            $table->integer('number_of_children')->nullable()->default(0);
            
            // Relatives (stored as JSON for multiple entries)
            $table->json('relatives')->nullable(); // [{"name": "Name 1", "relationship": "Brother", "phone": "123"}, ...]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'gender',
                'tribe',
                'religion',
                'blood_group',
                'national_id',
                'birth_region',
                'birth_district',
                'birth_street',
                'phone_2',
                'profession',
                'university',
                'employment',
                'other_education_level',
                'other_education_university',
                'skills',
                'marital_status',
                'spouse_name',
                'spouse_phone',
                'father_name',
                'father_phone',
                'mother_name',
                'mother_phone',
                'number_of_children',
                'relatives',
            ]);
        });
    }
};

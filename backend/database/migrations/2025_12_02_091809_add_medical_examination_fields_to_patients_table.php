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
        Schema::table('patients', function (Blueprint $table) {
            // Medical Examination Fields
            $table->string('blood_pressure')->nullable()->after('blood_type');
            $table->string('malaria_test')->nullable()->after('blood_pressure');
            $table->string('sugar_test')->nullable()->after('malaria_test');
            $table->string('hepatitis_test')->nullable()->after('sugar_test');
            $table->string('pregnancy_test')->nullable()->after('hepatitis_test');
            $table->string('weight')->nullable()->after('pregnancy_test');
            $table->string('height')->nullable()->after('weight');
            $table->string('hb_hemoglobin')->nullable()->after('height');
            $table->string('hiv_status')->nullable()->after('hb_hemoglobin');
            
            // Medical History Fields
            $table->text('chronic_illnesses')->nullable()->after('medical_history');
            $table->text('trauma_history')->nullable()->after('chronic_illnesses');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropColumn([
                'blood_pressure',
                'malaria_test',
                'sugar_test',
                'hepatitis_test',
                'pregnancy_test',
                'weight',
                'height',
                'hb_hemoglobin',
                'hiv_status',
                'chronic_illnesses',
                'trauma_history',
            ]);
        });
    }
};

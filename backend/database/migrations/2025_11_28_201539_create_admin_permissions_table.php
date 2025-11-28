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
        Schema::create('admin_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('admin_id')->constrained('users')->onDelete('cascade');
            $table->boolean('can_manage_users')->default(false);
            $table->boolean('can_manage_subjects')->default(false);
            $table->boolean('can_manage_materials')->default(false);
            $table->boolean('can_manage_gallery')->default(false);
            $table->boolean('can_manage_timetable')->default(false);
            $table->boolean('can_manage_reports')->default(false);
            $table->boolean('can_manage_chat')->default(false);
            $table->boolean('can_manage_assessments')->default(false);
            $table->boolean('can_manage_results')->default(false);
            $table->boolean('can_manage_activities')->default(false);
            $table->boolean('can_view_doctor_dashboard')->default(false);
            $table->timestamps();
            
            // Ensure one permission record per admin
            $table->unique('admin_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_permissions');
    }
};

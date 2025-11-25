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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // Transformation Course, Special Course, Recruit Course, Refresher Course
            $table->string('duration'); // e.g., "12 weeks"
            $table->integer('trainees')->default(0);
            $table->foreignId('instructor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('start_date');
            $table->enum('status', ['active', 'completed', 'upcoming'])->default('upcoming');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};

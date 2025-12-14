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
        Schema::create('course_metadata', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['name', 'course_type', 'location', 'course_code']); // Type of metadata
            $table->string('value'); // The actual value (course name, type, or location)
            $table->text('description')->nullable(); // Optional description
            $table->timestamps();
            
            // Ensure unique combination of type and value
            $table->unique(['type', 'value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_metadata');
    }
};

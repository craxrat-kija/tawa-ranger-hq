<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove course_id as we use course_enrollments for many-to-many
            if (Schema::hasColumn('users', 'course_id')) {
                try {
                    // Try to drop foreign key if it exists
                    $table->dropForeign(['course_id']);
                } catch (\Exception $e) {
                    // Ignore if no foreign key
                }
                $table->dropColumn('course_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->unsignedBigInteger('course_id')->nullable();
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modify the enum to include 'super_admin'
        // MySQL requires raw SQL to modify ENUM columns
        DB::statement("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'instructor', 'doctor', 'trainee', 'super_admin') DEFAULT 'trainee'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'super_admin' from the enum
        // First, update any super_admin users to admin
        DB::table('users')->where('role', 'super_admin')->update(['role' => 'admin']);
        
        // Then modify the enum back
        DB::statement("ALTER TABLE `users` MODIFY COLUMN `role` ENUM('admin', 'instructor', 'doctor', 'trainee') DEFAULT 'trainee'");
    }
};

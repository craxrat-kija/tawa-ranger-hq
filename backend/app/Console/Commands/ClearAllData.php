<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearAllData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:clear-all {--force : Force the operation to run when in production}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all data from the database (keeps table structure)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('force') && $this->laravel->environment() === 'production') {
            if (!$this->confirm('Are you sure you want to clear all data in production?')) {
                $this->info('Operation cancelled.');
                return 0;
            }
        }

        $this->info('Clearing all data from database...');

        try {
            $this->clearAllData();
            $this->info('✓ All data cleared successfully!');
            return 0;
        } catch (\Exception $e) {
            $this->error('✗ Error clearing data: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Clear all data from course-related tables
     */
    private function clearAllData()
    {
        $driver = DB::getDriverName();
        
        // Disable foreign key checks temporarily (MySQL/MariaDB)
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        } elseif ($driver === 'pgsql') {
            // PostgreSQL doesn't need this, but we can disable triggers if needed
            // For now, we'll rely on CASCADE deletes or manual ordering
        }

        // Clear all course-related data in proper order to respect foreign keys
        $tables = [
            'grades',
            'assessments',
            'subjects',
            'user_subject',
            'course_enrollments',
            'materials',
            'gallery',
            'timetable',
            'attendance_records',
            'medical_reports',
            'patients',
            'messages',
            'users',
            'courses',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                try {
                    DB::table($table)->truncate();
                    $this->line("  ✓ Cleared table: {$table}");
                } catch (\Exception $e) {
                    // If truncate fails (due to foreign keys), try delete
                    try {
                        DB::table($table)->delete();
                        $this->line("  ✓ Cleared table: {$table} (using delete)");
                    } catch (\Exception $e2) {
                        $this->warn("  ⚠ Could not clear table: {$table} - {$e2->getMessage()}");
                    }
                }
            }
        }

        // Re-enable foreign key checks (MySQL/MariaDB)
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }
}

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
        // First, delete existing data since we can't convert day names to dates
        DB::table('timetable')->truncate();
        
        // Drop the old day column and add date column
        Schema::table('timetable', function (Blueprint $table) {
            $table->dropColumn('day');
            $table->date('date')->after('id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('timetable', function (Blueprint $table) {
            $table->string('day')->after('id');
        });
        
        Schema::table('timetable', function (Blueprint $table) {
            $table->dropColumn('date');
        });
    }
};

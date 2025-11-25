<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::create([
            'name' => 'System Administrator',
            'email' => 'admin@tawa.go.tz',
            'password' => Hash::make('tawa2024'),
            'role' => 'admin',
            'phone' => '+255 712 345 678',
            'department' => 'IT Department',
        ]);

        // Instructor users
        User::create([
            'name' => 'Sgt. John Mwangi',
            'email' => 'instructor@tawa.go.tz',
            'password' => Hash::make('tawa2024'),
            'role' => 'instructor',
            'phone' => '+255 713 456 789',
            'department' => 'Training',
        ]);

        // Doctor user
        User::create([
            'name' => 'Dr. Medical Officer',
            'email' => 'doctor@tawa.go.tz',
            'password' => Hash::make('tawa2024'),
            'role' => 'doctor',
            'phone' => '+255 715 678 901',
            'department' => 'Medical',
        ]);

        // Trainee user
        User::create([
            'name' => 'John Doe',
            'email' => 'trainee@tawa.go.tz',
            'password' => Hash::make('tawa2024'),
            'role' => 'trainee',
            'phone' => '+255 716 789 012',
            'department' => 'Field Operations',
        ]);
    }
}

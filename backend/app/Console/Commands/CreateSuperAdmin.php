<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateSuperAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:create-super-admin 
                            {--email=superadmin@tawa.go.tz : Email address for the super admin}
                            {--password=superadmin2024 : Password for the super admin}
                            {--name=Super Administrator : Name of the super admin}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a super admin user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->option('email');
        $password = $this->option('password');
        $name = $this->option('name');

        // Check if super admin already exists
        $existingUser = User::where('email', $email)
            ->orWhere('role', 'super_admin')
            ->first();

        if ($existingUser) {
            if ($existingUser->role === 'super_admin') {
                $this->error('A super admin user already exists with email: ' . $existingUser->email);
                if ($this->confirm('Do you want to update the existing super admin?')) {
                    $existingUser->update([
                        'name' => $name,
                        'email' => $email,
                        'password' => Hash::make($password),
                        'user_id' => $existingUser->user_id ?? 'SUPER-ADMIN-001',
                    ]);
                    $this->info('Super admin updated successfully!');
                    return 0;
                }
                return 1;
            }
        }

        // Create new super admin
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'user_id' => 'SUPER-ADMIN-001',
            'password' => Hash::make($password),
            'role' => 'super_admin',
            'phone' => '+255 711 000 000',
            'department' => 'IT Department',
        ]);

        $this->info('Super admin created successfully!');
        $this->line('Email: ' . $email);
        $this->line('Password: ' . $password);
        $this->line('User ID: SUPER-ADMIN-001');

        return 0;
    }
}


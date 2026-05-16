<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
   public function run(): void
    {
        // 1. Superadmin
        User::create([
            'name' => 'Super Admin Tigo',
            'username' => 'superadmin',
            'email' => 'tigoipb@gmail.com',
            'password' => Hash::make('tigo-arsa-ipb'),
            'role' => 'superadmin',
            'email_verified_at' => now(),
        ]);

        // // 2. Organizer (EO)
        // $organizer = User::create([
        //     'name' => 'BEM Kampus',
        //     'username' => 'bem_kampus',
        //     'email' => 'organizer@tigo.com',
        //     'password' => Hash::make('organizer123'),
        //     'role' => 'organizer',
        // ]);

        // // Setiap Organizer WAJIB punya Wallet saat akun dibuat
        // Wallet::create([
        //     'organizer_id' => $organizer->_id,
        //     'available_balance' => 0,
        //     'pending_balance' => 0,
        // ]);

        // // 3. Customer
        // User::create([
        //     'name' => 'Aryo Customer',
        //     'username' => 'aryo_tigo',
        //     'email' => 'customer@gmail.com',
        //     'password' => Hash::make('customer123'),
        //     'role' => 'customer',
        // ]);

        $this->command->info('User Seeder berhasil dijalankan!');
    }
}

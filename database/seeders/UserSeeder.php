<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Ambil role pemilik dan karyawan
        $rolePemilik = Role::where('name', 'pemilik')->first();
        $roleKaryawan = Role::where('name', 'karyawan')->first();

        // Bikin user pemilik
        User::firstOrCreate(
            ['email' => 'pemilik@bilingps.pro'],
            [
                'name' => 'Pemilik',
                'password' => Hash::make('password'),
                'role_id' => $rolePemilik->id,
            ]
        );

        // Bikin user karyawan
        User::firstOrCreate(
            ['email' => 'karyawan@bilingps.pro'],
            [
                'name' => 'Karyawan',
                'password' => Hash::make('password'),
                'role_id' => $roleKaryawan->id,
            ]
        );
    }
}

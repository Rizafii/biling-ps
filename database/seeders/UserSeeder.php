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
        $roleSuperAdmin = Role::where('name', 'super admin')->first();
        $rolePemilik = Role::where('name', 'pemilik')->first();
        $rolePenanggungJawab = Role::where('name', 'penanggung jawab')->first();
        $roleKaryawan = Role::where('name', 'karyawan')->first();

        User::firstOrCreate(
            ['email' => 'admin@bilingps.pro'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role_id' => $roleSuperAdmin->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'pemilik@bilingps.pro'],
            [
                'name' => 'Pemilik',
                'password' => Hash::make('password'),
                'role_id' => $rolePemilik->id,
            ]
        );

        User::firstOrCreate(
            ['email' => 'penanggungjawab@bilingps.pro'],
            [
                'name' => 'Penanggung Jawab',
                'password' => Hash::make('password'),
                'role_id' => $rolePenanggungJawab->id,
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

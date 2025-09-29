<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends Controller
{
public function index()
{
    $authUser = Auth::user();

    // default ambil semua users & roles
    $users = User::with('role')->latest();
    $roles = Role::all();

    // filter sesuai role
    if (strtolower($authUser->role->name) === 'pemilik') {
        // user pemilik tidak boleh lihat penanggung jawab
        $users = $users->whereHas('role', function ($q) {
            $q->where('name', '!=', 'super admin');
        });

        // filter roles -> pemilik tidak boleh bikin super admin
        $roles = Role::where('name', '!=', 'super admin')->get();

    } elseif (strtolower($authUser->role->name) === 'penanggung jawab') {
        // user penanggung jawab hanya boleh lihat karyawan
        $users = $users->whereHas('role', function ($q) {
            $q->where('name', 'karyawan');
        });

        // filter roles -> penanggung jawab hanya bisa bikin karyawan
        $roles = Role::where('name', 'karyawan')->get();
    }

    return Inertia::render('user/index', [
        'users' => $users->get(),
        'roles' => $roles,
    ]);
}



    public function store(Request $request)
    {
        $authUser = Auth::user();

        // ambil role yang diperbolehkan untuk user login
        $allowedRoles = Role::query();
        if ($authUser->role->name === 'pemilik') {
            $allowedRoles->where('name', '!=', 'super admin');
        } elseif ($authUser->role->name === 'penanggung jawab') {
            $allowedRoles->where('name', 'karyawan');
        }
        $allowedRoleIds = $allowedRoles->pluck('id')->toArray();

        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id'  => 'required|integer|in:' . implode(',', $allowedRoleIds),
        ]);

        User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id'  => $validated['role_id'],
        ]);

        return redirect()->back()->with('success', 'User berhasil ditambahkan.');
    }


    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|integer|exists:roles,id',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role_id = $validated['role_id'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->back()->with('success', 'User berhasil diupdate.');
    }

    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->back()->with('success', 'User berhasil dihapus.');
    }
}

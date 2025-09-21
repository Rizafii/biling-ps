<?php

namespace App\Http\Controllers;

use App\Models\Role;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleController extends Controller
{
    public function index()
    {
        $roles = Role::latest()->get();

        return Inertia::render('role/index', [
            'roles' => $roles,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:50|unique:roles,name',
            'guard_name' => 'required|string|max:50',
        ]);

        Role::create($validated);

        return redirect()->back()->with('success', 'Role berhasil ditambahkan.');
    }

    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:50|unique:roles,name,' . $role->id,
            'guard_name' => 'required|string|max:50',
        ]);

        $role->update($validated);

        return redirect()->back()->with('success', 'Role berhasil diupdate.');
    }

    public function destroy(Role $role)
    {
        $role->delete();

        return redirect()->back()->with('success', 'Role berhasil dihapus.');
    }
}

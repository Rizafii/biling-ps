<?php

namespace App\Http\Controllers;

use App\Models\Paket;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaketController extends Controller
{
    public function index()
    {
        $pakets = Paket::latest()->get();

        return Inertia::render('paket/index', [
            'pakets' => $pakets,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'harga' => 'required|numeric',
            'duration' => 'nullable|numeric',
            'is_active' => 'required|boolean',
        ]);


        Paket::create($validated);

        return back()->with('success', 'Paket berhasil ditambahkan.');
    }

    public function update(Request $request, Paket $paket)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'harga' => 'required|numeric',
            'duration' => 'nullable|numeric',
            'is_active' => 'required|boolean',
        ]);


        $paket->update($validated);

        return back()->with('success', 'Paket berhasil diperbarui.');
    }

    public function destroy(Paket $paket)
    {
        $paket->delete();

        return back()->with('success', 'Paket berhasil dihapus.');
    }
}

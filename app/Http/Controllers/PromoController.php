<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PromoController extends Controller
{
    public function index()
    {
        $promos = Promo::latest()->get();
        return Inertia::render('promo/index', [
            'promos' => $promos,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'code'         => 'nullable|string|max:50',
            'type'         => 'required|in:flat,percent,time,bundle',
            'value'        => 'nullable|integer',
            'min_duration' => 'nullable|integer',
            'is_active'    => 'boolean',
        ]);

        Promo::create($validated);

        return redirect()->back()->with('success', 'Promo berhasil ditambahkan');
    }

    public function show(Promo $promo)
    {
        return response()->json($promo);
    }

    public function update(Request $request, Promo $promo)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'code'         => 'nullable|string|max:50',
            'type'         => 'required|in:flat,percent,time,bundle',
            'value'        => 'nullable|integer',
            'min_duration' => 'nullable|integer',
            'is_active'    => 'boolean',
        ]);

        $promo->update($validated);

        return redirect()->back()->with('success', 'Promo berhasil diperbarui');
    }

    public function destroy(Promo $promo)
    {
        $promo->delete();

        return redirect()->back()->with('success', 'Promo berhasil dihapus');
    }
}

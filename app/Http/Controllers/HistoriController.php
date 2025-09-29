<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use App\Models\EspRelay;
use App\Models\Promo;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HistoriController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $historis = Billing::with(['promo', 'espRelay','user'])->latest()->get();
        $promo = Promo::all();
        $esp_relay = EspRelay::all();

        return Inertia::render('histori/index', [
            'data' => $historis,
            'promo' => $promo,
            'esp_relay' => $esp_relay
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Billing $histori)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Billing $histori)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Billing $histori)
    {
        //
    }

    /**
     * Process payment for a billing
     */
    public function pay(Request $request, Billing $histori)
    {
        // Validate request
        $validated = $request->validate([
            'promo_id' => 'nullable|exists:promos,id',
        ]);

        // Check if billing is already paid
        if ($histori->status === 'sudah_bayar') {
            return back()->withErrors([
                'message' => 'Billing sudah dibayar sebelumnya'
            ]);
        }

        // Check if billing is completed
        if ($histori->status !== 'selesai') {
            return back()->withErrors([
                'message' => 'Billing belum selesai'
            ]);
        }

        $totalSetelahPromo = (float) $histori->total_biaya;
        $promoId = $validated['promo_id'] ?? null;

        // Apply promo if selected
        if ($promoId) {
            $promo = Promo::find($promoId);
            if ($promo && $promo->is_active) {
                // Calculate duration in minutes
                $durasiMenit = 0;
                if ($histori->durasi) {
                    $durasi = $histori->durasi;
                    if (is_string($durasi)) {
                        // Convert time format (HH:MM:SS) to minutes
                        $parts = explode(':', $durasi);
                        $durasiMenit = ((int) $parts[0] * 60) + (int) $parts[1];
                    }
                }

                $totalSetelahPromo = $promo->calculateDiscount(
                    (float) $histori->total_biaya,
                    $durasiMenit,
                    (float) $histori->tarif_perjam
                );
            }
        }

        // Update billing
        $histori->update([
            'status' => 'sudah_bayar',
            'promo_id' => $promoId,
            'total_setelah_promo' => $totalSetelahPromo,
        ]);

        return back()->with('success', 'Pembayaran berhasil diproses');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Billing $histori)
    {
        //
    }
}

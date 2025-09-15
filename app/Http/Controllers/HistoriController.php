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
        $historis = Billing::with(['promo', 'espRelay'])->latest()->get();
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
     * Remove the specified resource from storage.
     */
    public function destroy(Billing $histori)
    {
        //
    }
}

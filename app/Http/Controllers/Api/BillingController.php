<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Billing;
use App\Models\EspRelay;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BillingController extends Controller
{
    /**
     * Start a new billing session
     */
    public function start(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'device_id' => 'required|string',
                'pin' => 'required|integer',
                'nama_pelanggan' => 'required|string',
                'mode' => 'required|in:bebas,timer',
                'tarif_perjam' => 'required|numeric|min:0',
                'promo_id' => 'nullable|exists:promos,id',
            ]);

            // Find the ESP relay by device_id and pin
            $espRelay = EspRelay::where('device_id', $validated['device_id'])
                ->where('pin', $validated['pin'])
                ->first();

            if (!$espRelay) {
                return response()->json([
                    'success' => false,
                    'message' => 'ESP Relay not found for device and pin',
                ], 404);
            }

            // Check if there's already an active billing for this relay
            $existingBilling = Billing::where('esp_relay_id', $espRelay->id)
                ->where('status', 'aktif')
                ->first();

            if ($existingBilling) {
                return response()->json([
                    'success' => false,
                    'message' => 'There is already an active billing session for this relay',
                ], 400);
            }

            // Create new billing record
            $billing = Billing::create([
                'esp_relay_id' => $espRelay->id,
                'promo_id' => $validated['promo_id'],
                'nama_pelanggan' => $validated['nama_pelanggan'],
                'mode' => $validated['mode'],
                'status' => 'aktif',
                'tarif_perjam' => $validated['tarif_perjam'],
                'waktu_mulai' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Billing session started successfully',
                'data' => [
                    'billing_id' => $billing->id,
                    'esp_relay_id' => $billing->esp_relay_id,
                    'nama_pelanggan' => $billing->nama_pelanggan,
                    'mode' => $billing->mode,
                    'tarif_perjam' => $billing->tarif_perjam,
                    'waktu_mulai' => $billing->waktu_mulai->toISOString(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start billing session: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Stop billing session and calculate final costs
     */
    public function stop(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'device_id' => 'required|string',
                'pin' => 'required|integer',
                'total_biaya' => 'required|numeric|min:0',
                'durasi_menit' => 'nullable|integer|min:0', // Only required for bebas mode
            ]);

            // Find the ESP relay by device_id and pin
            $espRelay = EspRelay::where('device_id', $validated['device_id'])
                ->where('pin', $validated['pin'])
                ->first();

            if (!$espRelay) {
                return response()->json([
                    'success' => false,
                    'message' => 'ESP Relay not found for device and pin',
                ], 404);
            }

            // Find active billing for this relay
            $billing = Billing::where('esp_relay_id', $espRelay->id)
                ->where('status', 'aktif')
                ->first();

            if (!$billing) {
                return response()->json([
                    'success' => false,
                    'message' => 'No active billing session found for this relay',
                ], 404);
            }

            // Calculate duration in minutes if not provided (for bebas mode)
            $durasiMenit = $validated['durasi_menit'];
            if ($billing->mode === 'bebas' && !$durasiMenit) {
                $waktuMulai = Carbon::parse($billing->waktu_mulai);
                $waktuSekarang = Carbon::now();
                $durasiMenit = $waktuSekarang->diffInMinutes($waktuMulai);
            }

            // Update billing record
            $billing->update([
                'status' => 'selesai',
                'total_biaya' => $validated['total_biaya'],
                'durasi_menit' => $durasiMenit,
                'waktu_selesai' => Carbon::now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Billing session stopped successfully',
                'data' => [
                    'billing_id' => $billing->id,
                    'nama_pelanggan' => $billing->nama_pelanggan,
                    'mode' => $billing->mode,
                    'total_biaya' => $billing->total_biaya,
                    'durasi_menit' => $billing->durasi_menit,
                    'waktu_mulai' => $billing->waktu_mulai->toISOString(),
                    'waktu_selesai' => $billing->waktu_selesai->toISOString(),
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to stop billing session: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get active billing for a specific relay
     */
    public function getActiveBilling(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'device_id' => 'required|string',
                'pin' => 'required|integer',
            ]);

            // Find the ESP relay by device_id and pin
            $espRelay = EspRelay::where('device_id', $validated['device_id'])
                ->where('pin', $validated['pin'])
                ->first();

            if (!$espRelay) {
                return response()->json([
                    'success' => false,
                    'message' => 'ESP Relay not found for device and pin',
                ], 404);
            }

            // Find active billing for this relay
            $billing = Billing::with(['promo'])
                ->where('esp_relay_id', $espRelay->id)
                ->where('status', 'aktif')
                ->first();

            if (!$billing) {
                return response()->json([
                    'success' => true,
                    'message' => 'No active billing session found',
                    'data' => null,
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'billing_id' => $billing->id,
                    'nama_pelanggan' => $billing->nama_pelanggan,
                    'mode' => $billing->mode,
                    'tarif_perjam' => $billing->tarif_perjam,
                    'waktu_mulai' => $billing->waktu_mulai->toISOString(),
                    'promo' => $billing->promo ? [
                        'id' => $billing->promo->id,
                        'name' => $billing->promo->name,
                        'code' => $billing->promo->code,
                    ] : null,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get active billing: ' . $e->getMessage(),
            ], 500);
        }
    }
}
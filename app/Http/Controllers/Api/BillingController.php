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
                'durasi' => 'nullable|string', // Required for timer mode (HH:MM:SS format)
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

            // Validate duration for timer mode
            $durasi = null;
            if ($validated['mode'] === 'timer') {
                if (!isset($validated['durasi']) || empty($validated['durasi'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Duration is required for timer mode',
                    ], 400);
                }
                $durasi = $validated['durasi'];
            }

            // Create new billing record
            $billing = Billing::create([
                'esp_relay_id' => $espRelay->id,
                'promo_id' => $validated['promo_id'],
                'nama_pelanggan' => $validated['nama_pelanggan'],
                'mode' => $validated['mode'],
                'status' => 'aktif',
                'tarif_perjam' => $validated['tarif_perjam'],
                'durasi' => $durasi, // Set duration for timer mode
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
                    'durasi' => $billing->durasi,
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
                'durasi' => 'nullable|string', // Now accepts time format HH:MM:SS
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

            // Calculate actual duration for both modes
            $waktuMulai = Carbon::parse($billing->waktu_mulai);
            $waktuSekarang = Carbon::now();
            $totalSeconds = $waktuSekarang->diffInSeconds($waktuMulai);

            // Convert actual elapsed time to HH:MM:SS format
            $hours = floor($totalSeconds / 3600);
            $minutes = floor(($totalSeconds % 3600) / 60);
            $seconds = $totalSeconds % 60;
            $durasiAktual = sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);

            // Use provided duration if available, otherwise use calculated actual duration
            $durasi = $validated['durasi'] ?? $durasiAktual;

            // Update billing record
            $billing->update([
                'status' => 'selesai',
                'total_biaya' => $validated['total_biaya'],
                'durasi' => $durasi,
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
                    'durasi' => $billing->durasi,
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

    /**
     * Check and auto-stop expired timed billings
     */
    public function checkExpiredTimedBillings(): JsonResponse
    {
        try {
            // Get all active timer mode billings
            $expiredBillings = Billing::with(['espRelay'])
                ->where('status', 'aktif')
                ->where('mode', 'timer')
                ->whereNotNull('durasi')
                ->get()
                ->filter(function ($billing) {
                    // Check if billing has expired
                    $waktuMulai = Carbon::parse($billing->waktu_mulai);
                    $durasi = $billing->durasi; // Already in HH:MM:SS format
    
                    // Parse duration to add to start time
                    $durasiParts = explode(':', $durasi);
                    $hours = (int) $durasiParts[0];
                    $minutes = (int) $durasiParts[1];
                    $seconds = (int) $durasiParts[2];

                    $waktuSelesai = $waktuMulai->copy()
                        ->addHours($hours)
                        ->addMinutes($minutes)
                        ->addSeconds($seconds);

                    return Carbon::now()->greaterThan($waktuSelesai);
                });

            $stoppedBillings = [];

            foreach ($expiredBillings as $billing) {
                // Calculate total cost based on the set duration
                $tarif = $billing->tarif_perjam;
                $durasi = $billing->durasi;

                // Convert duration to hours for calculation
                $durasiParts = explode(':', $durasi);
                $totalHours = (int) $durasiParts[0] + ((int) $durasiParts[1] / 60) + ((int) $durasiParts[2] / 3600);

                $totalBiaya = $tarif * $totalHours;

                // Round up to nearest 100
                $sisa = $totalBiaya % 100;
                if ($sisa !== 0) {
                    $totalBiaya = $totalBiaya + (100 - $sisa);
                }

                // Update billing to completed
                $billing->update([
                    'status' => 'selesai',
                    'total_biaya' => $totalBiaya,
                    'waktu_selesai' => Carbon::now(),
                ]);

                $stoppedBillings[] = [
                    'billing_id' => $billing->id,
                    'device_id' => $billing->espRelay->device_id,
                    'pin' => $billing->espRelay->pin,
                    'nama_pelanggan' => $billing->nama_pelanggan,
                    'total_biaya' => $totalBiaya,
                    'durasi' => $billing->durasi,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Expired billings checked',
                'expired_count' => count($stoppedBillings),
                'stopped_billings' => $stoppedBillings,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check expired billings: ' . $e->getMessage(),
            ], 500);
        }
    }
}
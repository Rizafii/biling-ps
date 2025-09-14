<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EspDevice;
use App\Models\EspRelay;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class EspController extends Controller
{
    /**
     * Handle heartbeat from ESP32 devices
     * Hanya untuk update status device, bukan relay
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:255',
            'timestamp' => 'nullable|numeric',
            'ip_address' => 'nullable|string|ip',
        ]);

        // Find device
        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not registered. Please add device via admin panel first.',
                'device_id' => $validated['device_id'],
            ], 404);
        }

        // Update device status dan heartbeat
        $device->update([
            'status' => 'online',
            'last_heartbeat' => now(),
        ]);

        // Log heartbeat
        \Log::info("Heartbeat received from device: {$validated['device_id']}", [
            'ip_address' => $validated['ip_address'] ?? 'unknown',
            'timestamp' => $validated['timestamp'] ?? 'unknown',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Heartbeat received successfully',
            'device_id' => $device->device_id,
            'server_time' => now()->toISOString(),
        ]);
    }

    /**
     * Get relay status for ESP32 device
     * ESP akan polling endpoint ini untuk mendapatkan status relay terbaru
     */
    public function getRelayStatus(Request $request, string $deviceId): JsonResponse
    {
        $device = EspDevice::where('device_id', $deviceId)->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        // Get all relays for this device
        $relays = EspRelay::where('device_id', $deviceId)
            ->orderBy('pin')
            ->get();

        $relayStatus = [];
        foreach ($relays as $relay) {
            $relayStatus[] = [
                'pin' => $relay->pin,
                'status' => $relay->status ? 1 : 0, // 1 = ON (relay OFF, aliran nyala), 0 = OFF (relay ON, aliran mati)
                'nama' => $relay->nama_relay,
            ];
        }

        return response()->json([
            'success' => true,
            'device_id' => $deviceId,
            'relays' => $relayStatus,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Control relay from web interface
     * Endpoint ini dipanggil dari dashboard untuk mengubah status relay
     */
    public function controlRelay(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'pin' => 'required|integer',
            'status' => 'required|boolean', // true = aliran nyala, false = aliran mati
        ]);

        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        // Update relay status
        $relay = EspRelay::where('device_id', $validated['device_id'])
            ->where('pin', $validated['pin'])
            ->first();

        if (!$relay) {
            return response()->json([
                'success' => false,
                'message' => 'Relay not found',
            ], 404);
        }

        $relay->update(['status' => $validated['status']]);

        // Log relay control
        \Log::info("Relay controlled from web", [
            'device_id' => $validated['device_id'],
            'pin' => $validated['pin'],
            'status' => $validated['status'] ? 'ON' : 'OFF',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Relay status updated',
            'device_id' => $validated['device_id'],
            'pin' => $validated['pin'],
            'status' => $validated['status'],
        ]);
    }

    /**
     * Bulk control multiple relays
     * Untuk kontrol multiple relay sekaligus
     */
    public function controlMultipleRelays(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'relays' => 'required|array',
            'relays.*.pin' => 'required|integer',
            'relays.*.status' => 'required|boolean',
        ]);

        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        $updatedRelays = [];

        foreach ($validated['relays'] as $relayData) {
            $relay = EspRelay::where('device_id', $validated['device_id'])
                ->where('pin', $relayData['pin'])
                ->first();

            if ($relay) {
                $relay->update(['status' => $relayData['status']]);
                $updatedRelays[] = [
                    'pin' => $relayData['pin'],
                    'status' => $relayData['status'],
                    'nama' => $relay->nama_relay,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Multiple relays updated',
            'device_id' => $validated['device_id'],
            'updated_relays' => $updatedRelays,
        ]);
    }
}

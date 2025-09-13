<?php

namespace App\Http\Controllers;

use App\Models\EspDevice;
use App\Models\EspRelay;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EspDeviceController extends Controller
{
    public function index()
    {
        $devices = EspDevice::latest()->get();
        return Inertia::render('device/index', [
            'devices' => $devices,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:255|unique:esp_devices,device_id',
            'name' => 'nullable|string|max:255',
            'status' => 'required|in:online,offline',
        ]);

        $device = EspDevice::create($validated);

        // Auto-create 8 relay/port untuk device baru
        $this->createDefaultRelays($device->device_id);

        return redirect()->back()->with('success', 'Device berhasil ditambahkan');
    }

    public function show(EspDevice $device)
    {
        return response()->json($device);
    }

    public function update(Request $request, EspDevice $device)
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:255|unique:esp_devices,device_id,' . $device->id,
            'name' => 'nullable|string|max:255',
            'status' => 'required|in:online,offline',
        ]);

        $device->update($validated);

        return redirect()->back()->with('success', 'Device berhasil diperbarui');
    }

    public function destroy(EspDevice $device)
    {
        $device->delete();

        return redirect()->back()->with('success', 'Device berhasil dihapus');
    }

    /**
     * Handle heartbeat from ESP32 devices
     */
    public function heartbeat(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string|max:255',
            'timestamp' => 'nullable|numeric',
            'ip_address' => 'nullable|string|ip',
            'status' => 'nullable|string',
            'relays' => 'nullable|array',
        ]);

        // Find device (tidak auto-create)
        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            // Device tidak ditemukan, kembalikan error
            return response()->json([
                'success' => false,
                'message' => 'Device not registered. Please add device via admin panel first.',
                'device_id' => $validated['device_id'],
            ], 404);
        }

        // Update existing device status dan heartbeat
        $device->update([
            'status' => 'online',
            'last_heartbeat' => now(),
        ]);

        // Update relay states if provided (hanya update, tidak create baru)
        if (isset($validated['relays']) && is_array($validated['relays'])) {
            $this->updateRelayStates($validated['device_id'], $validated['relays']);
        }

        // Log heartbeat for debugging
        \Log::info("Heartbeat received from device: {$validated['device_id']}", [
            'ip_address' => $validated['ip_address'] ?? 'unknown',
            'timestamp' => $validated['timestamp'] ?? 'unknown',
            'relays_count' => count($validated['relays'] ?? []),
        ]);

        // Return success response
        return response()->json([
            'success' => true,
            'message' => 'Heartbeat received successfully',
            'device_id' => $device->device_id,
            'server_time' => now()->toISOString(),
            'relays' => [], // For future relay control implementation
        ]);
    }

    /**
     * Handle relay control (for future implementation)
     */
    public function relayControl(Request $request)
    {
        $validated = $request->validate([
            'device_id' => 'required|string',
            'relay_pin' => 'required|integer',
            'state' => 'required|boolean',
        ]);

        // Find device
        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            return response()->json([
                'success' => false,
                'message' => 'Device not found',
            ], 404);
        }

        // For now, just return success
        // In the future, this will store relay commands in database
        return response()->json([
            'success' => true,
            'message' => 'Relay command received',
        ]);
    }

    /**
     * Get devices for API (auto-refresh)
     */
    public function getDevices()
    {
        // First, check for offline devices
        $this->checkOfflineDevices();

        $devices = EspDevice::with(['latestRelays'])->latest()->get();

        return response()->json([
            'success' => true,
            'devices' => $devices,
        ]);
    }

    /**
     * Get ports/relays for dashboard
     */
    public function getPorts()
    {
        // First, check for offline devices
        $this->checkOfflineDevices();

        $devices = EspDevice::with(['relays'])->get();

        $ports = [];
        foreach ($devices as $device) {
            // Get relays untuk device ini (tidak perlu latest, karena sekarang tidak ada log)
            $relays = EspRelay::where('device_id', $device->device_id)
                ->orderBy('pin')
                ->get();

            foreach ($relays as $relay) {
                $portNumber = $this->getPinToPortNumber($relay->pin);

                // Determine port status based on device status
                $portStatus = 'idle'; // default
                if ($device->status === 'offline') {
                    $portStatus = 'off';
                } elseif ($device->status === 'online') {
                    $portStatus = $relay->status ? 'on' : 'idle';
                }

                $ports[] = [
                    'id' => $device->device_id . '_' . $relay->pin,
                    'device' => $device->device_id,
                    'device_name' => $device->name,
                    'no_port' => 'PORT ' . $portNumber,
                    'nama_port' => $relay->nama_relay,
                    'pin' => $relay->pin,
                    'type' => '', // Will be set by billing logic
                    'nama_pelanggan' => '',
                    'duration' => '00:00:00',
                    'price' => '',
                    'status' => $portStatus,
                    'time' => 0,
                    'total' => 0,
                    'billing' => 0,
                    'subtotal' => 0,
                    'diskon' => 0,
                    'device_status' => $device->status,
                    'last_heartbeat' => $device->last_heartbeat,
                ];
            }
        }

        return response()->json([
            'success' => true,
            'ports' => $ports,
        ]);
    }

    /**
     * Check and mark offline devices
     */
    public function checkOfflineDevices()
    {
        $thirtySecondsAgo = Carbon::now()->subSeconds(30);

        // Find devices that are marked as online but haven't sent heartbeat in 30 seconds
        $offlineDevices = EspDevice::where('status', 'online')
            ->where(function ($query) use ($thirtySecondsAgo) {
                $query->where('last_heartbeat', '<', $thirtySecondsAgo)
                    ->orWhereNull('last_heartbeat');
            })
            ->get();

        foreach ($offlineDevices as $device) {
            $device->update(['status' => 'offline']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Device status checked',
            'offline_devices' => $offlineDevices->count(),
        ]);
    }

    /**
     * Create default 8 relays for a new device
     */
    private function createDefaultRelays(string $deviceId)
    {
        // Pin mapping sesuai dengan kode ESP32
        $relayPins = [12, 13, 14, 27, 26, 25, 33, 32];

        foreach ($relayPins as $index => $pin) {
            EspRelay::create([
                'device_id' => $deviceId,
                'pin' => $pin,
                'nama_relay' => 'PORT ' . ($index + 1),
                'status' => false, // Default OFF
            ]);
        }
    }

    /**
     * Update relay states when receiving heartbeat from ESP32
     * Hanya update status relay yang sudah ada, tidak create baru
     */
    private function updateRelayStates(string $deviceId, array $relays)
    {
        foreach ($relays as $relay) {
            $pin = $relay['pin'] ?? null;
            $state = $relay['state'] ?? false;

            if ($pin) {
                // Update relay yang sudah ada berdasarkan device_id dan pin
                EspRelay::where('device_id', $deviceId)
                    ->where('pin', $pin)
                    ->update(['status' => $state]);
            }
        }
    }

    /**
     * Convert pin number to port number
     */
    private function getPinToPortNumber(int $pin): int
    {
        $pinMapping = [12 => 1, 13 => 2, 14 => 3, 27 => 4, 26 => 5, 25 => 6, 33 => 7, 32 => 8];
        return $pinMapping[$pin] ?? 0;
    }
}
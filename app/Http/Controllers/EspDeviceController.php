<?php

namespace App\Http\Controllers;

use App\Models\EspDevice;
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

        EspDevice::create($validated);

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

        // Find or create device with better validation
        $device = EspDevice::where('device_id', $validated['device_id'])->first();

        if (!$device) {
            // Create new device if it doesn't exist
            $device = EspDevice::create([
                'device_id' => $validated['device_id'],
                'name' => 'ESP Device ' . $validated['device_id'],
                'status' => 'online',
                'last_heartbeat' => now(),
            ]);

            \Log::info("New ESP device registered: {$validated['device_id']}");
        } else {
            // Update existing device
            $device->update([
                'status' => 'online',
                'last_heartbeat' => now(),
            ]);
        }

        // Log heartbeat for debugging
        \Log::info("Heartbeat received from device: {$validated['device_id']}", [
            'ip_address' => $validated['ip_address'] ?? 'unknown',
            'timestamp' => $validated['timestamp'] ?? 'unknown',
        ]);

        // Return success response with any relay commands if needed
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

        $devices = EspDevice::latest()->get();

        return response()->json([
            'success' => true,
            'devices' => $devices,
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
}
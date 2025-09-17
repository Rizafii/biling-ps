<?php

namespace App\Console\Commands;

use App\Models\EspDevice;
use App\Models\Billing;
use Illuminate\Console\Command;
use Carbon\Carbon;

class CheckDeviceStatus extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'device:check-status';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check device status and mark offline devices that haven\'t sent heartbeat in 30 seconds';

    /**
     * Execute the console command.
     */
    public function handle()
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
            $this->info("Device {$device->device_id} marked as offline");

            // Check for active billings on this device and stop them automatically
            $this->stopActiveBillingsForDevice($device);
        }

        $this->info("Checked " . EspDevice::count() . " devices, marked " . $offlineDevices->count() . " as offline");

        return 0;
    }

    /**
     * Stop active billings for offline device
     */
    private function stopActiveBillingsForDevice(EspDevice $device)
    {
        // Get all active billings for relays on this device
        $activeBillings = Billing::whereHas('espRelay', function ($query) use ($device) {
            $query->where('device_id', $device->device_id);
        })
            ->where('status', 'aktif')
            ->get();

        foreach ($activeBillings as $billing) {
            $this->stopBillingAutomatically($billing);
        }
    }

    /**
     * Stop billing automatically due to device offline
     */
    private function stopBillingAutomatically(Billing $billing)
    {
        $stopTime = Carbon::now();
        $startTime = Carbon::parse($billing->waktu_mulai);

        // Calculate actual duration
        $actualDurationInMinutes = $startTime->diffInMinutes($stopTime);
        $actualDurationTime = gmdate('H:i:s', $actualDurationInMinutes * 60);

        if ($billing->mode === 'timer') {
            // For timer mode: calculate cost based on actual duration
            $actualCost = ($actualDurationInMinutes / 60) * $billing->tarif_perjam;

            $billing->update([
                'status' => 'selesai',
                'waktu_selesai' => $stopTime,
                'durasi' => $actualDurationTime,
                'total_biaya' => round($actualCost, 2)
            ]);

            $this->info("Timer billing for {$billing->nama_pelanggan} stopped automatically. Actual cost: Rp" . number_format((float) $actualCost, 0, ',', '.'));
        } else {
            // For 'bebas' mode: keep the original total cost
            $billing->update([
                'status' => 'selesai',
                'waktu_selesai' => $stopTime,
                'durasi' => $actualDurationTime
            ]);

            $this->info("Free billing for {$billing->nama_pelanggan} stopped automatically. Cost remains: Rp" . number_format((float) $billing->total_biaya, 0, ',', '.'));
        }
    }
}

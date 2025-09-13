<?php

namespace App\Console\Commands;

use App\Models\EspDevice;
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
        }

        $this->info("Checked " . EspDevice::count() . " devices, marked " . $offlineDevices->count() . " as offline");

        return 0;
    }
}

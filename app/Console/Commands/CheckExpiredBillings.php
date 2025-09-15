<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Billing;
use App\Models\EspRelay;
use App\Models\EspDevice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class CheckExpiredBillings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'billing:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check expired timer billings and automatically turn off relays';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired billings...');

        // Get all active timer billings
        $activeTimerBillings = Billing::with(['espRelay', 'espRelay.device'])
            ->where('status', 'aktif')
            ->where('mode', 'timer')
            ->whereNotNull('durasi')
            ->get();

        $expiredCount = 0;
        $stoppedBillings = [];

        foreach ($activeTimerBillings as $billing) {
            // Parse durasi (HH:MM:SS)
            $durasiParts = explode(':', $billing->durasi);
            $totalDetikDurasi = ($durasiParts[0] * 3600) + ($durasiParts[1] * 60) + ($durasiParts[2] ?? 0);

            // Calculate elapsed time
            $waktuMulai = Carbon::parse($billing->waktu_mulai);
            $waktuSekarang = Carbon::now();

            // Use timestamp difference to avoid negative values
            $detikBerjalan = $waktuSekarang->timestamp - $waktuMulai->timestamp;

            // Ensure elapsed time is not negative
            if ($detikBerjalan < 0) {
                $detikBerjalan = 0;
            }

            // Check if billing has expired
            if ($detikBerjalan >= $totalDetikDurasi) {
                $this->info("Billing expired for {$billing->nama_pelanggan} on device {$billing->espRelay->device_id}, pin {$billing->espRelay->pin}");

                // Turn off relay
                $success = $this->turnOffRelay($billing->espRelay->device_id, $billing->espRelay->pin);

                if ($success) {
                    // For timer mode, use the original duration, not actual elapsed time
                    // Calculate total cost based on original duration (not actual elapsed time)
                    $totalBiaya = $this->hitungTotal((float) $billing->tarif_perjam, $totalDetikDurasi);

                    // Keep original duration as planned, don't update it
                    $originalDurasi = $billing->durasi;

                    // Calculate expected end time based on start time + original duration
                    $expectedEndTime = $waktuMulai->copy()->addSeconds($totalDetikDurasi);

                    // Update billing status
                    $billing->update([
                        'status' => 'selesai',
                        'waktu_selesai' => $expectedEndTime, // Use expected end time, not current time
                        'total_biaya' => $totalBiaya,
                        'durasi' => $originalDurasi, // Keep original duration
                    ]);

                    // Update relay status
                    $billing->espRelay->update(['status' => false]);

                    $stoppedBillings[] = [
                        'device_id' => $billing->espRelay->device_id,
                        'pin' => $billing->espRelay->pin,
                        'nama_pelanggan' => $billing->nama_pelanggan,
                        'total_biaya' => $totalBiaya,
                        'durasi' => $originalDurasi,
                    ];

                    $expiredCount++;
                    $this->info("Successfully stopped billing for {$billing->nama_pelanggan}");
                    $this->info("  Original duration: {$originalDurasi}, Cost based on original duration: Rp " . number_format($totalBiaya));
                } else {
                    $this->error("Failed to turn off relay for {$billing->nama_pelanggan}");
                    Log::error("Failed to turn off relay for billing ID: {$billing->id}");
                }
            }
        }

        if ($expiredCount > 0) {
            $this->info("Stopped {$expiredCount} expired billings");
            Log::info("Auto-stopped {$expiredCount} expired billings", ['stopped_billings' => $stoppedBillings]);
        } else {
            $this->info("No expired billings found");
        }

        return Command::SUCCESS;
    }

    /**
     * Turn off relay for a specific device and pin
     */
    private function turnOffRelay(string $deviceId, int $pin): bool
    {
        try {
            // Check if device exists
            $device = EspDevice::where('device_id', $deviceId)->first();

            if (!$device) {
                Log::warning("Device not found: {$deviceId}");
                return false;
            }

            // Update relay status in database
            $relay = EspRelay::where('device_id', $deviceId)
                ->where('pin', $pin)
                ->first();

            if (!$relay) {
                Log::warning("Relay not found", ['device_id' => $deviceId, 'pin' => $pin]);
                return false;
            }

            // Turn off relay status
            $relay->update(['status' => false]);

            // Log relay control
            Log::info("Relay automatically turned off due to expired billing", [
                'device_id' => $deviceId,
                'pin' => $pin,
                'device_status' => $device->status ?? 'unknown'
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error("Error turning off relay: " . $e->getMessage(), [
                'device_id' => $deviceId,
                'pin' => $pin
            ]);
            return false;
        }
    }

    /**
     * Calculate total cost
     */
    private function hitungTotal(float $tarif, int $detikDipakai): int
    {
        if ($detikDipakai < 0)
            $detikDipakai = 0;

        // Convert detik ke jam untuk perhitungan
        $jam = $detikDipakai / 3600;
        $total = round($tarif * $jam);

        // Pembulatan ke atas ke 100 terdekat
        $sisa = $total % 100;
        if ($sisa !== 0)
            $total = $total + (100 - $sisa);

        return (int) $total;
    }
}

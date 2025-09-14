<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EspRelay extends Model
{
    protected $table = 'esp_relay_logs';

    protected $fillable = [
        'device_id',
        'pin',
        'nama_relay',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the device that owns the relay
     */
    public function device(): BelongsTo
    {
        return $this->belongsTo(EspDevice::class, 'device_id', 'device_id');
    }

    /**
     * Get port number from pin (Pin 12 = Port 1, Pin 13 = Port 2, etc.)
     */
    public function getPortNumberAttribute(): int
    {
        $pinMapping = [12 => 1, 13 => 2, 14 => 3, 27 => 4, 26 => 5, 25 => 6, 33 => 7, 32 => 8];
        return $pinMapping[$this->pin] ?? 0;
    }

    /**
     * Get port status based on device status and relay status
     */
    public function getPortStatusAttribute(): string
    {
        $device = $this->device;

        if (!$device || $device->status === 'offline') {
            return 'off';
        }

        if ($device->status === 'online') {
            return $this->status ? 'on' : 'idle';
        }

        return 'idle';
    }

    /**
     * Get the billing records for this relay
     */
    public function billings(): HasMany
    {
        return $this->hasMany(Billing::class, 'esp_relay_id');
    }

    /**
     * Get the active billing for this relay
     */
    public function activeBilling(): HasOne
    {
        return $this->hasOne(Billing::class, 'esp_relay_id')->where('status', 'aktif');
    }
}

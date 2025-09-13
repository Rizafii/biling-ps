<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EspDevice extends Model
{
    protected $fillable = [
        'device_id',
        'name',
        'status',
        'last_heartbeat',
    ];

    protected $casts = [
        'last_heartbeat' => 'datetime',
        'status' => 'string',
    ];

    /**
     * Get the relays for the device
     */
    public function relays(): HasMany
    {
        return $this->hasMany(EspRelay::class, 'device_id', 'device_id');
    }
}

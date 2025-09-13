<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
}

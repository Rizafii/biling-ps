<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $fillable = [
        'name',
        'code',
        'type',
        'value',
        'min_duration',
        'is_active',
    ];
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Billing extends Model
{
    protected $fillable = [
        'esp_relay_id',
        'promo_id',
        'nama_pelanggan',
        'mode',
        'status',
        'tarif_perjam',
        'total_biaya',
        'total_setelah_promo',
        'durasi',
        'waktu_mulai',
        'waktu_selesai',
    ];

    protected $casts = [
        'tarif_perjam' => 'decimal:2',
        'total_biaya' => 'decimal:2',
        'total_setelah_promo' => 'decimal:2',
        'waktu_mulai' => 'datetime',
        'waktu_selesai' => 'datetime',
    ];

    /**
     * Get the ESP relay that owns the billing
     */
    public function espRelay(): BelongsTo
    {
        return $this->belongsTo(EspRelay::class, 'esp_relay_id');
    }

    /**
     * Get the promo that owns the billing
     */
    public function promo(): BelongsTo
    {
        return $this->belongsTo(Promo::class, 'promo_id');
    }
}

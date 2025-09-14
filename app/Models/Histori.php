<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Histori extends Model
{
    protected $fillable = [
        'esp_relay_id',
        'promo_id',
        'nama_pelanggan',
        'mode',
        'status',
        'tarif_perjam',
        'total_biaya',
        'durasi_menit',
        'waktu_mulai',
        'waktu_selesai',
    ];

    public function promo()
    {
        return $this->belongsTo(Promo::class);
    }
}

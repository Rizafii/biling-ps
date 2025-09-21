<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    /**
     * Get billings using this promo
     */
    public function billings(): HasMany
    {
        return $this->hasMany(Billing::class);
    }

    /**
     * Calculate total after promo discount
     */
    public function calculateDiscount(float $totalBiaya, int $durasiMenit = 0, float $tarifPerJam = 0): float
    {
        if (!$this->is_active) {
            return $totalBiaya;
        }

        // Check minimum duration requirement if set
        if ($this->min_duration && $durasiMenit < $this->min_duration) {
            return $totalBiaya;
        }

        $discount = 0;

        switch ($this->type) {
            case 'flat':
                // Fixed amount discount
                $discount = (float) $this->value;
                break;

            case 'percent':
                // Percentage discount
                $discount = $totalBiaya * ((float) $this->value / 100);
                break;

            case 'time':
                // Free time in minutes - convert to cost based on hourly rate
                if ($tarifPerJam > 0) {
                    $waktuGratisMenit = (float) $this->value;
                    // Hitung diskon berdasarkan waktu gratis * tarif per jam
                    $discount = ($waktuGratisMenit / 60) * $tarifPerJam;
                } else {
                    // Fallback jika tarif tidak tersedia
                    $discount = 0;
                }
                break;
        }

        $totalAfterDiscount = $totalBiaya - $discount;

        // Ensure total doesn't go below 0
        return max(0, $totalAfterDiscount);
    }

    /**
     * Get discount amount
     */
    public function getDiscountAmount(float $totalBiaya, int $durasiMenit = 0, float $tarifPerJam = 0): float
    {
        $totalAfterDiscount = $this->calculateDiscount($totalBiaya, $durasiMenit, $tarifPerJam);
        return $totalBiaya - $totalAfterDiscount;
    }
}

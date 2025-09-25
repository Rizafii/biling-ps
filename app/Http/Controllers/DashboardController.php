<?php

namespace App\Http\Controllers;

use App\Models\Billing;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $kemarin = now()->subDay()->toDateString();
        $hariIni = now()->toDateString();
        $bulanIni = now()->month;
        $tahunIni = now()->year;

        // --- Statistik angka ---
        $pendapatanHariIni = Billing::whereDate('created_at', $hariIni)->sum('total_setelah_promo');
        $pendapatanKemarin = Billing::whereDate('created_at', $kemarin)->sum('total_setelah_promo');

        $sesiHariIni = Billing::whereDate('created_at', $hariIni)->count();
        $sesiKemarin = Billing::whereDate('created_at', $kemarin)->count();

        // durasi pakai HOUR(durasi) + MINUTE(durasi)/60 (karena kolom `durasi` bertipe TIME)
        $totalJamMainHariIni = round(
            Billing::whereDate('created_at', $hariIni)
                ->select(DB::raw('SUM(HOUR(durasi) + MINUTE(durasi)/60) as jam'))
                ->value('jam') ?? 0
        );

        $totalJamMainKemarin = round(
            Billing::whereDate('created_at', $kemarin)
                ->select(DB::raw('SUM(HOUR(durasi) + MINUTE(durasi)/60) as jam'))
                ->value('jam') ?? 0
        );

        $statistik = [
            'pendapatanHariIni'  => $pendapatanHariIni,
            'pendapatanKemarin'  => $pendapatanKemarin,
            'sesiHariIni'        => $sesiHariIni,
            'sesiKemarin'        => $sesiKemarin,
            'totalJamMainHariIni' => $totalJamMainHariIni,
            'totalJamMainKemarin' => $totalJamMainKemarin,
        ];

        // --- Grafik 7 hari terakhir ---
        $pendapatanHarian = Billing::selectRaw('DATE(created_at) as tanggal, SUM(total_setelah_promo) as pendapatan, COUNT(id) as jumlah_sesi')
            ->where('created_at', '>=', now()->subDays(7))
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        // --- Grafik 30 hari terakhir ---
        $pendapatanBulanan = Billing::selectRaw('DATE(created_at) as tanggal, SUM(total_setelah_promo) as pendapatan')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('tanggal')
            ->orderBy('tanggal')
            ->get();

        // --- Konsol/port paling sering dipakai ---

        // --- Pemakaian Port Hari Ini ---
        $pemakaianPortHariIni = Billing::join('esp_relay_logs', 'billings.esp_relay_id', '=', 'esp_relay_logs.id')
            ->whereDate('billings.created_at', $hariIni)
            ->select('esp_relay_logs.nama_relay as port', DB::raw('COUNT(*) as total_pemakaian'))
            ->groupBy('esp_relay_logs.nama_relay')
            ->orderByDesc('total_pemakaian')
            ->get()
            ->map(function ($item) {
                return [
                    'port'  => $item->port ?? 'Tidak diketahui',
                    'total' => $item->total_pemakaian,
                ];
            });

        // --- Pemakaian Port Bulan Ini ---
        $pemakaianPortBulanIni = Billing::join('esp_relay_logs', 'billings.esp_relay_id', '=', 'esp_relay_logs.id')
            ->whereMonth('billings.created_at', $bulanIni)
            ->whereYear('billings.created_at', $tahunIni)
            ->select('esp_relay_logs.nama_relay as port', DB::raw('COUNT(*) as total_pemakaian'))
            ->groupBy('esp_relay_logs.nama_relay')
            ->orderByDesc('total_pemakaian')
            ->get()
            ->map(function ($item) {
                return [
                    'port'  => $item->port ?? 'Tidak diketahui',
                    'total' => $item->total_pemakaian,
                ];
            });

        // --- Pemakaian Promo Hari Ini ---
        $pemakaianPromoHariIni = Billing::join('promos', 'billings.promo_id', '=', 'promos.id')
            ->whereDate('billings.created_at', $hariIni)
            ->select('promos.name as nama', DB::raw('COUNT(*) as total_pemakaian'))
            ->groupBy('promos.name')
            ->orderByDesc('total_pemakaian')
            ->get()
            ->map(function ($item) {
                return [
                    'nama'  => $item->nama,
                    'total' => $item->total_pemakaian,
                ];
            });

        // --- Pemakaian Promo Bulan Ini ---
        $pemakaianPromoBulanIni = Billing::join('promos', 'billings.promo_id', '=', 'promos.id')
            ->whereMonth('billings.created_at', $bulanIni)
            ->whereYear('billings.created_at', $tahunIni)
            ->select('promos.name as nama', DB::raw('COUNT(*) as total_pemakaian'))
            ->groupBy('promos.name')
            ->orderByDesc('total_pemakaian')
            ->get()
            ->map(function ($item) {
                return [
                    'nama'  => $item->nama,
                    'total' => $item->total_pemakaian,
                ];
            });
        $pemakaianPort = [
            'pemakaianPortHariIni' => $pemakaianPortHariIni,
            'pemakaianPortBulanIni' => $pemakaianPortBulanIni,
        ];
        $pemakaianPromo = [
            'pemakaianPromoHariIni' => $pemakaianPromoHariIni,
            'pemakaianPromoBulanIni' => $pemakaianPromoBulanIni,
        ];

        $dataModeHariIni = Billing::select('mode', DB::raw('COUNT(*) as total'))
            ->whereDate('created_at', $hariIni)
            ->groupBy('mode')
            ->get()
            ->map(function ($item) {
                return [
                    'nama' => ucfirst($item->mode), // contoh: "Bebas" / "Timer"
                    'nilai' => $item->total,
                ];
            });

        // --- Bulan ini ---
        $dataModeBulanIni = Billing::select('mode', DB::raw('COUNT(*) as total'))
            ->whereMonth('created_at', $bulanIni)
            ->whereYear('created_at', $tahunIni)
            ->groupBy('mode')
            ->get()
            ->map(function ($item) {
                return [
                    'nama' => ucfirst($item->mode),
                    'nilai' => $item->total,
                ];
            });

        $dataMode = [
            'dataModeHariIni' => $dataModeHariIni,
            'dataModeBulanIni' => $dataModeBulanIni
        ];

        return inertia('dashboard', [
            'statistik'        => $statistik,
            'pendapatanHarian' => $pendapatanHarian,
            'pendapatanBulanan' => $pendapatanBulanan,
            'pemakaianPort'    => $pemakaianPort,
            'pemakaianPromo'   => $pemakaianPromo,
            'hariIni'          => $hariIni,
            'modeData' => $dataMode
        ]);
    }
}

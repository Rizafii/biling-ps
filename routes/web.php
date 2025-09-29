<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\EspDeviceController;
use App\Http\Controllers\HistoriController;
use App\Http\Controllers\PaketController;

// use App\Http\Controllers\HistoriController; // aktifkan kalau sudah siap

/*
|---------------------------------------------------p-----------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {


    Route::get('/controll', fn() => Inertia::render('controll/index'))->name('controll');

    // ✅ Pemilik & Super Admin -> akses semua
    Route::middleware('role:pemilik,super admin,penanggung jawab')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
        Route::resource('/user', UserController::class);
        Route::resource('/paket', PaketController::class);
        Route::resource('/promo', PromoController::class);
        Route::resource('/device', EspDeviceController::class);
        Route::resource('/histori', HistoriController::class);
        Route::post('/histori/{histori}/pay', [HistoriController::class, 'pay'])->name('histori.pay');
    });

    // ✅ Karyawan -> hanya controll & histori
    Route::middleware('role:karyawan')->group(function () {
        Route::get('/controll', fn() => Inertia::render('controll/index'))->name('controll');
        Route::resource('/histori', HistoriController::class);
        Route::resource('/paket', PaketController::class);
        Route::resource('/promo', PromoController::class);
        Route::post('/histori/{histori}/pay', [HistoriController::class, 'pay'])->name('histori.pay');
    });
});

Route::get('/', fn() => redirect()->route('controll'));

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

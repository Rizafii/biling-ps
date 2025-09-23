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
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/controll', function () {
        return Inertia::render('controll/index');
    })->name('controll');

    Route::resource('/user', UserController::class);

    Route::resource('/role', RoleController::class);
    Route::resource('/paket', PaketController::class);
    // Promo (resource route)
    Route::resource('/promo', PromoController::class);

    // ESP Device (resource route)
    Route::resource('/device', EspDeviceController::class);

    // Histori (nanti kalau sudah ada controller)
    Route::resource('/histori', HistoriController::class);
    Route::post('/histori/{histori}/pay', [HistoriController::class, 'pay'])->name('histori.pay');
});

// Home page redirect ke dashboard
Route::get('/', function () {
    return redirect()->route('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

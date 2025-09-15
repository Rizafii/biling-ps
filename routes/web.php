<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\EspDeviceController;
use App\Http\Controllers\HistoriController;

// use App\Http\Controllers\HistoriController; // aktifkan kalau sudah siap

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Promo (resource route)
    Route::resource('/promo', PromoController::class);

    // ESP Device (resource route)
    Route::resource('/device', EspDeviceController::class);

    // Histori (nanti kalau sudah ada controller)
    Route::resource('/histori', HistoriController::class);
});

// Home page redirect ke dashboard
Route::get('/', function () {
    return redirect()->route('dashboard');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';

<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EspDeviceController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ESP32 API Routes
Route::prefix('esp')->group(function () {
    Route::post('/heartbeat', [EspDeviceController::class, 'heartbeat']);
    Route::post('/relay', [EspDeviceController::class, 'relayControl']);
});

// Device API Routes for frontend
Route::prefix('devices')->group(function () {
    Route::get('/', [EspDeviceController::class, 'getDevices']);
    Route::post('/check-status', [EspDeviceController::class, 'checkOfflineDevices']);
});

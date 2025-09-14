<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\EspDeviceController;
use App\Http\Controllers\Api\EspController;
use App\Http\Controllers\Api\BillingController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ESP32 API Routes
Route::prefix('esp')->group(function () {
    Route::post('/heartbeat', [EspController::class, 'heartbeat']);
    Route::get('/relay-status/{device_id}', [EspController::class, 'getRelayStatus']);
    Route::post('/control-relay', [EspController::class, 'controlRelay']);
    Route::post('/control-multiple-relays', [EspController::class, 'controlMultipleRelays']);
});

// Device API Routes for frontend
Route::prefix('devices')->group(function () {
    Route::get('/', [EspDeviceController::class, 'getDevices']);
    Route::post('/check-status', [EspDeviceController::class, 'checkOfflineDevices']);
});

// Ports API Routes for dashboard
Route::prefix('ports')->group(function () {
    Route::get('/', [EspDeviceController::class, 'getPorts']);
});

// Relay Control API Routes for dashboard
Route::prefix('relay')->group(function () {
    Route::post('/control', [EspController::class, 'controlRelay']);
    Route::post('/control-multiple', [EspController::class, 'controlMultipleRelays']);
});

// Billing API Routes
Route::prefix('billing')->group(function () {
    Route::post('/start', [BillingController::class, 'start']);
    Route::post('/stop', [BillingController::class, 'stop']);
    Route::get('/active', [BillingController::class, 'getActiveBilling']);
});

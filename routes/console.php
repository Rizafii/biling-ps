<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule untuk mengecek billing expired setiap menit
Schedule::command('billing:check-expired')
    ->everySecond()
    ->withoutOverlapping()
    ->runInBackground();

// Schedule untuk mengecek device status setiap 30 detik
Schedule::command('device:check-status')
    ->everyThirtySeconds()
    ->withoutOverlapping()
    ->runInBackground();

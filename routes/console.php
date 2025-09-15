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

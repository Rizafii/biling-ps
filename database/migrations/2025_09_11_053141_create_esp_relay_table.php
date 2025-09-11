<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('esp_relay_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_id'); //kalau butuh skema multidevice
            $table->integer('pin');
            $table->boolean('status'); // true = ON, false = OFF
            $table->timestamps();
            $table->index(['device_id', 'pin']);
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('esp_relay_logs');
    }
};

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
        Schema::create('billings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('esp_relay_id')->constrained('esp_relay_logs')->onDelete('cascade');
            $table->foreignId('promo_id')->nullable()->constrained('promos')->onDelete('set null');
            $table->string('nama_pelanggan');
            $table->enum('mode', ['bebas', 'timer']);
            $table->enum('status', ['aktif', 'selesai'])->default('aktif');
            $table->decimal('tarif_perjam', 10, 2);
            $table->decimal('total_biaya', 10, 2)->nullable();
            $table->time('durasi')->nullable()->after('total_biaya');
            $table->timestamp('waktu_mulai');
            $table->timestamp('waktu_selesai')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('billings');
    }
};

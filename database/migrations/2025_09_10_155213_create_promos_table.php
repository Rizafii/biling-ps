<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nama promo (contoh: Happy Hour -10%)
            $table->string('code')->unique()->nullable(); // Kode promo (contoh: HAPPY10), boleh null
            $table->enum('type', ['flat', 'percent', 'time',/*'bundle'*/]);
            $table->decimal('value', 10, 2)->nullable();
            $table->integer('min_duration')->nullable();
            $table->boolean('is_active')->default(true); // untuk mengaktifkan/nonaktifkan promo
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promos');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // Wajib: beri tahu Laravel untuk menggunakan koneksi MongoDB
    protected $connection = 'mongodb';

    public function up()
    {
        // 1. Collection Users
        Schema::connection('mongodb')->create('users', function (Blueprint $collection) {
            $collection->unique('email');
            $collection->unique('username');
        });

        // 2. Collection Events
        Schema::connection('mongodb')->create('events', function (Blueprint $collection) {
            $collection->index('organizer_id'); // Mempercepat query: "Cari event milik EO ini"
        });

        // 3. Collection Payments
        Schema::connection('mongodb')->create('payments', function (Blueprint $collection) {
            $collection->index('xendit_invoice_id'); // Mempercepat query saat webhook Xendit masuk
            $collection->index('payment_status');
        });

        // 4. Collection Wallets
        Schema::connection('mongodb')->create('wallets', function (Blueprint $collection) {
            $collection->unique('organizer_id'); // 1 EO hanya boleh punya 1 wallet
        });
    }

    public function down()
    {
        Schema::connection('mongodb')->dropIfExists('users');
        Schema::connection('mongodb')->dropIfExists('events');
        Schema::connection('mongodb')->dropIfExists('payments');
        Schema::connection('mongodb')->dropIfExists('wallets');
    }
};
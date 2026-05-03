<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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
            $collection->index('organizer_id');
        });

        // 3. Collection Payments
        Schema::connection('mongodb')->create('payments', function (Blueprint $collection) {
            $collection->index('xendit_invoice_id'); 
            $collection->index('payment_status');
            $collection->index('user_id');
        });

        // 4. Collection Wallets
        Schema::connection('mongodb')->create('wallets', function (Blueprint $collection) {
            $collection->unique('organizer_id'); 
        });

        // --- TAMBAHAN BARU ---

        // 5. Collection Withdrawal Methods (Rekening yang disimpan EO)
        Schema::connection('mongodb')->create('withdrawal_methods', function (Blueprint $collection) {
            $collection->index('organizer_id');
            // Index majemuk untuk memastikan EO tidak simpan nomor rekening yang sama dua kali
            $collection->index(['organizer_id', 'account_number']); 
        });

        // 6. Collection Withdrawals (Riwayat Penarikan Dana)
        Schema::connection('mongodb')->create('withdrawals', function (Blueprint $collection) {
            $collection->index('organizer_id');
            $collection->index('status'); // Penting untuk filter: Berhasil, Diproses, Gagal
            $collection->index('withdrawal_method_id');
        });

        // 7. Collection Ticket Validations (Tiket yang sudah dibayar & siap discan)
        Schema::connection('mongodb')->create('ticket_validations', function (Blueprint $collection) {
            $collection->unique('qr_code_string'); // QR Code tidak boleh ada yang kembar
            $collection->index('payment_id');
            $collection->index('event_id');
            $collection->index('user_id');
            $collection->index('is_used'); // Untuk mempermudah filter tiket yang belum/sudah discan
        });
    }

    public function down()
    {
        Schema::connection('mongodb')->dropIfExists('users');
        Schema::connection('mongodb')->dropIfExists('events');
        Schema::connection('mongodb')->dropIfExists('payments');
        Schema::connection('mongodb')->dropIfExists('wallets');
        Schema::connection('mongodb')->dropIfExists('withdrawal_methods');
        Schema::connection('mongodb')->dropIfExists('withdrawals');
        Schema::connection('mongodb')->dropIfExists('ticket_validations');
    }
};
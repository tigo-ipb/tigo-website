<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class TicketValidation extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'ticket_validations';

    protected $fillable = [
        'payment_id', // Referensi ke transaksi pembelian
        'user_id',    // Pemilik tiket
        'event_id',
        'type_name',  // VIP, General, dll
        'qr_code_string', // String unik yang akan jadi QR Code
        'is_used',    // true jika sudah di-scan di pintu masuk
        'scanned_at'
    ];

    protected $casts = [
        'is_used' => 'boolean',
        'scanned_at' => 'datetime',
    ];
}
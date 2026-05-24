<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;
use MongoDB\Laravel\Relations\BelongsTo;

class Payment extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'payments';

    protected $fillable = [
        'user_id',
        'event_id',
        'organizer_id',
        'customer_info', // 🔥 TAMBAHKAN INI UNTUK MENYIMPAN IDENTITAS PEMESAN
        'ticket_items', 
        'sub_total',
        'platform_fee',
        'net_for_eo',
        'payment_status', 
        'xendit_invoice_id',
        'xendit_checkout_url'
    ];

    protected $casts = [
        'ticket_items' => 'array',
        'customer_info' => 'array', // 🔥 TAMBAHKAN INI AGAR FORMAT JSON/ARRAY TETAP TERJAGA
    ];

    public function event(): BelongsTo
    {
        // Karena kamu pakai MongoDB, kita pertegas foreign_key dan local_key-nya
        return $this->belongsTo(Event::class, 'event_id', '_id');
    }

    /**
     * Relasi ke model User (Pembeli tiket)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', '_id');
    }
}
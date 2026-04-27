<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Payment extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'payments';

    protected $fillable = [
        'user_id',
        'event_id',
        'organizer_id',
        'ticket_items', // Array: tiket apa saja yg dibeli
        'sub_total',
        'platform_fee',
        'net_for_eo',
        'payment_status', // PENDING, PAID, EXPIRED
        'xendit_invoice_id',
        'xendit_checkout_url'
    ];

    protected $casts = [
        'ticket_items' => 'array',
    ];
}
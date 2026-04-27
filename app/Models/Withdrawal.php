<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Withdrawal extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'withdrawals';

    protected $fillable = [
        'organizer_id', 'amount', 'bank_info', 'status', 'xendit_external_id'
    ];

    protected $casts = [
        'bank_info' => 'array', // Menyimpan {bank_name, account_number, account_holder}
        'amount' => 'integer'
    ];
}
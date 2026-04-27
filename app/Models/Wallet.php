<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Wallet extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'wallets';

    protected $fillable = [
        'organizer_id', 
        'pending_balance',
        'available_balance' 
    ];
}
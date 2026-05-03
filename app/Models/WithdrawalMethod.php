<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class WithdrawalMethod extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'withdrawal_methods';

    protected $fillable = [
        'organizer_id',
        'type', // 'bank', 'e-wallet', 'virtual_account'
        'bank_code', // Xendit butuh ini (contoh: 'BCA', 'MANDIRI', 'DANA', 'OVO')
        'account_number',
        'account_name',
    ];
}

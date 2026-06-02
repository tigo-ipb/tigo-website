<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model; // Pastikan menggunakan class MongoDB

class ScanLog extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'scan_logs';
    
    protected $guarded = []; // Izinkan insert semua kolom
}
<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class ExportHistory extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'export_histories';

    protected $fillable = [
        'organizer_id',
        'export_id', // Format: E-11239
        'file_name',
        'data_types', // Array: ['events', 'finance', 'wallet', 'bookings']
        'total_records',
        'file_size_mb',
    ];

    // Opsional: Casting untuk memastikan tipe data
    protected $casts = [
        'data_types' => 'array',
        'total_records' => 'integer',
        // 'file_size_mb' => 'float',
    ];
}
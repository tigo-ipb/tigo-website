<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model;

class Event extends Model
{
    protected $connection = 'mongodb';
    protected $collection = 'events';

    protected $fillable = [
        'organizer_id', 
        'name', 
        'category_name', 
        'description', 
        'location', 
        'date_start', 
        'date_end', 
        'time_start', 
        'time_end', 
        'ticket_types',
        'banners' // <--- Penambahan field baru
    ];

    protected $casts = [
        'date_start' => 'datetime',
        'date_end' => 'datetime',
        'location' => 'array', 
        'ticket_types' => 'array', 
        // Banners di-cast sebagai array agar bisa simpan JSON: {"1x1": "url", "16x9": "url"}
        'banners' => 'array', 
    ];
}
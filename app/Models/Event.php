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
        'terms_conditions',
        'location',
        'schedules',     // Array untuk menampung banyak jadwal
        'date_start',    // Tanggal awal (untuk filter cepat)
        'date_end',      // Tanggal akhir (untuk filter cepat)
        'banners',       // Object untuk rasio 1x1 dan 16x9
        'poster_url',
        'galleries',
        'ticket_types',
        'status',
        'format'
    ];

    /**
     * Casting sangat penting di MongoDB agar Laravel tahu 
     * bagaimana memperlakukan data JSON/Array dan Date.
     */
    protected $casts = [
        'terms_conditions' => 'array',
        'location'         => 'array', // Menyimpan venue, city, lat, long, map_link
        'schedules'        => 'array', // Menyimpan array of objects (date, time_start, time_end)
        'date_start'       => 'datetime',
        'date_end'         => 'datetime',
        'banners'          => 'array', // Menyimpan {"1x1": "url", "16x9": "url"}
        'galleries'        => 'array',
        'ticket_types'     => 'array',
    ];

    /**
     * Helper tambahan jika Anda ingin mendapatkan durasi event 
     * secara otomatis di frontend.
     */
    public function getDurationAttribute()
    {
        if ($this->date_start && $this->date_end) {
            return $this->date_start->format('d M') . ' - ' . $this->date_end->format('d M Y');
        }
        return null;
    }

    public function organizer() {
        return $this->belongsTo(User::class, 'organizer_id');
    }
}
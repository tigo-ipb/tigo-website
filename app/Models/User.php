<?php

namespace App\Models;

// PERHATIKAN: Kita menggunakan Auth User bawaan MongoDB, bukan bawaan standar Laravel
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $connection = 'mongodb';
    protected $collection = 'users';

    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at', // Tambahkan ini
        'bio',
        'password',
        'profile_photo',
        'birth_date',
        'phone_code',
        'phone_number',
        'role',
        'reset_otp',
        'otp_expires_at',
        'google_id',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    // Casting sangat penting di MongoDB untuk memastikan tipe data tersimpan dengan benar
    protected $casts = [
        'email_verified_at' => 'datetime',
        'birth_date' => 'datetime',
        'password' => 'hashed',
        'otp_expires_at' => 'datetime', // Akan tersimpan sebagai ISODate di MongoDB
    ];
}
<?php

namespace App\Models;

// PERHATIKAN: Kita menggunakan Auth User bawaan MongoDB, bukan bawaan standar Laravel
use MongoDB\Laravel\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Contracts\Auth\MustVerifyEmail;
class User extends Authenticatable implements MustVerifyEmail
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
        'verification_otp',
        'reset_otp',
        'otp_expires_at',
        'is_profile_setup',
        'google_id',
        'is_password_set_manually'
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
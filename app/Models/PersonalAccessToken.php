<?php

namespace App\Models;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;
use MongoDB\Laravel\Eloquent\DocumentModel;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    // Menggunakan trait dari MongoDB agar class Sanctum ini bisa membaca NoSQL
    use DocumentModel;

    protected $connection = 'mongodb';
    protected $table = 'personal_access_tokens'; 
    protected $primaryKey = '_id';
    protected $keyType = 'string';
}
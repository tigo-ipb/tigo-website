<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    protected $connection = 'mongodb';

    public function up(): void
    {
        // MongoDB tidak butuh schema migration untuk collection ini
        // Collection akan dibuat otomatis saat pertama kali digunakan
    }

    public function down(): void
    {
        //
    }
};
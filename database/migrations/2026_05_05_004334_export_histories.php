<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Pastikan menggunakan koneksi 'mongodb'
        Schema::connection('mongodb')->create('export_histories', function (Blueprint $collection) {
            // Di MongoDB, kita tidak perlu mendefinisikan tipe data per kolom seperti string(), integer(), dll 
            // karena skemanya fleksibel. 
            // FUNGSI UTAMA migration di sini adalah untuk membuat INDEX agar query cepat.

            $collection->index('organizer_id'); // Wajib di-index karena kita selalu filter by organizer
            $collection->index('export_id');    // Di-index untuk fitur pencarian (search)
            $collection->index('created_at');   // Di-index untuk fitur sorting (Terbaru/Terlama)
            
            // Kolom lainnya yang akan otomatis tersimpan oleh Model:
            // - file_name (string)
            // - data_types (array)
            // - total_records (integer)
            // - file_size_mb (float)
            // - updated_at (timestamp)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mongodb')->dropIfExists('export_histories');
    }
};
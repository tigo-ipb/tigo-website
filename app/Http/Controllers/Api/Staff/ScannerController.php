<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TicketValidation;
use App\Models\Event;
use App\Models\User;

class ScannerController extends Controller
{
    public function scan(Request $request)
    {
        $request->validate([
            'event_id' => 'required|string',
            'qr_code_string' => 'required|string'
        ]);

        // 1. Cari tiket berdasarkan QR Code
        $ticket = TicketValidation::where('qr_code_string', $request->qr_code_string)->first();

        // VALIDASI A: Apakah tiket ada/asli?
        if (!$ticket) {
            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket palsu atau tidak ditemukan dalam sistem.'
            ], 404);
        }

        // VALIDASI B: Apakah tiket ini untuk event yang sedang dijaga staff?
        if ($ticket->event_id !== $request->event_id) {
            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket ini bukan untuk acara ini.'
            ], 400);
        }

        // VALIDASI C: Apakah tiket sudah pernah di-scan (Mencegah tiket ganda/fotokopi)
        if ($ticket->is_used) {
            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket SUDAH DIGUNAKAN pada ' . $ticket->scanned_at->format('d/m/Y H:i')
            ], 400);
        }

        // 2. TIKET VALID -> Tandai sebagai telah digunakan
        $ticket->update([
            'is_used' => true,
            'scanned_at' => now()
        ]);

        // Ambil nama pembeli untuk ditampilkan di layar sukses
        $buyer = User::find($ticket->user_id);

        return response()->json([
            'success' => true, 
            'message' => 'Tiket diterima dan divalidasi admin. Selamat menikmati event!',
            'data' => [
                'type_name' => $ticket->type_name,
                'buyer_name' => $buyer ? $buyer->name : 'Pengunjung'
            ]
        ], 200);
    }
}
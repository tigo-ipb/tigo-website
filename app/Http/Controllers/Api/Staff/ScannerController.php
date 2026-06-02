<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TicketValidation;
use App\Models\Event;
use App\Models\User;
use App\Models\Payment;
use App\Models\ScanLog;

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
            // Catat Log: REJECTED (Karena murni palsu)
            ScanLog::create([
                'event_id' => $request->event_id,
                'status' => 'REJECTED',
                'reason' => 'Tiket palsu / tidak ditemukan',
                'customer_name' => 'Unknown',
                'order_id' => '-',
                'type_name' => '-',
                'category' => '-',
            ]);

            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket palsu atau tidak ditemukan dalam sistem.'
            ], 404);
        }

        // --- AMBIL DATA CUSTOMER DARI PAYMENT (Hanya dieksekusi jika tiket asli) ---
        $payment = Payment::find($ticket->payment_id);
        $customerInfo = $payment ? $payment->customer_info : [];
        if (is_string($customerInfo)) {
            $customerInfo = json_decode($customerInfo, true) ?? [];
        } else {
            $customerInfo = (array) $customerInfo;
        }
        
        $email = $customerInfo['email'] ?? '';
        $name = $customerInfo['name'] ?? 'Unknown';
        $isIpb = str_contains(strtolower($email), '@apps.ipb.ac.id');
        $category = $isIpb ? 'IPB' : 'General';
        $orderId = $payment ? substr((string)$payment->_id, 0, 8) : '-';
        // --------------------------------------------------------------------------


        // VALIDASI B: Apakah tiket ini untuk event yang sedang dijaga staff?
        if ($ticket->event_id !== $request->event_id) {
            // Catat Log: REJECTED (Karena salah acara/event)
            ScanLog::create([
                'event_id' => $request->event_id,
                'ticket_validation_id' => $ticket->_id,
                'status' => 'REJECTED',
                'reason' => 'Tiket bukan untuk acara ini',
                'customer_name' => $name,
                'email' => $email,
                'order_id' => $orderId,
                'type_name' => $ticket->type_name,
                'category' => $category,
            ]);

            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket ini bukan untuk acara ini.'
            ], 400);
        }

        // VALIDASI C: Apakah tiket sudah pernah di-scan (Mencegah tiket ganda/fotokopi)
        if ($ticket->is_used) {
            // 🔥 Catat Log: FAILED 🔥 
            // (QR benar, Event benar, tapi ada anomali sudah dipakai. Membutuhkan tombol manual dari Admin)
            ScanLog::create([
                'event_id' => $request->event_id,
                'ticket_validation_id' => $ticket->_id,
                'status' => 'FAILED',
                'reason' => 'Tiket SUDAH DIGUNAKAN',
                'customer_name' => $name,
                'email' => $email,
                'order_id' => $orderId,
                'type_name' => $ticket->type_name,
                'category' => $category,
            ]);

            return response()->json([
                'success' => false, 
                'message' => 'Terjadi masalah! Tiket SUDAH DIGUNAKAN pada ' . ($ticket->scanned_at ? $ticket->scanned_at->format('d/m/Y H:i') : 'waktu sebelumnya')
            ], 400);
        }

        // 2. TIKET VALID -> Tandai sebagai telah digunakan
        $ticket->update([
            'is_used' => true,
            'scanned_at' => now()
        ]);

        // Catat Log Sukses
        ScanLog::create([
            'event_id' => $request->event_id,
            'ticket_validation_id' => $ticket->_id,
            'status' => 'SUCCESS',
            'reason' => 'Scan Berhasil',
            'customer_name' => $name,
            'email' => $email,
            'order_id' => $orderId,
            'type_name' => $ticket->type_name,
            'category' => $category,
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Tiket diterima dan divalidasi admin. Selamat menikmati event!',
            'data' => [
                'type_name' => $ticket->type_name,
                'buyer_name' => $name
            ]
        ], 200);
    }
}
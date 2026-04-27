<?php

namespace App\Http\Controllers\Api\Webhook;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\Wallet;
use App\Models\TicketValidation;
use App\Models\Withdrawal;
use Illuminate\Support\Str;

class XenditController extends Controller
{
    private function verifyXenditToken(Request $request)
    {
        $xenditToken = env('XENDIT_CALLBACK_TOKEN');
        $headerToken = $request->header('x-callback-token');

        return $headerToken === $xenditToken;
    }

    public function disbursementCallback(Request $request)
    {
        // 1. Validasi Token Keamanan
        if (!$this->verifyXenditToken($request)) {
            return response()->json(['message' => 'Token tidak valid'], 403);
        }

        // 2. Ambil data dari payload Xendit
        $externalId = $request->external_id; // Ini adalah ID Withdrawal kita
        $status = $request->status; // 'COMPLETED' atau 'FAILED'

        // Cari data penarikan di database
        $withdrawal = Withdrawal::where('_id', $externalId)->first();

        if (!$withdrawal) {
            return response()->json(['message' => 'Data penarikan tidak ditemukan'], 404);
        }

        // Jika statusnya sudah selesai/gagal sebelumnya, abaikan (mencegah double hit)
        if (in_array($withdrawal->status, ['COMPLETED', 'FAILED'])) {
            return response()->json(['message' => 'Webhook sudah diproses sebelumnya'], 200);
        }

        // 3. Proses berdasarkan status dari bank/Xendit
        if ($status === 'COMPLETED') {
            // Transfer sukses! Cukup ubah status menjadi COMPLETED
            $withdrawal->update(['status' => 'COMPLETED']);
            
        } elseif ($status === 'FAILED') {
            // Transfer Gagal (misal: rekening EO salah atau tutup)
            $withdrawal->update(['status' => 'FAILED']);

            // ROLLBACK UANG: Kembalikan uang ke saldo available EO agar bisa ditarik ulang
            $wallet = Wallet::where('organizer_id', $withdrawal->organizer_id)->first();
            if ($wallet) {
                $wallet->increment('available_balance', $withdrawal->amount);
            }
        }

        // Xendit mewajibkan kita membalas dengan status 200 agar mereka tahu webhook sampai
        return response()->json(['message' => 'Webhook pencairan berhasil diproses'], 200);
    }

    public function invoiceCallback(Request $request)
    {
        // Validasi Token Callback Xendit
        if (!$this->verifyXenditToken($request)) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $payment = Payment::find($request->external_id);
        
        if (!$payment) {
            return response()->json(['message' => 'Payment not found'], 404);
        }

        // 1. JIKA PEMBAYARAN BERHASIL (PAID)
        if ($payment->payment_status === 'PENDING' && $request->status === 'PAID') {
            
            $payment->update(['payment_status' => 'PAID']);

            // Tambah Saldo EO
            $wallet = Wallet::firstOrCreate(
                ['organizer_id' => $payment->organizer_id],
                ['pending_balance' => 0, 'available_balance' => 0]
            );
            $wallet->increment('available_balance', $payment->net_for_eo);

            // Generate QR Code untuk pembeli
            foreach ($payment->ticket_items as $item) {
                for ($i = 0; $i < $item['quantity']; $i++) {
                    TicketValidation::create([
                        'payment_id' => $payment->_id,
                        'user_id' => $payment->user_id,
                        'event_id' => $payment->event_id,
                        'type_name' => $item['type_name'],
                        'qr_code_string' => Str::random(32), 
                        'is_used' => false
                    ]);
                }
            }
        }

        // 2. JIKA PEMBAYARAN KADALUARSA (EXPIRED)
        elseif ($payment->payment_status === 'PENDING' && $request->status === 'EXPIRED') {
            
            $payment->update(['payment_status' => 'EXPIRED']);

            // Kembalikan stok tiket ke Event agar bisa dibeli orang lain
            $event = \App\Models\Event::find($payment->event_id);
            if ($event) {
                $eventTickets = $event->ticket_types;
                
                foreach ($payment->ticket_items as $item) {
                    $ticketIndex = collect($eventTickets)->search(fn($t) => $t['type_id'] === $item['type_id']);
                    if ($ticketIndex !== false) {
                        // Tambahkan kembali kuota yang sebelumnya dipesan
                        $eventTickets[$ticketIndex]['available_stock'] += $item['quantity'];
                    }
                }
                
                $event->update(['ticket_types' => $eventTickets]);
            }
        }

        return response()->json(['message' => 'Webhook received'], 200);
    }
}
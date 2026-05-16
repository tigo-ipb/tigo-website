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

   public function disbursementCallback(\Illuminate\Http\Request $request)
    {
        // 1. Verifikasi Token Keamanan Xendit
        if ($request->header('x-callback-token') !== env('XENDIT_CALLBACK_TOKEN')) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // 2. Deteksi ID Penarikan yang Cerdas (Bisa dari Single atau Batch)
        $withdrawalId = null;

        if ($request->filled('external_id')) {
            // Jika webhook dari Disbursement biasa (Single)
            $withdrawalId = $request->external_id;
        } elseif ($request->filled('reference')) {
            // Jika webhook dari Batch Disbursement (Format: BATCH-WD-xxxxxx)
            $withdrawalId = str_replace('BATCH-WD-', '', $request->reference);
        }

        if (!$withdrawalId) {
            return response()->json(['message' => 'ID tidak ditemukan di payload'], 400);
        }

        // Cari data penarikannya di database
        $withdrawal = \App\Models\Withdrawal::find($withdrawalId);

        if (!$withdrawal) {
            return response()->json(['message' => 'Withdrawal not found'], 404);
        }

        // 3. JIKA TRANSFER SUKSES DIAPPROVE & CAIR
        if ($request->status === 'COMPLETED' && $withdrawal->status === 'PENDING') {
            
            $withdrawal->update(['status' => 'SUCCESS']);

        }
        // 4. JIKA TRANSFER GAGAL (Ditolak bank / Salah Rekening)
        elseif ($request->status === 'FAILED' && $withdrawal->status === 'PENDING') {
            
            $withdrawal->update([
                'status' => 'FAILED',
                'error_message' => $request->failure_code ?? 'Batch disbursement failed'
            ]);

            // KEMBALIKAN SALDO KE EO
            $wallet = \App\Models\Wallet::where('organizer_id', $withdrawal->organizer_id)->first();
            if ($wallet) {
                $wallet->increment('available_balance', $withdrawal->amount);
            }
        }

        return response()->json(['message' => 'Webhook diproses dengan sukses!'], 200);
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

            // $adminWallet = Wallet::firstOrCreate(
            //     ['organizer_id' => 'SYSTEM_SUPERADMIN'], // ID Khusus untuk sistem
            //     ['pending_balance' => 0, 'available_balance' => 0]
            // );
            // $adminWallet->increment('available_balance', $payment->platform_fee);

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
            
            $payment->update(['payment_status' => 'FAILED']);

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
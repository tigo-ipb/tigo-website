<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Payment;
use App\Models\TicketValidation; 
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str; 

class CheckoutController extends Controller
{
    public function store(Request $request)
    {
        // 1. Validasi Input dari Flutter
        $request->validate([
            'event_id' => 'required|string',
            'ticket_items' => 'required|array|min:1',
            'ticket_items.*.type_id' => 'required|string',
            'ticket_items.*.quantity' => 'required|integer|min:1',
        ]);

        $event = Event::find($request->event_id);
        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event tidak ditemukan'], 404);
        }

        $subTotal = 0;
        $savedTicketItems = [];
        $eventTickets = $event->ticket_types; 

        // 2. Periksa Stok dan Hitung Harga dengan Aman
        foreach ($request->ticket_items as $item) {
            $ticketIndex = collect($eventTickets)->search(fn($t) => $t['type_id'] === $item['type_id']);
            
            if ($ticketIndex === false) {
                return response()->json(['success' => false, 'message' => 'Tipe tiket tidak valid'], 400);
            }

            $ticketData = $eventTickets[$ticketIndex];

            if ($ticketData['available_stock'] < $item['quantity']) {
                return response()->json([
                    'success' => false, 
                    'message' => "Stok tiket {$ticketData['type_name']} tidak mencukupi. Sisa: {$ticketData['available_stock']}"
                ], 400);
            }

            $itemTotal = $ticketData['price'] * $item['quantity'];
            $subTotal += $itemTotal;

            $savedTicketItems[] = [
                'type_id' => $item['type_id'],
                'type_name' => $ticketData['type_name'],
                'quantity' => $item['quantity'],
                'price' => $ticketData['price'],
                'sub_total' => $itemTotal
            ];

            // Kurangi stok tiket secara lokal (di memory)
            $eventTickets[$ticketIndex]['available_stock'] -= $item['quantity'];
        }

        // 3. Kalkulasi Pembagian Dana
        $platformFee = $subTotal * 0.10;
        $netForEo = $subTotal - $platformFee;

        // Cek apakah tiket gratis
        $isFree = $subTotal == 0;
        
        // Tarik data user yang sedang login
        $user = auth()->user();

        // ================================================================
        // 🔥 VALIDASI EMAIL IPB (KHUSUS TIKET GRATIS) 🔥
        // ================================================================
        if ($isFree && !Str::endsWith($user->email, '@apps.ipb.ac.id')) {
            return response()->json([
                'success' => false,
                'message' => 'Maaf, tiket gratis ini eksklusif dan hanya dapat diklaim menggunakan email IPB (@apps.ipb.ac.id).'
            ], 403); // 403 Forbidden
        }

        // 4. Simpan ke Database (Jika gratis langsung PAID, jika bayar PENDING)
        $payment = Payment::create([
            'user_id' => $user->id, // Menggunakan id dari variable $user yang ditarik di atas
            'event_id' => $event->_id,
            'organizer_id' => $event->organizer_id,
            'ticket_items' => $savedTicketItems,
            'sub_total' => $subTotal,
            'platform_fee' => $platformFee,
            'net_for_eo' => $netForEo,
            'payment_status' => $isFree ? 'PAID' : 'PENDING',
        ]);

        // ================================================================
        // SKENARIO A: TIKET GRATIS (TIDAK LEWAT XENDIT)
        // ================================================================
        if ($isFree) {
            // Update stok event ke DB
            $event->update(['ticket_types' => $eventTickets]);

            // Buatkan QR Code Tiket langsung (Karena tidak memicu webhook)
            foreach ($savedTicketItems as $item) {
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

            return response()->json([
                'success' => true,
                'message' => 'Tiket gratis berhasil diklaim.',
                'data' => [
                    'payment_id' => $payment->_id,
                    'payment_url' => null // Null karena tidak ada tagihan
                ]
            ], 201);
        }


        // ================================================================
        // SKENARIO B: TIKET BERBAYAR (LEWAT XENDIT)
        // ================================================================
        try {
            // Rakit data kustomer
            $customerData = [
                'given_names' => $user->name,
                'email' => $user->email,
            ];

            // Setup No HP yang aman untuk Xendit
            if (!empty($user->phone_number)) {
                $phoneCode = $user->phone_code ?? '+62'; 
                // Buang angka 0 di depan jika user mengetik 0812...
                $cleanPhone = ltrim($user->phone_number, '0');
                $customerData['mobile_number'] = $phoneCode . $cleanPhone;
            }

            $response = Http::withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                ->timeout(30)
                ->post('https://api.xendit.co/v2/invoices', [
                    'external_id' => (string) $payment->_id,
                    'amount' => (int) $subTotal,
                    'payer_email' => $user->email,
                    'description' => 'Pembelian Tiket: ' . $event->name,
                    'invoice_duration' => 86400,
                    'customer' => $customerData
                ]);

            $xenditData = $response->json();

            if ($response->failed()) {
                $errorDetail = isset($xenditData['errors']) ? ' | ' . json_encode($xenditData['errors']) : '';
                throw new \Exception(($xenditData['message'] ?? 'Gagal membuat invoice') . $errorDetail);
            }

            // Update Payment dengan URL Xendit
            $payment->update([
                'xendit_invoice_id' => $xenditData['id'],
                'xendit_checkout_url' => $xenditData['invoice_url']
            ]);

            // Simpan stok yang sudah dikurangi ke database MongoDB
            $event->update(['ticket_types' => $eventTickets]);

            return response()->json([
                'success' => true,
                'message' => 'Checkout berhasil, silakan selesaikan pembayaran.',
                'data' => [
                    'payment_id' => $payment->_id,
                    'payment_url' => $xenditData['invoice_url']
                ]
            ], 201);

        } catch (\Exception $e) {
            // Rollback payment jika Xendit gagal (stok tidak jadi dikurangi)
            $payment->delete();
            return response()->json([
                'success' => false, 
                'message' => 'Gagal terhubung ke gerbang pembayaran.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
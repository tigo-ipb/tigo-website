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
        // 1. Validasi Input dari Mobile (Termasuk field customer_birth_date)
        $request->validate([
            'event_id' => 'required|string',
            'ticket_items' => 'required|array|min:1',
            'ticket_items.*.type_id' => 'required|string',
            'ticket_items.*.quantity' => 'required|integer|min:1',
            'customer_name' => 'required|string|max:255',
            'customer_email' => 'required|email|max:255',
            'customer_phone' => 'required|string|max:20',
            'customer_birth_date' => 'required|date', // 🔥 TAMBAHAN VALIDASI TANGGAL LAHIR
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
        // VALIDASI EMAIL IPB (KHUSUS TIKET GRATIS)
        // ================================================================
        if ($isFree && !Str::endsWith($user->email, '@apps.ipb.ac.id')) {
            return response()->json([
                'success' => false,
                'message' => 'Maaf, tiket gratis ini eksklusif dan hanya dapat diklaim menggunakan akun dengan email IPB (@apps.ipb.ac.id).'
            ], 403); 
        }

        // 4. Simpan ke Database Payment dengan tambahan birth_date di customer_info
        $payment = Payment::create([
            'user_id' => $user->id,
            'event_id' => $event->_id,
            'organizer_id' => $event->organizer_id,
            'ticket_items' => $savedTicketItems,
            'customer_info' => [
                'name' => $request->customer_name,
                'email' => $request->customer_email,
                'phone' => $request->customer_phone,
                'birth_date' => $request->customer_birth_date, // 🔥 SIMPAN TANGGAL LAHIR DI SINI
            ],
            'sub_total' => $subTotal,
            'platform_fee' => $platformFee,
            'net_for_eo' => $netForEo,
            'payment_status' => $isFree ? 'PAID' : 'PENDING',
        ]);

        // ================================================================
        // SKENARIO A: TIKET GRATIS (TIDAK LEWAT XENDIT)
        // ================================================================
        if ($isFree) {
            $event->update(['ticket_types' => $eventTickets]);

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
                    'payment_url' => null 
                ]
            ], 201);
        }

        // ================================================================
        // SKENARIO B: TIKET BERBAYAR (LEWAT XENDIT)
        // ================================================================
        try {
            $cleanPhone = $request->customer_phone;
            if (Str::startsWith($cleanPhone, '0')) {
                $cleanPhone = '+62' . substr($cleanPhone, 1);
            }

            $customerData = [
                'given_names' => $request->customer_name,
                'email' => $request->customer_email,
                'mobile_number' => $cleanPhone,
            ];

            $response = Http::withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                ->timeout(30)
                ->post('https://api.xendit.co/v2/invoices', [
                    'external_id' => (string) $payment->_id,
                    'amount' => (int) $subTotal,
                    'payer_email' => $request->customer_email,
                    'description' => 'Pembelian Tiket: ' . $event->name,
                    'invoice_duration' => 86400, 
                    'customer' => $customerData,
                    'success_redirect_url' => 'tigoapp://payment/success', 
                    'failure_redirect_url' => 'tigoapp://payment/failed',
                ]);

            $xenditData = $response->json();

            if ($response->failed()) {
                $errorDetail = isset($xenditData['errors']) ? ' | ' . json_encode($xenditData['errors']) : '';
                throw new \Exception(($xenditData['message'] ?? 'Gagal membuat invoice') . $errorDetail);
            }

            $payment->update([
                'xendit_invoice_id' => $xenditData['id'],
                'xendit_checkout_url' => $xenditData['invoice_url']
            ]);

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
            $payment->delete();
            return response()->json([
                'success' => false, 
                'message' => 'Gagal terhubung ke gerbang pembayaran.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
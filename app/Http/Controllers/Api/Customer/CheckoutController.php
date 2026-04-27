<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\Payment;
use Illuminate\Support\Facades\Http;

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
        $eventTickets = $event->ticket_types; // Ambil array tiket saat ini

        // 2. Periksa Stok dan Hitung Harga dengan Aman (Jangan percaya harga dari frontend)
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

        // 3. Kalkulasi Pembagian Dana (Fee 10% Platform)
        $platformFee = $subTotal * 0.10;
        $netForEo = $subTotal - $platformFee;

        // 4. Simpan ke Database (Status PENDING)
        $payment = Payment::create([
            'user_id' => auth()->id(),
            'event_id' => $event->_id,
            'organizer_id' => $event->organizer_id,
            'ticket_items' => $savedTicketItems,
            'sub_total' => $subTotal,
            'platform_fee' => $platformFee,
            'net_for_eo' => $netForEo,
            'payment_status' => 'PENDING',
        ]);

        // 5. Tembak API Invoice Xendit
        try {
            $response = Http::withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                ->post('https://api.xendit.co/v2/invoices', [
                    'external_id' => (string) $payment->_id,
                    'amount' => $subTotal,
                    'payer_email' => auth()->user()->email,
                    'description' => 'Pembelian Tiket: ' . $event->name,
                    'invoice_duration' => 86400, // Kadaluarsa dalam 24 Jam
                    'customer' => [
                        'given_names' => auth()->user()->name,
                        'email' => auth()->user()->email,
                        'mobile_number' => auth()->user()->phone_number ?? '',
                    ]
                ]);

            $xenditData = $response->json();

            if ($response->failed()) {
                throw new \Exception($xenditData['message'] ?? 'Gagal membuat invoice');
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
                    'payment_url' => $xenditData['invoice_url'] // <-- Flutter akan membuka Webview ke URL ini
                ]
            ], 201);

        } catch (\Exception $e) {
            // Rollback jika Xendit gagal
            $payment->delete();
            return response()->json([
                'success' => false, 
                'message' => 'Gagal terhubung ke gerbang pembayaran.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
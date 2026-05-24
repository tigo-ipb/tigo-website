<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Payment;
use App\Models\TicketValidation;
use App\Models\Event;

class MyTicketController extends Controller
{
    // Mengambil daftar transaksi yang sudah dibayar (Untuk Tab Ticket & Riwayat)
    public function index(Request $request)
    {
        // Ambil semua pembayaran milik user ini yang statusnya PAID
        $payments = Payment::where('user_id', auth()->id())
            ->where('payment_status', 'PAID')
            ->orderBy('created_at', 'desc')
            ->get();

        $activeTickets = [];
        $historyTickets = [];

        $today = now()->format('Y-m-d');

        // Looping untuk memisahkan mana tiket yang masih aktif (event belum selesai) dan riwayat
        foreach ($payments as $payment) {
            $event = Event::find($payment->event_id);
            
            if (!$event) continue;

            $ticketData = [
                'payment_id' => $payment->_id,
                'event_name' => $event->name,
                'organizer_name' => \App\Models\User::find($event->organizer_id)->name ?? 'Organizer',
                'date_start' => $event->date_start,
                'location' => $event->location,
                'banner_1x1' => $event->banners['1x1'] ?? null,
                'total_tickets' => collect($payment->ticket_items)->sum('quantity')
            ];

            // Jika event masih berlangsung/akan datang -> Masuk Tab 'Ticket'
            if ($event->date_end >= $today) {
                $activeTickets[] = $ticketData;
            } else {
                // Jika event sudah lewat -> Masuk Tab 'Riwayat'
                $historyTickets[] = $ticketData;
            }
        }

        return response()->json([
            'success' => true,
            'data' => [
                'active' => $activeTickets,
                'history' => $historyTickets
            ]
        ], 200);
    }

    // Mengambil Detail E-Ticket (Menampilkan QR Code)
    public function show($payment_id)
    {
        $payment = Payment::where('_id', $payment_id)
            ->where('user_id', auth()->id())
            ->first();

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Data tiket tidak ditemukan'], 404);
        }

        $event = Event::find($payment->event_id);

        // Ambil data QR Code dari tabel TicketValidations
        // (Satu payment bisa menghasilkan banyak QR jika beli banyak tiket)
        $qrCodes = TicketValidation::where('payment_id', $payment_id)->get();

        // Di dalam fungsi show() MyTicketController...
        $customerInfo = $payment->customer_info ?? [];

        return response()->json([
            'success' => true,
            'data' => [
                'event_details' => [
                    'name' => $event->name ?? 'Event',
                    'date_start' => $event->date_start ?? '',
                    'time_start' => $event->time_start ?? '',
                    'location' => $event->location ?? null,
                ],
                'buyer_details' => [
                    'name' => $customerInfo['name'] ?? auth()->user()->name,
                    'email' => $customerInfo['email'] ?? auth()->user()->email,
                    'phone_number' => $customerInfo['phone'] ?? auth()->user()->phone_number,
                    'birth_date' => $customerInfo['birth_date'] ?? auth()->user()->birth_date, // 🔥 AMBIL TANGGAL LAHIR TRANSKASI DI SINI
                ],
                'ticket_items' => $payment->ticket_items,
                'total_paid' => $payment->sub_total,
                'status' => $payment->payment_status,
                'qr_codes' => $qrCodes 
            ]
        ], 200);
    }
}
<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\Event;
use App\Models\User;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $organizerId = auth()->id();

        // Ambil semua payment milik organizer ini
        $query = Payment::where('organizer_id', $organizerId)
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($request->status && $request->status !== 'semua') {
            $query->where('payment_status', strtoupper($request->status));
        }

        // Filter by search
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('buyer_name', 'like', '%'.$search.'%')
                  ->orWhere('buyer_email', 'like', '%'.$search.'%');
            });
        }

        // Filter by event
        if ($request->event_id) {
            $query->where('event_id', $request->event_id);
        }

        // Pagination
        $perPage = 10;
        $allPayments = $query->get();
        $total = $allPayments->count();
        $page = $request->page ?? 1;
        $payments = $allPayments->slice(($page - 1) * $perPage, $perPage)->values();

        // Map data
        $bookings = $payments->map(function ($payment) {
            $user = User::find($payment->user_id);
            $event = Event::find($payment->event_id);

            return [
                'order_id' => strtoupper(substr($payment->_id, -8)),
                'date' => $payment->created_at->format('d/m/Y'),
                'time' => $payment->created_at->format('H:i'),
                'buyer_name' => $user ? $user->name : 'Pengunjung',
                'email' => $user ? $user->email : '-',
                'event_name' => $event ? $event->name : 'Event Dihapus',
                'category' => $event ? ($event->category_name ?? 'Hiburan') : '-',
                'qty' => collect($payment->ticket_items)->sum('quantity'),
                'amount' => $payment->sub_total,
                'status' => $payment->payment_status,
            ];
        });

        // Stats
        $allPaymentsForStats = Payment::where('organizer_id', $organizerId)->get();
        $totalBookings = $allPaymentsForStats->count();
        $totalTicketsSold = 0;
        foreach ($allPaymentsForStats->where('payment_status', 'PAID') as $p) {
            $totalTicketsSold += collect($p->ticket_items)->sum('quantity');
        }

        // Events untuk filter dropdown
        $events = Event::where('organizer_id', $organizerId)
            ->get()
            ->map(fn($e) => ['id' => $e->_id, 'name' => $e->name]);

        return Inertia::render('Organizer/Bookings', [
            'bookings' => $bookings,
            'events' => $events,
            'stats' => [
                'total_bookings' => $totalBookings,
                'total_tickets_sold' => $totalTicketsSold,
            ],
            'pagination' => [
                'total' => $total,
                'per_page' => $perPage,
                'current_page' => (int) $page,
                'last_page' => ceil($total / $perPage),
            ],
            'filters' => [
                'status' => $request->status ?? 'semua',
                'search' => $request->search ?? '',
                'event_id' => $request->event_id ?? '',
            ]
        ]);
    }
}
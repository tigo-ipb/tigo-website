<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use App\Models\Payment;
use App\Models\User;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $organizerId = auth()->id();

        // 1. Ambil data dasar
        $events = Event::where('organizer_id', $organizerId)->get();
        
        // Ambil semua transaksi (termasuk yang PENDING untuk tabel)
        $allPayments = Payment::where('organizer_id', $organizerId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $paidPayments = $allPayments->where('payment_status', 'PAID');

        // 2. Kalkulasi Statistik & Chart Donut
        $totalEvents = $events->count();
        $totalTicketsSold = 0;
        $totalTicketsAvailable = 0;
        $totalRevenue = 0;
        $eventRevenueMap = []; 

        // Hitung total tiket tersedia dari seluruh event aktif
        foreach ($events as $event) {
            foreach ($event->ticket_types as $ticket) {
                $totalTicketsAvailable += (int) $ticket['available_stock'];
            }
        }

        foreach ($paidPayments as $payment) {
            $totalRevenue += $payment->net_for_eo;
            $totalTicketsSold += collect($payment->ticket_items)->sum('quantity');

            // Map untuk Top Event
            if (!isset($eventRevenueMap[$payment->event_id])) {
                $eventRevenueMap[$payment->event_id] = 0;
            }
            $eventRevenueMap[$payment->event_id] += $payment->net_for_eo;
        }

        // 3. Kalkulasi Chart Area (Pendapatan Bulanan tahun ini)
        $monthlyRevenue = array_fill(0, 12, 0); // Array [0,0,0... 12x]
        $currentYear = now()->year;
        
        foreach ($paidPayments as $payment) {
            if ($payment->created_at->year === $currentYear) {
                $monthIndex = $payment->created_at->month - 1; // 0 untuk Jan, 11 untuk Des
                $monthlyRevenue[$monthIndex] += $payment->net_for_eo;
            }
        }

        // 4. Top Events (5 teratas)
        arsort($eventRevenueMap); 
        $topEventIds = array_slice(array_keys($eventRevenueMap), 0, 8); // Ambil 8 sesuai UI
        
        $topEvents = Event::whereIn('_id', $topEventIds)->get()->map(function ($event) use ($eventRevenueMap) {
            return [
                'name' => $event->name,
                'revenue' => $eventRevenueMap[$event->_id] ?? 0
            ];
        })->sortByDesc('revenue')->values();

        // 5. Booking Terkini & Aktivitas Terakhir (Ambil 5 terbaru)
        $recentBookings = $allPayments->take(5)->map(function ($payment) {
            $user = User::find($payment->user_id);
            $event = Event::find($payment->event_id);
            
            return [
                'order_id' => substr($payment->_id, -8),
                'date' => $payment->created_at->format('d/m/Y'),
                'time' => $payment->created_at->format('H:i'),
                'buyer_name' => $user ? $user->name : 'Pengunjung',
                'email' => $user ? $user->email : '-',
                'event_name' => $event ? $event->name : 'Event Dihapus',
                'category' => $event ? $event->category_name : 'Hiburan',
                'qty' => collect($payment->ticket_items)->sum('quantity'),
                'amount' => $payment->sub_total, // Gunakan sub_total karena ini yang dibayar user
                'status' => $payment->payment_status,
                'time_ago' => $payment->created_at->translatedFormat('H.i, d F Y')
            ];
        });

        // 6. Event Saat Ini (Event terdekat)
        $currentEventRaw = Event::where('organizer_id', $organizerId)
            ->where('date_end', '>=', now())
            ->orderBy('date_start', 'asc')
            ->first();

        $currentEvent = null;
        if ($currentEventRaw) {
            $firstSchedule = collect($currentEventRaw->schedules)->first() ?? [];
            $scheduleDate = isset($firstSchedule['date']) ? Carbon::parse($firstSchedule['date'])->translatedFormat('D, j F Y') : '';
            $scheduleTime = (isset($firstSchedule['time_start']) ? $firstSchedule['time_start'] : '') . ' - ' . (isset($firstSchedule['time_end']) ? $firstSchedule['time_end'] : '');

            $currentEvent = [
                'name' => $currentEventRaw->name,
                'category' => $currentEventRaw->category_name ?? 'Event',
                'venue' => $currentEventRaw->location['venue'] ?? 'TBA',
                'city' => $currentEventRaw->location['city'] ?? '',
                'image' => $currentEventRaw->banners['16x9'] ?? ($currentEventRaw->poster_url ?? 'https://via.placeholder.com/400x200'),
                'date_format' => $scheduleDate,
                'time_format' => $scheduleTime
            ];
        }

        return Inertia::render('Organizer/Dashboard', [
            'stats' => [
                'total_events' => $totalEvents,
                'total_tickets_sold' => $totalTicketsSold,
                'total_tickets_available' => $totalTicketsAvailable,
                'monthly_revenue' => $monthlyRevenue
            ],
            'topEvents' => $topEvents,
            'recentBookings' => $recentBookings,
            'currentEvent' => $currentEvent
        ]);
    }
}
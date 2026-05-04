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
    public function index(\Illuminate\Http\Request $request)
{
    $organizerId = auth()->id();

    // --- PARAMETER FILTER DARI FRONTEND ---
    $topEventBy = $request->query('top_event', 'revenue'); // revenue / attendance
    $chartPeriod = $request->query('chart_period', 'tahun_ini'); // tahun_ini, 3_bulan, 6_bulan, tahun_kemarin, 5_tahun
    $search = $request->query('search', null); // Pencarian untuk Booking Terkini

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
    $eventStatsMap = []; // Menyimpan revenue dan attendance per event

    // Hitung total tiket tersedia
    foreach ($events as $event) {
        foreach ($event->ticket_types ?? [] as $ticket) {
            $totalTicketsAvailable += (int) ($ticket['available_stock'] ?? 0);
        }
    }

    foreach ($paidPayments as $payment) {
        $revenue = $payment->net_for_eo ?? 0;
        $qty = collect($payment->ticket_items)->sum('quantity');

        $totalRevenue += $revenue;
        $totalTicketsSold += $qty;

        // Map untuk Top Event
        if (!isset($eventStatsMap[$payment->event_id])) {
            $eventStatsMap[$payment->event_id] = ['revenue' => 0, 'attendance' => 0];
        }
        $eventStatsMap[$payment->event_id]['revenue'] += $revenue;
        $eventStatsMap[$payment->event_id]['attendance'] += $qty;
    }

    // 3. Top Events (Ambil 8 teratas berdasarkan Filter Metrik)
    // Urutkan array map berdasarkan revenue atau attendance
    uasort($eventStatsMap, function ($a, $b) use ($topEventBy) {
        return $b[$topEventBy] <=> $a[$topEventBy];
    });

    $topEventIds = array_slice(array_keys($eventStatsMap), 0, 8); 
    
    $topEvents = Event::whereIn('_id', $topEventIds)->get()->map(function ($event) use ($eventStatsMap) {
        return [
            'name' => $event->name,
            'revenue' => $eventStatsMap[$event->_id]['revenue'] ?? 0,
            'attendance' => $eventStatsMap[$event->_id]['attendance'] ?? 0
        ];
    })->sortByDesc($topEventBy)->values();

    // 4. Kalkulasi Chart Area (Berdasarkan Rentang Waktu)
    $chartLabels = [];
    $chartData = [];
    $now = \Carbon\Carbon::now();

    if ($chartPeriod === 'tahun_ini' || $chartPeriod === 'tahun_kemarin') {
        $targetYear = $chartPeriod === 'tahun_ini' ? $now->year : $now->year - 1;
        $chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
        $chartData = array_fill(0, 12, 0);

        foreach ($paidPayments as $payment) {
            if ($payment->created_at->year === $targetYear) {
                $monthIndex = $payment->created_at->month - 1;
                $chartData[$monthIndex] += $payment->net_for_eo ?? 0;
            }
        }
    } elseif ($chartPeriod === '3_bulan' || $chartPeriod === '6_bulan') {
        $monthsCount = $chartPeriod === '3_bulan' ? 3 : 6;
        
        // Buat label bulan mundur ke belakang (contoh: Mar, Apr, Mei)
        for ($i = $monthsCount - 1; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $chartLabels[] = $date->translatedFormat('M y');
            $chartData[] = 0;
        }

        $startDate = $now->copy()->subMonths($monthsCount - 1)->startOfMonth();
        
        foreach ($paidPayments as $payment) {
            if ($payment->created_at >= $startDate && $payment->created_at <= $now->copy()->endOfMonth()) {
                $paymentLabel = $payment->created_at->translatedFormat('M y');
                $index = array_search($paymentLabel, $chartLabels);
                if ($index !== false) {
                    $chartData[$index] += $payment->net_for_eo ?? 0;
                }
            }
        }
    } elseif ($chartPeriod === '5_tahun') {
        $startYear = $now->year - 4;
        for ($i = $startYear; $i <= $now->year; $i++) {
            $chartLabels[] = (string) $i;
            $chartData[] = 0;
        }

        foreach ($paidPayments as $payment) {
            if ($payment->created_at->year >= $startYear) {
                $index = array_search((string)$payment->created_at->year, $chartLabels);
                if ($index !== false) {
                    $chartData[$index] += $payment->net_for_eo ?? 0;
                }
            }
        }
    }

    $recentBookingsQuery = Payment::with(['user', 'event'])
        ->where('organizer_id', $organizerId);

    if ($search) {
        $safeSearch = preg_quote($search, '/');
        $regexPattern = "/.*{$safeSearch}.*/i";

        // Tarik ID Relasi
        $userIds = User::where('name', 'regex', $regexPattern)
            ->select('_id')->limit(100)->get()->map(fn($user) => $user->id)->filter()->toArray();
            
        $eventIds = Event::where('name', 'regex', $regexPattern)
            ->select('_id')->limit(100)->get()->map(fn($event) => $event->id)->filter()->toArray();

        // Terapkan filter ke Query Booking Terkini
        $recentBookingsQuery->where(function($q) use ($search, $regexPattern, $userIds, $eventIds) {
            $q->where('external_id', 'regex', $regexPattern);
              
            if (strlen($search) === 24) {
                $q->orWhere('_id', $search);
            }

            if (!empty($userIds)) {
                $q->orWhereIn('user_id', $userIds);
            }
            
            if (!empty($eventIds)) {
                $q->orWhereIn('event_id', $eventIds);
            }
        });
    }

    // Eksekusi Query, ambil 5 teratas, lalu mapping ke format Frontend
    $recentBookings = $recentBookingsQuery->orderBy('created_at', 'desc')
        ->take(5)
        ->get()
        ->map(function ($payment) {
            return [
                'order_id' => substr($payment->_id, -8),
                'date' => $payment->created_at->format('d/m/Y'),
                'time' => $payment->created_at->format('H:i'),
                // Karena sudah pakai with(), kita panggil relasinya langsung tanpa query User::find() lagi
                'buyer_name' => $payment->user ? $payment->user->name : 'Pengunjung',
                'email' => $payment->user ? $payment->user->email : '-',
                'event_name' => $payment->event ? $payment->event->name : 'Event Dihapus',
                'category' => $payment->event ? $payment->event->category_name : 'Hiburan',
                'qty' => collect($payment->ticket_items)->sum('quantity'),
                'amount' => $payment->sub_total,
                'status' => $payment->payment_status,
            ];
        });

    // 6. Aktivitas Terakhir
    $ticketActivities = $paidPayments->take(10)->map(function ($payment) {
        $user = User::find($payment->user_id);
        $event = Event::find($payment->event_id);
        return [
            'type' => 'ticket', 
            'title' => ($user->name ?? 'Pengunjung') . ' membeli tiket',
            'target' => $event->name ?? 'Event Dihapus',
            'time_ago' => $payment->created_at->translatedFormat('H.i, d F Y'),
            'timestamp' => $payment->created_at
        ];
    });

    $eventActivities = Event::where('organizer_id', $organizerId)
        ->latest()->take(5)->get()->map(function ($event) {
            return [
                'type' => 'event',
                'title' => 'Menambahkan Event',
                'target' => '"' . $event->name . '"',
                'time_ago' => $event->created_at->translatedFormat('H.i, d F Y'),
                'timestamp' => $event->created_at
            ];
        });

    $recentActivities = $ticketActivities->concat($eventActivities)
        ->sortByDesc('timestamp')->take(5)->values();

    // 7. Event Saat Ini
    $currentEventRaw = Event::where('organizer_id', $organizerId)
        ->where('date_end', '>=', now())
        ->orderBy('date_start', 'asc')
        ->first();

    $currentEvent = null;
    if ($currentEventRaw) {
        $firstSchedule = collect($currentEventRaw->schedules)->first() ?? [];
        $currentEvent = [
            'id' => $currentEventRaw->_id,
            'name' => $currentEventRaw->name,
            'category' => $currentEventRaw->category_name ?? 'Event',
            'venue' => $currentEventRaw->location['venue'] ?? 'TBA',
            'city' => $currentEventRaw->location['city'] ?? '',
            'image' => $currentEventRaw->banners['16x9'] ?? ($currentEventRaw->poster_url ?? 'https://via.placeholder.com/400x200'),
            'date_format' => isset($firstSchedule['date']) ? \Carbon\Carbon::parse($firstSchedule['date'])->translatedFormat('D, j F Y') : '',
            'time_format' => (isset($firstSchedule['time_start']) ? $firstSchedule['time_start'] : '') . ' - ' . (isset($firstSchedule['time_end']) ? $firstSchedule['time_end'] : '')
        ];
    }

       // Return Data
    return inertia('Organizer/Dashboard', [
        'stats' => [
            'total_events' => $totalEvents,
            'total_tickets_sold' => $totalTicketsSold,
            'total_tickets_available' => $totalTicketsAvailable,
            'chart_labels' => $chartLabels, // Kirim Array Label
            'chart_data' => $chartData,     // Kirim Array Data
        ],
        'topEvents' => $topEvents,
        'recentBookings' => $recentBookings,
        'recentActivities' => $recentActivities,
        'currentEvent' => $currentEvent,
        'filters' => $request->only(['top_event', 'chart_period', 'search']) // Kirim balik state filter
    ]);
}
}
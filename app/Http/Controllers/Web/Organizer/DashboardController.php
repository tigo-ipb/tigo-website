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
        $topEventBy = $request->query('top_event', 'revenue'); 
        $chartPeriod = $request->query('chart_period', 'tahun_ini'); 
        $ticketPeriod = $request->query('ticket_period', 'minggu_ini'); 
        $search = $request->query('search', null); 

        // 1. Ambil data dasar
        $events = Event::where('organizer_id', $organizerId)->get();
        
        $allPayments = Payment::where('organizer_id', $organizerId)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $paidPayments = $allPayments->where('payment_status', 'PAID');
        $now = Carbon::now();

        // 2. Kalkulasi Statistik & Chart Donut
        $totalEvents = $events->count();
        $totalTicketsSold = 0;
        $totalTicketsAvailable = 0;
        $totalRevenue = 0;
        $eventStatsMap = []; 

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

            if (!isset($eventStatsMap[$payment->event_id])) {
                $eventStatsMap[$payment->event_id] = ['revenue' => 0, 'attendance' => 0];
            }
            $eventStatsMap[$payment->event_id]['revenue'] += $revenue;
            $eventStatsMap[$payment->event_id]['attendance'] += $qty;
        }

        $donutPayments = $paidPayments;
        if ($ticketPeriod === 'minggu_ini') {
            $donutPayments = $paidPayments->filter(fn ($p) => $p->created_at >= $now->copy()->subWeek());
        } elseif ($ticketPeriod === 'bulan_ini') {
            $donutPayments = $paidPayments->filter(fn ($p) => $p->created_at >= $now->copy()->startOfMonth());
        }

        $donutTicketsSold = 0;
        foreach ($donutPayments as $payment) {
            $donutTicketsSold += collect($payment->ticket_items)->sum('quantity');
        }

        // 3. Top Events
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

        // =========================================================================
        // 4. KALKULASI CHART AREA (AKTUAL & TARGET POTENSI)
        // =========================================================================
        $chartLabels = [];
        $chartData = []; // Untuk aktual (pendapatan murni)
        $chartTarget = []; // Untuk target (potensi maksimal)

        // Tentukan Range Tanggal berdasarkan Filter
        if ($chartPeriod === 'tahun_ini' || $chartPeriod === 'tahun_kemarin') {
            $targetYear = $chartPeriod === 'tahun_ini' ? $now->year : $now->year - 1;
            $startChart = Carbon::create($targetYear)->startOfYear();
            $endChart = Carbon::create($targetYear)->endOfYear();
            $chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            $chartData = array_fill(0, 12, 0);
            $chartTarget = array_fill(0, 12, 0);
            $formatKey = fn($date) => $chartLabels[Carbon::parse($date)->format('n') - 1];
        } elseif ($chartPeriod === '3_bulan' || $chartPeriod === '6_bulan') {
            $monthsCount = $chartPeriod === '3_bulan' ? 3 : 6;
            $startChart = $now->copy()->subMonths($monthsCount - 1)->startOfMonth();
            $endChart = $now->copy()->endOfMonth();
            for ($i = $monthsCount - 1; $i >= 0; $i--) {
                $lbl = $now->copy()->subMonths($i)->translatedFormat('M y');
                $chartLabels[] = $lbl;
                $chartData[] = 0;
                $chartTarget[] = 0;
            }
            $formatKey = fn($date) => Carbon::parse($date)->translatedFormat('M y');
        } elseif ($chartPeriod === '5_tahun') {
            $startYear = $now->year - 4;
            $startChart = Carbon::create($startYear)->startOfYear();
            $endChart = $now->copy()->endOfYear();
            for ($i = $startYear; $i <= $now->year; $i++) {
                $chartLabels[] = (string) $i;
                $chartData[] = 0;
                $chartTarget[] = 0;
            }
            $formatKey = fn($date) => (string) Carbon::parse($date)->year;
        }

        // A. Kalkulasi Aktual
        $paymentsChart = $paidPayments->where('created_at', '>=', $startChart)->where('created_at', '<=', $endChart);
        foreach ($paymentsChart as $payment) {
            $key = $formatKey($payment->created_at);
            $index = array_search($key, $chartLabels);
            if ($index !== false) {
                $chartData[$index] += $payment->net_for_eo ?? 0;
            }
        }

        // B. Kalkulasi Target
        $eventsChart = $events->where('created_at', '>=', $startChart)->where('created_at', '<=', $endChart);
        foreach ($eventsChart as $event) {
            $key = $formatKey($event->created_at);
            $eventId = $event->_id ?? $event->id;
            
            // Hitung Potensi Maksimal
            $pendapatanSaatIni = $paidPayments->where('event_id', $eventId)->sum('net_for_eo');
            $potensiSisa = 0;
            if ($event->ticket_types) {
                $potensiSisa = collect($event->ticket_types)->sum(function ($ticket) {
                    $harga = is_array($ticket) ? ($ticket['price'] ?? 0) : ($ticket->price ?? 0);
                    $sisaStok = is_array($ticket) ? ($ticket['available_stock'] ?? 0) : ($ticket->available_stock ?? 0); 
                    return $harga * $sisaStok;
                });
            }
            $potensiMaksimal = $pendapatanSaatIni + $potensiSisa;

            // Sebar ke Grafik
            if ($chartPeriod === '5_tahun') {
                $index = array_search($key, $chartLabels);
                if ($index !== false) $chartTarget[$index] += $potensiMaksimal;
            } else {
                // Sebar rata berdasarkan bulan
                $startMDate = Carbon::parse($event->created_at)->startOfMonth();
                $endMDate = $event->date_end ? Carbon::parse($event->date_end)->startOfMonth() : $startMDate;
                if ($endMDate < $startMDate) $endMDate = $startMDate;
                
                // Cari ada berapa bulan event ini berjalan
                $diffInMonths = $startMDate->diffInMonths($endMDate) + 1;
                $targetPerBulan = $potensiMaksimal / $diffInMonths;
                
                for ($i = 0; $i < $diffInMonths; $i++) {
                    $d = $startMDate->copy()->addMonths($i);
                    $lblKey = $formatKey($d);
                    
                    $idx = array_search($lblKey, $chartLabels);
                    if ($idx !== false) {
                        $chartTarget[$idx] += $targetPerBulan;
                    }
                }
            }
        }

        // 5. Booking Terkini
        $recentBookingsQuery = Payment::with(['user', 'event'])->where('organizer_id', $organizerId);
        if ($search) {
            $safeSearch = preg_quote($search, '/');
            $regexPattern = "/.*{$safeSearch}.*/i";

            $userIds = User::where('name', 'regex', $regexPattern)
                ->select('_id')->limit(100)->get()->map(fn($u) => $u->id)->filter()->toArray();
                
            $eventIds = Event::where('name', 'regex', $regexPattern)
                ->select('_id')->limit(100)->get()->map(fn($e) => $e->id)->filter()->toArray();

            $recentBookingsQuery->where(function($q) use ($search, $regexPattern, $userIds, $eventIds) {
                $q->where('external_id', 'regex', $regexPattern);
                if (strlen($search) === 24) $q->orWhere('_id', $search);
                if (!empty($userIds)) $q->orWhereIn('user_id', $userIds);
                if (!empty($eventIds)) $q->orWhereIn('event_id', $eventIds);
            });
        }

        $recentBookings = $recentBookingsQuery->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(function ($payment) {
                return [
                    'order_id' => substr($payment->_id, -8),
                    'date' => $payment->created_at->format('d/m/Y'),
                    'time' => $payment->created_at->format('H:i'),
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

        $eventActivities = $events->sortByDesc('created_at')->take(5)->map(function ($event) {
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
        $currentEventRaw = $events->where('date_end', '>=', now())->sortBy('date_start')->first();
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
                'date_format' => isset($firstSchedule['date']) ? Carbon::parse($firstSchedule['date'])->translatedFormat('D, j F Y') : '',
                'time_format' => (isset($firstSchedule['time_start']) ? $firstSchedule['time_start'] : '') . ' - ' . (isset($firstSchedule['time_end']) ? $firstSchedule['time_end'] : '')
            ];
        }

        return inertia('Organizer/Dashboard', [
            'stats' => [
                'total_events' => $totalEvents,
                'total_tickets_sold' => $totalTicketsSold,
                'total_tickets_available' => $totalTicketsAvailable,
                'donut_tickets_sold' => $donutTicketsSold,
                'donut_tickets_available' => max(0, $totalTicketsAvailable),
                'chart_labels' => $chartLabels,
                'chart_data' => $chartData, // 🔥 Pendapatan Aktual
                'chart_target' => $chartTarget, // 🔥 Pendapatan Target (Maksimal)
            ],
            'topEvents' => $topEvents,
            'recentBookings' => $recentBookings,
            'recentActivities' => $recentActivities,
            'currentEvent' => $currentEvent,
            'filters' => $request->only(['top_event', 'chart_period', 'ticket_period', 'search'])
        ]);
    }
}
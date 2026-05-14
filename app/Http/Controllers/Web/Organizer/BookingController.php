<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;

class BookingController extends Controller
{
    // Fungsi bantuan untuk menerapkan filter waktu ke query
    private function applyTimeFilter($query, $filter) {
        if ($filter === 'minggu_ini') {
            $query->where('created_at', '>=', now()->startOfWeek());
        } elseif ($filter === 'bulan_ini') {
            $query->where('created_at', '>=', now()->startOfMonth());
        } elseif ($filter === 'tahun_ini') {
            $query->where('created_at', '>=', now()->startOfYear());
        }
        return $query;
    }

    public function index(Request $request)
    {
        $organizerId = auth()->id();
        $baseQuery = Payment::where('organizer_id', $organizerId);

        // --- 1. STATS CARDS (Semua Waktu - Sesuai referensi gambar) ---
        $allPaymentsForStats = (clone $baseQuery)->get();
        $totalBookings = $allPaymentsForStats->count();
        $totalTicketsSold = 0;
        foreach ($allPaymentsForStats->where('payment_status', 'PAID') as $p) {
            $totalTicketsSold += collect($p->ticket_items)->sum('quantity');
        }

        // --- 2. CHART AREA (Overview Booking) ---
        $filterOverview = $request->filter_overview ?? 'minggu_ini';
        $overviewQuery = clone $baseQuery;
        $this->applyTimeFilter($overviewQuery, $filterOverview);
        $overviewPayments = $overviewQuery->get();

        $areaLabels = [];
        $areaData = [];

        if ($filterOverview === 'minggu_ini') {
            for ($i = 0; $i < 7; $i++) {
                $areaLabels[] = now()->startOfWeek()->addDays($i)->translatedFormat('D'); // Sen, Sel...
                $areaData[] = 0;
            }
            foreach ($overviewPayments as $p) {
                $dayName = Carbon::parse($p->created_at)->translatedFormat('D');
                $idx = array_search($dayName, $areaLabels);
                if ($idx !== false) $areaData[$idx]++;
            }
        } elseif ($filterOverview === 'bulan_ini') {
            $daysInMonth = now()->daysInMonth;
            for ($i = 1; $i <= $daysInMonth; $i++) {
                $areaLabels[] = (string)$i;
                $areaData[] = 0;
            }
            foreach ($overviewPayments as $p) {
                $day = (int)Carbon::parse($p->created_at)->format('j');
                $areaData[$day - 1]++;
            }
        } else { // tahun_ini / semua
            $areaLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            $areaData = array_fill(0, 12, 0);
            foreach ($overviewPayments as $p) {
                $month = (int)Carbon::parse($p->created_at)->format('n');
                $areaData[$month - 1]++;
            }
        }

        // --- 3. CHART DONUT (Kategori) ---
        $filterCategory = $request->filter_category ?? 'minggu_ini';
        $categoryQuery = clone $baseQuery;
        $this->applyTimeFilter($categoryQuery, $filterCategory);
        
        // Hanya hitung kategori dari tiket yang statusnya PAID (sudah laku)
        $categoryPayments = $categoryQuery->where('payment_status', 'PAID')->get();
        $allEvents = Event::where('organizer_id', $organizerId)->get()->keyBy('_id');
        $categoryCounts = [];
        
        foreach ($categoryPayments as $p) {
            $e = $allEvents->get($p->event_id);
            $cat = $e ? ($e->category_name ?? 'Lainnya') : 'Lainnya';
            $qty = collect($p->ticket_items)->sum('quantity');

            if (!isset($categoryCounts[$cat])) $categoryCounts[$cat] = 0;
            $categoryCounts[$cat] += $qty; 
        }

        // --- 4. TABLE (Riwayat Booking) ---
        $tableQuery = clone $baseQuery;
        
        // Filter Status & Search
        if ($request->status && $request->status !== 'semua') {
            $tableQuery->where('payment_status', strtoupper($request->status));
        }
        if ($request->search) {
            $search = $request->search;
            $tableQuery->where(function($q) use ($search) {
                $q->where('buyer_name', 'like', '%'.$search.'%')
                  ->orWhere('buyer_email', 'like', '%'.$search.'%');
            });
        }

        // Sort Table (Terbaru / Terlama)
        $sortOrder = $request->sort_table === 'terlama' ? 'asc' : 'desc';
        $tableQuery->orderBy('created_at', $sortOrder);

        // Pagination
        $perPage = 10;
        $allPaymentsTable = $tableQuery->get();
        $total = $allPaymentsTable->count();
        $page = $request->page ?? 1;
        $payments = $allPaymentsTable->slice(($page - 1) * $perPage, $perPage)->values();

        // Optimasi N+1 Query
        $userIds = $payments->pluck('user_id')->filter()->unique();
        $eventIds = $payments->pluck('event_id')->filter()->unique();
        $users = User::whereIn('_id', $userIds)->get()->keyBy('_id');
        $events = Event::whereIn('_id', $eventIds)->get()->keyBy('_id');

        $bookings = $payments->map(function ($payment) use ($users, $events) {
            $user = $users->get($payment->user_id);
            $event = $events->get($payment->event_id);

            return [
                'order_id' => strtoupper(substr($payment->_id, -8)),
                'date' => Carbon::parse($payment->created_at)->format('d/m/Y'),
                'time' => Carbon::parse($payment->created_at)->format('H:i'),
                'buyer_name' => $payment->buyer_name ?? ($user ? $user->name : 'Pengunjung'),
                'email' => $payment->buyer_email ?? ($user ? $user->email : '-'),
                'event_name' => $event ? $event->name : 'Event Dihapus',
                'category' => $event ? ($event->category_name ?? 'Lainnya') : '-',
                'qty' => collect($payment->ticket_items)->sum('quantity'),
                'amount' => $payment->sub_total,
                'status' => $payment->payment_status,
            ];
        });

        return Inertia::render('Organizer/Bookings', [
            'bookings' => $bookings,
            'stats' => [
                'total_bookings' => $totalBookings,
                'total_tickets_sold' => $totalTicketsSold,
            ],
            'charts' => [
                'area' => [
                    'labels' => $areaLabels,
                    'data' => $areaData
                ],
                'donut' => [
                    'labels' => empty($categoryCounts) ? ['Belum ada data'] : array_keys($categoryCounts),
                    'data' => empty($categoryCounts) ? [1] : array_values($categoryCounts)
                ]
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
                'filter_overview' => $filterOverview,
                'filter_category' => $filterCategory,
                'sort_table' => $request->sort_table ?? 'terbaru',
            ]
        ]);
    }
}
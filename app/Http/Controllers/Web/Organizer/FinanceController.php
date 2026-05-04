<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Payment;
use App\Models\Wallet;
use App\Models\Event;
use App\Models\User;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function index(Request $request)
    {
        $organizerId = auth()->id();

        // Parameter Filters
        $chartFilter = $request->chart_filter ?? 'tahun_ini';
        $categoryFilter = $request->category_filter ?? 'minggu_ini';
        $sortOrder = $request->sort_order ?? 'terbaru';
        $search = $request->search;
        $status = $request->status;

        // --- GLOBAL TOP STATS (Tetap dihitung keseluruhan/all time) ---
        $allPaidPayments = Payment::with('event')->where('organizer_id', $organizerId)->where('payment_status', 'PAID')->get();
        $totalPendapatan = $allPaidPayments->sum('net_for_eo');
        
        $wallet = Wallet::where('organizer_id', $organizerId)->first();
        $saldo = $wallet ? $wallet->available_balance : 0;
        
        $totalEvent = Event::where('organizer_id', $organizerId)->count();
        $rataRataEvent = $totalEvent > 0 ? $totalPendapatan / $totalEvent : 0;

        // =========================================================
        // 1. FILTER CHART PENDAPATAN
        // =========================================================
        $chartData = [];
        if ($chartFilter === 'tahun_kemarin') {
            $startChart = Carbon::now()->subYear()->startOfYear();
            $endChart = Carbon::now()->subYear()->endOfYear();
            $keys = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            foreach ($keys as $k) $chartData[$k] = ['aktual' => 0, 'target' => 0];
            $formatKey = function($date) use ($keys) { return $keys[Carbon::parse($date)->format('n') - 1]; };
        } elseif ($chartFilter === '5_tahun_kemarin') {
            $startChart = Carbon::now()->subYears(4)->startOfYear(); // Termasuk tahun ini
            $endChart = Carbon::now()->endOfYear();
            $keys = [];
            for($i=4; $i>=0; $i--) $keys[] = Carbon::now()->subYears($i)->format('Y');
            foreach ($keys as $k) $chartData[$k] = ['aktual' => 0, 'target' => 0];
            $formatKey = function($date) { return Carbon::parse($date)->format('Y'); };
        } else { // tahun_ini
            $startChart = Carbon::now()->startOfYear();
            $endChart = Carbon::now()->endOfYear();
            $keys = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
            foreach ($keys as $k) $chartData[$k] = ['aktual' => 0, 'target' => 0];
            $formatKey = function($date) use ($keys) { return $keys[Carbon::parse($date)->format('n') - 1]; };
        }

        // Kalkulasi Aktual
        $paymentsChart = Payment::where('organizer_id', $organizerId)->where('payment_status', 'PAID')
            ->whereBetween('created_at', [$startChart, $endChart])->get();
        
        foreach ($paymentsChart as $payment) {
            $key = $formatKey($payment->created_at);
            if(isset($chartData[$key])) $chartData[$key]['aktual'] += $payment->net_for_eo;
        }

        // Kalkulasi Target
        $eventsChart = Event::where('organizer_id', $organizerId)->whereBetween('created_at', [$startChart, $endChart])->get();
        foreach ($eventsChart as $event) {
            $key = $formatKey($event->created_at);
            $eventId = $event->_id ?? $event->id;
            
            $pendapatanSaatIni = $allPaidPayments->where('event_id', $eventId)->sum('net_for_eo');
            $potensiSisa = 0;
            if ($event->ticket_types) {
                $potensiSisa = collect($event->ticket_types)->sum(function ($ticket) {
                    $harga = is_array($ticket) ? ($ticket['price'] ?? 0) : ($ticket->price ?? 0);
                    $sisaStok = is_array($ticket) ? ($ticket['available_stock'] ?? 0) : ($ticket->available_stock ?? 0); 
                    return $harga * $sisaStok;
                });
            }
            $potensiMaksimal = $pendapatanSaatIni + $potensiSisa;

            if ($chartFilter === '5_tahun_kemarin') {
                 // Jika 5 tahun, garis target disatukan per tahun
                 if(isset($chartData[$key])) $chartData[$key]['target'] += $potensiMaksimal;
            } else {
                 // Jika per bulan, sebar rata ke bulan event berjalan
                 $startM = Carbon::parse($event->created_at)->format('n') - 1;
                 $endDate = $event->date_end ? Carbon::parse($event->date_end) : Carbon::parse($event->created_at);
                 $endM = $endDate->year > $startChart->year ? 11 : $endDate->format('n') - 1;
                 if ($endM < $startM) $endM = $startM;
                 
                 $jumlahBulan = ($endM - $startM) + 1;
                 $targetPerBulan = $potensiMaksimal / $jumlahBulan;
                 
                 for ($i = $startM; $i <= $endM; $i++) {
                     if ($i <= 11) $chartData[$keys[$i]]['target'] += $targetPerBulan;
                 }
            }
        }

        $chartPendapatan = [];
        foreach ($chartData as $name => $data) {
            $chartPendapatan[] = ['name' => (string)$name, 'aktual' => $data['aktual'], 'target' => $data['target']];
        }

        // =========================================================
        // 2. FILTER KATEGORI PENDAPATAN (DONUT)
        // =========================================================
        if ($categoryFilter === 'bulan_ini') { 
            $catStart = Carbon::now()->startOfMonth(); $catEnd = Carbon::now()->endOfMonth(); 
        } elseif ($categoryFilter === '6_bulan') { 
            $catStart = Carbon::now()->subMonths(5)->startOfMonth(); $catEnd = Carbon::now()->endOfMonth(); 
        } elseif ($categoryFilter === 'tahun_ini') { 
            $catStart = Carbon::now()->startOfYear(); $catEnd = Carbon::now()->endOfYear(); 
        } elseif ($categoryFilter === 'tahun_kemarin') { 
            $catStart = Carbon::now()->subYear()->startOfYear(); $catEnd = Carbon::now()->subYear()->endOfYear(); 
        } elseif ($categoryFilter === '5_tahun_kemarin') { 
            $catStart = Carbon::now()->subYears(4)->startOfYear(); $catEnd = Carbon::now()->endOfYear(); 
        } else { // minggu_ini
            $catStart = Carbon::now()->startOfWeek(); $catEnd = Carbon::now()->endOfWeek(); 
        }

        $catPayments = Payment::with('event')->where('organizer_id', $organizerId)
            ->where('payment_status', 'PAID')->whereBetween('created_at', [$catStart, $catEnd])->get();
        
        $catTotalRev = $catPayments->sum('net_for_eo');
        // Total tiket HANYA pada rentang waktu yang difilter
        $catTotalTiket = $catPayments->sum(function ($p) { return collect($p->ticket_items)->sum('quantity'); });

        $colors = ['#0ea5e9', '#38bdf8', '#7dd3fc', '#e0f2fe', '#0284c7']; 
        $categories = $catPayments->groupBy(function ($payment) {
            return $payment->event ? ($payment->event->category_name ?? 'Lainnya') : 'Lainnya';
        })->map(function ($payments, $categoryName) use ($catTotalRev) {
            $revenue = $payments->sum('net_for_eo');
            $percentage = $catTotalRev > 0 ? round(($revenue / $catTotalRev) * 100) : 0;
            return ['name' => $categoryName, 'value' => $revenue, 'percentage' => $percentage];
        })->sortByDesc('value')->values();

        $categories = $categories->map(function ($item, $index) use ($colors) {
            $item['color'] = $colors[$index % count($colors)]; return $item;
        });

        // =========================================================
        // 3. RIWAYAT TRANSAKSI & SORTING
        // =========================================================
        $query = Payment::with(['event', 'user'])->where('organizer_id', $organizerId);

        if ($status && $status !== 'Semua') {
            $dbStatus = $status === 'Dibayar' ? 'PAID' : ($status === 'Menunggu' ? 'PENDING' : 'FAILED');
            $query->where('payment_status', $dbStatus);
        }
       if ($search) {
            // Pengaman: Mencegah error jika user ngetik karakter aneh seperti tanda kurung () atau bintang *
            $safeSearch = preg_quote($search, '/');
            $regexPattern = "/.*{$safeSearch}.*/i";

            // OPTIMISASI 1: Gunakan limit(100) agar memori tidak meledak saat pencarian terlalu umum
            $userIds = User::where('name', 'regex', $regexPattern)
                ->select('_id')
                ->limit(100) 
                ->get()
                ->map(fn($user) => $user->id)
                ->filter()
                ->toArray();
                
            $eventIds = Event::where('name', 'regex', $regexPattern)
                ->select('_id')
                ->limit(100)
                ->get()
                ->map(fn($event) => $event->id)
                ->filter()
                ->toArray();

            // 2. Eksekusi ke tabel Payment
            $query->where(function($q) use ($search, $regexPattern, $userIds, $eventIds) {
                // OPTIMISASI 2: Gunakan safe regex pattern
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

        $direction = $sortOrder === 'terlama' ? 'asc' : 'desc';
        $transactions = $query->orderBy('created_at', $direction)->paginate(10)->withQueryString();

        // Top Events (Tetap All Time)
        $topEvents = $allPaidPayments->groupBy('event_id')->map(function ($payments, $eventId) {
            $event = $payments->first()->event;
            return ['id' => $eventId, 'name' => $event ? $event->name : 'Event Dihapus', 'revenue' => $payments->sum('net_for_eo')];
        })->sortByDesc('revenue')->take(5)->values()->toArray();

        return Inertia::render('Organizer/Finance', [
            'stats' => [
                'total' => $totalPendapatan, 
                'saldo' => $saldo, 
                'rata_rata' => $rataRataEvent,
                'cat_total_tiket' => $catTotalTiket // <- Ini angka total tiket untuk Donut Chart
            ],
            'chartPendapatan' => $chartPendapatan,
            'topEvents' => $topEvents,
            'categories' => $categories,
            'transactions' => $transactions,
            'filters' => $request->only(['search', 'status', 'chart_filter', 'category_filter', 'sort_order'])
        ]);
    }
}
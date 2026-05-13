<?php

namespace App\Http\Controllers\Web\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Models\WithdrawalMethod;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http; // Tambahkan ini untuk tembak API Xendit
use Illuminate\Support\Facades\Log;

class WithdrawalController extends Controller
{
   public function index(Request $request)
    {
        // =======================================================
        // HELPER FUNGSI RENTANG WAKTU (DATE RANGE)
        // =======================================================
        $getDateRange = function($filter) {
            $now = Carbon::now();
            switch ($filter) {
                case 'bulan_ini': return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
                case '3_bulan': return [$now->copy()->subMonths(2)->startOfMonth(), $now->copy()->endOfMonth()];
                case '6_bulan': return [$now->copy()->subMonths(5)->startOfMonth(), $now->copy()->endOfMonth()];
                case 'tahun_ini': return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];
                case 'tahun_kemarin': return [$now->copy()->subYear()->startOfYear(), $now->copy()->subYear()->endOfYear()];
                case '5_tahun': return [$now->copy()->subYears(4)->startOfYear(), $now->copy()->endOfYear()];
                case 'semua': return [null, null];
                case 'minggu_ini':
                default: return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            }
        };

        // HELPER KHUSUS PEMBUAT DATA GRAFIK
        $generateChartData = function($filter) {
            $categories = []; $counts = []; $sums = [];

            if ($filter === 'bulan_ini') {
                $daysInMonth = Carbon::now()->daysInMonth;
                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $date = Carbon::now()->startOfMonth()->addDays($i - 1);
                    $categories[] = $i;
                    $q = Withdrawal::whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()]);
                    $counts[] = $q->count(); $sums[] = $q->sum('amount');
                }
            } elseif (in_array($filter, ['tahun_ini', 'tahun_kemarin'])) {
                $year = $filter === 'tahun_ini' ? Carbon::now()->year : Carbon::now()->subYear()->year;
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                foreach ($months as $index => $monthName) {
                    $date = Carbon::createFromDate($year, $index + 1, 1);
                    $categories[] = $monthName;
                    $q = Withdrawal::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()]);
                    $counts[] = $q->count(); $sums[] = $q->sum('amount');
                }
            } elseif (in_array($filter, ['3_bulan', '6_bulan'])) {
                $monthsToSub = $filter === '3_bulan' ? 2 : 5;
                $startMonth = Carbon::now()->subMonths($monthsToSub)->startOfMonth();
                for ($i = 0; $i <= $monthsToSub; $i++) {
                    $date = $startMonth->copy()->addMonths($i);
                    $categories[] = $date->translatedFormat('M y');
                    $q = Withdrawal::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()]);
                    $counts[] = $q->count(); $sums[] = $q->sum('amount');
                }
            } elseif ($filter === '5_tahun') {
                $startYear = Carbon::now()->subYears(4)->startOfYear();
                for ($i = 0; $i < 5; $i++) {
                    $date = $startYear->copy()->addYears($i);
                    $categories[] = $date->format('Y');
                    $q = Withdrawal::whereBetween('created_at', [$date->copy()->startOfYear(), $date->copy()->endOfYear()]);
                    $counts[] = $q->count(); $sums[] = $q->sum('amount');
                }
            } else {
                $startOfWeek = Carbon::now()->startOfWeek();
                $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
                for ($i = 0; $i < 7; $i++) {
                    $date = $startOfWeek->copy()->addDays($i);
                    $categories[] = $days[$i];
                    $q = Withdrawal::whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()]);
                    $counts[] = $q->count(); $sums[] = $q->sum('amount');
                }
            }
            return ['categories' => $categories, 'counts' => $counts, 'sums' => $sums];
        };

        // ... [BAGIAN 1: Xendit biarkan seperti sebelumnya] ...
        $totalSaldoOrganizer = Wallet::whereNotIn('organizer_id',['SYSTEM_SUPERADMIN'])->sum('available_balance');
        // B. Ambil Live Balance dari API Xendit (DENGAN CACHE 5 MENIT)
        $xenditBalance = Cache::remember('xendit_live_balance', 60 * 5, function () {
            try {
                $response = Http::timeout(10) // Set maksimal nunggu 10 detik
                                ->withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                                ->get('https://api.xendit.co/balance', [
                                    'account_type' => 'CASH'
                                ]);
                
                if ($response->successful()) {
                    return $response->json('balance') ?? 0;
                }
                
                // Kalau gagal tapi bukan exception (misal error 401/429)
                Log::warning('Xendit API Failed: ' . $response->body());
                return 0;

            } catch (\Exception $e) {
                // Catat error aslinya ke storage/logs/laravel.log agar bisa diinvestigasi
                Log::error('Xendit API Exception: ' . $e->getMessage());
                return 0; 
            }
        });

        $stats = [
            'total_freq' => Withdrawal::count(),
            'total_fee' => $xenditBalance - $totalSaldoOrganizer,
            'avg_amount' => Withdrawal::where('status', 'SUCCESS')->avg('amount') ?? 0,
        ];

        // ... [BAGIAN 2: Donut Chart] ...
        $filterDonut = $request->input('filter_donut', 'minggu_ini');
        [$startDonut, $endDonut] = $getDateRange($filterDonut);
        $donutQuery = Withdrawal::query();
        if ($startDonut && $endDonut) {
            $donutQuery->whereBetween('created_at', [$startDonut->startOfDay(), $endDonut->endOfDay()]);
        }
        $statusCounts = [
            'selesai' => (clone $donutQuery)->where('status', 'SUCCESS')->count(),
            'diproses' => (clone $donutQuery)->where('status', 'PENDING')->count(),
            'ditolak' => (clone $donutQuery)->where('status', 'FAILED')->count(),
        ];

        // =======================================================
        // 3. Data Grafik (TREN & VOLUME SEKARANG TERPISAH)
        // =======================================================
        $trenResult = $generateChartData($request->input('filter_tren', 'minggu_ini'));
        $volumeResult = $generateChartData($request->input('filter_volume', 'minggu_ini'));

        // ... [BAGIAN 4: Statistik Metode] ...
        $methodStats = [
            'bank' => WithdrawalMethod::where('type', 'bank')->count(),
            'ewallet' => WithdrawalMethod::whereIn('type', ['ewallet', 'e-wallet', 'digital'])->count(),
            'va' => WithdrawalMethod::whereIn('type', ['va', 'virtual_account'])->count(),
        ];

        // ... [BAGIAN 5: Data Tabel] ...
        $wdQuery = Withdrawal::query();
        $filterTable = $request->input('filter_table', 'minggu_ini');
        [$startTable, $endTable] = $getDateRange($filterTable);
        if ($startTable && $endTable) {
            $wdQuery->whereBetween('created_at', [$startTable->startOfDay(), $endTable->endOfDay()]);
        }
        
        if ($request->filled('status') && $request->status !== 'Semua') {
            $statusMap = ['Selesai' => 'SUCCESS', 'Diproses' => 'PENDING', 'Ditolak' => 'FAILED'];
            $wdQuery->where('status', $statusMap[$request->status] ?? $request->status);
        }
        if ($request->filled('search')) {
            $search = preg_quote($request->search, '/');
            $wdQuery->where(function($q) use ($search) {
                $q->where('_id', 'regex', "/.*{$search}.*/i")
                  ->orWhere('organizer_id', 'regex', "/.*{$search}.*/i")
                  ->orWhere('bank_info', 'regex', "/.*{$search}.*/i");
            });
        }

        $withdrawals = $wdQuery->latest()->paginate(10)->through(function ($item) {
            $bankInfo = is_string($item->bank_info) ? json_decode($item->bank_info, true) : $item->bank_info;
            return [
                'id' => $item->_id,
                'organizer_id' => $item->organizer_id,
                'date' => Carbon::parse($item->created_at)->timezone('Asia/Jakarta')->format('d/m/Y'),
                'time' => Carbon::parse($item->created_at)->timezone('Asia/Jakarta')->format('H:i'),
                'bank_code' => $bankInfo['bank_code'] ?? '-',
                'account_number' => $bankInfo['account_number'] ?? '-',
                'account_name' => $bankInfo['account_name'] ?? '-',
                'amount' => $item->amount ?? 0,
                'status' => strtoupper($item->status),
            ];
        })->withQueryString();

        return Inertia::render('Superadmin/Withdrawals', [
            'stats' => $stats,
            'statusCounts' => $statusCounts,
            'charts' => [
                // PERUBAHAN DISINI: Memecah data chart
                'tren' => [
                    'categories' => $trenResult['categories'],
                    'data' => $trenResult['counts']
                ],
                'volume' => [
                    'categories' => $volumeResult['categories'],
                    'data' => $volumeResult['sums']
                ],
            ],
            'methodStats' => $methodStats,
            'withdrawals' => $withdrawals,
            // 4 Filter dimasukkan ke Inertia
            'filters' => (object) $request->only(['search', 'status', 'filter_donut', 'filter_tren', 'filter_volume', 'filter_table'])
        ]);
    }
}
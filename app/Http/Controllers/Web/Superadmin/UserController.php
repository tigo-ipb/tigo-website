<?php

namespace App\Http\Controllers\Web\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use Carbon\Carbon;

class UserController extends Controller
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

        // HELPER KHUSUS GRAFIK PERTUMBUHAN PENGGUNA
        $generateGrowthData = function($filter) {
            $categories = []; $counts = [];

            if ($filter === 'bulan_ini') {
                $daysInMonth = Carbon::now()->daysInMonth;
                for ($i = 1; $i <= $daysInMonth; $i++) {
                    $date = Carbon::now()->startOfMonth()->addDays($i - 1);
                    $categories[] = $i;
                    $counts[] = User::whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])->count();
                }
            } elseif (in_array($filter, ['tahun_ini', 'tahun_kemarin'])) {
                $year = $filter === 'tahun_ini' ? Carbon::now()->year : Carbon::now()->subYear()->year;
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                foreach ($months as $index => $monthName) {
                    $date = Carbon::createFromDate($year, $index + 1, 1);
                    $categories[] = $monthName;
                    $counts[] = User::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count();
                }
            } elseif (in_array($filter, ['3_bulan', '6_bulan'])) {
                $monthsToSub = $filter === '3_bulan' ? 2 : 5;
                $startMonth = Carbon::now()->subMonths($monthsToSub)->startOfMonth();
                for ($i = 0; $i <= $monthsToSub; $i++) {
                    $date = $startMonth->copy()->addMonths($i);
                    $categories[] = $date->translatedFormat('M y');
                    $counts[] = User::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count();
                }
            } elseif ($filter === '5_tahun') {
                $startYear = Carbon::now()->subYears(4)->startOfYear();
                for ($i = 0; $i < 5; $i++) {
                    $date = $startYear->copy()->addYears($i);
                    $categories[] = $date->format('Y');
                    $counts[] = User::whereBetween('created_at', [$date->copy()->startOfYear(), $date->copy()->endOfYear()])->count();
                }
            } else {
                $startOfWeek = Carbon::now()->startOfWeek();
                $days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
                for ($i = 0; $i < 7; $i++) {
                    $date = $startOfWeek->copy()->addDays($i);
                    $categories[] = $days[$i];
                    $counts[] = User::whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()])->count();
                }
            }
            return ['categories' => $categories, 'counts' => $counts];
        };

        // =======================================================
        // 1. Data Statistik Atas (All Time / Sepanjang Masa)
        // =======================================================
        $totalPemesanAll = User::where('role', 'user')->orWhereNull('role')->count();
        $totalPenyelenggaraAll = User::where('role', 'organizer')->count();
        
        $topStats = [
            'total' => $totalPemesanAll + $totalPenyelenggaraAll,
            'pemesan' => $totalPemesanAll,
            'penyelenggara' => $totalPenyelenggaraAll,
        ];

        // =======================================================
        // 2. Data Donut Chart (Berdasarkan Filter Waktu)
        // =======================================================
        $filterRole = $request->input('filter_role', 'minggu_ini');
        [$startRole, $endRole] = $getDateRange($filterRole);
        
        $roleQuery = User::query();
        if ($startRole && $endRole) {
            $roleQuery->whereBetween('created_at', [$startRole->startOfDay(), $endRole->endOfDay()]);
        }

        $pemesanDonut = (clone $roleQuery)->where(function($q) { $q->where('role', 'user')->orWhereNull('role'); })->count();
        $penyelenggaraDonut = (clone $roleQuery)->where('role', 'organizer')->count();

        $donutStats = [
            'total' => $pemesanDonut + $penyelenggaraDonut,
            'pemesan' => $pemesanDonut,
            'penyelenggara' => $penyelenggaraDonut,
        ];

        // =======================================================
        // 3. Data Area Chart (Pertumbuhan Pengguna)
        // =======================================================
        $filterGrowth = $request->input('filter_growth', 'minggu_ini');
        $growthResult = $generateGrowthData($filterGrowth);

        // =======================================================
        // 4. Query Tabel Pengguna
        // =======================================================
        $userQuery = User::query();

        // Tambahan filter waktu untuk tabel jika dibutuhkan
        $filterTable = $request->input('filter_table', 'semua');
        [$startTable, $endTable] = $getDateRange($filterTable);
        if ($startTable && $endTable) {
            $userQuery->whereBetween('created_at', [$startTable->startOfDay(), $endTable->endOfDay()]);
        }

        if ($request->filled('search')) {
            $search = preg_quote($request->search, '/');
            $userQuery->where(function($q) use ($search) {
                $q->where('name', 'regex', "/.*{$search}.*/i")
                  ->orWhere('email', 'regex', "/.*{$search}.*/i")
                  ->orWhere('username', 'regex', "/.*{$search}.*/i");
            });
        }

        $users = $userQuery->latest()->paginate(10)->withQueryString();

        return Inertia::render('Superadmin/Users', [
            'topStats' => $topStats,
            'donutStats' => $donutStats,
            'chartData' => [
                'categories' => $growthResult['categories'],
                'growth' => $growthResult['counts']
            ],
            'users' => $users,
            'filters' => (object) $request->only(['search', 'filter_role', 'filter_growth', 'filter_table'])
        ]);
    }
}
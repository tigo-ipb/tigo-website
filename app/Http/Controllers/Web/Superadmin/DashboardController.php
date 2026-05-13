<?php

namespace App\Http\Controllers\Web\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Event;
use App\Models\Withdrawal;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // =======================================================
        // HELPER 1: RENTANG WAKTU STANDAR (UNTUK TABEL BAWAH)
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

        // =======================================================
        // HELPER 2: KHUSUS GRAFIK DASHBOARD (TAHUNAN & DUAL DATA)
        // =======================================================
        $generateDashboardChart = function($filter) {
            $categories = []; $pengguna = []; $event = [];
            $now = Carbon::now();

            if (in_array($filter, ['tahun_ini', 'tahun_kemarin'])) {
                // Sumbu X: Jan - Des
                $year = $filter === 'tahun_ini' ? $now->year : $now->copy()->subYear()->year;
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                foreach ($months as $index => $monthName) {
                    $date = Carbon::createFromDate($year, $index + 1, 1);
                    $categories[] = $monthName;
                    $pengguna[] = User::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count();
                    $event[] = Event::whereBetween('created_at', [$date->copy()->startOfMonth(), $date->copy()->endOfMonth()])->count();
                }
            } else {
                // Sumbu X: Tahun (misal 2024, 2025, 2026)
                $yearsToSub = 2; // Default 3_tahun (sekarang + 2 mundur)
                if ($filter === '5_tahun') $yearsToSub = 4;
                if ($filter === '10_tahun') $yearsToSub = 9;

                $startYear = $now->copy()->subYears($yearsToSub)->startOfYear();
                for ($i = 0; $i <= $yearsToSub; $i++) {
                    $date = $startYear->copy()->addYears($i);
                    $categories[] = $date->format('Y');
                    $pengguna[] = User::whereBetween('created_at', [$date->copy()->startOfYear(), $date->copy()->endOfYear()])->count();
                    $event[] = Event::whereBetween('created_at', [$date->copy()->startOfYear(), $date->copy()->endOfYear()])->count();
                }
            }
            return ['categories' => $categories, 'pengguna' => $pengguna, 'event' => $event];
        };

        // 1. Ambil Data Card Statistik (All Time)
        $stats = [
            'users' => User::count(),
            'events' => Event::count(),
            'withdrawals' => Withdrawal::count(), 
        ];

        // 2. Data Chart Pertumbuhan Pengguna & Event (Dinamis dari Helper 2)
        $chartYearFilter = $request->input('chart_year', 'tahun_ini');
        $chartData = $generateDashboardChart($chartYearFilter);

        // 3. Query Tabel Riwayat Penarikan
        $withdrawalQuery = Withdrawal::query();

        // --- Terapkan Filter Waktu Tabel Penarikan ---
        $wPeriod = $request->input('w_period', 'minggu_ini');
        [$wStart, $wEnd] = $getDateRange($wPeriod);
        if ($wStart && $wEnd) {
            $withdrawalQuery->whereBetween('created_at', [$wStart->startOfDay(), $wEnd->endOfDay()]);
        }

        // Filter Tab Status Penarikan
        if ($request->filled('w_status') && $request->w_status !== 'Semua') {
            $statusMap = [
                'Selesai' => 'SUCCESS',
                'Diproses' => 'PENDING',
                'Ditolak' => 'FAILED'
            ];
             if (isset($statusMap[$request->w_status])) {
                $withdrawalQuery->where('status', $statusMap[$request->w_status]);
            }
        }

        if ($request->filled('w_search')) {
            $search = preg_quote($request->w_search, '/');
            $withdrawalQuery->where(function($q) use ($search) {
                $q->where('_id', 'regex', "/.*{$search}.*/i")
                  ->orWhere('bank_info', 'regex', "/.*{$search}.*/i") // Tembus JSON String bank_info
                  ->orWhere('organizer_id', 'regex', "/.*{$search}.*/i");
            });
        }

        // Pagination independen w_page & Formatting JSON Bank Info
        $withdrawals = $withdrawalQuery->latest()->paginate(5, ['*'], 'w_page')->through(function ($item) {
            $bankInfo = is_string($item->bank_info) ? json_decode($item->bank_info, true) : $item->bank_info;
            return [
                'id' => $item->_id,
                'organizer_id' => $item->organizer_id,
                'date' => Carbon::parse($item->created_at)->timezone('Asia/Jakarta')->format('d/m/Y'),
                'time' => Carbon::parse($item->created_at)->timezone('Asia/Jakarta')->format('H:i'),
                'bank_info' => $bankInfo, // Berupa object array agar bisa dipanggil bank_info?.bank_code di React
                'amount' => $item->amount ?? 0,
                'status' => strtoupper($item->status),
            ];
        })->withQueryString();

        // 4. Query Tabel Pengguna
        $userQuery = User::query();

        if ($request->filled('u_search')) {
            $search = preg_quote($request->u_search, '/');
            $userQuery->where(function($q) use ($search) {
                $q->where('name', 'regex', "/.*{$search}.*/i")
                  ->orWhere('email', 'regex', "/.*{$search}.*/i")
                  ->orWhere('username', 'regex', "/.*{$search}.*/i");
            });
        }

        // Pagination independen u_page & Formatting
        $users = $userQuery->latest()->paginate(5, ['*'], 'u_page')->through(function ($user) {
            return [
                'id' => $user->_id,
                'username' => $user->username,
                'email' => $user->email,
                'name' => $user->name,
                'phone_code' => $user->phone_code ?? '+62',
                'phone_number' => $user->phone_number,
                'birth_date' => $user->birth_date ? Carbon::parse($user->birth_date)->format('d-m-Y') : '-',
                'role' => $user->role,
            ];
        })->withQueryString();

        return Inertia::render('Superadmin/Dashboard', [
            'stats' => $stats,
            'chartData' => $chartData,
            'withdrawals' => $withdrawals,
            'users' => $users,
            'filters' => (object) $request->only(['w_status', 'w_search', 'w_period', 'u_search', 'chart_year'])
        ]);
    }

    // ================= FUNGSI AKSI PENGGUNA =================
    public function updateUser(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,'.$id.',_id', // Abaikan email milik sendiri (MongoDB style)
            'phone_number' => 'nullable|string|max:20',
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
        ]);

        return back()->with('success', 'Data pengguna berhasil diperbarui.');
    }

    public function destroyUser($id)
    {
        // Fitur Soft Deletes sangat disarankan di sini agar relasi data tidak hancur
        User::findOrFail($id)->delete();
        return back()->with('success', 'Pengguna berhasil dihapus.');
    }

    // ================= FUNGSI AKSI PENARIKAN =================
    public function updateWithdrawal(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:PENDING,SUCCESS,FAILED',
        ]);

        $withdrawal = Withdrawal::findOrFail($id);
        $withdrawal->update([
            'status' => $request->status
        ]);

        // Opsional: Kalau status berubah jadi SUCCESS, tambahkan logika potong saldo EO di sini

        return back()->with('success', 'Status penarikan berhasil diupdate.');
    }

    public function destroyWithdrawal($id)
    {
        Withdrawal::findOrFail($id)->delete();
        return back()->with('success', 'Data penarikan berhasil dihapus.');
    }
}
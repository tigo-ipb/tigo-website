<?php
namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wallet;
use App\Models\Withdrawal;
use App\Models\WithdrawalMethod; // Model baru kita
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Http; 

class WalletController extends Controller
{
    // ==========================================
    // 1. HALAMAN WALLET DASHBOARD (INDEX)
    // ==========================================
    public function index(Request $request)
    {
        $organizerId = auth()->id();
        $wallet = Wallet::where('organizer_id', $organizerId)->first();

        // --- A. Hitung Metrik Saldo ---
        $saldoAktif = $wallet ? $wallet->available_balance : 0;

        // Saldo Pending (Total penarikan yang statusnya masih PENDING di Xendit)
        $saldoPending = Withdrawal::where('organizer_id', $organizerId)
            ->whereIn('status', ['PENDING', 'PROCESSING'])
            ->sum('amount');

        // Total Penarikan Berhasil (Total pencairan yang sudah SUCCESS)
        $totalPenarikan = Withdrawal::where('organizer_id', $organizerId)
            ->where('status', 'SUCCESS') 
            ->sum('amount');

        // --- B. Data Metode Penarikan (Ditampilkan di layar utama) ---
        $methods = WithdrawalMethod::where('organizer_id', $organizerId)->get();
        $groupedMethods = [
            'bank' => $methods->where('type', 'bank')->values(),
            'e-wallet' => $methods->where('type', 'e-wallet')->values(),
            'virtual_account' => $methods->where('type', 'virtual_account')->values(),
        ];

        // --- C. Data Riwayat Penarikan (Dengan Filter, Search, dan Pagination) ---
        $query = Withdrawal::where('organizer_id', $organizerId);

        // Filter berdasarkan Status (Tab: Semua, Berhasil, Diproses, Gagal)
        if ($request->filled('status') && $request->status !== 'Semua') {
            $statusMap = [
                'Berhasil' => 'SUCCESS',
                'Diproses' => 'PENDING',
                'Gagal' => 'FAILED'
            ];
            if (isset($statusMap[$request->status])) {
                $query->where('status', $statusMap[$request->status]);
            }
        }

        // =========================================================
        // PENCARIAN TEXT KHUSUS MONGODB (Ini yang Diperbarui)
        // =========================================================
        if ($request->filled('search')) {
            $search = $request->search;
            
            // Langkah 1: Cari ID rekening yang nama/bank-nya cocok dengan ketikan user
            $matchingMethodIds = WithdrawalMethod::where('organizer_id', $organizerId)
                ->where(function($q) use ($search) {
                    // Gunakan 'regex' dengan flag 'i' agar tidak case-sensitive (BCA = bca)
                    $q->where('account_name', 'regex', "/.*{$search}.*/i")
                      ->orWhere('account_number', 'regex', "/.*{$search}.*/i")
                      ->orWhere('bank_code', 'regex', "/.*{$search}.*/i");
                })
                ->pluck('_id');

            // Langkah 2: Terapkan ke query utama Withdrawal
            $query->where(function($q) use ($search, $matchingMethodIds) {
                // Cocokkan transaksi yang menggunakan ID rekening di atas
                $q->whereIn('withdrawal_method_id', $matchingMethodIds);

                // Cocokkan _id (Hanya bisa jika user mengetikkan 24 karakter ID penuh)
                // Jika dipaksa parsial (LIKE), MongoDB akan error karena gagal casting String ke ObjectId
                if (strlen($search) === 24) {
                    $q->orWhere('_id', $search);
                }
            });
        }
        // =========================================================
        
        // Ambil data dengan Pagination (10 per halaman) & pertahankan URL query
        // TAMBAHAN: Jangan lupa pakai with() jika bank_info adalah relasi
        $history = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Organizer/Wallet/Index', [
            'balances' => [
                'active' => $saldoAktif,
                'pending' => $saldoPending,
                'total' => $totalPenarikan,
            ],
            'methods' => $groupedMethods,
            'history' => $history,
            'filters' => $request->only(['search', 'status']) // Kirim balik filter ke UI agar state tidak hilang
        ]);
    }

    // ==========================================
    // 2. HAPUS METODE PENARIKAN (Tong Sampah)
    // ==========================================
    public function destroyMethod($id)
    {
        $method = WithdrawalMethod::where('_id', $id)
            ->where('organizer_id', auth()->id())
            ->firstOrFail();
            
        $method->delete();

        return back()->with('success', 'Metode penarikan berhasil dihapus.');
    }

    // ==========================================
    // 3. HALAMAN FORM TAMBAH METODE
    // ==========================================
    public function createMethod()
    {
        return Inertia::render('Organizer/Wallet/CreateMethod');
    }

    // ==========================================
    // 4. SIMPAN METODE PENARIKAN BARU
    // ==========================================
    public function storeMethod(Request $request)
    {
        $request->validate([
            'type' => 'required|in:bank,e-wallet,virtual_account',
            'bank_code' => 'required|string',
            'account_number' => 'required|string',
            'account_name' => 'required|string',
        ]);

        WithdrawalMethod::create([
            'organizer_id' => auth()->id(),
            'type' => $request->type,
            'bank_code' => $request->bank_code,
            'account_number' => $request->account_number,
            'account_name' => $request->account_name,
        ]);

        return redirect()->route('organizer.wallet.index')
            ->with('success', 'Metode penarikan berhasil ditambahkan!');
    }

    // 4. HALAMAN TARIK SALDO (Sesuai Gambar 4)
    public function withdrawForm()
    {
        $wallet = Wallet::where('organizer_id', auth()->id())->first();
        $methods = WithdrawalMethod::where('organizer_id', auth()->id())->get();

        // Kelompokkan metode untuk UI
        $groupedMethods = [
            'bank' => $methods->where('type', 'bank')->values(),
            'e-wallet' => $methods->where('type', 'e-wallet')->values(),
            'virtual_account' => $methods->where('type', 'virtual_account')->values(),
        ];

        return Inertia::render('Organizer/Wallet/Withdraw', [
            'wallet' => $wallet,
            'methods' => $groupedMethods
        ]);
    }

    // 5. PROSES PENARIKAN (XENDIT DISBURSEMENT)
    public function withdraw(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'amount' => 'required|numeric|min:50000',
            'withdrawal_method_id' => 'required|exists:mongodb.withdrawal_methods,_id', 
        ]);

        $organizerId = auth()->id();
        $wallet = Wallet::where('organizer_id', $organizerId)->first();
        
        // Ambil data rekening yang dipilih dari Database
        $method = WithdrawalMethod::where('_id', $request->withdrawal_method_id)
            ->where('organizer_id', $organizerId)
            ->firstOrFail();

        // =======================================================
        // TAMBAHAN: Tentukan Biaya Admin Berdasarkan Tipe Metode
        // =======================================================
        $adminFee = 0;
        switch (strtolower($method->type)) {
            case 'bank':
                $adminFee = 6500;
                break;
            case 'e-wallet':
                $adminFee = 2500;
                break;
            case 'virtual_account':
                $adminFee = 4500;
                break;
            default:
                $adminFee = 0;
                break;
        }

        // Jumlah bersih yang akan ditransfer ke rekening user
        $netAmount = (int) $request->amount - $adminFee;

        // Pastikan jumlah bersih tidak minus 
        // (walaupun aturan min:50000 sudah mencegah ini, tetap baik untuk keamanan ganda)
        if ($netAmount <= 0) {
            return back()->withErrors(['amount' => 'Jumlah penarikan terlalu kecil setelah dipotong biaya admin.']);
        }

        // 2. Cek ketersediaan saldo
        if (!$wallet || $wallet->available_balance < $request->amount) {
            return back()->withErrors(['amount' => 'Saldo tidak mencukupi untuk penarikan ini.']);
        }

        $originalBalance = $wallet->available_balance;

        // 3. Potong saldo EO (Dipotong penuh sesuai permintaan awal)
        $wallet->decrement('available_balance', (int) $request->amount);

        // 4. Buat Record Withdrawal (PENDING)
        // Kita simpan data fee dan net_amount agar transaksi transparan di database
        $withdrawal = Withdrawal::create([
            'organizer_id' => $organizerId,
            'amount' => (int) $request->amount,         // Total ditarik (Misal: 100.000)
            'admin_fee' => $adminFee,                   // Biaya Admin (Misal: 6.500)
            'net_amount' => $netAmount,                 // Bersih cair (Misal: 93.500)
            'bank_info' => [
                'type' => $method->type,
                'bank_code' => $method->bank_code,
                'account_name' => $method->account_name,
                'account_number' => $method->account_number,
            ],
            'status' => 'PENDING'
        ]);

        // 5. Tembak API Xendit Disbursement
        try {
            $response = Http::withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                ->timeout(30) // Biasakan pakai timeout untuk keamanan API
                ->post('https://api.xendit.co/disbursements', [
                    'external_id' => (string) $withdrawal->_id,
                    'amount' => $netAmount, // <--- PENTING: Kirim NET AMOUNT ke Xendit
                    'bank_code' => $method->bank_code, 
                    'account_holder_name' => $method->account_name, 
                    'account_number' => $method->account_number, 
                    'description' => 'Pencairan Dana Tiket Tigo - EO: ' . auth()->user()->name,
                ]);

            $xenditData = $response->json();

            if ($response->failed()) {
                // Tangkap pesan error detail dari Xendit jika ada
                $errorDetail = isset($xenditData['errors']) ? ' | ' . json_encode($xenditData['errors']) : '';
                throw new \Exception(($xenditData['message'] ?? 'Gagal membuat pencairan di Xendit') . $errorDetail);
            }

            // 6. Jika sukses API
            $withdrawal->update([
                'xendit_external_id' => $xenditData['id'],
                'status' => 'PENDING' 
            ]);

            return redirect()->route('organizer.wallet.index')->with('success', 'Permintaan penarikan berhasil dibuat. Menunggu persetujuan pencairan.');

        } catch (\Exception $e) {
            // ROLLBACK Saldo jika API Xendit gagal/timeout
            $wallet->update(['available_balance' => $originalBalance]);
            $withdrawal->update(['status' => 'FAILED', 'error_message' => $e->getMessage()]);

            return back()->withErrors(['api_error' => 'Gagal terhubung ke gerbang pembayaran: ' . $e->getMessage()]);
        }
    }
}
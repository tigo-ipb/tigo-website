<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Wallet;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Xendit\Configuration;
// Pastikan Anda sudah menginstall SDK Xendit terbaru dan import class yang benar
// Gunakan Http facade dari Laravel jika ingin lebih mudah tanpa pusing versi SDK
use Illuminate\Support\Facades\Http; 

class WalletController extends Controller
{
    public function index()
    {
        $wallet = Wallet::where('organizer_id', auth()->id())->first();
        $history = Withdrawal::where('organizer_id', auth()->id())->latest()->get();

        return Inertia::render('Organizer/Wallet', [
            'wallet' => $wallet,
            'history' => $history
        ]);
    }

    public function withdraw(Request $request)
    {
        // 1. Validasi Input Form
        $request->validate([
            'amount' => 'required|numeric|min:50000',
            'bank_code' => 'required|string', // Kode bank dari Xendit (contoh: BCA, MANDIRI)
            'account_holder_name' => 'required|string',
            'account_number' => 'required|string',
        ]);

        $organizerId = auth()->id();
        $wallet = Wallet::where('organizer_id', $organizerId)->first();

        // 2. Cek ketersediaan saldo
        if (!$wallet || $wallet->available_balance < $request->amount) {
            return back()->withErrors(['amount' => 'Saldo tidak mencukupi untuk penarikan ini.']);
        }

        // Simpan saldo awal untuk berjaga-jaga jika API Xendit gagal (Rollback)
        $originalBalance = $wallet->available_balance;

        // 3. Potong saldo Organizer terlebih dahulu
        $wallet->decrement('available_balance', (int) $request->amount);

        // 4. Buat Record Withdrawal di Database kita (Status: PENDING)
        $withdrawal = Withdrawal::create([
            'organizer_id' => $organizerId,
            'amount' => (int) $request->amount,
            'bank_info' => [
                'bank_code' => $request->bank_code,
                'account_name' => $request->account_holder_name,
                'account_number' => $request->account_number,
            ],
            'status' => 'PENDING'
        ]);

        // 5. Tembak API Xendit Disbursement
        try {
            // Kita gunakan Http Facade bawaan Laravel agar lebih stabil & mudah dibaca
            // Pastikan XENDIT_SECRET_KEY sudah di-set di file .env Anda
            $response = Http::withBasicAuth(env('XENDIT_SECRET_KEY'), '')
                ->post('https://api.xendit.co/disbursements', [
                    'external_id' => (string) $withdrawal->_id, // Gunakan ID dari tabel kita
                    'amount' => (int) $request->amount,
                    'bank_code' => $request->bank_code,
                    'account_holder_name' => $request->account_holder_name,
                    'account_number' => $request->account_number,
                    'description' => 'Pencairan Dana Tiket Tigo - EO: ' . auth()->user()->name,
                ]);

            $xenditData = $response->json();

            // Cek apakah Xendit merespons dengan error (misal bank code salah)
            if ($response->failed()) {
                throw new \Exception($xenditData['message'] ?? 'Gagal membuat pencairan di Xendit');
            }

            // 6. Jika sukses, update record kita dengan ID dari Xendit
            $withdrawal->update([
                'xendit_external_id' => $xenditData['id'],
                'status' => 'PENDING' // Tetap PENDING menunggu Anda "Approve" di dashboard Xendit
            ]);

            return redirect()->back()->with('success', 'Permintaan penarikan berhasil dibuat. Menunggu persetujuan pencairan.');

        } catch (\Exception $e) {
            // ROLLBACK: Jika API Xendit gagal/gangguan, kembalikan uang ke saldo EO dan batalkan penarikan
            $wallet->update(['available_balance' => $originalBalance]);
            $withdrawal->update(['status' => 'FAILED', 'error_message' => $e->getMessage()]);

            return back()->withErrors(['api_error' => 'Gagal terhubung ke gerbang pembayaran: ' . $e->getMessage()]);
        }
    }
}
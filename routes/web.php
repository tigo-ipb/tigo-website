<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// --------------------------------------------------------
// CONTROLLER AUTH KUSTOM (Google & Setup)
// --------------------------------------------------------
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\SetupAccountController;
use App\Http\Middleware\EnsureAccountSetup;

// --------------------------------------------------------
// CONTROLLER ORGANIZER (EO)
// --------------------------------------------------------
use App\Http\Controllers\Web\Organizer\DashboardController as OrgDashboard;
use App\Http\Controllers\Web\Organizer\EventController as OrgEvent;
use App\Http\Controllers\Web\Organizer\BookingController as OrgBooking;
use App\Http\Controllers\Web\Organizer\FinanceController as OrgFinance;
use App\Http\Controllers\Web\Organizer\StaffController as OrgStaff;
use App\Http\Controllers\Web\Organizer\WalletController;

// --------------------------------------------------------
// CONTROLLER SUPERADMIN
// --------------------------------------------------------
use App\Http\Controllers\Web\Superadmin\DashboardController as AdminDashboard;
use App\Http\Controllers\Web\Superadmin\EventController;
use App\Http\Controllers\Web\Superadmin\UserController as AdminUser;
use App\Http\Controllers\Web\Superadmin\FinanceController as AdminFinance;
use App\Http\Controllers\Web\Superadmin\ReportController as AdminReport; 
use App\Http\Controllers\Web\Superadmin\EventController as AdminEvent;
use App\Http\Controllers\Web\Superadmin\WithdrawalController as AdminWithdrawal;

use App\Http\Controllers\ProfileController;
/*
|--------------------------------------------------------------------------
| PUBLIC & AUTH WEB (React)
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (Auth::check()) {
        $role = Auth::user()->role;
        if ($role === 'superadmin') return redirect()->route('superadmin.dashboard');
        if ($role === 'organizer') return redirect()->route('organizer.dashboard');
    }
    
    return redirect()->route('login'); 
});


/*
|--------------------------------------------------------------------------
| PANEL ORGANIZER (EO)
|--------------------------------------------------------------------------
*/
// 🔥 PERHATIKAN: Saya menambahkan EnsureAccountSetup::class di sini
Route::middleware(['auth', EnsureAccountSetup::class, 'role:organizer'])->prefix('organizer')->name('organizer.')->group(function () {
    
    // 1. Dashboard
    Route::get('/dashboard', [OrgDashboard::class, 'index'])->name('dashboard');
    
    // 2. Events (CRUD Event & Cloudinary)
    Route::resource('events', OrgEvent::class);
    // Tambahkan di dalam middleware organizer
    Route::get('/organizer/events/{event}/monitoring', [OrgEvent::class, 'monitoring'])->name('events.monitoring');
    Route::patch('/organizer/events/{id}/status', [OrgEvent::class, 'updateStatus'])->name('events.update-status');
    // Tambahkan di bawah route monitoring yang sudah ada
    Route::post('/organizer/events/{event}/monitoring/{log}/action', [OrgEvent::class, 'scanAction'])->name('organizer.events.monitoring.action');

    
    // 3. Bookings (Data Transaksi & Pesanan Tiket)
    Route::get('/bookings', [OrgBooking::class, 'index'])->name('bookings');
    
    // 4. Finance (Saldo & Request Withdrawal)
    Route::get('/finance', [OrgFinance::class, 'index'])->name('finance');

    Route::prefix('wallet')->name('wallet.')->group(function () {
        // 1. Dashboard Wallet (Menampilkan Saldo, Daftar Rekening, dan Riwayat)
        Route::get('/', [WalletController::class, 'index'])->name('index');

        // 2. Tarik Saldo
        Route::get('/withdraw', [WalletController::class, 'withdrawForm'])->name('withdrawForm');
        Route::post('/withdraw', [WalletController::class, 'withdraw'])->name('withdraw');

        // 3. Manajemen Metode Penarikan (Rekening / E-Wallet / VA)
        Route::get('/methods/create', [WalletController::class, 'createMethod'])->name('createMethod');
        Route::post('/methods', [WalletController::class, 'storeMethod'])->name('storeMethod');
        Route::delete('/methods/{id}', [WalletController::class, 'destroyMethod'])->name('destroyMethod');
    });

    Route::get('/export', [App\Http\Controllers\Web\Organizer\ExportController::class, 'index'])->name('export');
    Route::get('/export/download', [App\Http\Controllers\Web\Organizer\ExportController::class, 'download'])->name('export.download');
});


/*
|--------------------------------------------------------------------------
| PANEL SUPERADMIN
|--------------------------------------------------------------------------
*/
// 🔥 PERHATIKAN: Saya menambahkan EnsureAccountSetup::class di sini juga
Route::middleware(['auth', EnsureAccountSetup::class, 'role:superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    
    // 1. Dashboard
    Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
    
    // Route Aksi Pengguna
    Route::put('/users/{id}', [AdminDashboard::class, 'updateUser'])->name('users.update');
    Route::delete('/users/{id}', [AdminDashboard::class, 'destroyUser'])->name('users.destroy');

    // Route Aksi Penarikan
    Route::patch('/withdrawals/{id}', [AdminDashboard::class, 'updateWithdrawal'])->name('withdrawals.update');
    Route::delete('/withdrawals/{id}', [AdminDashboard::class, 'destroyWithdrawal'])->name('withdrawals.destroy');
    
    // 2. User Management (Pantau Customer & Verifikasi EO)
    Route::get('users', [AdminUser::class, 'index'])->name('users');
    
    Route::get('/events', [AdminEvent::class, 'index'])->name('events');
    Route::get('/events/{id}', [AdminEvent::class, 'edit'])->name('events.edit');
    Route::put('/events/{id}', [AdminEvent::class, 'update'])->name('events.update');
    Route::delete('/events/{id}', [AdminEvent::class, 'destroy'])->name('events.destroy');

    Route::get('/withdrawals', [AdminWithdrawal::class, 'index'])->name('withdrawals');

    // 3. Finance (Approval Pencairan Dana EO ke Xendit)
    // Route::get('/finance', [AdminFinance::class, 'index'])->name('finance');
    
    // 4. Report (Laporan Pendapatan Platform, Export CSV/Excel, dll)
    // Route::get('/reports', [AdminReport::class, 'index'])->name('reports.index');
    // Route::get('/reports/export', [AdminReport::class, 'export'])->name('reports.export');
    
});

Route::middleware(['auth', 'verified'])->group(function () {
    
    // Grup Rute Profile
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'index'])->name('index');
        
        // Rute-rute ini untuk halaman selanjutnya, kita siapkan dulu jalurnya
        Route::get('/edit', [ProfileController::class, 'edit'])->name('edit');
        Route::patch('/edit', [ProfileController::class, 'updateProfile'])->name('update');

        Route::get('/account', [ProfileController::class, 'account'])->name('account');
        Route::patch('/account', [ProfileController::class, 'updateAccount'])->name('account.update');

        Route::get('/password', [ProfileController::class, 'password'])->name('password');
        Route::patch('/password', [ProfileController::class, 'updatePassword'])->name('password.update');

        Route::get('/language', [ProfileController::class, 'language'])->name('language');
    });

});

require __DIR__.'/auth.php';
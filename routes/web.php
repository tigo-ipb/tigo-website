<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
// --------------------------------------------------------
// CONTROLLER ORGANIZER (EO)
// --------------------------------------------------------
use App\Http\Controllers\Web\Organizer\DashboardController as OrgDashboard;
use App\Http\Controllers\Web\Organizer\EventController as OrgEvent;
use App\Http\Controllers\Web\Organizer\BookingController as OrgBooking;
use App\Http\Controllers\Web\Organizer\FinanceController as OrgFinance;
use App\Http\Controllers\Web\Organizer\StaffController as OrgStaff;

// --------------------------------------------------------
// CONTROLLER SUPERADMIN
// --------------------------------------------------------
use App\Http\Controllers\Web\Superadmin\DashboardController as AdminDashboard;
use App\Http\Controllers\Web\Superadmin\UserController as AdminUser;
use App\Http\Controllers\Web\Superadmin\FinanceController as AdminFinance;
use App\Http\Controllers\Web\Superadmin\ReportController as AdminReport; // <-- Modul Baru

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
Route::middleware(['auth', 'role:organizer'])->prefix('organizer')->name('organizer.')->group(function () {
    
    // 1. Dashboard
    Route::get('/dashboard', [OrgDashboard::class, 'index'])->name('dashboard');
    
    // 2. Events (CRUD Event & Cloudinary)
    Route::resource('events', OrgEvent::class);
    
    // 3. Bookings (Data Transaksi & Pesanan Tiket)
    Route::get('/bookings', [OrgBooking::class, 'index'])->name('bookings');
    
    // 4. Finance (Saldo & Request Withdrawal)
    Route::get('/finance', [OrgFinance::class, 'index'])->name('finance');
    Route::post('/finance/withdraw', [OrgFinance::class, 'withdraw'])->name('finance.withdraw');
    
    // 5. Staff (Manajemen Akun Penjaga Pintu/Scanner)
    Route::resource('staff', OrgStaff::class);
});


/*
|--------------------------------------------------------------------------
| PANEL SUPERADMIN
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'role:superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    
    // 1. Dashboard
    Route::get('/dashboard', [AdminDashboard::class, 'index'])->name('dashboard');
    
    // 2. User Management (Pantau Customer & Verifikasi EO)
    Route::resource('users', AdminUser::class);
    
    // 3. Finance (Approval Pencairan Dana EO ke Xendit)
    Route::get('/finance', [AdminFinance::class, 'index'])->name('finance');
    
    // 4. Report (Laporan Pendapatan Platform, Export CSV/Excel, dll)
    Route::get('/reports', [AdminReport::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [AdminReport::class, 'export'])->name('reports.export');
    
});

require __DIR__.'/auth.php';
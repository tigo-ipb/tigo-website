<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\ApiAuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\ExploreController;
use App\Http\Controllers\Api\EventController; // 🔥 TAMBAHKAN IMPORT INI
use App\Http\Controllers\Api\Customer\CheckoutController;
use App\Http\Controllers\Api\Customer\MyTicketController;
use App\Http\Controllers\Api\Customer\ProfileController;
use App\Http\Controllers\Api\Staff\MobileDashboardController;
use App\Http\Controllers\Api\Staff\ScannerController;
use App\Http\Controllers\Api\Webhook\XenditController;

// Webhook Xendit (Tanpa Auth, tapi diproteksi Header Token)
Route::prefix('webhook/xendit')->group(function () {
    Route::post('/invoice', [XenditController::class, 'invoiceCallback']);
    Route::post('/disbursement', [XenditController::class, 'disbursementCallback']);
});

// Public API
Route::post('/auth/register', [ApiAuthController::class, 'register']);
Route::post('/auth/verify-email', [ApiAuthController::class, 'verifyEmail']); // Untuk kirim OTP Register
Route::post('/auth/login', [ApiAuthController::class, 'login']);
Route::post('/auth/google', [ApiAuthController::class, 'googleLogin']);       // Untuk Login via Google
Route::post('/auth/forgot-password', [ApiAuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [ApiAuthController::class, 'resetPassword']);
Route::post('/auth/resend-otp', [ApiAuthController::class, 'resendOtp']);

Route::get('/home', [HomeController::class, 'index']); // Tab Home
Route::get('/explore', [ExploreController::class, 'index']); // Tab Explore
Route::get('/events/{id}', [EventController::class, 'show']); // 🔥 TAMBAHKAN INI (Halaman Detail Event)

// Private API (Wajib Token)
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/setup-profile', [ApiAuthController::class, 'setupProfile']);
    
    // Role Customer (Pembeli)
    Route::middleware('role:customer')->group(function () {
        Route::post('/checkout', [CheckoutController::class, 'store']);

        Route::get('/my-tickets', [MyTicketController::class, 'index']);
        Route::get('/my-tickets/{payment_id}', [MyTicketController::class, 'show']);

       // Menampilkan data profil
    Route::get('/profile', [ProfileController::class, 'show']);
    
    // 1. Update Profile (Username, Bio, Foto) -> WAJIB POST karena untuk upload file (form-data)
    Route::post('/profile/update-profile', [ProfileController::class, 'updateProfile']); 
    
    // 2. Update Account (Nama, Email, HP, Ultah) -> Pakai PUT karena hanya kirim teks (raw JSON)
    Route::put('/profile/update-account', [ProfileController::class, 'updateAccount']); 
    
    // 3. Update Password
    Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    });

    // Role Staff/Organizer (Scanner)
    Route::middleware(['auth:sanctum', 'role:organizer'])->group(function () {
        // Scan Tiket
        Route::post('/organizer/scan', [ScannerController::class, 'scan']);
        
        // Lihat Dashboard Real-time Lapangan
        Route::get('/organizer/dashboard', [MobileDashboardController::class, 'stats']);
        Route::get('/organizer/events/active', [MobileDashboardController::class, 'getActiveEvents']);
    });
});
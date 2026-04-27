<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\ApiAuthController;
use App\Http\Controllers\Api\HomeController;
use App\Http\Controllers\Api\ExploreController;
use App\Http\Controllers\Api\Customer\CheckoutController;
use App\Http\Controllers\Api\Customer\MyTicketController;
use App\Http\Controllers\Api\Customer\ProfileController;
use App\Http\Controllers\Api\Staff\MobileDashboardController;
use App\Http\Controllers\Api\Staff\ScannerController;
use App\Http\Controllers\Api\Webhook\XenditController;

// Webhook Xendit (Tanpa Auth)
// Webhook Xendit (Tanpa Auth, tapi diproteksi Header Token)
Route::prefix('webhook/xendit')->group(function () {
    Route::post('/invoice', [XenditController::class, 'invoiceCallback']);
    Route::post('/disbursement', [XenditController::class, 'disbursementCallback']);
});

// Public API
Route::post('/auth/register', [ApiAuthController::class, 'register']);
Route::post('/auth/login', [ApiAuthController::class, 'login']);
Route::post('/auth/forgot-password', [ApiAuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [ApiAuthController::class, 'resetPassword']);


Route::get('/home', [HomeController::class, 'index']); // Tab Home
Route::get('/explore', [ExploreController::class, 'index']); // Tab Explore

// Private API (Wajib Token)
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/auth/setup-profile', [ApiAuthController::class, 'setupProfile']);
    
    // Role Customer (Pembeli)
    Route::middleware('role:customer')->group(function () {
        Route::post('/checkout', [CheckoutController::class, 'store']);

        Route::get('/my-tickets', [MyTicketController::class, 'index']);
        Route::get('/my-tickets/{payment_id}', [MyTicketController::class, 'show']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::post('/profile/update', [ProfileController::class, 'update']); // Gunakan POST untuk form-data / upload file
        Route::put('/profile/password', [ProfileController::class, 'updatePassword']);
    });

    // Role Staff/Organizer (Scanner)
    Route::middleware(['auth:sanctum', 'role:staff,organizer'])->group(function () {
        // Scan Tiket
        Route::post('/staff/scan', [ScannerController::class, 'scan']);
        
        // Lihat Dashboard Real-time Lapangan
        Route::get('/staff/dashboard', [MobileDashboardController::class, 'stats']);
        
    });
});
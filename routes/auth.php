<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\SetupAccountController;
use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;

Route::middleware('guest')->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])
        ->name('register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
        ->name('password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
        ->name('password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');

    // OAUTH GOOGLE
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('google.login');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback']);
});

Route::middleware('auth')->group(function () {
    // 1. Menampilkan halaman peringatan "Cek Email"
    // Nama rute HARUS 'verification.notice' karena ini standar baku Laravel
    Route::get('/email/verify', function () {
        return Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    })->name('verification.notice');

    // 2. Memproses saat user mengeklik link dari kotak masuk email mereka
    Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
        // Tandai email sebagai terverifikasi di database
        $request->fulfill(); 
        
        // Arahkan ke halaman setup-account setelah sukses!
        return redirect('/setup-account'); 
    })->middleware(['signed'])->name('verification.verify');

    // 3. Memproses tombol "Kirim Ulang Email"
    Route::post('/email/verification-notification', function (Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return back()->with('status', 'verification-link-sent');
    })->middleware(['throttle:6,1'])->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');

    // SETUP ACCOUNT (PILIH ROLE & ISI DATA AWAL)
    Route::get('/setup-account', [SetupAccountController::class, 'create'])->name('setup.account')->middleware(['verified']);
    Route::post('/setup-account', [SetupAccountController::class, 'store'])->middleware(['verified']);
});

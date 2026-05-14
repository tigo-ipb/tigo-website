<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Illuminate\Auth\Events\PasswordReset;
use App\Models\User;


class PasswordResetLinkController extends Controller
{
    // 1. Tampilkan halaman Lupa Password
    public function create()
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    // 2. Proses kirim email link reset
    public function store(Request $request)
    {
        $request->validate([
            'email' => [
                'required',
                'email',
                function ($attribute, $value, $fail) {
                    // Cek manual menggunakan Model User (MongoDB)
                    if (!User::where('email', $value)->exists()) {
                        $fail('The selected email is invalid.');
                    }
                },
            ],
        ]);

        // Broker bawaan Laravel akan otomatis membuat token & mengirim email
        $status = Password::broker()->sendResetLink(
            $request->only('email')
        );

        return $status == Password::RESET_LINK_SENT
            ? back()->with('status', 'Email berisi link reset password telah dikirim!')
            : back()->withErrors(['email' => __($status)]);
    }

    // 3. Tampilkan halaman Ganti Password (dari link email)
    public function edit(Request $request, $token)
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $token,
        ]);
    }

    // 4. Proses simpan password baru
    public function update(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        return $status == Password::PASSWORD_RESET
            ? redirect('/login')->with('status', 'Password berhasil diubah! Silakan login.')
            : back()->withErrors(['email' => __($status)]);
    }
}
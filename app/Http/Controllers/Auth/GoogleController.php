<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    public function redirect(Request $request)
    {
        // 1. Tangkap parameter role dari URL (misal: ?role=organizer)
        // Jika tidak ada, default-nya jadikan 'user' (customer)
        $intendedRole = $request->query('role', 'user');

        // 2. Simpan ke Session sebelum dilempar ke Google
        session(['google_intended_role' => $intendedRole]);

        return Socialite::driver('google')->redirect();
    }

    public function callback()
    {
        $googleUser = Socialite::driver('google')->user();
        
        // 3. Ambil kembali role dari Session
        $role = session('google_intended_role', 'user');

        $user = User::where('email', $googleUser->email)->orWhere('google_id', $googleUser->id)->first();

        if (!$user) {
            // 4. Terapkan role yang sudah didapat dari Session
            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'google_id' => $googleUser->id,
                'password' => Hash::make(uniqid()), 
                'role' => $role, // <--- Masuk sebagai 'organizer' atau 'user'
            ]);
        } else {
            $user->update(['google_id' => $googleUser->id]);
        }

        Auth::login($user);

        // Hapus session setelah dipakai agar bersih
        session()->forget('google_intended_role');

        if (empty($user->phone_number) || empty($user->username)) {
            return redirect()->route('setup.account');
        }

        return redirect('/');
    }
}
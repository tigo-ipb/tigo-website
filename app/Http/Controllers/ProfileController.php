<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    // Menampilkan Halaman Utama Profile
    public function index(Request $request)
    {
        return Inertia::render('Profile/Index', [
            'user' => $request->user()
        ]);
    }

    // Menampilkan Halaman Edit Profile
    public function edit(Request $request)
    {
        return Inertia::render('Profile/Edit', [
            'user' => $request->user()
        ]);
    }

    // Memproses update Nama dan Bio
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->bio = $request->bio;
        $user->save();

        // Kembali ke halaman profile utama dengan pesan sukses
        return redirect()->route('profile.index')->with('success', 'Profile berhasil diperbarui!');
    }

    // Menampilkan Halaman Setting Akun
    public function account(Request $request)
    {
        return Inertia::render('Profile/Account', [
            'user' => $request->user()
        ]);
    }

    // Memproses update data Akun
    public function updateAccount(Request $request)
    {
        $user = $request->user();

        $request->validate([
            // Pastikan username & email unik, kecuali untuk user ini sendiri (menggunakan $user->id)
            'username' => 'required|string|max:255|unique:users,username,' . $user->id . ',_id', 
            'birth_date' => 'nullable|date',
            'phone_code' => 'nullable|string|max:10',
            'phone_number' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id . ',_id',
        ]);

        $user->username = $request->username;
        $user->birth_date = $request->birth_date;
        $user->phone_code = $request->phone_code;
        $user->phone_number = $request->phone_number;

        // Cek jika user mengganti emailnya
        if ($user->email !== $request->email) {
            $user->email = $request->email;
            $user->email_verified_at = null; // Reset verifikasi jika email diganti (opsional tapi disarankan)
        }

        $user->save();

        return redirect()->route('profile.index')->with('success', 'Informasi akun berhasil diperbarui!');
    }

    public function password(Request $request)
    {
        return Inertia::render('Profile/Password');
    }

    // Memproses update Password
    public function updatePassword(Request $request)
    {
        $request->validate([
            // current_password adalah aturan bawaan Laravel untuk mengecek password lama
            'current_password' => ['required', 'current_password'], 
            'password' => ['required', 'string', 'min:8'], // Minimal 8 karakter
        ]);

        $user = $request->user();
        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('profile.index')->with('success', 'Password berhasil diperbarui!');
    }
}
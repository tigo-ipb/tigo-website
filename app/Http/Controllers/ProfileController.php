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
        $user = auth()->user();

        // 1. Cek apakah ini jatah VIP (Punya google_id DAN belum pernah set password manual)
        $isFirstTimeGoogleUser = $user->google_id && !$user->is_password_set_manually;

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed', // Mobile wajib kirim new_password_confirmation
        ]);

        // 2. Jika BUKAN user VIP, lakukan validasi ketat kecocokan hash password lama
        if (!$isFirstTimeGoogleUser) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password saat ini salah.'
                ], 400);
            }
        }
        // Jika VIP, blok pengecekan hash di atas akan diabaikan (bebas isi apapun di current_password).

        // 3. Simpan password baru dan tandai jatah VIP-nya sudah hangus
        $user->update([
            'password' => Hash::make($request->new_password),
            'is_password_set_manually' => true // 🔥 Cabut status VIP agar trik ini hanya berlaku 1 kali
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui.'
        ], 200);
    }
}
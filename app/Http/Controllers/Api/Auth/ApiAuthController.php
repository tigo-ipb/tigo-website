<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ApiAuthController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | 1. REGISTER (TAHAP 1: BUAT AKUN BARU)
    |--------------------------------------------------------------------------
    */
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:users,username',
            'email'    => 'required|string|email|unique:users,email',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'username' => $request->username,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'role'     => 'customer', // Default pengguna mobile adalah customer
        ]);

        // Buat token agar otomatis login dan bisa lanjut ke tahap Setup Akun
        $token = $user->createToken('mobile-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil dibuat. Silakan lanjut setup profil.',
            'data'    => [
                'user'  => $user,
                'token' => $token
            ]
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. SETUP PROFILE (TAHAP 2: LENGKAPI DATA)
    |--------------------------------------------------------------------------
    | Endpoint ini membutuhkan Bearer Token (Auth Sanctum) dari tahap 1
    */
    public function setupProfile(Request $request)
    {
        $user = auth()->user(); // Ambil data user yang sedang login

        $request->validate([
            'name'          => 'required|string|max:255',
            'bio'           => 'nullable|string',
            'birth_date'    => 'nullable|date',
            'phone_code'    => 'nullable|string',
            'phone_number'  => 'nullable|string',
            'profile_photo' => 'nullable|image|max:2048', // Max 2MB
        ]);

        $dataToUpdate = [
            'name'         => $request->name,
            'bio'          => $request->bio,
            'birth_date'   => $request->birth_date,
            'phone_code'   => $request->phone_code,
            'phone_number' => $request->phone_number,
        ];

        // Jika user mengupload foto profil (Menggunakan Cloudinary)
        if ($request->hasFile('profile_photo')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('profile_photo')->getRealPath(), [
                'folder' => 'tigo_ticketing/profiles'
            ])->getSecurePath();
            
            $dataToUpdate['profile_photo'] = $uploadedFileUrl;
        }

        $user->update($dataToUpdate);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => $user
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOGIN (BISA PAKAI USERNAME ATAU EMAIL)
    |--------------------------------------------------------------------------
    */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string', // Bisa berisi username atau email
            'password' => 'required|string',
        ]);

        // Cek apakah input berupa email atau username
        $fieldType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        $user = User::where($fieldType, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username/Email atau Password salah.'
            ], 401);
        }

        $token = $user->createToken('mobile-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'user'  => $user,
                'token' => $token
            ]
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. LUPA PASSWORD (KIRIM OTP)
    |--------------------------------------------------------------------------
    */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'login' => 'required|string', // Bisa username atau email
        ]);

        $fieldType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($fieldType, $request->login)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Akun tidak ditemukan.'], 404);
        }

        // Generate 6 digit angka acak untuk OTP
        $otp = rand(100000, 999999);
        
        $user->update([
            'reset_otp'      => $otp,
            'otp_expires_at' => now()->addMinutes(15) // Berlaku 15 menit
        ]);

        // TODO: Kirim $otp ini ke email user (Gunakan Mail::to()->send(...))
        // Simulasi sementara, kita tampilkan di response untuk kebutuhan testing
        return response()->json([
            'success' => true,
            'message' => 'Kode OTP berhasil dikirim ke email Anda.',
            'simulasi_otp' => $otp 
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 5. RESET PASSWORD
    |--------------------------------------------------------------------------
    */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'otp'      => 'required|numeric', // Dari inputan user di layar setelah forgot password
            'password' => 'required|string|min:8|confirmed', // Pastikan flutter mengirim 'password_confirmation'
        ]);

        $fieldType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        
        // Cari user berdasarkan email/username dan OTP yang cocok
        $user = User::where($fieldType, $request->login)
                    ->where('reset_otp', (int) $request->otp)
                    ->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'OTP salah atau Akun tidak valid.'], 400);
        }

        if (now()->greaterThan($user->otp_expires_at)) {
            return response()->json(['success' => false, 'message' => 'Kode OTP sudah kadaluarsa.'], 400);
        }

        // Jika valid, ubah password dan bersihkan OTP
        $user->update([
            'password'       => Hash::make($request->password),
            'reset_otp'      => null,
            'otp_expires_at' => null
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Password berhasil diubah. Silakan login kembali.'
        ], 200);
    }
}
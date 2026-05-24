<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Google_Client;
use Illuminate\Support\Facades\Log;

class ApiAuthController extends Controller
{
    // =========================================================================
    // HELPER: Cek apakah profil user sudah lengkap
    // =========================================================================
    private function isProfileComplete($user)
    {
        // Sesuaikan dengan kebutuhan Tigo. Misal: dianggap lengkap kalau ada nomor HP
        return $user->is_profile_setup || ($user->phone_number != null);
    }

    /*
    |--------------------------------------------------------------------------
    | 1. REGISTER (Kirim OTP ke Gmail)
    |--------------------------------------------------------------------------
    */
    public function register(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:mongodb.users,username',
            'email'    => 'required|string|email|unique:mongodb.users,email',
            'password' => 'required|string|min:8',
        ]);

        $otp = rand(100000, 999999);

        $user = User::create([
            'username'         => $request->username,
            'email'            => $request->email,
            'password'         => Hash::make($request->password),
            'role'             => 'customer',
            'verification_otp' => $otp,
            'otp_expires_at'   => now()->addMinutes(15),
            'is_profile_setup' => false, // Belum setup profil
            'is_password_set_manually' => true
            
        ]);

        // TODO: Aktifkan kode ini jika Mailable sudah dibuat
        Mail::to($user->email)->send(new \App\Mail\VerifyEmailMobileMail($otp));

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil dibuat. Silakan cek email untuk kode OTP verifikasi.',
            'data'    => ['email' => $user->email, 'simulasi_otp' => $otp] // Hapus simulasi_otp di production!
        ], 201);
    }

    /*
    |--------------------------------------------------------------------------
    | 2. VERIFIKASI EMAIL (Pakai OTP dari Register)
    |--------------------------------------------------------------------------
    */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'otp'   => 'required|numeric',
        ]);

        $user = User::where('email', $request->email)->where('verification_otp', (int) $request->otp)->first();

        if (!$user || now()->greaterThan($user->otp_expires_at)) {
            return response()->json(['success' => false, 'message' => 'OTP salah atau sudah kadaluarsa.'], 400);
        }

        $user->update([
            'email_verified_at' => now(),
            'verification_otp'  => null,
            'otp_expires_at'    => null,
        ]);

        // Langsung login-kan dan berikan token
        $token = $user->createToken('mobile-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Email berhasil diverifikasi.',
            'data'    => [
                'user' => $user,
                'token' => $token,
                'needs_setup' => !$this->isProfileComplete($user) // Flag untuk Mobile App
            ]
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 3. LOGIN BIASA (Cek Verifikasi & Setup)
    |--------------------------------------------------------------------------
    */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'password' => 'required|string',
        ]);

        $fieldType = filter_var($request->login, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $user = User::where($fieldType, $request->login)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['success' => false, 'message' => 'Kredensial salah.'], 401);
        }

        // Cek apakah email sudah diverifikasi
        if (is_null($user->email_verified_at)) {
            return response()->json(['success' => false, 'message' => 'Email belum diverifikasi. Silakan verifikasi terlebih dahulu.', 'needs_verification' => true], 403);
        }

        $token = $user->createToken('mobile-app-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil',
            'data'    => [
                'user'  => $user,
                'token' => $token,
                'needs_setup' => !$this->isProfileComplete($user) // Jika true, Mobile arahkan ke halaman setup
            ]
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 4. GOOGLE LOGIN (Mobile Version)
    |--------------------------------------------------------------------------
    */
    public function googleLogin(Request $request)
    {
        $request->validate(['id_token' => 'required|string']);

        $client = new Google_Client(['client_id' => env('GOOGLE_CLIENT_ID')]);

        try {
            $payload = $client->verifyIdToken($request->id_token);

            if ($payload) {
                // Cari atau Buat User Baru
                $user = User::updateOrCreate(
                    ['email' => $payload['email']], 
                    [
                        'name' => $payload['name'],
                        'google_id' => $payload['sub'],
                        'password' => null, 
                        'email_verified_at' => now(), // Google sudah pasti valid
                    ]
                );

                // Pastikan kolom is_profile_setup ada (default false untuk user baru)
                if (!isset($user->is_profile_setup)) {
                    $user->is_profile_setup = false;
                    $user->save();
                }

                $token = $user->createToken('mobile-app-token')->plainTextToken;

                return response()->json([
                    'success' => true,
                    'message' => 'Google Login berhasil',
                    'data'    => [
                        'user'  => $user,
                        'token' => $token,
                        'needs_setup' => !$this->isProfileComplete($user)
                    ]
                ], 200);

            } else {
                return response()->json(['success' => false, 'message' => 'Token Google tidak valid'], 401);
            }
        } catch (\Exception $e) {
            Log::error('Google Auth Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Kesalahan saat verifikasi Google.'], 500);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 5. SETUP PROFILE 
    |--------------------------------------------------------------------------
    */
    public function setupProfile(Request $request)
    {
        $user = auth()->user();
        
        if ($user->is_profile_setup) {
            return response()->json(['success' => false, 'message' => 'Profil sudah lengkap.'], 400);
        }
        $request->validate([
            'phone_number' => 'required|string',
            'phone_code' => 'required|string|max:10',
            'birth_date'   => 'required|date',
            'name'         => 'required|string|max:255',
            'username'     => 'required|string|max:255|unique:mongodb.users,username,' . $user->id . ',id',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,webp|max:15360', // Maks 15MB
        ]);


        $dataToUpdate = $request->only(['name', 'username', 'birth_date', 'phone_code', 'phone_number']);
        $dataToUpdate['is_profile_setup'] = true; // Tandai profil sudah lengkap!

        $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
         if ($request->hasFile('profile_photo')) {
            $upload = $cloudinary->uploadApi()->upload($request->file('profile_photo')->getRealPath(), ['folder' => 'tigo/users/profile']);
            $avatarUrl = $upload['secure_url'];
            $dataToUpdate['profile_photo'] = $avatarUrl;
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
    | 6. LUPA PASSWORD (Kirim OTP ke Email)
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

        // Generate 6 digit angka acak untuk OTP Reset Password
        $otp = rand(100000, 999999);
        
        $user->update([
            'reset_otp'      => $otp,
            'otp_expires_at' => now()->addMinutes(15) // Berlaku 15 menit
        ]);

        // Kirim email menggunakan class Mailable
        Mail::to($user->email)->send(new \App\Mail\ResetPasswordMobileMail($otp));

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP untuk reset password berhasil dikirim ke email Anda.',
            // 'simulasi_otp' => $otp // Hapus/comment ini saat production
        ], 200);
    }

    /*
    |--------------------------------------------------------------------------
    | 7. RESET PASSWORD (Verifikasi OTP & Simpan Password Baru)
    |--------------------------------------------------------------------------
    */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'login'    => 'required|string',
            'otp'      => 'required|numeric', 
            'password' => 'required|string|min:8|confirmed', // Mobile harus kirim 'password_confirmation'
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
            return response()->json(['success' => false, 'message' => 'Kode OTP sudah kadaluarsa. Silakan request ulang.'], 400);
        }

        // Jika valid, ubah password dan bersihkan data OTP di database
        $user->update([
            'password'       => Hash::make($request->password),
            'reset_otp'      => null,
            'otp_expires_at' => null
        ]);

        return response()->json([
            'success' => true, 
            'message' => 'Password berhasil diubah. Silakan login kembali dengan password baru Anda.'
        ], 200);
    }
}
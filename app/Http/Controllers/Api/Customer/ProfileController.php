<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function show()
    {
        return response()->json([
            'success' => true,
            'data' => auth()->user()
        ], 200);
    }

    // =========================================================
    // 🔥 MEMPROSES UPDATE PROFILE & FOTO (MOBILE API)
    // =========================================================
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'username' => 'required|string|max:255|unique:mongodb.users,username,' . $user->id . ',id',
            'bio' => 'nullable|string|max:1000',
        ],[
            // Kustomisasi pesan error di sini
            'username.unique' => 'Maaf, username ini sudah dipakai oleh orang lain.',
            'username.required' => 'Username tidak boleh kosong.',
            'username.max' => 'Username maksimal 255 karakter.'
        ]);

        $user->username = $request->username;
        $user->bio = $request->bio;

            
            // Jika ada upload foto profil baru
        if ($request->hasFile('profile_photo')) {
            $request->validate([
                'profile_photo' => 'image|mimes:jpeg,png,webp|max:15360', // Maks 15MB
            ]);
            // Hapus foto lama di Cloudinary terlebih dahulu
            $this->deleteCloudinaryImage($user->profile_photo);

            // Upload foto baru
            $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
            $upload = $cloudinary->uploadApi()->upload($request->file('profile_photo')->getRealPath(), [
                'folder' => 'tigo/users/profile'
            ]);
            
            $user->profile_photo = $upload['secure_url'];
        }
        

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile berhasil diperbarui',
            'data' => $user
        ], 200);
    }

    public function updateAccount(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:mongodb.users,email,' . $user->id . ',id',
            'birth_date' => 'nullable|date',
            'phone_code' => 'nullable|string|max:10',
            'phone_number' => 'nullable|string|max:20',
        ],[
            // Kustomisasi pesan error di sini
            'email.unique' => 'Maaf, email ini sudah dipakai oleh orang lain.',
        ]);

        $user->name = $request->name;
        $user->birth_date = $request->birth_date;
        $user->phone_code = $request->phone_code;
        $user->phone_number = $request->phone_number;

        if ($user->email !== $request->email) {
            $user->email = $request->email;
            $user->email_verified_at = null; 
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Informasi akun berhasil diperbarui',
            'data' => $user
        ], 200);
    }

    public function updatePassword(Request $request)
    {
        $user = auth()->user();
        $isFirstTimeGoogleUser = $user->google_id && !$user->is_password_set_manually;

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed', 
        ]);

        if (!$isFirstTimeGoogleUser) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password saat ini salah.'
                ], 400);
            }
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'is_password_set_manually' => true 
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui.'
        ], 200);
    }

    // =========================================================
    // 🔥 PRIVATE FUNCTION MENGHAPUS GAMBAR LAMA
    // =========================================================
    private function deleteCloudinaryImage($url)
    {
        if (!$url) return;
        try {
            $parts = explode('/upload/', $url);
            if (count($parts) > 1) {
                $path = preg_replace('/^v\d+\//', '', $parts[1]);
                $publicId = preg_replace('/\.[^.]+$/', '', $path);
                
                $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
                $cloudinary->uploadApi()->destroy($publicId);
            }
        } catch (\Exception $e) {
            // Abaikan error
        }
    }
}
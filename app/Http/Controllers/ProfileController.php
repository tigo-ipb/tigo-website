<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Profile/Index', [
            'user' => $request->user()
        ]);
    }

    public function edit(Request $request)
    {
        return Inertia::render('Profile/Edit', [
            'user' => $request->user()
        ]);
    }

    // =========================================================
    // 🔥 MEMPROSES UPDATE PROFILE & FOTO (WEB)
    // =========================================================
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'bio' => 'nullable|string|max:1000',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,webp|max:15360', // Maks 15MB
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->bio = $request->bio;

        // Jika ada upload foto profil baru
        if ($request->hasFile('profile_photo')) {
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

        return redirect()->route('profile.index')->with('success', 'Profile berhasil diperbarui!');
    }

    public function account(Request $request)
    {
        return Inertia::render('Profile/Account', [
            'user' => $request->user()
        ]);
    }

    public function updateAccount(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'username' => 'required|string|max:255|unique:mongodb.users,username,' . $user->id . ',id', 
            'birth_date' => 'nullable|date',
            'phone_code' => 'nullable|string|max:10',
            'phone_number' => 'nullable|string|max:20',
            'email' => 'required|string|email|max:255|unique:mongodb.users,email,' . $user->id . ',id',
        ]);

        $user->username = $request->username;
        $user->birth_date = $request->birth_date;
        $user->phone_code = $request->phone_code;
        $user->phone_number = $request->phone_number;

        if ($user->email !== $request->email) {
            $user->email = $request->email;
            $user->email_verified_at = null; 
        }

        $user->save();

        return redirect()->route('profile.index')->with('success', 'Informasi akun berhasil diperbarui!');
    }

    public function password(Request $request)
    {
        return Inertia::render('Profile/Password');
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
                return back()->withErrors(['current_password' => 'Password saat ini salah.']);
            }
        }

        $user->update([
            'password' => Hash::make($request->new_password),
            'is_password_set_manually' => true 
        ]);

        return redirect()->route('profile.index')->with('success', 'Password berhasil diperbarui!');
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
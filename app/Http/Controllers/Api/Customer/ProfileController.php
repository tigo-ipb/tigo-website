<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;

class ProfileController extends Controller
{
    // Mengambil data profil yang sedang login
    public function show()
    {
        return response()->json([
            'success' => true,
            'data' => auth()->user()
        ], 200);
    }

    // Update Profile (Nama, Username, Bio, dsb)
    public function update(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'username' => 'sometimes|string|unique:users,username,' . $user->_id . ',_id',
            'bio' => 'nullable|string',
            'birth_date' => 'nullable|date',
            'phone_code' => 'nullable|string',
            'phone_number' => 'nullable|string',
            'profile_photo' => 'nullable|image|max:2048',
        ]);

        $data = $request->only(['name', 'username', 'bio', 'birth_date', 'phone_code', 'phone_number']);

        // Jika ada upload foto profil baru
        if ($request->hasFile('profile_photo')) {
            $uploadedFileUrl = Cloudinary::upload($request->file('profile_photo')->getRealPath(), [
                'folder' => 'tigo_ticketing/profiles'
            ])->getSecurePath();
            
            $data['profile_photo'] = $uploadedFileUrl;
        }

        $user->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
            'data' => $user
        ], 200);
    }

    // Update Password dari menu "Password" di UI Profile
    public function updatePassword(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed', // Perlu field new_password_confirmation dari Flutter
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password saat ini salah.'
            ], 400);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diperbarui.'
        ], 200);
    }
}
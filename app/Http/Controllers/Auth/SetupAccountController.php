<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class SetupAccountController extends Controller
{
    public function create()
    {
        // Cegah user yang sudah lengkap datanya masuk ke halaman ini lagi
        if (Auth::user()->username && Auth::user()->phone_number) {
            return redirect('/');
        }

        return Inertia::render('Auth/SetupAccount', ['user' => Auth::user()]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'username' => 'required|string|unique:mongodb.users,username,' . Auth::id() . ',_id',
            'phone_number' => 'required|string',
            'name' => 'required|string',
            'birth_date' => 'required|date',
            'profile_photo' => 'nullable|image|mimes:jpeg,png,webp|max:15360', // Maks 15MB
        ]);

        $user = Auth::user();
         $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
         if ($request->hasFile('profile_photo')) {
            $upload = $cloudinary->uploadApi()->upload($request->file('profile_photo')->getRealPath(), ['folder' => 'tigo/users/profile']);
            $avatarUrl = $upload['secure_url'];
            $user->update(['profile_photo' => $avatarUrl]);
        }
        // Simpan data
        $user->update([
            'username' => $request->username,
            'name' => $request->name,
            'birth_date' => $request->birth_date,
            'phone_code' => $request->phone_code ?? '+62',
            'phone_number' => $request->phone_number,
        ]);

        return redirect('/')->with('success', 'Sukses Setup Akun');
    }
}
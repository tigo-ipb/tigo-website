<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountSetup
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();

            // Karpet merah untuk superadmin
            if ($user->role === 'superadmin') {
                return $next($request);
            }

            // Cek apakah data krusial masih kosong
            if (empty($user->phone_number) || empty($user->name)) {
                
                // 🔥 TAMBAHAN UNTUK MOBILE (API) 🔥
                // Jika request meminta format JSON (biasanya dari Mobile App / Postman)
                if ($request->expectsJson()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Setup akun belum selesai. Silakan lengkapi profil Anda.',
                        'needs_setup' => true // Penanda khusus untuk frontend mobile
                    ], 403); // Kode 403 Forbidden
                }

                // Logika untuk Web (Browser)
                if (!$request->routeIs('setup.account') && !$request->routeIs('logout')) {
                    return redirect()->route('setup.account');
                }
            }
        }

        return $next($request);
    }
}
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Parameter $roles bisa menerima lebih dari satu role.
     * Contoh penggunaan di route: middleware('role:organizer,superadmin')
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // 1. Cek apakah user sudah login
        if (!$request->user()) {
            // Jika request dari API/Mobile
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Unauthorized. Silakan login terlebih dahulu.'], 401);
            }
            // Jika request dari Web
            return redirect()->route('login');
        }

        // 2. Cek apakah role user saat ini cocok dengan role yang diizinkan
        if (!in_array($request->user()->role, $roles)) {
            // Jika request dari API/Mobile
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Forbidden: Akses ditolak. Role Anda adalah ' . $request->user()->role
                ], 403);
            }
            // Jika request dari Web (Tampilkan halaman error 403)
            abort(403, 'Anda tidak memiliki izin untuk mengakses halaman ini.');
        }

        // Jika aman, lanjutkan request
        return $next($request);
    }
}
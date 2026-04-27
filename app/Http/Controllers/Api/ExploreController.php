<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class ExploreController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::where('date_end', '>=', now()->format('Y-m-d'));

        // Filter 1: Pencarian Nama Event
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        // Filter 2: Kategori (Misal: 'Hiburan & Festival')
        if ($request->filled('category')) {
            $query->where('category_name', $request->category);
        }

        // Filter 3: Lokasi (Kota)
        if ($request->filled('city')) {
            $query->where('location.city', $request->city);
        }

        // Filter 4: Waktu (Hari ini, Besok, Minggu Ini)
        if ($request->filled('time_filter')) {
            $today = now()->format('Y-m-d');
            if ($request->time_filter === 'today') {
                $query->where('date_start', '<=', $today)->where('date_end', '>=', $today);
            } elseif ($request->time_filter === 'tomorrow') {
                $tomorrow = now()->addDay()->format('Y-m-d');
                $query->where('date_start', '<=', $tomorrow)->where('date_end', '>=', $tomorrow);
            }
        }

        // Eksekusi Query dengan Paginasi (10 event per halaman agar memori HP tidak penuh)
        $events = $query->orderBy('date_start', 'asc')->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Data Explore berhasil diambil',
            'data' => $events
        ], 200);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index()
    {
        $today = now()->format('Y-m-d');

        // 1. Pilihan untuk kamu (Featured Events - 5 event terdekat)
        $featuredEvents = Event::where('date_end', '>=', $today)
            ->orderBy('date_start', 'asc')
            ->limit(5)
            ->get();

        // 2. Event lainnya (10 event terbaru yang belum berakhir dan bukan bagian dari featured)
        $otherEvents = Event::where('date_end', '>=', $today)
            ->whereNotIn('_id', $featuredEvents->pluck('_id')->toArray())
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data Beranda berhasil diambil',
            'data' => [
                'featured_events' => $featuredEvents,
                'other_events' => $otherEvents
            ]
        ], 200);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;

class HomeController extends Controller
{
   public function index()
{
    // 1. Base Query Super Aman (Hanya singkirkan yang BUKAN draft)
    // Kita matikan filter date_end sementara agar data testing Anda tidak hilang
    $baseQuery = Event::where('status', '!=', 'draft')->where('date_end', '>=', now());

    // 2. Featured Events (Ambil 5)
    // Menggunakan created_at sebagai fallback jika date_start kosong di data testing
    $featuredEventsRaw = (clone $baseQuery)
        ->orderBy('created_at', 'desc') 
        ->limit(5)
        ->get();

    // Ambil ID dari Featured Events untuk dieksklusi dari Other Events
    $featuredIds = $featuredEventsRaw->pluck('_id')->toArray();

    // 3. Other Events (Ambil 10, pastikan tidak kembar dengan Featured)
    $otherEventsRaw = (clone $baseQuery)
        ->whereNotIn('_id', $featuredIds)
        ->orderBy('created_at', 'desc')
        ->limit(10)
        ->get();

    // =======================================================
    // 4. FUNGSI FORMATTER (Agar JSON bersih & ringan untuk React)
    // =======================================================
    $formatEvent = function ($event) {
        $firstSchedule = collect($event->schedules ?? [])->first() ?? [];
        $scheduleDate = isset($firstSchedule['date']) 
            ? \Carbon\Carbon::parse($firstSchedule['date'])->translatedFormat('D, d M Y') 
            : 'Jadwal TBA';

        // Hitung harga termurah (Mulai dari Rp...)
        $lowestPrice = collect($event->ticket_types ?? [])->min('price') ?? 0;

        return [
            'id' => $event->_id,
            'name' => $event->name,
            'category' => $event->category_name ?? 'Event',
            'venue' => $event->location['venue'] ?? 'Lokasi Belum Ditentukan',
            'address' => $event->location['address'] ?? '',
            'image' => $event->banners['16x9'] ?? ($event->poster_url ?? 'https://via.placeholder.com/400x200?text=No+Image'),
            'schedule' => $scheduleDate,
            'lowest_price' => $lowestPrice,
            'ticket_types' => $event->ticket_types ?? [],
            'organizer_name' => $event->organizer_name ?? 'Penyelenggara',
        ];
    };

    // 5. Eksekusi Formatter ke Data
    $featuredEvents = $featuredEventsRaw->map($formatEvent);
    $otherEvents = $otherEventsRaw->map($formatEvent);

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
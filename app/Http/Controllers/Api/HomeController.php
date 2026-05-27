<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();

        // 1. Base Query (Event Aktif & Belum Berakhir)
        $baseQuery = Event::where('status', '=', 'active')->where('date_end', '>=', $now);

        // FILTER KATEGORI DARI UI MOBILE (Chips)
        if ($request->filled('category')) {
            $baseQuery->where('category_name', $request->category);
        }

        // =======================================================
        // 2. LOGIKA FEATURED EVENTS (Personalization)
        // =======================================================
        $featuredEventsRaw = collect();
        $preferredCategories = [];

        $user = auth('sanctum')->user();

        if ($user) {
            $pastEventIds = Payment::where('user_id', $user->_id)
                ->where('payment_status', 'PAID')
                ->pluck('event_id')
                ->unique();

            if ($pastEventIds->isNotEmpty()) {
                $preferredCategories = Event::whereIn('_id', $pastEventIds)
                    ->pluck('category_name')
                    ->filter()
                    ->unique()
                    ->toArray();
            }
        }

        if (!empty($preferredCategories)) {
            $featuredEventsRaw = (clone $baseQuery)
                ->whereIn('category_name', $preferredCategories)
                ->orderBy('date_end', 'asc')
                ->limit(5)
                ->get();
        }

        if ($featuredEventsRaw->count() < 5) {
            $excludeIds = $featuredEventsRaw->pluck('_id')->toArray();
            $needed = 5 - $featuredEventsRaw->count();

            $additionalEvents = (clone $baseQuery)
                ->whereNotIn('_id', $excludeIds)
                ->orderBy('date_end', 'asc')
                ->limit($needed)
                ->get();

            $featuredEventsRaw = $featuredEventsRaw->merge($additionalEvents);
        }

        // =======================================================
        // 3. LOGIKA OTHER EVENTS
        // =======================================================
        $featuredIds = $featuredEventsRaw->pluck('_id')->toArray();

        $otherEventsRaw = (clone $baseQuery)
            ->whereNotIn('_id', $featuredIds)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // =======================================================
        // 🔥 PERBAIKAN: AMBIL ORGANIZER UNTUK KEDUA LIST SEKALIGUS
        // =======================================================
        // Gabungkan ID dari Featured dan Other, lalu filter yang unik
        $organizerIds = $featuredEventsRaw->pluck('organizer_id')
            ->concat($otherEventsRaw->pluck('organizer_id'))
            ->filter()
            ->unique();
            
        $organizers = User::whereIn('_id', $organizerIds)->get()->keyBy('_id');

        // =======================================================
        // 4. FORMATTER KHUSUS SESUAI UI MOBILE
        // =======================================================
        
        $formatSchedule = function ($event) {
            $firstSchedule = collect($event->schedules ?? [])->first() ?? [];
            $date = isset($firstSchedule['date']) 
                ? Carbon::parse($firstSchedule['date'])->translatedFormat('D, j F Y') 
                : 'Jadwal TBA';
            
            $time = (isset($firstSchedule['start_time']) && isset($firstSchedule['end_time']))
                ? $firstSchedule['start_time'] . ' - ' . $firstSchedule['end_time']
                : '';

            return $time ? "$date • $time" : $date;
        };

        $featuredEvents = $featuredEventsRaw->map(function ($event) use ($formatSchedule, $organizers) {
            // Sekarang $organizers punya data untuk Featured Event juga
            $organizer = $organizers->get($event->organizer_id);
            $lowestPrice = collect($event->ticket_types ?? [])->min('price') ?? 0;

            return [
                'id' => $event->_id,
                'name' => $event->name,
                'venue' => $event->location['venue'] ?? 'Lokasi TBA',
                'image' => $event->banners['16x9'] ?? ($event->poster_url ?? 'https://via.placeholder.com/640x360?text=No+16x9+Banner'),
                'schedule' => $formatSchedule($event),
                'lowest_price' => $lowestPrice,
                'organizer_name' => $event->organizer_name ?? ($organizer->name ?? 'Penyelenggara'),
                'organizer_photo' => $organizer->profile_photo ?? 'https://via.placeholder.com/100?text=EO', 
            ];
        });

        $otherEvents = $otherEventsRaw->map(function ($event) use ($formatSchedule, $organizers) {
            $organizer = $organizers->get($event->organizer_id);

            return [
                'id' => $event->_id,
                'name' => $event->name,
                'venue' => $event->location['venue'] ?? 'Lokasi TBA',
                'image' => $event->banners['1x1'] ?? ($event->poster_url ?? 'https://via.placeholder.com/400x400?text=No+1x1+Banner'),
                'schedule' => $formatSchedule($event),
                'organizer_name' => $event->organizer_name ?? ($organizer->name ?? 'Penyelenggara'),
                'organizer_photo' => $organizer->profile_photo ?? 'https://via.placeholder.com/100?text=EO', 
            ];
        });

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
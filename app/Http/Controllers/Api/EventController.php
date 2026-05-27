<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class EventController extends Controller
{
    public function show($id)
    {
        // 1. Cari event utama yang aktif berdasarkan ID MongoDB
        $event = Event::where('_id', $id)->where('status', '=', 'active')->first();

        if (!$event) {
            return response()->json([
                'success' => false,
                'message' => 'Event tidak ditemukan atau sudah tidak aktif.'
            ], 404);
        }

        // Ambil data profil Organizer (EO) pemilik event utama ini
        $organizer = User::find($event->organizer_id);

        // Format jadwal event utama
        $formattedSchedules = collect($event->schedules ?? [])->map(function ($schedule) {
            return [
                'date' => isset($schedule['date']) ? Carbon::parse($schedule['date'])->translatedFormat('l, j F Y') : 'TBA',
                'start_time' => $schedule['start_time'] ?? '',
                'end_time' => $schedule['end_time'] ?? '',
            ];
        });

        // =======================================================
        // 🔥 LOGIKA: AMBIL 7 EVENT LAINNYA SECARA RANDOM + DATA EO
        // =======================================================
        $otherEventsRaw = Event::where('status', '=', 'active')
            ->where('_id', '!=', $id) // Eksklusi event yang sedang dibuka saat ini
            ->where('date_end', '>=', Carbon::now()) // Pastikan event belum berakhir
            ->latest() 
            ->limit(30) // Batasi kuota dokumen agar query MongoDB tetap ringan
            ->get()
            ->shuffle() // Diacak di memory server
            ->take(7); // Ambil tepat 7 dokumen

        // Ambil data profil Organizer (EO) untuk ke-7 event rekomendasi di atas sekaligus
        $otherOrganizerIds = $otherEventsRaw->pluck('organizer_id')->filter()->unique();
        $otherOrganizers = User::whereIn('_id', $otherOrganizerIds)->get()->keyBy('_id');

        // Helper untuk format jadwal event rekomendasi
        $formatOtherSchedule = function ($ev) {
            $firstSchedule = collect($ev->schedules ?? [])->first() ?? [];
            $date = isset($firstSchedule['date']) 
                ? Carbon::parse($firstSchedule['date'])->translatedFormat('D, j M Y') 
                : 'TBA';
            
            $time = (isset($firstSchedule['start_time']) && isset($firstSchedule['end_time']))
                ? $firstSchedule['start_time'] . ' - ' . $firstSchedule['end_time']
                : '';

            return $time ? "$date • $time" : $date;
        };

        // Format 7 event lainnya beserta nama & foto profil EO-nya
        $otherEvents = $otherEventsRaw->map(function ($ev) use ($formatOtherSchedule, $otherOrganizers) {
            $lowestPrice = collect($ev->ticket_types ?? [])->min('price') ?? 0;
            $otherOrganizer = $otherOrganizers->get($ev->organizer_id);

            return [
                'id' => $ev->_id,
                'name' => $ev->name,
                'venue' => $ev->location['venue'] ?? 'Lokasi TBA',
                'image' => $ev->banners['16x9'] ?? ($ev->poster_url ?? 'https://via.placeholder.com/640x360?text=No+Image'),
                'schedule' => $formatOtherSchedule($ev),
                'lowest_price' => $lowestPrice,
                // 🔥 TAMBAHAN: Nama dan Foto Profil Organizer untuk list Event Lainnya
                'organizer_name' => $ev->organizer_name ?? ($otherOrganizer->name ?? 'Penyelenggara'),
                'organizer_photo' => $otherOrganizer->profile_photo ?? 'https://via.placeholder.com/100?text=EO', 
            ];
        })->values(); // Reset indeks array agar kembali berurutan dari 0-6

        // =======================================================
        // 3. RAKIT DATA AKHIR UNTUK RESPONSE
        // =======================================================
        $eventDetails = [
            'id' => $event->_id,
            'name' => $event->name,
            'description' => $event->description ?? 'Tidak ada deskripsi.',
            'category' => $event->category_name ?? 'Event',
            'format' => ($event->is_online ?? false) ? 'Online' : 'Offline',
            'location' => $event->location ?? [],
            'image_16x9' => $event->banners['16x9'] ?? ($event->poster_url ?? 'https://via.placeholder.com/640x360'),
            'image_1x1' => $event->banners['1x1'] ?? ($event->poster_url ?? 'https://via.placeholder.com/400x400'),
            'schedules' => $formattedSchedules,
            'ticket_types' => collect($event->ticket_types ?? [])->map(function ($ticket) {
                return [
                    'type_id' => $ticket['type_id'] ?? '',
                    'type_name' => $ticket['type_name'] ?? 'Reguler',
                    'price' => (int) ($ticket['price'] ?? 0),
                    'available_stock' => (int) ($ticket['available_stock'] ?? 0),
                    'description' => $ticket['description'] ?? '',
                ];
            }),
            'terms_conditions' => $event->terms_conditions ?? '',
            'galleries' => $event->galleries ?? [],
            'organizer' => [
                'id' => $event->organizer_id,
                'name' => $event->organizer_name ?? ($organizer->name ?? 'Penyelenggara'),
                'photo' => $organizer->profile_photo ?? 'https://via.placeholder.com/100?text=EO',
            ],
            // 7 Event Acak + Detail data EO lengkap
            'other_events' => $otherEvents
        ];

        return response()->json([
            'success' => true,
            'message' => 'Detail event berhasil diambil',
            'data' => $eventDetails
        ], 200);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ExploreController extends Controller
{
    public function index(Request $request)
    {
        $now = Carbon::now();

        // Base Query: Hanya tampilkan event aktif yang belum kedaluwarsa
        $query = Event::where('status', '!=', 'draft')->where('date_end', '>=', $now);

        // =======================================================
        // 🔥 1. FILTER: Pencarian Nama Event
        // =======================================================
        if ($request->filled('name')) {
            // Menggunakan 'like' agar pencarian tidak harus sama persis (case-insensitive di MongoDB)
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        // =======================================================
        // 🔥 2. FILTER: Kategori (Dari Chips / Modal)
        // =======================================================
        if ($request->filled('category')) {
            $query->where('category_name', 'like', '%' . $request->category . '%');
        }

        // =======================================================
        // 🔥 3. FILTER: Lokasi (Address)
        // =======================================================
        if ($request->filled('address')) {
            $query->where('location.address', 'like', '%' . $request->address . '%');
        }

        // =======================================================
        // 🔥 4. FILTER: Range Tanggal (Waktu)
        // =======================================================
        // Jika user memilih rentang tanggal dari modal filter
        if ($request->filled('start_date')) {
            $startDate = Carbon::parse($request->start_date)->startOfDay();
            $query->where('date_end', '>=', $startDate);
        }
        
        if ($request->filled('end_date')) {
            $endDate = Carbon::parse($request->end_date)->endOfDay();
            $query->where('date_start', '<=', $endDate);
        }

        // =======================================================
        // 🔥 5. FILTER: Range Harga (Terendah - Tertinggi)
        // =======================================================
        // MongoDB sangat pintar, dia bisa langsung mencari ke dalam array ticket_types!
        if ($request->filled('price_min')) {
            $query->where('ticket_types.price', '>=', (int) $request->price_min);
        }
        
        if ($request->filled('price_max')) {
            $query->where('ticket_types.price', '<=', (int) $request->price_max);
        }

        // =======================================================
        // 🔥 6. FILTER: Format (Offline / Online)
        // =======================================================
        if ($request->filled('format')) {
            $format = strtolower($request->format); // 'online' atau 'offline'
            
            // Cek apakah Mas Aryo pakai field is_online (boolean) atau format (string) di database.
            // Asumsi kita pakai field is_online boolean (true/false)
            if ($format === 'online') {
                $query->where('is_online', true);
            } elseif ($format === 'offline') {
                $query->where('is_online', '!=', true);
            }
        }

        // =======================================================
        // EKSEKUSI PAGINASI
        // =======================================================
        // Eksekusi query dengan 10 item per halaman
        $events = $query->orderBy('date_start', 'asc')->paginate(10);

        // Ambil data User (Organizer) untuk mendapatkan foto profil
        $organizerIds = collect($events->items())->pluck('organizer_id')->filter()->unique();
        $organizers = User::whereIn('_id', $organizerIds)->get()->keyBy('_id');

        // =======================================================
        // FORMATTER KHUSUS SESUAI UI MOBILE
        // =======================================================
        $formatSchedule = function ($event) {
            $firstSchedule = collect($event->schedules ?? [])->first() ?? [];
            $date = isset($firstSchedule['date']) 
                ? Carbon::parse($firstSchedule['date'])->translatedFormat('D, j F Y') 
                : 'TBA';
            
            $time = (isset($firstSchedule['start_time']) && isset($firstSchedule['end_time']))
                ? $firstSchedule['start_time'] . ' - ' . $firstSchedule['end_time']
                : '';

            return $time ? "$date • $time" : $date;
        };

        // Ubah format output dari paginasi agar rapi seperti di HomeController
        $events->getCollection()->transform(function ($event) use ($formatSchedule, $organizers) {
            $organizer = $organizers->get($event->organizer_id);
            $lowestPrice = collect($event->ticket_types ?? [])->min('price') ?? 0;

            return [
                'id' => $event->_id,
                'name' => $event->name,
                'venue' => $event->location['venue'] ?? 'Lokasi TBA',
                // UI Explore menggunakan gambar 16x9
                'image' => $event->banners['16x9'] ?? ($event->poster_url ?? 'https://via.placeholder.com/640x360?text=No+Image'),
                'schedule' => $formatSchedule($event),
                'lowest_price' => $lowestPrice,
                'organizer_name' => $event->organizer_name ?? ($organizer->name ?? 'Penyelenggara'),
                'organizer_photo' => $organizer->profile_photo ?? 'https://via.placeholder.com/100?text=EO', 
            ];
        });

        return response()->json([
            'success' => true,
            'message' => 'Data Explore berhasil diambil',
            // Paginasi bawaan Laravel otomatis menyertakan prev_page_url, next_page_url, dll.
            'data' => $events 
        ], 200);
    }
}
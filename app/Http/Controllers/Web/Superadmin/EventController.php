<?php

namespace App\Http\Controllers\Web\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use Carbon\Carbon;
use DOMDocument;
use Cloudinary\Cloudinary;

class EventController extends Controller
{
    public function index(Request $request)
    {
        // ... (Data statistik biarkan seperti sebelumnya) ...
        $stats = [
            'total' => Event::count(),
            'active' => Event::where('status', 'active')->count(), // Pastikan pakai huruf kecil sesuai DB
            'archived' => Event::where('status', 'archive')->count(),
        ];

        // 2. Query Data Event
        $eventQuery = Event::with('organizer');

        // Filter Tab Status
        if ($request->filled('status') && $request->status !== 'Semua') {
            $eventQuery->where('status', strtolower($request->status)); // Paksa jadi huruf kecil saat query
        }

        // Filter Pencarian
        if ($request->filled('search')) {
            $search = preg_quote($request->search, '/');
            $eventQuery->where(function($q) use ($search) {
                $q->where('name', 'regex', "/.*{$search}.*/i")
                  ->orWhere('category_name', 'regex', "/.*{$search}.*/i")
                  ->orWhere('_id', 'regex', "/.*{$search}.*/i");
            });
        }

        $sort = $request->input('sort', 'terbaru');
        if ($sort === 'terbaru') {
            $eventQuery->latest();
        } else {
            $eventQuery->oldest();
        }

        // FORMATTING DATA SEBELUM DIKIRIM KE REACT
        $events = $eventQuery->paginate(10)->through(function ($event) {
            // Decode String JSON menjadi Array PHP
            $location = is_string($event->location) ? json_decode($event->location, true) : $event->location;
            $schedules = is_string($event->schedules) ? json_decode($event->schedules, true) : $event->schedules;
            
            // Ambil jadwal pertama dan terakhir dari array schedules
            $firstSchedule = (is_array($schedules) && count($schedules) > 0) ? $schedules[0] : null;
            $lastSchedule = (is_array($schedules) && count($schedules) > 0) ? end($schedules) : null;

            return [
                'id' => $event->_id,
                'name' => $event->name,
                'category_name' => $event->category_name,
                'organizer_name' => $event->organizer->name ?? 'Penyelenggara', // Asumsi relasi berfungsi
                'venue' => $location['venue'] ?? 'Lokasi tidak diketahui',
                'address' => $location['address'] ?? '',
                
                // Ambil data tanggal/waktu dari schedules, kalau kosong ambil dari date_start
                'start_date' => $firstSchedule['date'] ?? \Carbon\Carbon::parse($event->date_start)->format('Y-m-d'),
                'start_time' => $firstSchedule['time_start'] ?? '00:00',
                'end_date' => $lastSchedule['date'] ?? \Carbon\Carbon::parse($event->date_end)->format('Y-m-d'),
                'end_time' => $lastSchedule['time_end'] ?? '00:00',
                
                'status' => strtolower($event->status),
            ];
        })->withQueryString();

        return Inertia::render('Superadmin/Events', [
            'stats' => $stats,
            'events' => $events,
            'filters' => (object) $request->only(['search', 'status', 'sort']) // Solusi error sort sebelumnya
        ]);
    }
    public function edit($id)
    {
        $event = Event::where('_id', $id)->firstOrFail();
        
        // Join terms array jadi string untuk Textarea
        $event->terms_string = implode("\n", $event->terms_conditions ?? []);
        
        return Inertia::render('Superadmin/Form', [
            'event' => $event
        ]);
    }

    private function deleteCloudinaryImage($url)
    {
        if (!$url) return;
        try {
            $parts = explode('/upload/', $url);
            if (count($parts) > 1) {
                $path = preg_replace('/^v\d+\//', '', $parts[1]);
                $publicId = preg_replace('/\.[^.]+$/', '', $path);
                
                $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
                $cloudinary->uploadApi()->destroy($publicId);
            }
        } catch (\Exception $e) {
            // Abaikan error
        }
    }

    public function update(Request $request, $id)
    {
        $event = Event::where('_id', $id)->firstOrFail();

        $request->validate([
            'name' => 'required|string',
            'category_name' => 'required|string',
            'schedules' => 'required|array|min:1',
            'ticket_types' => 'required|array|min:1',
            'banner_16x9' => 'nullable|image|max:20480', 
            'banner_1x1' => 'nullable|image|max:15360',  
            'galleries' => 'nullable|array|max:4',
            'status' => 'nullable|in:active,draft'
        ]);

        $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));
        $banners = $event->banners ?? [];
        $existingGalleries = $event->galleries ?? [];

        // 1. Update Banners (Hapus Lama -> Upload Baru)
        if ($request->hasFile('banner_16x9')) {
            $this->deleteCloudinaryImage($banners['16x9'] ?? null);
            $upload = $cloudinary->uploadApi()->upload($request->file('banner_16x9')->getRealPath(), ['folder' => 'tigo/events/banners']);
            $banners['16x9'] = $upload['secure_url'];
        }
        if ($request->hasFile('banner_1x1')) {
            $this->deleteCloudinaryImage($banners['1x1'] ?? null);
            $upload = $cloudinary->uploadApi()->upload($request->file('banner_1x1')->getRealPath(), ['folder' => 'tigo/events/banners']);
            $banners['1x1'] = $upload['secure_url'];
        }

        // 2. Update Galleries
        // Catatan: Jika ada file baru di index tertentu, hapus foto lama di index itu, lalu ganti URL-nya.
        if ($request->hasFile('galleries')) {
            $uploadedGalleries = $request->file('galleries');
            
            foreach ($uploadedGalleries as $index => $file) {
                // Jika slot ini sebelumnya ada foto lamanya, hapus dulu di Cloudinary
                if (isset($existingGalleries[$index])) {
                    $this->deleteCloudinaryImage($existingGalleries[$index]);
                }
                
                // Upload foto baru
                $upload = $cloudinary->uploadApi()->upload($file->getRealPath(), ['folder' => 'tigo/events/galleries']);
                // Timpa array pada index tersebut
                $existingGalleries[$index] = $upload['secure_url']; 
            }
            
            // Re-index array agar rapi (misal slot 1 dan 3 kehapus, sisa slot 0 dan 2 akan merapat)
            $existingGalleries = array_values($existingGalleries); 
        }

        $dates = collect($request->schedules)->pluck('date');
        $terms = $request->terms_conditions ? explode("\n", str_replace("\r", "", $request->terms_conditions)) : [];

        $dom = new DOMDocument();
        $dom->loadHTML($request->map_link);
        $iframes = $dom->getElementsByTagName('iframe');
        if ($iframes->length > 0) {
            $iframe = $iframes[0];
            $mapUrl = $iframe->getAttribute('src');
        } else {
            $mapUrl = $request->map_link;
        }

        // 3. Update Database
        $event->update([
            'name' => $request->name,
            'category_name' => $request->category_name,
            'description' => $request->description,
            'terms_conditions' => $terms,
            'location' => [
                'venue' => $request->venue,
                'address' => $request->address,
                'map_link' => $mapUrl
            ],
            'schedules' => $request->schedules,
            'date_start' => Carbon::parse($dates->min()),
            'date_end' => Carbon::parse($dates->max()),
            'ticket_types' => array_map(function($ticket) {
                if (!isset($ticket['type_id'])) $ticket['type_id'] = (string) Str::uuid();
                $ticket['price'] = (int) $ticket['price'];
                $ticket['available_stock'] = (int) $ticket['available_stock'];
                if(is_string($ticket['features'])) {
                    $ticket['features'] = array_map('trim', explode('-', $ticket['features']));
                }
                return $ticket;
            }, $request->ticket_types),
            'banners' => $banners,
            'galleries' => $existingGalleries, // Update array galleries
            'status' => $request->status ?? $event->status, // Update status jika ada
        ]);
        return redirect()->route('superadmin.events')->with('success', 'Event berhasil diperbarui!');
    }
}
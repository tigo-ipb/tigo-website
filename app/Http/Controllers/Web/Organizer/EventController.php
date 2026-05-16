<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use App\Models\Payment;
use Carbon\Carbon;
use DOMDocument;
use Illuminate\Support\Str;
use Cloudinary\Cloudinary;
class EventController extends Controller
{
    // 1. HALAMAN LIST EVENT (Index)
   public function index(Request $request)
{
    $organizerId = auth()->id();
    
    // 1. Tangkap Parameter Filter dari React
    $tab = $request->query('tab', 'active');
    $search = $request->query('search');
    $category = $request->query('category');
    $timeFilter = $request->query('time');
    
    // 2. Query Dasar
    $query = \App\Models\Event::where('organizer_id', $organizerId);

    // -- FILTER PENCARIAN & KATEGORI (Tetap Sama) --
    if ($search) {
        $query->where('name', 'like', "%{$search}%");
    }

    if ($category && $category !== 'Semua Kategori') {
        $query->where('category_name', $category);
    }

    // -- FILTER WAKTU (Tetap Sama) --
    if ($timeFilter === 'Bulan Ini') {
        $startOfMonth = \Carbon\Carbon::now()->startOfMonth(); 
        $endOfMonth = \Carbon\Carbon::now()->endOfMonth();
        $query->whereBetween('created_at', [$startOfMonth, $endOfMonth]);
    }

    // =========================================================
    // 3. FILTER TAB & STATUS (INI YANG KITA PERBAIKI)
    // =========================================================
    $now = \Carbon\Carbon::now();
    
    if ($tab === 'history') {
        // Hanya cari yang punya date_end DAN tanggalnya lebih kecil dari hari ini
        $query->where('date_end', '!=', null)->where('date_end', '<', $now);
        
    } elseif ($tab === 'draft') {
        // Harus beneran ada tulisan 'draft'
        $query->where('status', 'draft')->where('date_end', '>=', $now);
        
    } else {
        // TAB ACTIVE (Default)
        // Pokoknya SELAIN draft, tampilkan semua! 
        // (Termasuk event lama yang nggak punya kolom status / date_end)
        $query->where('status', '!=', 'draft')->where('date_end', '>=', $now);
        
        // Kita matikan dulu filter date_end di Tab Active agar data lama Anda tidak hilang
        // $query->where(function($q) use ($now) { ... }); 
    }
    // =========================================================

    // 4. Eksekusi Paginasi
    $events = $query->orderBy('created_at', 'desc')->paginate(10);

    // 4. Transformasi Data untuk UI React (Hitung Tiket, Harga, dll)
    $events->getCollection()->transform(function ($event) {
        
        // Hitung total tiket dan yang terjual
        $totalTickets = 0;
        foreach ($event->ticket_types ?? [] as $ticket) {
            $totalTickets += (int) ($ticket['available_stock'] ?? 0);
        }
        
        $ticketsSold = Payment::where('event_id', $event->_id)
            ->where('payment_status', 'PAID')
            ->get()
            ->sum(function ($payment) {
                return collect($payment->ticket_items)->sum('quantity');
            });

        $totalTickets += $ticketsSold;
        $soldPercentage = $totalTickets > 0 ? round(($ticketsSold / $totalTickets) * 100) : 0;

        // Cari harga termurah
        $lowestPrice = collect($event->ticket_types ?? [])->min('price') ?? 0;

        // Format tanggal schedule pertama
        $firstSchedule = collect($event->schedules ?? [])->first() ?? [];
        $scheduleFormat = isset($firstSchedule['date']) 
            ? \Carbon\Carbon::parse($firstSchedule['date'])->translatedFormat('D, d F Y') . ' • ' . $firstSchedule['time_start'] . ' - ' . $firstSchedule['time_end']
            : 'Jadwal belum ditentukan';

        return [
            'id' => $event->_id,
            'name' => $event->name,
            'category' => $event->category_name ?? 'Event',
            'venue' => $event->location['venue'] ?? 'TBA',
            'image' => $event->banners['16x9'] ?? ($event->poster_url ?? 'https://via.placeholder.com/400x200'),
            'schedule' => $scheduleFormat,
            'sold_percentage' => $soldPercentage,
            'lowest_price' => $lowestPrice,
            'status' => $event->status ?? 'active',
            'date_end' => $event->date_end,
        ];
    });

    // 5. Kembalikan data Event beserta state Filter saat ini ke React
    return inertia('Organizer/Events/Index', [
        'events' => $events,
        'filters' => $request->only(['tab', 'search', 'category', 'time'])
    ]);
}

    public function create()
    {
        // Kirim event kosong untuk mode 'Create'
        return Inertia::render('Organizer/Events/Form', [
            'event' => null
        ]);
    }

    public function show($id)
    {
        $event = Event::where('_id', $id)->where('organizer_id', auth()->id())->firstOrFail();
        
        // Ambil data transaksi khusus event ini
        $payments = Payment::where('event_id', $id)->get();
        
        $ticketsSold = 0;
        $revenuePaid = 0;
        $revenueUnpaid = 0;

        foreach ($payments as $p) {
            $qty = collect($p->ticket_items)->sum('quantity');
            
            if ($p->payment_status === 'PAID') {
                $ticketsSold += $qty;
                $revenuePaid += $p->sub_total; // Uang yang sudah masuk
            } else {
                $revenueUnpaid += $p->sub_total; // Uang yang masih pending
            }
        }

        // Total kuota = Tiket terjual (PAID) + Sisa stok di semua tipe tiket
        $availableStock = collect($event->ticket_types)->sum('available_stock');
        $totalQuota = $ticketsSold + $availableStock;
        
        $soldPercentage = $totalQuota > 0 ? round(($ticketsSold / $totalQuota) * 100) : 0;

        // Jadwal format
        $firstSchedule = collect($event->schedules)->first() ?? [];
        $scheduleFormat = isset($firstSchedule['date']) 
            ? \Carbon\Carbon::parse($firstSchedule['date'])->translatedFormat('D, d F Y') . ' • ' . $firstSchedule['time_start'] . ' - ' . $firstSchedule['time_end']
            : 'Jadwal belum ditentukan';

        // Tentukan harga termurah
        $lowestPrice = collect($event->ticket_types)->min('price');

        $eventData = $event->toArray();
        $eventData['stats'] = [
            'tickets_sold' => $ticketsSold,
            'total_quota' => $totalQuota,
            'sold_percentage' => $soldPercentage,
            'revenue_paid' => $revenuePaid,
            'revenue_unpaid' => $revenueUnpaid,
        ];
        $eventData['schedule_format'] = $scheduleFormat;
        $eventData['lowest_price'] = $lowestPrice;
        $eventData['status'] = $event->date_end >= now() ? 'Active' : 'History';

        return Inertia::render('Organizer/Events/Show', [
            'event' => $eventData
        ]);
    }

    public function edit($id)
    {
        $event = Event::where('_id', $id)->where('organizer_id', auth()->id())->firstOrFail();
        
        // Join terms array jadi string untuk Textarea
        $event->terms_string = implode("\n", $event->terms_conditions ?? []);
        
        return Inertia::render('Organizer/Events/Form', [
            'event' => $event
        ]);
    }
    /**
     * HELPER: Fungsi untuk menghapus file dari Cloudinary
     */
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

    /**
     * STORE EVENT
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'category_name' => 'required|string',
            'description' => 'required|string',
            'schedules' => 'required|array|min:1',
            'ticket_types' => 'required|array|min:1',
            'banner_16x9' => 'nullable|image|max:20480', 
            'banner_1x1' => 'nullable|image|max:15360',
            // Validasi galleries: array of images
            'galleries' => 'nullable|array|max:4',
            'galleries.*' => 'image|max:15360',
            'status' => 'nullable|in:active,draft' // Status opsional (default active)
        ]);

        $cloudinary = new \Cloudinary\Cloudinary(env('CLOUDINARY_URL'));

        // 1. Upload Banners
        $banners = [];
        if ($request->hasFile('banner_16x9')) {
            $upload = $cloudinary->uploadApi()->upload($request->file('banner_16x9')->getRealPath(), ['folder' => 'tigo/events/banners']);
            $banners['16x9'] = $upload['secure_url'];
        }
        if ($request->hasFile('banner_1x1')) {
            $upload = $cloudinary->uploadApi()->upload($request->file('banner_1x1')->getRealPath(), ['folder' => 'tigo/events/banners']);
            $banners['1x1'] = $upload['secure_url'];
        }

        // 2. Upload Galleries (Multi-Image)
        $galleries = [];
        if ($request->hasFile('galleries')) {
            foreach ($request->file('galleries') as $file) {
                $upload = $cloudinary->uploadApi()->upload($file->getRealPath(), ['folder' => 'tigo/events/galleries']);
                $galleries[] = $upload['secure_url']; // Simpan URL-nya ke dalam array
            }
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

        // 3. Simpan ke MongoDB
        Event::create([
            'organizer_id' => auth()->id(),
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
                $ticket['type_id'] = (string) Str::uuid();
                $ticket['price'] = (int) $ticket['price'];
                $ticket['available_stock'] = (int) $ticket['available_stock'];
                $ticket['features'] = isset($ticket['features']) ? array_map('trim', explode('-', $ticket['features'])) : [];
                return $ticket;
            }, $request->ticket_types),
            'banners' => $banners,
            'galleries' => $galleries, // Simpan array URL ke kolom galleries
            'status' => $request->status ?? 'active', // Default 'active' jika tidak ada request
        ]);

        return redirect()->route('organizer.events.index')->with('success', 'Event berhasil dibuat!');
    }

    /**
     * UPDATE EVENT
     */
    public function update(Request $request, $id)
    {
        $event = Event::where('_id', $id)->where('organizer_id', auth()->id())->firstOrFail();

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
        return redirect()->route('organizer.events.index')->with('success', 'Event berhasil diperbarui!');
    }

    /**
     * UPDATE STATUS EVENT (ACTIVE <-> DRAFT)
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,draft'
        ]);

        $event = Event::where('_id', $id)->where('organizer_id', auth()->id())->firstOrFail();

        // Update murni hanya statusnya saja
        $event->update([
            'status' => $request->status
        ]);

        $pesan = $request->status === 'active' ? 'Event diaktifkan!' : 'Event disimpan sebagai Draft!';
        
        // Kita menggunakan back() agar halaman tidak reload keras, 
        // Inertia akan menangkapnya dengan mulus
        return back()->with('success', $pesan);
    }

    /**
     * DELETE EVENT
     */
    public function destroy($id)
    {
        $event = Event::where('_id', $id)->where('organizer_id', auth()->id())->firstOrFail();

        // 1. Hapus Banners
        if (isset($event->banners['16x9'])) $this->deleteCloudinaryImage($event->banners['16x9']);
        if (isset($event->banners['1x1'])) $this->deleteCloudinaryImage($event->banners['1x1']);
        
        // 2. Hapus SEMUA gambar Galleries
        if (isset($event->galleries) && is_array($event->galleries)) {
            foreach($event->galleries as $imgUrl) {
                $this->deleteCloudinaryImage($imgUrl);
            }
        }

        // 3. Hapus Event
        $event->delete();

        return redirect()->route('organizer.events.index')->with('success', 'Event beserta seluruh fotonya berhasil dihapus!');
    }}
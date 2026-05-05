<?php

namespace App\Http\Controllers\Web\Organizer;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Event;
use App\Models\Payment;
use App\Models\ExportHistory;
use App\Models\Withdrawal;
use Illuminate\Support\Facades\Storage; // <-- Tambahkan ini untuk akses direktori penyimpanan

class ExportController extends Controller
{
    public function index(Request $request)
    {
        $organizerId = auth()->id();

        // 1. Ambil Data Statistik Cepat untuk 4 Card Atas
        $stats = [
            'events' => Event::where('organizer_id', $organizerId)->count(),
            'bookings' => Payment::where('organizer_id', $organizerId)->count(),
            'finance' => Payment::where('organizer_id', $organizerId)->where('payment_status', 'PAID')->count(),
            'wallet' => Withdrawal::where('organizer_id', $organizerId)->count()
        ];

        // 2. Query Riwayat Export
        $query = ExportHistory::where('organizer_id', $organizerId);

        // Filter Tab (Semua, Events, Bookings, dll)
        if ($request->filled('type') && $request->type !== 'Semua') {
            // Karena di DB tersimpan sebagai teks JSON, kita pakai pencarian 'like'
            $query->where('data_types', 'like', '%' . strtolower($request->type) . '%');
        }

        // Filter Pencarian (Nama File atau Export ID)
        if ($request->filled('search')) {
            $search = preg_quote($request->search, '/');
            $query->where(function($q) use ($search) {
                $q->where('file_name', 'regex', "/.*{$search}.*/i")
                  ->orWhere('export_id', 'regex', "/.*{$search}.*/i");
            });
        }

        // Sorting
        $sortOrder = $request->query('sort', 'terbaru');
        $direction = $sortOrder === 'terlama' ? 'asc' : 'desc';

        // Pagination
        $histories = $query->orderBy('created_at', $direction)
                           ->paginate(10)
                           ->withQueryString();

        return Inertia::render('Organizer/Export', [
            'stats' => $stats,
            'histories' => $histories,
            'filters' => $request->only(['search', 'type', 'sort'])
        ]);
    }

  public function download(Request $request)
    {
        $organizerId = auth()->id();
        $types = explode(',', $request->types);
        $startDate = $request->start_date ? \Carbon\Carbon::parse($request->start_date)->startOfDay() : null;
        $endDate = $request->end_date ? \Carbon\Carbon::parse($request->end_date)->endOfDay() : null;

        // 1. Kalkulasi Records
        $totalRecords = 0;
        if (in_array('events', $types)) {
            $q = Event::where('organizer_id', $organizerId);
            if ($startDate && $endDate) $q->whereBetween('created_at', [$startDate, $endDate]);
            $totalRecords += $q->count();
        }
        if (in_array('bookings', $types)) {
            $q = Payment::where('organizer_id', $organizerId);
            if ($startDate && $endDate) $q->whereBetween('created_at', [$startDate, $endDate]);
            $totalRecords += $q->count();
        }
        if (in_array('finance', $types)) {
            $q = Payment::where('organizer_id', $organizerId)->where('payment_status', 'PAID');
            if ($startDate && $endDate) $q->whereBetween('created_at', [$startDate, $endDate]);
            $totalRecords += $q->count();
        }
        if (in_array('wallet', $types)) {
            $q = \App\Models\Withdrawal::where('organizer_id', $organizerId); // Pastikan Modelnya sesuai
            if ($startDate && $endDate) $q->whereBetween('created_at', [$startDate, $endDate]);
            $totalRecords += $q->count();
        }

        // 2. Siapkan Nama File
        $exportId = 'E-' . rand(10000, 99999);
        $fileName = 'Data_Export_' . date('Ymd_His') . '.xlsx';

        // ========================================================
        // 3. MAGIC TRICK: GENERATE EXCEL LANGSUNG DI MEMORY (RAM)
        // ========================================================
        $rawExcel = \Maatwebsite\Excel\Facades\Excel::raw(
            new \App\Exports\MasterExport($types, $startDate, $endDate, $organizerId), 
            \Maatwebsite\Excel\Excel::XLSX
        );

        // 4. Hitung Ukuran File Asli dari Memory (tanpa perlu baca disk)
        $fileSizeBytes = strlen($rawExcel);
        $fileSizeKb = $fileSizeBytes / 1024;
        
        $sizeText = $fileSizeKb > 1024 
                    ? round($fileSizeKb / 1024, 1) . ' MB' 
                    : round($fileSizeKb, 1) . ' KB';

        // 5. Simpan Riwayat ke Database
        ExportHistory::create([
            'organizer_id' => $organizerId,
            'export_id' => $exportId,
            'file_name' => $fileName,
            'data_types' => $types,
            'total_records' => $totalRecords,
            'file_size_mb' => $sizeText, 
        ]);

        // 6. Tembakkan langsung data memory-nya ke Browser User
        return response($rawExcel)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', 'attachment; filename="' . $fileName . '"');
    }
    }
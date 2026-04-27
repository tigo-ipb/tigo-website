<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\TicketValidation;
use App\Models\User;

class MobileDashboardController extends Controller
{
    public function stats(Request $request)
    {
        $request->validate([
            'event_id' => 'required|string'
        ]);

        $eventId = $request->event_id;
        $event = Event::find($eventId);

        if (!$event) {
            return response()->json(['success' => false, 'message' => 'Event tidak ditemukan'], 404);
        }

        // 1. Ambil SEMUA tiket yang terjual untuk event ini
        $allTickets = TicketValidation::where('event_id', $eventId)->get();
        
        $totalSold = $allTickets->count(); // Total tiket terjual (angka 500 di UI)
        $totalScanned = $allTickets->where('is_used', true)->count(); // Pengunjung masuk (angka 250 di UI)

        // 2. Hitung Rincian per Tipe Tiket (Progress Bar di UI)
        // Kita kelompokkan koleksi berdasarkan 'type_name'
        $groupedTickets = $allTickets->groupBy('type_name');
        
        $ticketBreakdown = [];
        foreach ($groupedTickets as $typeName => $tickets) {
            $ticketBreakdown[] = [
                'type_name' => $typeName,
                'scanned' => $tickets->where('is_used', true)->count(),
                'sold' => $tickets->count()
            ];
        }

        // 3. Riwayat "Scan Terakhir" (Ambil 10 data terbaru yang sudah is_used = true)
        $recentScansRaw = TicketValidation::where('event_id', $eventId)
                            ->where('is_used', true)
                            ->orderBy('scanned_at', 'desc')
                            ->limit(10)
                            ->get();

        $recentScans = $recentScansRaw->map(function ($ticket) use ($event) {
            $user = User::find($ticket->user_id);
            return [
                'order_id' => substr($ticket->_id, -8), // Ambil 8 karakter terakhir ID sebagai Order ID
                'buyer_name' => $user ? $user->name : 'Unknown',
                'scanned_at' => $ticket->scanned_at->format('d/m/Y H:i'),
                'event_name' => $event->name,
                'category' => $event->category_name
            ];
        });

        // 4. Return Data
        return response()->json([
            'success' => true,
            'data' => [
                'event_name' => $event->name,
                'summary' => [
                    'total_scanned' => $totalScanned,
                    'total_sold' => $totalSold,
                ],
                'breakdown' => $ticketBreakdown,
                'recent_scans' => $recentScans
            ]
        ], 200);
    }
}
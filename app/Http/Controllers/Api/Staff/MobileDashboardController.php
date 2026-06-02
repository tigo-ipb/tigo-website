<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Event;
use App\Models\TicketValidation;
use App\Models\Payment;
use App\Models\ScanLog;

class MobileDashboardController extends Controller
{
    public function stats(Request $request)
    {
        // 1. Ambil SEMUA event yang berstatus Aktif dan belum berakhir
        // (Silakan sesuaikan value 'Aktif' jika di database Mas Aryo menggunakan bahasa Inggris misal 'ACTIVE')
        $activeEvents = Event::where('status', 'active')
                             ->where('date_end', '>=', now())
                             ->get();

        // Jika tidak ada event yang aktif saat ini
        if ($activeEvents->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'Tidak ada event aktif saat ini.',
                'data' => [
                    'event_id'   => '',
                    'event_name' => 'Tidak Ada Event Aktif',
                    'summary' => [
                        'total_scanned' => 0,
                        'total_sold' => 0,
                    ],
                    'breakdown' => [],
                    'recent_scans' => []
                ]
            ], 200);
        }

        // Ambil event pertama sebagai default event_id untuk keperluan scan
        $defaultEvent = $activeEvents->first();

        // Kumpulkan semua ID event aktif ke dalam bentuk Array
        $activeEventIds = $activeEvents->pluck('_id')->toArray();
        
        // Simpan data event dengan key ID agar mudah diambil nama event-nya nanti
        $eventsById = $activeEvents->keyBy('_id');


        // =========================================================
        // 2. STATISTIK TIKET (Gabungan dari SEMUA event aktif)
        // =========================================================
        // Menggunakan whereIn untuk mencari tiket dari banyak event sekaligus
        $allTickets = TicketValidation::whereIn('event_id', $activeEventIds)->get();
        
        $paymentIds = $allTickets->pluck('payment_id')->unique();
        $allPayments = Payment::whereIn('_id', $paymentIds)->get()->keyBy('_id');

        $totalSold = $allTickets->count();
        $totalScanned = 0;

        $stats = [
            'IPB' => ['total' => 0, 'scanned' => 0],
            'General' => ['total' => 0, 'scanned' => 0],
        ];

        foreach ($allTickets as $ticket) {
            $payment = $allPayments->get($ticket->payment_id);
            $customerInfo = $payment ? $payment->customer_info : [];
            
            if (is_string($customerInfo)) {
                $customerInfo = json_decode($customerInfo, true) ?? [];
            } else {
                $customerInfo = (array) $customerInfo;
            }
            
            $email = $customerInfo['email'] ?? '';
            $isIpb = str_contains(strtolower($email), '@apps.ipb.ac.id');
            $category = $isIpb ? 'IPB' : 'General';

            $stats[$category]['total']++;
            if ($ticket->is_used) {
                $stats[$category]['scanned']++;
                $totalScanned++;
            }
        }

        $ticketBreakdown = [];
        foreach ($stats as $name => $data) {
            $ticketBreakdown[] = [
                'type_name' => $name,
                'scanned' => $data['scanned'],
                'sold' => $data['total']
            ];
        }


        // =========================================================
        // 3. RIWAYAT SCAN TERAKHIR (Gabungan dari SEMUA event aktif)
        // =========================================================
        // Menggunakan whereIn untuk mengambil log dari semua acara
        $recentScansRaw = ScanLog::whereIn('event_id', $activeEventIds)
                            ->orderBy('created_at', 'desc')
                            ->limit(10)
                            ->get();

        $recentScans = $recentScansRaw->map(function ($log) use ($eventsById) {
            // Cocokkan event_id di log dengan array eventsById untuk mendapatkan nama acara
            $eventName = $eventsById->has($log->event_id) ? $eventsById->get($log->event_id)->name : 'Unknown Event';

            return [
                'order_id' => $log->order_id,
                'buyer_name' => $log->customer_name,
                'scanned_at' => $log->created_at ? $log->created_at->format('d/m/Y H:i') : null,
                'event_name' => $eventName, // Memunculkan nama event yang sedang berlangsung
                'category' => $log->category,
                'status' => $log->status, 
                'reason' => $log->reason
            ];
        });


        // =========================================================
        // 4. RETURN DATA KE MOBILE
        // =========================================================
        return response()->json([
            'success' => true,
            'data' => [
                'event_id'   => (string) $defaultEvent->_id, // Event pertama sebagai default untuk scan
                'event_name' => 'Semua Event Aktif', // Diubah menjadi label Global
                'summary' => [
                    'total_scanned' => $totalScanned,
                    'total_sold' => $totalSold,
                ],
                'breakdown' => $ticketBreakdown,
                'recent_scans' => $recentScans
            ]
        ], 200);
    }

    public function getActiveEvents()
    {
        $activeEvents = Event::where('status', 'active')
                             ->where('date_end', '>=', now())
                             ->get(['_id', 'name']); // Ambil ID dan Nama saja

        return response()->json([
            'success' => true,
            'data' => $activeEvents
        ], 200);
    }
}
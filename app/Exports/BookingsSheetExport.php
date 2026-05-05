<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;

class BookingsSheetExport implements FromCollection, WithHeadings, WithTitle, WithMapping
{
    protected $startDate;
    protected $endDate;
    protected $organizerId;

    public function __construct($startDate, $endDate, $organizerId)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->organizerId = $organizerId;
    }

    public function collection()
    {
        $query = Payment::with(['user', 'event'])->where('organizer_id', $this->organizerId);
        if ($this->startDate && $this->endDate) $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        return $query->get();
    }

    public function map($payment): array
    {
        // Sesuaikan terjemahan status
        $statusText = 'Dibatalkan';
        if ($payment->payment_status === 'PAID') $statusText = 'Dibayar';
        if ($payment->payment_status === 'PENDING') $statusText = 'Menunggu';

        return [
            $payment->external_id,
            $payment->created_at->format('d/m/Y H:i'),
            $payment->user->name ?? 'Pengunjung',
            $payment->user->email ?? '-',
            $payment->event->name ?? 'Event Dihapus',
            $payment->quantity ?? 1, // Ganti 'quantity' jika nama kolom di DB beda
            'Rp ' . number_format($payment->sub_total ?? 0, 0, ',', '.'),
            $statusText,
        ];
    }

    public function headings(): array
    {
        return ['Order ID', 'Waktu', 'Nama', 'Email', 'Event', 'Qty', 'Jumlah', 'Status'];
    }

    public function title(): string
    {
        return 'Riwayat Booking';
    }
}
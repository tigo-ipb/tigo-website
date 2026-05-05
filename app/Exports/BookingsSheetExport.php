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
        $query = Payment::with('user')->where('organizer_id', $this->organizerId);
        
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        }

        return $query->get();
    }

    public function map($payment): array
    {
        return [
            $payment->external_id,
            $payment->user ? $payment->user->name : 'Pengunjung',
            $payment->payment_status,
            $payment->sub_total,
            $payment->net_for_eo,
            $payment->created_at->format('d-m-Y H:i'),
        ];
    }

    public function headings(): array
    {
        return [
            'Order ID',
            'Nama Pembeli',
            'Status Pembayaran',
            'Total Bayar (Rp)',
            'Pendapatan Bersih (Rp)',
            'Tanggal Beli',
        ];
    }

    public function title(): string
    {
        return 'Data Bookings';
    }
}
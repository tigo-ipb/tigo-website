<?php

namespace App\Exports;

use App\Models\Payment;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;

class FinanceSheetExport implements FromCollection, WithHeadings, WithTitle, WithMapping
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
        // Hanya ambil yang PAID dan load relasi event & user
        $query = Payment::with(['user', 'event'])
            ->where('organizer_id', $this->organizerId)
            ->where('payment_status', 'PAID');
        
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        }

        return $query->get();
    }

    public function map($payment): array
    {
        return [
            $payment->external_id,
            $payment->created_at->format('d-m-Y H:i'),
            $payment->event ? $payment->event->name : 'Event Dihapus',
            $payment->user ? $payment->user->name : 'Pengunjung',
            $payment->sub_total,
            $payment->platform_fee ?? 0, // Biaya layanan platform (jika ada)
            $payment->net_for_eo, // Ini yang paling penting untuk Finance!
        ];
    }

    public function headings(): array
    {
        return [
            'Order ID',
            'Tanggal Transaksi',
            'Nama Event',
            'Nama Pembeli',
            'Bruto / Sub Total (Rp)',
            'Potongan Platform (Rp)',
            'Netto / Masuk Dompet (Rp)',
        ];
    }

    public function title(): string
    {
        return 'Data Finance';
    }
}
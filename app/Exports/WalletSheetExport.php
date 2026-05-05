<?php

namespace App\Exports;

use App\Models\Withdrawal;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;

class WalletSheetExport implements FromCollection, WithHeadings, WithTitle, WithMapping
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
        $query = Withdrawal::where('organizer_id', $this->organizerId);
        if ($this->startDate && $this->endDate) $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        return $query->get();
    }

    public function map($withdrawal): array
    {
        // 1. Gabungkan Nama Bank dan Rekening
        $bankName = $withdrawal->bank_info['bank_code'] ?? 'Bank';
        $accountNum = $withdrawal->bank_info['account_number'] ?? '';
        $tujuan = $bankName . ' - ' . $accountNum;

        // 2. Terjemahkan Status
        $statusText = 'Gagal';
        if ($withdrawal->status === 'SUCCESS') $statusText = 'Berhasil';
        if ($withdrawal->status === 'PENDING') $statusText = 'Diproses';

        // 3. Kalkulasi (pastikan propertinya sesuai dengan kolom di database Mas Aryo)
        $nominal = $withdrawal->amount ?? 0;
        $fee = $withdrawal->admin_fee ?? 0;
        $diterima = $nominal - $fee;

        return [
            $withdrawal->withdrawal_id ?? (string) $withdrawal->_id, // Ambil ID custom atau default bawaan Mongo
            $withdrawal->created_at->format('d/m/Y H:i'),
            $tujuan,
            $withdrawal->bank_info['account_name'] ?? '-', // Nama pemilik rekening
            'Rp ' . number_format($nominal, 0, ',', '.'),
            '-Rp ' . number_format($fee, 0, ',', '.'),
            'Rp ' . number_format($diterima, 0, ',', '.'),
            $statusText,
        ];
    }

    public function headings(): array
    {
        return ['Withdrawal ID', 'Waktu', 'Tujuan', 'Nama', 'Nominal', 'Fee', 'Diterima', 'Status'];
    }

    public function title(): string
    {
        return 'Riwayat Penarikan';
    }
}
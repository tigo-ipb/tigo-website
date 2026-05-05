<?php

namespace App\Exports;

use App\Models\Withdrawal; // Sesuaikan dengan nama Model penarikan Anda
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
        
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        }

        return $query->get();
    }

    public function map($withdrawal): array
    {
        // Ambil info bank dari array/object di MongoDB
        $bankCode = $withdrawal->bank_info['bank_code'] ?? '-';
        $accountNum = $withdrawal->bank_info['account_number'] ?? '-';
        $accountName = $withdrawal->bank_info['account_name'] ?? '-';

        return [
            (string) $withdrawal->_id,
            $withdrawal->created_at->format('d-m-Y H:i'),
            $bankCode,
            $accountNum,
            $accountName,
            $withdrawal->amount,
            $withdrawal->status, // PENDING, SUCCESS, FAILED
        ];
    }

    public function headings(): array
    {
        return [
            'Withdrawal ID',
            'Tanggal Penarikan',
            'Tujuan (Bank/E-Wallet)',
            'Nomor Rekening',
            'Nama Pemilik Rekening',
            'Nominal Penarikan (Rp)',
            'Status',
        ];
    }

    public function title(): string
    {
        return 'Riwayat Penarikan (Wallet)';
    }
}
<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class MasterExport implements WithMultipleSheets
{
    protected $types;
    protected $startDate;
    protected $endDate;
    protected $organizerId;

    public function __construct($types, $startDate, $endDate, $organizerId)
    {
        $this->types = $types;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->organizerId = $organizerId;
    }

    public function sheets(): array
    {
        $sheets = [];

        if (in_array('events', $this->types)) {
            $sheets[] = new EventsSheetExport($this->startDate, $this->endDate, $this->organizerId);
        }
        if (in_array('bookings', $this->types)) {
            $sheets[] = new BookingsSheetExport($this->startDate, $this->endDate, $this->organizerId);
        }
        // TAMBAHAN UNTUK FINANCE & WALLET
        if (in_array('finance', $this->types)) {
            $sheets[] = new FinanceSheetExport($this->startDate, $this->endDate, $this->organizerId);
        }
        if (in_array('wallet', $this->types)) {
            $sheets[] = new WalletSheetExport($this->startDate, $this->endDate, $this->organizerId);
        }

        return $sheets;
    }
}
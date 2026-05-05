<?php

namespace App\Exports;

use App\Models\Event;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithMapping;

class EventsSheetExport implements FromCollection, WithHeadings, WithTitle, WithMapping
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
        $query = Event::where('organizer_id', $this->organizerId);
        
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [$this->startDate, $this->endDate]);
        }

        return $query->get();
    }

    // Mapping Data: Pilih kolom apa saja yang mau dicetak
    public function map($event): array
    {
        return [
            $event->_id,
            $event->name,
            $event->category_name ?? 'Lainnya',
            $event->created_at->format('d-m-Y H:i'),
        ];
    }

    // Header Kolom di Excel
    public function headings(): array
    {
        return [
            'Event ID',
            'Nama Event',
            'Kategori',
            'Dibuat Pada',
        ];
    }

    // Nama Tab Sheet
    public function title(): string
    {
        return 'Data Events';
    }
}
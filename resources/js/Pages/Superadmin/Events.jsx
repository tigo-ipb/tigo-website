import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, router, Link } from '@inertiajs/react';
import { 
    IconCalendarEvent, IconCalendarCheck, IconCalendarTime, 
    IconEdit, IconTrash
} from '@tabler/icons-react';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";

// --- IMPORT KOMPONEN TIGO ---
import StatCard from '@/Components/StatCard';
import Search from '@/Components/Search';
import DynamicTable from '@/Components/Table';
import Pagination from '@/Components/Pagination';

export default function Events({ stats, events, filters }) {
    
    // ================= STATE FILTER (BULLETPROOF) =================
    const safeFilters = filters || {};
    const [search, setSearch] = useState(safeFilters.search || '');
    const [statusTab, setStatusTab] = useState(safeFilters.status || 'Semua');
    const [sort, setSort] = useState(safeFilters.sort || 'terbaru');

    const updateFilter = (newFilters = {}) => {
        const query = {
            search: search,
            status: statusTab,
            sort: sort,
            ...newFilters
        };

        // Bersihkan parameter kosong
        Object.keys(query).forEach(key => (!query[key] || query[key] === 'Semua') && delete query[key]);

        router.get(route('superadmin.events'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true 
        });
    };

    const selectTriggerClass =
    "h-[36px] px-4 bg-sky-500 border-0 rounded-full text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

    // ================= DEFINISI KOLOM TABEL =================
    const eventColumns = [
        { 
            header: 'Event ID', 
            render: (row) => `EV-${(row.id || row._id || '').substring(0,4).toUpperCase()}`, 
            cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' 
        },
        { 
            header: 'Event', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <p className="text-sm font-semibold text-neutral-900">{row.name}</p>
                    <p className="text-xs text-neutral-500">{row.category_name}</p>
                </div>
            ) 
        },
        { 
            header: 'Penyelenggara', 
            accessor: 'organizer_name', 
            cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' 
        },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap text-xs font-medium text-neutral-800">
                    {row.start_date} <br/> <span className="text-neutral-400">{row.start_time}</span>
                    <span className="mx-2 text-neutral-300">-</span>
                    {row.end_date} <br/> <span className="text-neutral-400">{row.end_time}</span>
                </div>
            ) 
        },
        { 
            header: 'Alamat', 
            render: (row) => (
                <div className="max-w-[200px]">
                    <p className="truncate font-medium text-neutral-900">{row.venue}</p>
                    <p className="text-xs text-neutral-400 truncate">{row.address}</p>
                </div>
            ) 
        },
        { 
            header: 'Status', 
            render: (row) => {
                if (row.status === 'active') return <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-green-500 text-green-500 bg-white">Active</span>;
                if (row.status === 'draft') return <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-neutral-500 text-neutral-500 bg-white">Draft</span>;
                return <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-yellow-500 text-yellow-500 bg-white">Archive</span>;
            } 
        },
        { 
            header: 'Aksi', 
            headerClassName: 'text-center', 
            cellClassName: 'text-center', 
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <Link href={route('superadmin.events.edit', row.id || row._id)} className="p-1.5 bg-sky-50 text-sky-500 rounded-md hover:bg-sky-100 transition-colors">
                        <IconEdit size={16}/>
                    </Link>
                    <button className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors">
                        <IconTrash size={16}/>
                    </button>
                </div>
            ) 
        }
    ];

    return (
        <DashboardLayout header="Events">
            <Head title="Events" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconCalendarEvent} label="Total Event" value={stats.total.toLocaleString('id-ID')} />
                    <StatCard icon={IconCalendarCheck} label="Active Event" value={stats.active.toLocaleString('id-ID')} />
                    <StatCard icon={IconCalendarTime} label="Archived Event" value={stats.archived.toLocaleString('id-ID')} />
                </div>

                {/* 2. TABEL EVENTS */}
                <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col gap-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
                            <h4 className="font-medium text-xl text-neutral-950 shrink-0">Events</h4>
                            {/* Filter Tabs (Style Membulat/Pil) */}
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                                {['Semua', 'Active', 'Draft', 'Archive'].map((tab) => {
                                    // Contoh Mapping Value Backend (Sesuaikan dengan kebutuhan halaman)
                                    const val = tab === 'Semua' ? 'Semua' : tab.toLowerCase();

                                    // Pastikan variabel status state-nya sesuai dengan halaman (misal: w_status, statusTab, dll)
                                    const isActive = statusTab === tab || statusTab === val;

                                    return (
                                        <button 
                                            key={tab} 
                                            type="button" 
                                            onClick={() => {
                                                setStatusTab(tab);
                                                updateFilter({ status: val });
                                            }}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[16px] text-xs font-semibold transition-all shrink-0 capitalize ${
                                                isActive 
                                                    ? 'bg-sky-500 text-white shadow-sm' 
                                                    : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 cursor-pointer'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex w-full xl:w-auto gap-3 items-center shrink-0">
                            {/* 🔥 Menggunakan Komponen Search Tigo 🔥 */}
                            <Search
                                value={search}
                                onChange={setSearch}
                                onSubmit={(val) => updateFilter({ search: val })}
                                placeholder="Cari nama, event..."
                                className="flex-1 xl:w-[240px]"
                            />
                            
                            <Select value={sort} onValueChange={(val) => { setSort(val); updateFilter({ sort: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 w-[var(--radix-select-trigger-width)] min-w-[120px]">
                                    <SelectItem value="terbaru" className="font-medium text-sm text-neutral-700 focus:bg-sky-50 focus:text-sky-500 cursor-pointer py-2.5 px-3 rounded-xl">Terbaru</SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-sm text-neutral-700 focus:bg-sky-50 focus:text-sky-500 cursor-pointer py-2.5 px-3 rounded-xl">Terlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* 🔥 Menggunakan Komponen Dynamic Table 🔥 */}
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={eventColumns} 
                            data={events?.data} 
                            emptyMessage="Tidak ada data event ditemukan."
                            minWidth="min-w-[1100px]" 
                        />
                    </div>
                </div>

                {/* 🔥 Menggunakan Komponen Pagination Tigo 🔥 */}
                {events && events.data && events.data.length > 0 && (
                    <Pagination
                        pagination={events}
                        onPageChange={(page) => updateFilter({ page })}
                    />
                )}

            </div>
        </DashboardLayout>
    );
}
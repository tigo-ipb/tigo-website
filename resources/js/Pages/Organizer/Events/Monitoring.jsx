import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { IconChevronRight, IconCheck, IconX } from '@tabler/icons-react';
import Search from '@/Components/Search';
import DynamicTable from '@/Components/Table';
import Pagination from '@/Components/Pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

const selectTriggerClass =
    "h-[36px] px-4 bg-sky-500 border-0 rounded-full text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

export default function Monitoring({ auth, event, totalTickets, scannedTickets, ticketStats, scans, filters }) {
    // 1. State diambil langsung dari server backend untuk menjaga posisi filter
    const [statusTab, setStatusTab] = useState(filters?.status || 'Semua');
    const [search, setSearch] = useState(filters?.search || '');
    const [sort, setSort] = useState(filters?.sort || 'Terbaru');

    // 2. Fungsi Utama untuk memanggil Router ke Backend
    const updateFilter = (newFilters = {}) => {
        const query = {
            status: statusTab,
            search,
            sort,
            ...newFilters,
        };

        // Bersihkan parameter jika kosong agar URL rapi
        Object.keys(query).forEach(key => !query[key] && delete query[key]);

        router.get(route('organizer.events.monitoring', event.id), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const customHeader = (
        <div className="flex items-center justify-center text-lg md:text-xl font-semibold">
            <Link href={route('organizer.events.index')} className="text-neutral-900 hover:text-sky-500 transition-colors">
                Events
            </Link>
            <IconChevronRight size={20} className="mx-2 text-neutral-400" />
            <span className="text-sky-500">Event Monitoring</span>
        </div>
    );

    // Fungsi untuk menembak API manual action
    const handleAction = (logId, actionType) => {
        if (confirm(`Apakah Anda yakin ingin ${actionType} pengunjung ini?`)) {
            router.post(route('organizer.events.monitoring.action', { event: event.id, log: logId }), {
                action: actionType
            }, {
                preserveScroll: true,
                preserveState: true,
            });
        }
    };

    const scanColumns = [
        { header: 'Order ID', accessor: 'order_id', cellClassName: 'font-medium text-neutral-950 whitespace-nowrap' },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <div className="font-medium text-neutral-800">
                        {new Date(row.updated_at).toLocaleDateString('id-ID')}
                    </div>
                    <div className="text-xs text-neutral-500">
                        {new Date(row.updated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>
            )
        },
        { 
            header: 'Event & Kategori', 
            render: (row) => (
                <>
                    <p className="text-neutral-950 font-medium truncate">{row.event_name}</p>
                    <p className="text-xs text-sky-500 font-semibold mt-0.5">{row.category} <span className="text-neutral-400 font-normal">({row.type_name})</span></p>
                </>
            )
        },
        { 
            header: 'Nama', 
            render: (row) => (
                <>
                    <p className="text-neutral-950 font-medium whitespace-nowrap">{row.customer_name}</p>
                    <p className="text-xs text-neutral-500">{row.email}</p>
                </>
            )
        },
        { 
            header: 'Status', 
            render: (row) => {
                if (row.status === 'SUCCESS') {
                    return <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-green-500 text-green-500">Berhasil</span>;
                }
                if (row.status === 'REJECTED') {
                    return <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-red-500 text-red-500">Gagal</span>;
                }
                return (
                    <div>
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border border-red-500 text-red-500">Gagal</span>
                    </div>
                );
            }
        },
        { header: 'Pesan', accessor: 'reason', cellClassName: 'font-medium text-neutral-950 whitespace-nowrap capitalize' },
    ];

    return (
        <DashboardLayout header={customHeader} user={auth?.user}>
            <Head title={`Monitoring - ${event.name}`} />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                
                {/* --- CARD PROGRESS BAR --- */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-xl font-medium text-neutral-950">Total Pengunjung</h4>
                        <div className="bg-sky-50 text-sky-500 px-4 py-1.5 rounded-full font-medium text-sm border border-sky-100">
                            <span className="font-bold">{scannedTickets}</span> / <span className="text-sky-300">{totalTickets}</span>
                        </div>
                    </div>

                    {ticketStats.map((stat, index) => (
                        <div key={index} className="mb-4 last:mb-0">
                            <div className="flex justify-between text-xs font-medium mb-2">
                                <span className="text-neutral-600">{stat.name}</span>
                                <span className="text-neutral-900">
                                    {stat.scanned} <span className="text-neutral-400">/ {stat.total}</span>
                                </span>
                            </div>
                            <div className="w-full bg-neutral-100 rounded-full h-3">
                                <div 
                                    className="bg-sky-500 h-3 rounded-full transition-all duration-500" 
                                    style={{ width: `${stat.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- CARD TABEL DENGAN FILTER BACKEND --- */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                            <h4 className="font-medium text-xl text-neutral-950 shrink-0">Scan Terakhir</h4>
                            
                            {/* Filter Tabs Status */}
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                                {['Semua', 'Berhasil', 'Gagal'].map((tab) => {
                                    const isActive = (filters?.status || 'Semua') === tab;
                                    return (
                                        <button 
                                            key={tab} 
                                            type="button" 
                                            onClick={() => { setStatusTab(tab); updateFilter({ status: tab, page: 1 }); }}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-[16px] text-xs font-semibold transition-all shrink-0 capitalize ${
                                                isActive 
                                                    ? 'bg-sky-500 text-white shadow-sm' 
                                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 cursor-pointer'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Search & Sort Dropdown */}
                        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center shrink-0">
                            <Search
                                value={search}
                                onChange={setSearch}
                                onSubmit={(val) => updateFilter({ search: val, page: 1 })}
                                placeholder="Cari ID, tujuan, nama..."
                                className="w-full sm:w-[240px]"
                            />
                            
                            <Select 
                                value={sort} 
                                onValueChange={(val) => { setSort(val); updateFilter({ sort: val, page: 1 }); }}
                            >
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[130px]">
                                    <SelectItem value="Terbaru" className="font-medium text-xs rounded-xl focus:bg-sky-50 focus:text-sky-500 cursor-pointer">
                                        Terbaru
                                    </SelectItem>
                                    <SelectItem value="Terlama" className="font-medium text-xs rounded-xl focus:bg-sky-50 focus:text-sky-500 cursor-pointer">
                                        Terlama
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={scanColumns} 
                            data={scans?.data} 
                            emptyMessage="Tidak ada data scan ditemukan."
                            minWidth="min-w-[900px]" 
                        />
                    </div>
                </div>

                {/* --- PAGINATION KOMPONEN TIGO --- */}
                {scans && scans.data && scans.data.length > 0 && (
                    <Pagination
                        pagination={scans}
                        onPageChange={(page) => updateFilter({ page })}
                    />
                )}
                
            </div>
        </DashboardLayout>
    );
}
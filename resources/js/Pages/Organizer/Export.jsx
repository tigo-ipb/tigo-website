import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import {
    IconTicket, IconWallet,
    IconCalendar, IconDownload, IconCalendarWeek, IconCoin,
} from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import DateRangeModal from '@/Components/DateRangeModal';
import Search from '@/Components/Search';
import Pagination from '@/Components/Pagination';
import StatCard from '@/Components/StatCard';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import DynamicTable from '@/Components/Table';

const DATE_PRESETS = ['7 Hari Terakhir', '30 Hari Terakhir', '3 Bulan Terakhir', '6 Bulan Terakhir'];

const applyDatePreset = (preset) => {
    const end = new Date();
    const start = new Date();

    switch (preset) {
        case '30 Hari Terakhir':
            start.setDate(end.getDate() - 30);
            break;
        case '3 Bulan Terakhir':
            start.setMonth(end.getMonth() - 3);
            break;
        case '6 Bulan Terakhir':
            start.setMonth(end.getMonth() - 6);
            break;
        default:
            start.setDate(end.getDate() - 7);
    }

    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
    };
};

const formatDisplayDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

export default function Export({ stats, histories, filters }) {
    const [selectedData, setSelectedData] = useState({
        events: true,
        bookings: false,
        finance: false,
        wallet: false,
    });

    const [dateFilter, setDateFilter] = useState(() => applyDatePreset('7 Hari Terakhir'));
    const [activePreset, setActivePreset] = useState('7 Hari Terakhir');

    const [historySearch, setHistorySearch] = useState(filters?.search || '');
    const [activeTab, setActiveTab] = useState(filters?.type || 'Semua');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'terbaru');

    const formatDateStr = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const toggleData = (key) => {
        setSelectedData(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleAll = () => {
        const allSelected = Object.values(selectedData).every(Boolean);
        setSelectedData({
            events: !allSelected,
            bookings: !allSelected,
            finance: !allSelected,
            wallet: !allSelected,
        });
    };

    const handlePresetClick = (preset) => {
        setActivePreset(preset);
        setDateFilter(applyDatePreset(preset));
    };

    const handleExport = () => {
        const types = Object.keys(selectedData).filter(k => selectedData[k]);
        if (types.length === 0) return alert("Pilih minimal 1 data yang ingin diexport!");

        const queryParams = new URLSearchParams({
            types: types.join(','),
            start_date: dateFilter.start || '',
            end_date: dateFilter.end || '',
        }).toString();

        window.location.href = `${route('organizer.export.download')}?${queryParams}`;

        setTimeout(() => {
            router.reload({ only: ['histories', 'stats'] });
        }, 2000);
    };

    const handleFilterChange = (newFilters = {}) => {
        const query = {
            search: historySearch,
            type: activeTab,
            sort_order: sortOrder,
            ...newFilters,
        };

        Object.keys(query).forEach(key => !query[key] && delete query[key]);

        router.get(route('organizer.export'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const dateLabel = dateFilter.start && dateFilter.end
        ? `${formatDisplayDate(dateFilter.start)} - ${formatDisplayDate(dateFilter.end)}`
        : 'Pilih rentang tanggal';

    const historyTabs = ['Semua', 'Events', 'Bookings', 'Finance', 'Wallet'];

    const exportColumns = [
        { 
            header: 'Export ID', 
            accessor: 'export_id',
            cellClassName: 'font-medium text-neutral-950 whitespace-nowrap'
        },
        { 
            header: 'Waktu', 
            render: (row) => {
                const formatted = formatDateStr(row.created_at);
                return (
                    <div className="whitespace-nowrap">
                        <div className="font-medium text-neutral-950">{formatted?.date}</div>
                        <div className="text-xs text-neutral-400">{formatted?.time}</div>
                    </div>
                );
            }
        },
        { 
            header: 'Nama File', 
            accessor: 'file_name',
            cellClassName: 'font-medium text-neutral-950 whitespace-nowrap'
        },
        { 
            header: 'Data', 
            render: (row) => (
                <div className="flex gap-1.5 flex-wrap">
                    {row.data_types?.map(type => (
                        <DataBadge key={type} type={type} />
                    ))}
                </div>
            )
        },
        { 
            header: 'Records', 
            headerClassName: 'text-center',
            cellClassName: 'text-center font-medium text-neutral-950 whitespace-nowrap',
            render: (row) => row.total_records?.toLocaleString('id-ID')
        },
        { 
            header: 'Ukuran', 
            accessor: 'file_size_mb',
            cellClassName: 'font-medium whitespace-nowrap'
        },
    ];

    return (
        <DashboardLayout header="Export">
            <Head title="Export Data" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard icon={IconCalendarWeek} label="Record Events" value={stats.events} />
                    <StatCard icon={IconTicket} label="Record Bookings" value={stats.bookings} />
                    <StatCard icon={IconCoin} label="Record Finance" value={stats.finance} />
                    <StatCard icon={IconWallet} label="Record Wallet" value={stats.wallet} />
                </div>

                {/* Export config */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-4 flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-medium text-neutral-950">Pilih Data yang Diekspor</h2>
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-neutral-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                                    checked={Object.values(selectedData).every(Boolean)}
                                    onChange={toggleAll}
                                />
                                <span className="text-sm font-medium text-neutral-500">Pilih semua</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <DataToggleItem icon={IconCalendarWeek} title="Events" active={selectedData.events} onClick={() => toggleData('events')} />
                            <DataToggleItem icon={IconTicket} title="Bookings" active={selectedData.bookings} onClick={() => toggleData('bookings')} />
                            <DataToggleItem icon={IconCoin} title="Finance" active={selectedData.finance} onClick={() => toggleData('finance')} />
                            <DataToggleItem icon={IconWallet} title="Wallet" active={selectedData.wallet} onClick={() => toggleData('wallet')} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-medium text-neutral-950 mb-4">Rentang Tanggal</h2>
                        <p className="text-sm font-regular text-neutral-500 mb-2">Tanggal Export</p>
                        <DateRangeModal
                            title="Rentang Tanggal Export"
                            actionLabel="Terapkan Tanggal"
                            onAction={(start, end) => {
                                setDateFilter({ start, end });
                                setActivePreset('');
                            }}
                            triggerNode={
                                <button
                                    type="button"
                                    className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-[12px] text-sm text-neutral-700 font-medium hover:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer transition-colors"
                                >
                                    <span>{dateLabel}</span>
                                    <IconCalendar size={20} className="text-neutral-400 shrink-0" stroke={1.5} />
                                </button>
                            }
                        />

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handlePresetClick(preset)}
                                    className={cn(
                                        "w-full px-4 py-2.5 rounded-full text-xs font-semibold text-center transition-colors",
                                        activePreset === preset
                                            ? "bg-sky-500 text-white"
                                            : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                                    )}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleExport}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-[12px] text-sm transition-colors active:scale-[0.99] cursor-pointer"
                    >
                        <IconDownload size={20} stroke={2} />
                        Export
                    </button>
                </div>

                {/* Riwayat export */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-4">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        {/* Left Side: Title & Tabs */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                            <h2 className="text-xl font-medium text-neutral-950 shrink-0">Riwayat Export</h2>
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                                {historyTabs.map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab);
                                            handleFilterChange({ type: tab });
                                        }}
                                        className={cn(
                                            "px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0",
                                            activeTab === tab
                                                ? "bg-sky-500 text-white"
                                                : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right Side: Search & Sortir */}
                        <div className="flex w-full lg:w-auto gap-3 items-center shrink-0">
                            <Search
                                value={historySearch}
                                onChange={setHistorySearch}
                                onSubmit={(val) => handleFilterChange({ search: val })}
                                placeholder="Cari data ekspor"
                                className="flex-1 lg:w-[240px] xl:w-[280px]"
                            />
                            <Select
                                value={sortOrder}
                                onValueChange={(val) => {
                                    setSortOrder(val);
                                    handleFilterChange({ sort_order: val });
                                }}
                            >
                                <SelectTrigger className="bg-sky-500 text-white text-xs font-medium px-4 py-2 h-auto rounded-full flex justify-between items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                    <SelectValue placeholder="Sortir" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-[24px] border border-gray-100 shadow-xl z-[100] p-1.5">
                                    <SelectItem value="terbaru" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Terbaru</SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Terlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={exportColumns} 
                            data={histories?.data} 
                            emptyMessage="Belum ada riwayat export data."
                            minWidth="min-w-[900px]" 
                        />
                    </div>
                </div>

                <Pagination
                    pagination={histories}
                    onPageChange={(page) => handleFilterChange({ page })}
                />
            </div>
        </DashboardLayout>
    );
}


function DataToggleItem({ icon: Icon, title, active, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "flex items-center justify-between w-full p-4 rounded-[16px] border transition-all cursor-pointer text-left",
                active
                    ? "border-sky-500 bg-white"
                    : "border-neutral-300 bg-white hover:border-sky-500"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-colors",
                    active ? "bg-[#e6f4fe] text-sky-500" : "bg-[#f0f2f5] text-neutral-400"
                )}>
                    <Icon size={22} stroke={active ? 2 : 1.5} />
                </div>
                <span className="font-semibold text-neutral-950 text-sm">{title}</span>
            </div>

            <div
                className={cn(
                    "w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0",
                    active ? "bg-sky-500 justify-end" : "bg-neutral-200 justify-start"
                )}
            >
                <div className="w-5 h-5 bg-white rounded-full" />
            </div>
        </button>
    );
}

function DataBadge({ type }) {
    const colors = {
        events: "border-sky-500 text-sky-500",
        finance: "border-green-500 text-green-500",
        wallet: "border-yellow-500 text-yellow-500",
        bookings: "border-red-500 text-red-500",
    };

    return (
        <span className={cn(
            "px-2 py-0.5 rounded-[4px] border text-[10px] font-medium capitalize",
            colors[type] || "border-neutral-300 text-gray-500 bg-gray-50"
        )}>
            {type}
        </span>
    );
}

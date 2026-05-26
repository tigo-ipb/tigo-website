import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import {
    IconCalendarEvent, IconTicket, IconReportMoney, IconWallet,
    IconCalendar, IconDownload,
} from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import DateRangeModal from '@/Components/DateRangeModal';
import Search from '@/Components/Search';
import Pagination from '@/Components/Pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

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

    return (
        <DashboardLayout header="Export">
            <Head title="Export Data" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <StatCard icon={IconCalendarEvent} title="Record Events" value={stats.events} />
                    <StatCard icon={IconTicket} title="Record Bookings" value={stats.bookings} />
                    <StatCard icon={IconReportMoney} title="Record Finance" value={stats.finance} />
                    <StatCard icon={IconWallet} title="Record Wallet" value={stats.wallet} />
                </div>

                {/* Export config */}
                <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-neutral-950">Pilih Data yang Diekspor</h2>
                            <label className="flex items-center gap-2 cursor-pointer shrink-0">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-[#00a2ff] focus:ring-[#00a2ff] cursor-pointer"
                                    checked={Object.values(selectedData).every(Boolean)}
                                    onChange={toggleAll}
                                />
                                <span className="text-sm font-medium text-neutral-500">Pilih semua</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <DataToggleItem icon={IconCalendarEvent} title="Events" active={selectedData.events} onClick={() => toggleData('events')} />
                            <DataToggleItem icon={IconTicket} title="Bookings" active={selectedData.bookings} onClick={() => toggleData('bookings')} />
                            <DataToggleItem icon={IconReportMoney} title="Finance" active={selectedData.finance} onClick={() => toggleData('finance')} />
                            <DataToggleItem icon={IconWallet} title="Wallet" active={selectedData.wallet} onClick={() => toggleData('wallet')} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-base font-bold text-neutral-950 mb-4">Rentang Tanggal</h2>
                        <p className="text-sm font-medium text-neutral-500 mb-2">Tanggal Export</p>
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
                                    className="flex items-center justify-between w-full px-4 py-2.5 bg-white border border-gray-200 rounded-[12px] text-sm text-neutral-700 font-medium hover:border-[#00a2ff] focus:outline-none focus:ring-1 focus:ring-[#00a2ff] cursor-pointer transition-colors"
                                >
                                    <span>{dateLabel}</span>
                                    <IconCalendar size={20} className="text-neutral-400 shrink-0" stroke={1.5} />
                                </button>
                            }
                        />

                        <div className="flex flex-wrap gap-2 mt-4">
                            {DATE_PRESETS.map(preset => (
                                <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handlePresetClick(preset)}
                                    className={cn(
                                        "px-4 py-2 rounded-[12px] text-sm font-bold transition-colors",
                                        activePreset === preset
                                            ? "bg-[#00a2ff] text-white shadow-sm shadow-[#00a2ff]/10"
                                            : "bg-[#f0f2f5] text-neutral-400 hover:bg-gray-200"
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
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#00a2ff] hover:bg-sky-600 text-white font-bold rounded-[12px] text-sm shadow-sm shadow-[#00a2ff]/10 transition-colors active:scale-[0.99] cursor-pointer"
                    >
                        <IconDownload size={20} stroke={2} />
                        Export
                    </button>
                </div>

                {/* Riwayat export */}
                <div className="bg-white border border-gray-100 rounded-[24px] p-6 shadow-sm">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-base font-bold text-neutral-950">Riwayat Export</h2>

                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full xl:w-auto">
                                {historyTabs.map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(tab);
                                            handleFilterChange({ type: tab });
                                        }}
                                        className={cn(
                                            "px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all shrink-0",
                                            activeTab === tab
                                                ? "bg-[#00a2ff] text-white shadow-sm shadow-[#00a2ff]/10"
                                                : "bg-[#f0f2f5] text-neutral-400 hover:bg-gray-200"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex w-full xl:w-auto gap-3 items-center">
                                <Search
                                    value={historySearch}
                                    onChange={setHistorySearch}
                                    onSubmit={(val) => handleFilterChange({ search: val })}
                                    placeholder="Cari nama, file, atau ID..."
                                    className="flex-1 xl:max-w-[280px]"
                                />
                                <Select
                                    value={sortOrder}
                                    onValueChange={(val) => {
                                        setSortOrder(val);
                                        handleFilterChange({ sort_order: val });
                                    }}
                                >
                                    <SelectTrigger className="w-[120px] h-[42px] px-4 bg-[#00a2ff] border-0 rounded-[12px] text-sm font-bold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0">
                                        <SelectValue placeholder="Sortir" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-[20px] border border-gray-100 shadow-xl z-[100] p-1.5">
                                        <SelectItem value="terbaru" className="font-medium text-sm text-gray-700 focus:bg-sky-50 focus:text-sky-600 cursor-pointer rounded-xl py-2.5 px-3">
                                            Terbaru
                                        </SelectItem>
                                        <SelectItem value="terlama" className="font-medium text-sm text-gray-700 focus:bg-sky-50 focus:text-sky-600 cursor-pointer rounded-xl py-2.5 px-3">
                                            Terlama
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 text-[#00a2ff] font-bold">
                                    <th className="py-3 px-2 whitespace-nowrap">Export ID</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Waktu</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Nama File</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Data</th>
                                    <th className="py-3 px-2 whitespace-nowrap text-center">Records</th>
                                    <th className="py-3 px-2 whitespace-nowrap">Ukuran</th>
                                </tr>
                            </thead>
                            <tbody className="text-neutral-700">
                                {histories?.data?.length > 0 ? histories.data.map((item, index) => {
                                    const formatted = formatDateStr(item.created_at);
                                    return (
                                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">{item.export_id}</td>
                                            <td className="py-4 px-2 whitespace-nowrap">
                                                <div className="font-medium text-neutral-950">{formatted?.date}</div>
                                                <div className="text-xs text-neutral-400">{formatted?.time}</div>
                                            </td>
                                            <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">{item.file_name}</td>
                                            <td className="py-4 px-2">
                                                <div className="flex gap-1.5 flex-wrap">
                                                    {item.data_types.map(type => (
                                                        <DataBadge key={type} type={type} />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-center font-bold text-neutral-950 whitespace-nowrap">
                                                {item.total_records.toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-4 px-2 font-medium whitespace-nowrap">{item.file_size_mb}</td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="6" className="py-10 text-center text-neutral-400 text-sm">
                                            Belum ada riwayat export data
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6">
                        <Pagination
                            pagination={histories}
                            onPageChange={(page) => handleFilterChange({ page })}
                        />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function StatCard({ icon: Icon, title, value }) {
    return (
        <div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 bg-[#e6f4fe] text-[#00a2ff] rounded-full flex items-center justify-center shrink-0">
                <Icon size={22} stroke={2} />
            </div>
            <div className="min-w-0">
                <p className="text-sm text-neutral-500 font-medium mb-0.5">{title}</p>
                <p className="text-2xl font-bold text-neutral-950 leading-tight">
                    {(value ?? 0).toLocaleString('id-ID')}
                </p>
            </div>
        </div>
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
                    ? "border-[#00a2ff] bg-white shadow-sm"
                    : "border-gray-100 bg-white hover:border-gray-200"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-colors",
                    active ? "bg-[#e6f4fe] text-[#00a2ff]" : "bg-[#f0f2f5] text-neutral-400"
                )}>
                    <Icon size={22} stroke={active ? 2 : 1.5} />
                </div>
                <span className="font-bold text-neutral-950 text-sm">{title}</span>
            </div>

            <div
                className={cn(
                    "w-11 h-6 rounded-full p-0.5 transition-colors flex items-center shrink-0",
                    active ? "bg-[#00a2ff] justify-end" : "bg-neutral-200 justify-start"
                )}
            >
                <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
        </button>
    );
}

function DataBadge({ type }) {
    const colors = {
        events: "border-sky-500 text-sky-500 bg-sky-50",
        finance: "border-green-500 text-green-600 bg-green-50",
        wallet: "border-yellow-500 text-yellow-600 bg-yellow-50",
        bookings: "border-red-500 text-red-500 bg-red-50",
    };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-md border text-[10px] font-bold capitalize",
            colors[type] || "border-gray-300 text-gray-500 bg-gray-50"
        )}>
            {type}
        </span>
    );
}

import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    IconCalendarEvent, IconTicket, IconReportMoney, IconWallet, 
    IconCalendarWeek, IconDownload, IconSearch, IconFilter,
    IconChevronLeft, IconChevronRight
} from '@tabler/icons-react';
import { cn } from "@/lib/utils";
import DateRangeModal from '@/Components/DateRangeModal';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";


export default function Export({ stats, histories, filters }) {
    // --- STATE PENGATURAN EXPORT ---
    const [selectedData, setSelectedData] = useState({
        events: true,
        bookings: false,
        finance: false,
        wallet: false,
    });
    
    // Simpan range tanggal dari Modal
    const [dateFilter, setDateFilter] = useState({ start: null, end: null });
    const [activePreset, setActivePreset] = useState('7 Hari Terakhir');

    // --- STATE FILTER RIWAYAT ---
    const [historySearch, setHistorySearch] = useState(filters?.search || '');
    const [activeTab, setActiveTab] = useState(filters?.type || 'Semua');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'terbaru');
    
    
    // --- Fungsi Helper Tanggal ---
    const formatDateStr = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // --- Action Handlers ---
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

    const handleExport = () => {
        const types = Object.keys(selectedData).filter(k => selectedData[k]);
        if (types.length === 0) return alert("Pilih minimal 1 data yang ingin diexport!");

        // 1. Ubah parameter menjadi Query String
        const queryParams = new URLSearchParams({
            types: types.join(','),
            start_date: dateFilter.start || '',
            end_date: dateFilter.end || ''
        }).toString();

        // 2. Trigger Download file Excel langsung dari Browser (bukan via router Inertia)
        window.location.href = `${route('organizer.export.download')}?${queryParams}`;

        // 3. Trick Inertia: Refresh tabel riwayat setelah 2 detik agar file baru muncul
        setTimeout(() => {
            router.reload({ only: ['histories', 'stats'] });
        }, 2000);
    };

    const handleFilterChange = (key, value) => {
            const query = { 
                search: historySearch,
                type: activeTab,
                sort_order: sortOrder,
                [key]: value 
            };
            
            // Memakai replace: true agar saat user klik tombol "Back" di browser,
            // dia tidak perlu melewati riwayat filter satu-satu.
            router.get(route('organizer.export'), query, { 
                preserveState: true, 
                preserveScroll: true,
                replace: true 
            });
        };

        const handleSearch = (e) => {
        if (e.key === 'Enter') {
            handleFilterChange('search', historySearch);
        }
    };

    // Text Label Tanggal untuk Trigger Modal
    const dateLabel = dateFilter.start && dateFilter.end 
        ? `${formatDateStr(dateFilter.start).date} - ${formatDateStr(dateFilter.end).date}` 
        : 'Pilih rentang tanggal';

    return (
        <DashboardLayout header={"Export"}>
            <Head title="Export Data" />

            <div className="flex flex-col h-full w-full gap-6">
                
                {/* =========================================
                    1. TOP STATS CARDS (Mengikuti style Wallet)
                ========================================== */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={<IconCalendarEvent size={24} />} title="Record Events" value={stats.events} />
                    <StatCard icon={<IconTicket size={24} />} title="Record Bookings" value={stats.bookings} />
                    <StatCard icon={<IconReportMoney size={24} />} title="Record Finance" value={stats.finance} />
                    <StatCard icon={<IconWallet size={24} />} title="Record Wallet" value={stats.wallet} />
                </div>

                {/* =========================================
                    2. PILIH DATA & TANGGAL EXPORT
                ========================================== */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm">
                    {/* Pilih Data */}
                    <div className="mb-10">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Pilih Data yang Diekspor</h2>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-gray-300 text-sky-500 focus:ring-sky-500 cursor-pointer"
                                    checked={Object.values(selectedData).every(Boolean)}
                                    onChange={toggleAll}
                                />
                                <span className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pilih semua</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DataToggleItem icon={<IconCalendarEvent />} title="Events" active={selectedData.events} onClick={() => toggleData('events')} />
                            <DataToggleItem icon={<IconTicket />} title="Bookings" active={selectedData.bookings} onClick={() => toggleData('bookings')} />
                            <DataToggleItem icon={<IconReportMoney />} title="Finance" active={selectedData.finance} onClick={() => toggleData('finance')} />
                            <DataToggleItem icon={<IconWallet />} title="Wallet" active={selectedData.wallet} onClick={() => toggleData('wallet')} />
                        </div>
                    </div>

                    {/* Rentang Tanggal */}
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Rentang Tanggal</h2>
                        <div className="mb-5">
                            <p className="text-sm font-medium text-gray-500 mb-2">Tanggal Export</p>
                            
                            {/* Panggil DateRangeModal di sini */}
                            <DateRangeModal
                                title="Rentang Tanggal Export"
                                actionLabel="Terapkan Tanggal"
                                onAction={(start, end) => setDateFilter({ start, end })}
                                triggerNode={
                                    <button className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 transition-all text-left font-medium hover:border-sky-500 focus:outline-none cursor-pointer focus:ring-2 focus:ring-sky-50">
                                        <span className="text-gray-400"><IconCalendarWeek size={20} stroke={2} /></span>
                                        {dateLabel}
                                    </button>
                                }
                            />
                        </div>

                        {/* Preset Pills */}
                        <div className="flex flex-wrap gap-2">
                            {['7 Hari Terakhir', '30 Hari Terakhir', '3 Bulan Terakhir', '6 Bulan Terakhir'].map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setActivePreset(preset)}
                                    className={cn(
                                        "px-5 py-2 rounded-full text-sm font-bold transition-colors border",
                                        activePreset === preset 
                                            ? "bg-sky-50 border-sky-200 text-sky-500" 
                                            : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                                    )}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tombol Export (Sama seperti tombol Tarik Saldo di Wallet) */}
                    <Button 
                        onClick={handleExport}
                        className="w-full py-6 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-base shadow-sm transition-all active:scale-[0.99]"
                    >
                        <IconDownload size={20} className="mr-2" /> Export
                    </Button>
                </div>

                {/* =========================================
                    3. TABEL RIWAYAT EXPORT (Mengikuti style Wallet)
                ========================================== */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                        
                        {/* Kiri: Judul & Tab Filter */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900 mr-4">Riwayat Export</h2>
                            <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                                {['Semua', 'Events', 'Bookings', 'Finance', 'Wallet'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => { 
                                            setActiveTab(tab); 
                                            handleFilterChange('type', tab); 
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors whitespace-nowrap ${
                                            activeTab === tab ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kanan: Search Bar & Filter */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input 
                                    type="text" 
                                    placeholder="Cari nama, file, atau ID..." 
                                     value={historySearch} 
                                    onChange={e => setHistorySearch(e.target.value)} 
                                    onKeyDown={handleSearch}
                                    className="pl-10 rounded-full border-gray-200 h-10 w-full focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                            <Select 
                                value={sortOrder} 
                                onValueChange={(val) => { 
                                    setSortOrder(val); 
                                    handleFilterChange('sort_order', val); 
                                }}
                            >
                                <SelectTrigger className="bg-[#0ea5e9] w-28 text-white text-xs font-medium px-4 py-2 h-auto rounded-full flex justify-between items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                    <SelectValue placeholder="Sortir" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    <SelectItem value="terbaru" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Terbaru</SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Terlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-200 text-sky-500 font-bold">
                                    <th className="py-4 px-2">Export ID</th>
                                    <th className="py-4 px-2">Waktu</th>
                                    <th className="py-4 px-2">Nama File</th>
                                    <th className="py-4 px-2">Data</th>
                                    <th className="py-4 px-2 text-center">Records</th>
                                    <th className="py-4 px-2">Ukuran</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {histories?.data?.length > 0 ? histories.data.map((item, index) => (
                                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="py-5 px-2 font-medium text-gray-900">{item.export_id}</td>
                                        <td className="py-4 px-2">
                                            <div className="font-medium text-gray-900">{formatDateStr(item.created_at).date}</div>
                                            <div className="text-xs text-gray-400">{formatDateStr(item.created_at).time}</div>
                                        </td>
                                        <td className="py-4 px-2 font-medium text-gray-900">{item.file_name}</td>
                                        <td className="py-4 px-2">
                                            <div className="flex gap-1.5 flex-wrap">
                                                {item.data_types.map(type => <DataBadge key={type} type={type} />)}
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-center font-bold text-gray-900">{item.total_records.toLocaleString('id-ID')}</td>
                                        <td className="py-4 px-2 font-medium">{item.file_size_mb}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400">Belum ada riwayat export data</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (Mengikuti style Wallet) */}
                    {histories?.links && histories.links.length > 3 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500 font-medium">
                                Menampilkan {histories.from || 0} dari {histories.total}
                            </span>
                            <div className="flex gap-1">
                                {histories.links.map((link, key) => (
                                    link.url ? (
                                        <Link 
                                            key={key} 
                                            href={link.url}
                                            preserveState preserveScroll
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                                link.active 
                                                    ? 'border-sky-500 bg-white text-sky-500 shadow-sm' 
                                                    : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50' 
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        <span 
                                            key={key}
                                            className="px-4 py-2 rounded-xl text-sm font-bold border border-transparent text-gray-300 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </DashboardLayout>
    );
}

// --- SUB COMPONENTS ---

function StatCard({ icon, title, value }) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-sky-50 text-sky-500 rounded-full flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{value.toLocaleString('id-ID')}</h2>
            </div>
        </div>
    );
}

function DataToggleItem({ icon, title, active, onClick }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all bg-white",
                active ? "border-sky-500 ring-1 ring-sky-500 shadow-sm" : "border-gray-200 hover:border-sky-300 hover:shadow-sm"
            )}
        >
            <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", active ? "bg-sky-100 text-sky-500" : "bg-gray-50 text-gray-500")}>
                    {React.cloneElement(icon, { size: 24, stroke: 1.5 })}
                </div>
                <span className="font-bold text-gray-900 text-base">{title}</span>
            </div>
            
            {/* Custom Toggle Switch */}
            <div className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors flex items-center shadow-inner",
                active ? "bg-sky-500 justify-end" : "bg-gray-200 justify-start"
            )}>
                <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform"></div>
            </div>
        </div>
    );
}

function DataBadge({ type }) {
    const colors = {
        events: "border-sky-500 text-sky-500 bg-sky-50",
        finance: "border-green-500 text-green-500 bg-green-50",
        wallet: "border-yellow-500 text-yellow-600 bg-yellow-50",
        bookings: "border-red-500 text-red-500 bg-red-50",
    };
    
    return (
        <span className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider", colors[type] || "border-gray-300 text-gray-500 bg-gray-50")}>
            {type}
        </span>
    );
}
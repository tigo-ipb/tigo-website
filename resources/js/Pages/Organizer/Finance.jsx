import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconCurrencyDollar, IconWallet, IconChartLine, IconSearch, IconChevronDown 
} from '@tabler/icons-react';

// Import Shadcn Select
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Index({ stats, chartPendapatan, topEvents, categories, transactions, filters }) {
    
    // --- 1. State Filter (diambil dari URL props jika ada) ---
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeTab, setActiveTab] = useState(filters?.status || 'Semua');
    const [chartFilter, setChartFilter] = useState(filters?.chart_filter || 'tahun_ini');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category_filter || 'minggu_ini');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'terbaru');

    console.log(transactions);
    
    // --- Helper Format Rupiah ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
    };

    // --- 2. Fungsi Filter (Sama Persis Gaya Dashboard) ---
    const handleFilterChange = (key, value) => {
        const query = { 
            search: searchTerm,
            status: activeTab,
            chart_filter: chartFilter,
            category_filter: categoryFilter,
            sort_order: sortOrder,
            [key]: value 
        };
        
        // Memakai replace: true agar saat user klik tombol "Back" di browser,
        // dia tidak perlu melewati riwayat filter satu-satu.
        router.get(route('organizer.finance'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true 
        });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            handleFilterChange('search', searchTerm);
        }
    };

    // ==========================================
    // 3. CONFIG APEXCHARTS: AREA CHART (PENDAPATAN)
    // ==========================================
    const areaSeries = [
        { name: 'Aktual', type: 'area', data: chartPendapatan.map(item => item.aktual) },
        { name: 'Target', type: 'line', data: chartPendapatan.map(item => item.target) }
    ];

    const areaOptions = {
        chart: { type: 'line', toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#94a3b8'],
        fill: {
            type: ['gradient', 'solid'],
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 90, 100] }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 5] },
        xaxis: {
            categories: chartPendapatan.map(item => item.name),
            axisBorder: { show: false }, axisTicks: { show: false },
            labels: { style: { colors: '#94a3b8', fontSize: '12px' } }, crosshairs: { show: false }
        },
        yaxis: {
            labels: { formatter: (value) => `${(value / 1000000).toFixed(1)}jt`, style: { colors: '#94a3b8', fontSize: '12px' } }
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
        tooltip: { shared: true, intersect: false, y: { formatter: (value) => formatRupiah(value) } },
        legend: { show: false } 
    };

    // ==========================================
    // 4. CONFIG APEXCHARTS: DONUT CHART (KATEGORI)
    // ==========================================
    const donutSeries = categories.map(cat => cat.value);
    
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: categories.map(cat => cat.color),
        labels: categories.map(cat => cat.name),
        dataLabels: { enabled: false },
        stroke: { width: 4, colors: ['#ffffff'] },
        legend: { show: false }, 
        plotOptions: {
            pie: {
                donut: {
                    size: '78%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '12px', color: '#6b7280', offsetY: -5 },
                        value: { show: true, fontSize: '24px', fontWeight: 700, color: '#111827', formatter: () => new Intl.NumberFormat("id-ID").format(stats.cat_total_tiket || 0) },
                        total: { show: true, showAlways: true, label: 'Total Penjualan', fontSize: '12px', color: '#6b7280', formatter: () => new Intl.NumberFormat("id-ID").format(stats.cat_total_tiket || 0) }
                    }
                }
            }
        },
        tooltip: { y: { formatter: (value) => formatRupiah(value) } }
    };

    return (
        <DashboardLayout header="Finance">
            <Head title="Finance Dashboard" />

            <div className="flex flex-col gap-6">

                {/* --- 1. TOP STATS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-blue-50 text-[#0ea5e9] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                            <IconCurrencyDollar size={28} stroke={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Pendapatan</p>
                            <h2 className="text-2xl font-bold text-gray-900">{formatRupiah(stats.total)}</h2>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-blue-50 text-[#0ea5e9] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                            <IconWallet size={28} stroke={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Saldo</p>
                            <h2 className="text-2xl font-bold text-gray-900">{formatRupiah(stats.saldo)}</h2>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 bg-blue-50 text-[#0ea5e9] rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                            <IconChartLine size={28} stroke={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Rata-Rata Pendapatan /Event</p>
                            <h2 className="text-2xl font-bold text-gray-900">{formatRupiah(stats.rata_rata)}</h2>
                        </div>
                    </div>
                </div>

                {/* --- 2. GRAFIK PENDAPATAN & TOP EVENT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Area Chart Pendapatan */}
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-lg font-bold text-gray-900">Pendapatan Penjualan</h3>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-full bg-[#0ea5e9]"></span> Aktual</div>
                                    <div className="flex items-center gap-2"><span className="w-3 h-1.5 border-t-2 border-dashed border-gray-400"></span> Target</div>
                                </div>
                                
                                {/* SHADCN SELECT: Chart Filter */}
                                <Select 
                                    value={chartFilter} 
                                    onValueChange={(val) => { 
                                        setChartFilter(val); 
                                        handleFilterChange('chart_filter', val); 
                                    }}
                                >
                                    <SelectTrigger className="bg-[#0ea5e9] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                        <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                        <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                        <SelectItem value="5_tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                        </div>
                        <div className="w-full h-[300px] -ml-4">
                            {/* Key prop dipakai agar chart render ulang mulus saat data berubah */}
                            <Chart key={`chart-${chartFilter}`} options={areaOptions} series={areaSeries} type="line" height="100%" />
                        </div>
                    </div>

                    {/* Top Pendapatan Event */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6">Top Pendapatan Event</h3>
                        <div className="space-y-5">
                            {topEvents.length > 0 ? topEvents.map((event, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 bg-blue-50 text-[#0ea5e9] text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate w-32 md:w-40">{event.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-500">{formatRupiah(event.revenue)}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400">Belum ada data event.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- 3. KATEGORI PENDAPATAN (DONUT) --- */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-lg font-bold text-gray-900">Kategori Pendapatan</h3>
                        
                        {/* SHADCN SELECT: Category Filter */}
                        <Select 
                            value={categoryFilter} 
                            onValueChange={(val) => { 
                                setCategoryFilter(val); 
                                handleFilterChange('category_filter', val); 
                            }}
                        >
                            <SelectTrigger className="bg-[#0ea5e9] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                <SelectValue placeholder="Pilih Waktu" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                <SelectItem value="minggu_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Minggu Ini</SelectItem>
                                <SelectItem value="bulan_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Bulan Ini</SelectItem>
                                <SelectItem value="6_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                <SelectItem value="5_tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-64 h-64 shrink-0">
                            {/* Key prop diubah mengikuti filter agar Donut rerender animasi */}
                            <Chart key={`donut-${categoryFilter}`} options={donutOptions} series={donutSeries} type="donut" height="100%" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full">
                            {categories.map((cat, idx) => (
                                <div key={idx} className="flex justify-between items-center border-l-4 pl-3" style={{ borderColor: cat.color }}>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-0.5">{cat.name}</p>
                                        <p className="text-lg font-bold text-gray-900">{formatRupiah(cat.value)}</p>
                                    </div>
                                    <div className="bg-blue-50 text-[#0ea5e9] px-3 py-1 rounded-lg text-sm font-bold">{cat.percentage}%</div>
                                </div>
                            ))}
                            {categories.length === 0 && <div className="text-sm text-gray-400 col-span-2">Belum ada data kategori.</div>}
                        </div>
                    </div>
                </div>

                {/* --- 4. RIWAYAT TRANSAKSI TABLE --- */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                        
                        {/* Tabs Kiri */}
                        <div className="flex items-center gap-4">
                            <h3 className="text-lg font-bold text-gray-900">Riwayat Transaksi</h3>
                            <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                                {['Semua', 'Dibayar', 'Menunggu', 'Dibatalkan'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => { 
                                            setActiveTab(tab); 
                                            handleFilterChange('status', tab); 
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                                            activeTab === tab ? 'bg-[#0ea5e9] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Select Kanan */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="Cari ID, nama..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]"
                                />
                            </div>

                            {/* SHADCN SELECT: Sort Order */}
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Order ID</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Waktu</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Nama</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Event</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs text-center">Qty</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Jumlah</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Fee</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Net</th>
                                    <th className="py-4 px-2 font-bold text-[#0ea5e9] text-xs">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {transactions?.data?.length > 0 ? (
                                    transactions.data.map((item, index) => {
                                        let statusColor = 'border-gray-200 text-gray-500 bg-gray-50';
                                        let statusText = item.payment_status;
                                        if(item.payment_status === 'PAID') { statusColor = 'border-green-300 text-green-600 bg-green-50'; statusText = 'Dibayar'; }
                                        if(item.payment_status === 'PENDING') { statusColor = 'border-yellow-300 text-yellow-600 bg-yellow-50'; statusText = 'Menunggu'; }

                                        return (
                                            <tr key={index} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                <td className="py-4 px-2 font-medium text-gray-900">{item.id?.substring(0,8)}</td>
                                                <td className="py-4 px-2 text-xs text-gray-500">
                                                    <div>{new Date(item.created_at).toLocaleDateString('id-ID')}</div>
                                                    <div>{new Date(item.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</div>
                                                </td>
                                                <td className="py-4 px-2 font-bold text-gray-900">{item.user?.name || 'User'}</td>
                                                <td className="py-4 px-2 text-xs">
                                                    <div className="font-bold text-gray-900">{item.event?.name}</div>
                                                    <div className="text-gray-500">{item.event?.category_name || 'Lainnya'}</div>
                                                </td>
                                                <td className="py-4 px-2 text-center font-medium">{(item.ticket_items || []).reduce((sum, t) => sum + t.quantity, 0)}</td>
                                                <td className="py-4 px-2 font-medium text-sm">{formatRupiah(item.sub_total)}</td>
                                                <td className="py-4 px-2 text-sm text-red-500">-{formatRupiah(item.platform_fee)}</td>
                                                <td className="py-4 px-2 font-bold text-sm text-green-500">{formatRupiah(item.net_for_eo)}</td>
                                                <td className="py-4 px-2">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr><td colSpan="9" className="py-8 text-center text-gray-400 font-medium text-sm">Belum ada transaksi ditemukan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
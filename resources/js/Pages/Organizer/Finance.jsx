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
} from "@/Components/ui/select";
import StatCard from '@/Components/StatCard';
import DynamicTable from '@/Components/Table'; // 🔥 Import komponen tabel dinamis
import Search from '@/Components/Search'; // 🔥 Import komponen pencarian dinamis
import Pagination from '@/Components/Pagination'; // 🔥 Import pagination

export default function Index({ stats, chartPendapatan, topEvents, categories, transactions, filters }) {
    
    // --- 1. State Filter (diambil dari URL props jika ada) ---
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeTab, setActiveTab] = useState(filters?.status || 'Semua');
    const [chartFilter, setChartFilter] = useState(filters?.chart_filter || 'tahun_ini');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category_filter || 'minggu_ini');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'terbaru');

    // --- Helper Format Rupiah ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
    };

    // --- 2. Fungsi Filter (Sama Persis Gaya Dashboard/Bookings) ---
    const handleFilterChange = (key, value) => {
        const query = { 
            search: searchTerm,
            status: activeTab,
            chart_filter: chartFilter,
            category_filter: categoryFilter,
            sort_order: sortOrder,
            [key]: value 
        };
        
        // Hapus value null/kosong agar URL bersih
        Object.keys(query).forEach(k => (!query[k] || query[k] === 'Semua') && delete query[k]);

        router.get(route('organizer.finance'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true 
        });
    };

    // Fungsi handle Pagination (Sama dengan Bookings)
    const handlePage = (page) => {
        handleFilterChange('page', page);
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

    // 🔥 DEFINISI KOLOM UNTUK TABEL TRANSAKSI (Sama seperti Bookings) 🔥
    const financeColumns = [
        { 
            header: 'Order ID', 
            cellClassName: 'font-medium text-gray-900 whitespace-nowrap',
            render: (row) => `#${row.id?.substring(0,8).toUpperCase()}` 
        },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <span className="text-gray-900">{new Date(row.created_at).toLocaleDateString('id-ID')}</span><br />
                    <span className="text-gray-500">{new Date(row.created_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                </div>
            )
        },
        { 
            header: 'Nama', 
            cellClassName: 'font-medium text-gray-900 whitespace-nowrap',
            render: (row) => row.user?.name || 'Pengunjung'
        },
        { 
            header: 'Event', 
            render: (row) => (
                <>
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{row.event?.name || 'Event Dihapus'}</p>
                    <p className="text-xs text-gray-500">{row.event?.category_name || 'Lainnya'}</p>
                </>
            )
        },
        { 
            header: 'Qty', 
            headerClassName: 'text-center',
            cellClassName: 'text-center font-medium text-gray-900',
            render: (row) => (row.ticket_items || []).reduce((sum, t) => sum + t.quantity, 0)
        },
        { 
            header: 'Jumlah', 
            cellClassName: 'font-medium text-gray-900 whitespace-nowrap',
            render: (row) => formatRupiah(row.sub_total) 
        },
        { 
            header: 'Fee', 
            cellClassName: 'text-red-500 whitespace-nowrap',
            render: (row) => `-${formatRupiah(row.platform_fee)}` 
        },
        { 
            header: 'Net', 
            cellClassName: 'font-bold text-green-500 whitespace-nowrap',
            render: (row) => formatRupiah(row.net_for_eo) 
        },
        { 
            header: 'Status', 
            render: (row) => {
                let statusColor = 'border-neutral-300 text-gray-500 bg-gray-50';
                let statusText = row.payment_status;
                
                if(row.payment_status === 'PAID') { statusColor = 'border-green-500 text-green-500 bg-white'; statusText = 'Dibayar'; }
                if(row.payment_status === 'PENDING') { statusColor = 'border-yellow-500 text-yellow-500 bg-white'; statusText = 'Menunggu'; }
                if(row.payment_status === 'CANCELLED') { statusColor = 'border-red-500 text-red-500 bg-white'; statusText = 'Dibatalkan'; }

                return (
                    <span className={`px-2 py-[2px] rounded-[4px] text-[10px] font-semibold border ${statusColor}`}>
                        {statusText}
                    </span>
                );
            }
        },
    ];

    const STATUS_TABS = ['Semua', 'Dibayar', 'Menunggu', 'Dibatalkan'];

    return (
        <DashboardLayout header="Finance">
            <Head title="Finance Dashboard" />

            <div className="flex flex-col gap-6">

                {/* --- 1. TOP STATS CARDS --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconCurrencyDollar} label="Total Pendapatan" value={stats.total} />
                    <StatCard icon={IconWallet} label="Saldo" value={stats.saldo} />
                    <StatCard icon={IconChartLine} label="Rata-Rata Pendapatan /Event" value={stats.rata_rata} />
                </div>

                {/* --- 2. GRAFIK PENDAPATAN & TOP EVENT --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Area Chart Pendapatan */}
                    <div className="lg:col-span-2 bg-white border border-neutral-300 rounded-[24px] p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="text-xl font-medium text-neutral-950">Pendapatan Penjualan</h3>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-2"><span className="w-3 h-1.5 rounded-full bg-sky-500"></span> Aktual</div>
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
                                    <SelectTrigger className="bg-sky-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-[24px] border border-gray-100 shadow-xl z-[100] p-1.5">
                                        <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                        <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                        <SelectItem value="5_tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                    </SelectContent>
                                </Select>

                            </div>
                        </div>
                        <div className="w-full h-[300px] -ml-4">
                            <Chart key={`chart-${chartFilter}`} options={areaOptions} series={areaSeries} type="line" height="100%" />
                        </div>
                    </div>

                    {/* Top Pendapatan Event */}
                    <div className="bg-white border border-neutral-300 rounded-[24px] p-6 shadow-sm">
                        <h3 className="text-xl font-medium text-neutral-950 mb-6">Top Pendapatan Event</h3>
                        <div className="space-y-5 max-h-[280px] overflow-y-auto pr-2">
                            {topEvents.length > 0 ? topEvents.map((event, index) => (
                                <div key={index} className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-6 h-6 bg-blue-50 text-sky-500 text-xs font-bold rounded-full flex items-center justify-center shrink-0">
                                            {index + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate">{event.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-green-500 shrink-0">{formatRupiah(event.revenue)}</span>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 py-4 text-center">Belum ada data event.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- 3. KATEGORI PENDAPATAN (DONUT) --- */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h3 className="text-xl font-medium text-neutral-950">Kategori Pendapatan</h3>
                        
                        {/* SHADCN SELECT: Category Filter */}
                        <Select 
                            value={categoryFilter} 
                            onValueChange={(val) => { 
                                setCategoryFilter(val); 
                                handleFilterChange('category_filter', val); 
                            }}
                        >
                            <SelectTrigger className="bg-sky-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                <SelectValue placeholder="Pilih Waktu" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-[24px] border border-gray-100 shadow-xl z-[100] p-1.5">
                                <SelectItem value="minggu_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Minggu Ini</SelectItem>
                                <SelectItem value="bulan_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Bulan Ini</SelectItem>
                                <SelectItem value="6_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                <SelectItem value="5_tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-sky-500 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
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
                                <div key={idx} className="flex items-center justify-between p-3">
                                     <div className='flex gap-2'>
            <div className={`w-2 h-12 rounded-full`} style={{ backgroundColor: cat.color }} />
            <div className="flex flex-col h-full">
                <p className="text-xs text-black">{cat.name}</p>
                <p className="text-xl font-semibold text-black">{formatRupiah(cat.value)}</p>
            </div>
            </div>
                                   <div className={`text-lg font-semibold p-2.5 rounded-[8px] bg-sky-100 text-sky-500`}>
                {cat.percentage}%
            </div>
                                </div>
                                
                            ))}
                            {categories.length === 0 && <div className="text-sm text-gray-400 col-span-2 text-center py-4">Belum ada data pendapatan.</div>}
                        </div>
                    </div>
                </div>

                {/* --- 4. RIWAYAT TRANSAKSI TABLE --- */}
                <div className="bg-white rounded-[24px] border p-4 border-neutral-300 shadow-sm overflow-hidden flex flex-col gap-6">
                    
                    {/* Header Table & Filters */}
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        
                        <div className="flex items-center flex-wrap gap-4 w-full xl:w-auto">
                            <h4 className="text-xl font-medium text-neutral-950 mr-2">Riwayat Transaksi</h4>
                            {/* Status Tabs dengan desain sama seperti Bookings */}
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                                {STATUS_TABS.map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => { 
                                            setActiveTab(tab); 
                                            handleFilterChange('status', tab); 
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                                            activeTab === tab ? 'bg-[#00a2ff] text-white shadow-sm' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 cursor-pointer'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Search & Select Kanan */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            
                            {/* 🔥 Menggunakan Komponen Search yang sama dengan Bookings 🔥 */}
                            <Search
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSubmit={(val) => handleFilterChange('search', val)}
                                placeholder="Cari ID, nama..."
                                className="w-full xl:w-64"
                            />

                            {/* SHADCN SELECT: Sort Order */}
                            <Select 
                                value={sortOrder} 
                                onValueChange={(val) => { 
                                    setSortOrder(val); 
                                    handleFilterChange('sort_order', val); 
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

                    {/* 🔥 Menggunakan Komponen Dynamic Table 🔥 */}
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={financeColumns} 
                            data={transactions?.data} 
                            emptyMessage="Belum ada transaksi ditemukan."
                            minWidth="min-w-[1000px]" 
                        />
                    </div>
                </div>

                {/* 🔥 Panggil Pagination sama persis seperti di Bookings 🔥 */}
                {transactions && transactions.data && transactions.data.length > 0 && (
                    <Pagination
                        pagination={transactions}
                        onPageChange={handlePage}
                    />
                )}

            </div>
        </DashboardLayout>
    );
}
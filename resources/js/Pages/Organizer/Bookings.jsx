import DashboardLayout from '@/Layouts/DashboardLayout'
import { Head, router } from '@inertiajs/react'
import React, { useState } from 'react'
import Chart from 'react-apexcharts'
import {
    IconTicket,
    IconShoppingCart,
    IconSearch,
} from '@tabler/icons-react'

// Import Shadcn UI
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select"
import StatCard from '@/Components/StatCard'
import Pagination from '@/Components/Pagination'
import DynamicTable from '@/Components/Table'
import Search from '@/Components/Search'

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number)
}

const STATUS_TABS = [
    { id: 'semua', label: 'Semua', value: 'semua' },
    { id: 'dibayar', label: 'Dibayar', value: 'PAID' },
    { id: 'menunggu', label: 'Menunggu', value: 'PENDING' },
    { id: 'dibatalkan', label: 'Dibatalkan', value: 'CANCELLED' },
]

function StatusBadge({ status }) {
    if (status === 'PAID') {
        return <span className="px-3 py-1 rounded-[4px] text-[10px] font-semibold border border-green-200 text-green-500 bg-white">Dibayar</span>;
    }
    if (status === 'PENDING') {
        return <span className="px-3 py-1 rounded-[4px] text-[10px] font-semibold border border-yellow-200 text-yellow-500 bg-white">Menunggu</span>;
    }
    return <span className="px-3 py-1 rounded-[4px] text-[10px] font-semibold border border-red-200 text-red-500 bg-white">Dibatalkan</span>;
}

export default function Bookings({ bookings, stats, charts, filters }) {

    // 3 State Independen
    const [search, setSearch] = useState(filters.search ?? '')
    const [activeTab, setActiveTab] = useState(filters?.tab || 'semua');
    const [filterOverview, setFilterOverview] = useState(filters.filter_overview ?? 'minggu_ini')
    const [filterCategory, setFilterCategory] = useState(filters.filter_category ?? 'minggu_ini')
    const [sortTable, setSortTable] = useState(filters.sort_table ?? 'terbaru')

    
    // 🔥 Fungsi serbaguna untuk Update Filter (Reset ke page 1)
    const updateFilter = (key, value) => {
        router.get(route('organizer.bookings'), {
            ...filters, [key]: value, page: 1
        }, { preserveState: true, preserveScroll: true })
    }
    const handleTabChange = (status) => {
            setActiveTab(status);
            updateFilter('status', status == 'semua' ? null : status);
        };
    
    // 🔥 Fungsi khusus untuk Pindah Halaman Pagination
    const handlePage = (page) => {
        router.get(route('organizer.bookings'), {
            ...filters, page: page,
        }, { preserveState: true, preserveScroll: true })
    }

    // --- Komponen Opsi Dropdown Shadcn ---
    const timeOptions = (
        <>
            <SelectItem value="minggu_ini" className="text-xs cursor-pointer focus:bg-sky-50">Minggu ini</SelectItem>
            <SelectItem value="bulan_ini" className="text-xs cursor-pointer focus:bg-sky-50">Bulan ini</SelectItem>
            <SelectItem value="tahun_ini" className="text-xs cursor-pointer focus:bg-sky-50">Tahun ini</SelectItem>
            <SelectItem value="semua" className="text-xs cursor-pointer focus:bg-sky-50">Semua Waktu</SelectItem>
        </>
    );

    const sortOptions = (
        <>
            <SelectItem value="terbaru" className="text-xs cursor-pointer focus:bg-sky-50">Terbaru</SelectItem>
            <SelectItem value="terlama" className="text-xs cursor-pointer focus:bg-sky-50">Terlama</SelectItem>
        </>
    );

    // ==========================================
    // CHART CONFIGURATIONS
    // ==========================================
    const totalDonutValue = charts.donut.data.reduce((a, b) => a + b, 0);

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f1f5f9'],
        labels: charts.donut.labels,
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '75%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '12px', color: '#64748b', offsetY: -5 }, 
                        value: { show: true, fontSize: '28px', fontWeight: 800, color: '#0f172a', offsetY: 5 }, 
                        total: {
                            show: true, showAlways: true, label: 'Total Tiket', color: '#64748b',
                            formatter: () => new Intl.NumberFormat('id-ID').format(totalDonutValue)
                        }
                    }
                }
            }
        },
        stroke: { show: false },
        legend: { show: false },
        tooltip: { y: { formatter: (v) => v + (charts.donut.labels[0] === 'Belum ada data' ? '' : ' tiket') } }
    }

    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false }, sparkline: { enabled: false } },
        colors: ['#0ea5e9'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: charts.area.labels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
        yaxis: { labels: { formatter: (v) => v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v, style: { colors: '#94a3b8' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        tooltip: { y: { formatter: (v) => v + ' booking' } }
    }
    

    const bookingColumns = [
        { 
            header: 'Order ID', 
            accessor: 'order_id', 
            cellClassName: 'font-medium text-gray-900 whitespace-nowrap',
            render: (row) => `#${row.order_id}` // Tambahkan hashtag di depannya
        },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <span className="text-gray-900">{row.date}</span><br />
                    <span className="text-gray-500">{row.time}</span>
                </div>
            )
        },
        { header: 'Nama', accessor: 'buyer_name', cellClassName: 'font-medium text-gray-900 whitespace-nowrap' },
        { header: 'Email', accessor: 'email', cellClassName: 'font-medium text-gray-900 whitespace-nowrap' },
        { 
            header: 'Event', 
            render: (row) => (
                <>
                    <p className="text-xs font-medium text-gray-900 line-clamp-1">{row.event_name}</p>
                    <p className="text-xs text-gray-500">{row.category}</p>
                </>
            )
        },
        { header: 'Qty', accessor: 'qty', cellClassName: 'font-medium text-gray-900' },
        { 
            header: 'Jumlah', 
            cellClassName: 'font-medium text-gray-900 whitespace-nowrap',
            render: (row) => formatRupiah(row.amount) 
        },
        { 
            header: 'Status', 
            render: (row) => <StatusBadge status={row.status} /> 
        },
    ];

    return (
        <DashboardLayout header={"Bookings"}>
            <Head title="Bookings" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                
                {/* ================= BAGIAN KIRI ================= */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* ===== STAT CARDS ===== */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard
                        icon={IconShoppingCart}
                        label="Total Bookings"
                        value={stats.total_bookings}/>
                        <StatCard 
                        icon={IconTicket} 
                        label="Tiket Terjual" 
                        value={stats.total_tickets_sold} />
                        
                    </div>

                    {/* ===== BOOKINGS OVERVIEW ===== */}
                    <div className="bg-white p-6 rounded-[24px] border border-neutral-300 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-medium text-neutral-950">Bookings Overview</h4>
                            <Select value={filterOverview} onValueChange={(val) => { setFilterOverview(val); updateFilter('filter_overview', val); }}>
                                <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-neutral-300 shadow-xl">
                                    {timeOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <Chart options={areaOptions} series={[{ name: 'Booking', data: charts.area.data }]} type="area" height={220} />
                    </div>
                </div>

                {/* ================= BAGIAN KANAN ================= */}
                {/* ===== BOOKINGS CATEGORY ===== */}
                <div className="lg:col-span-1 bg-white p-6 rounded-[24px] border border-neutral-300 shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xl font-medium text-neutral-950">Bookings Category</h4>
                        <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); updateFilter('filter_category', val); }}>
                            <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto">
                                <SelectValue placeholder="Waktu" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-neutral-300 shadow-xl">
                                {timeOptions}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="flex justify-center mb-8">
                        <Chart options={donutOptions} series={charts.donut.data} type="donut" height={220} width={220} />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        {charts.donut.labels.map((cat, i) => {
                            const value = charts.donut.data[i];
                            const isEmpty = cat === 'Belum ada data'; // 🔥 Cek apakah ini data kosong
                            
                            // Jika kosong, persentase 0, jika ada isi baru hitung persennya
                            const percent = (totalDonutValue > 0 && !isEmpty) ? ((value / totalDonutValue) * 100).toFixed(1) : 0;
                            const color = isEmpty ? '#f1f5f9' : donutOptions.colors[i % donutOptions.colors.length];
                            
                            return (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex-1 pr-4">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className={`${isEmpty ? 'text-gray-400' : 'text-gray-900'} font-medium truncate`} title={cat}>
                                                {cat}
                                            </span>
                                            <span className="text-gray-400">
                                                {isEmpty ? '(-)' : `(${percent}%)`}
                                            </span>
                                        </div>
                                        {/* Custom Progress Bar */}
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div 
                                                className="h-1.5 rounded-full transition-all duration-500" 
                                                style={{ width: isEmpty ? '100%' : `${percent}%`, backgroundColor: color }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className={`font-bold w-12 text-right mt-3 ${isEmpty ? 'text-gray-400' : 'text-gray-900'}`}>
                                        {isEmpty ? '-' : new Intl.NumberFormat('id-ID').format(value)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* ===== TABEL RIWAYAT BOOKING ===== */}
            <div className="bg-white rounded-[24px] border p-4 border-neutral-300 shadow-sm overflow-hidden flex flex-col gap-6 mb-6">
                
                {/* Header Table & Filters */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    
                    <div className="flex items-center flex-wrap gap-4 w-full xl:w-auto">
                        <h4 className="text-xl font-medium text-neutral-950 mr-2">Riwayat Booking</h4>
                        {/* Status Tabs */}
                         <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                            {STATUS_TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.value)}
                                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[16px] text-xs font-semibold transition-all shrink-0 capitalize ${activeTab === tab.value ? 'bg-sky-500 text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 cursor-pointer'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        {/* Search */}
                         <Search
                            value={search}
                            onChange={setSearch}
                            onSubmit={(val) => updateFilter('search', val)} // Langsung kirim val ke updateFilter
                            placeholder="Cari ID, nama..."
                            className="w-full xl:w-64"
                        />

                        {/* Sort Dropdown */}
                        <Select value={sortTable} onValueChange={(val) => { setSortTable(val); updateFilter('sort_table', val); }}>
                            <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-2 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto shrink-0">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-neutral-300 shadow-xl">
                                {sortOptions}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <DynamicTable 
                    columns={bookingColumns} 
                    data={bookings?.data} 
                    emptyMessage="Belum ada data booking."
                    minWidth="min-w-[1000px]" 
                />
                </div>

                {/* 🔥 Ganti fungsi onPageChange menjadi handlePage 🔥 */}
            </div>
                <Pagination
                    pagination={bookings}
                    onPageChange={(page) => handlePage(page)}
                />

        </DashboardLayout>
    )
}
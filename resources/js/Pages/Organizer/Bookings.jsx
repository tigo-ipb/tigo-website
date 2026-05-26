import DashboardLayout from '@/Layouts/DashboardLayout'
import { Head, router } from '@inertiajs/react'
import React, { useState } from 'react'
import Chart from 'react-apexcharts'
import {
    IconTicket,
    IconShoppingCart,
    IconSearch,
    IconChevronLeft,
    IconChevronRight,
} from '@tabler/icons-react'

// Import Shadcn UI
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select"
import StatCard from '@/Components/StatCard'

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(number)
}

const STATUS_TABS = [
    { label: 'Semua', value: 'semua' },
    { label: 'Dibayar', value: 'PAID' },
    { label: 'Menunggu', value: 'PENDING' },
    { label: 'Dibatalkan', value: 'CANCELLED' },
]

export default function Bookings({ bookings, stats, charts, pagination, filters }) {

    // 3 State Independen
    const [search, setSearch] = useState(filters.search ?? '')
    const [filterOverview, setFilterOverview] = useState(filters.filter_overview ?? 'minggu_ini')
    const [filterCategory, setFilterCategory] = useState(filters.filter_category ?? 'minggu_ini')
    const [sortTable, setSortTable] = useState(filters.sort_table ?? 'terbaru')

    const updateFilter = (key, value) => {
        router.get(route('organizer.bookings'), {
            ...filters, [key]: value, page: 1
        }, { preserveState: true, preserveScroll: true })
    }

    const handleSearch = (e) => {
        e.preventDefault()
        updateFilter('search', search)
    }

    const handlePage = (page) => {
        router.get(route('organizer.bookings'), {
            ...filters, page,
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-xl text-gray-900">Bookings Overview</h4>
                            <Select value={filterOverview} onValueChange={(val) => { setFilterOverview(val); updateFilter('filter_overview', val); }}>
                                <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl">
                                    {timeOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <Chart options={areaOptions} series={[{ name: 'Booking', data: charts.area.data }]} type="area" height={220} />
                    </div>
                </div>

                {/* ================= BAGIAN KANAN ================= */}
                {/* ===== BOOKINGS CATEGORY ===== */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="font-bold text-xl text-gray-900">Bookings Category</h4>
                        <Select value={filterCategory} onValueChange={(val) => { setFilterCategory(val); updateFilter('filter_category', val); }}>
                            <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto">
                                <SelectValue placeholder="Waktu" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl">
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
                            const percent = totalDonutValue > 0 ? ((value / totalDonutValue) * 100).toFixed(1) : 0;
                            const color = donutOptions.colors[i % donutOptions.colors.length];
                            
                            return (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex-1 pr-4">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-gray-900 font-medium truncate" title={cat}>{cat}</span>
                                            <span className="text-gray-500">({percent}%)</span>
                                        </div>
                                        {/* Custom Progress Bar */}
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${percent}%`, backgroundColor: color }}></div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-gray-900 w-12 text-right mt-3">
                                        {new Intl.NumberFormat('id-ID').format(value)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>

            {/* ===== TABEL RIWAYAT BOOKING ===== */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                
                {/* Header Table & Filters */}
                <div className="p-6 border-b border-gray-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                    
                    <div className="flex items-center flex-wrap gap-4 w-full xl:w-auto">
                        <h4 className="font-bold text-xl text-gray-900 mr-2">Riwayat Booking</h4>
                        {/* Status Tabs */}
                        <div className="flex gap-1 bg-gray-50 p-1 rounded-full border border-gray-100 overflow-x-auto scrollbar-hide">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => updateFilter('status', tab.value)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 ${
                                        filters.status === tab.value || (tab.value === 'semua' && !filters.status)
                                            ? 'bg-[#0099ff] text-white shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full xl:w-auto">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative flex-1 xl:w-64">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama, event..."
                                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                            />
                        </form>

                        {/* Sort Dropdown */}
                        <Select value={sortTable} onValueChange={(val) => { setSortTable(val); updateFilter('sort_table', val); }}>
                            <SelectTrigger className="bg-[#0099ff] text-white text-xs font-medium px-4 py-2 h-auto rounded-full border-0 focus:ring-0 shadow-none w-auto shrink-0">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl">
                                {sortOptions}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead>
                            <tr className="border-b border-gray-100 text-sky-500">
                                <th className="py-4 px-6 text-xs font-bold">Order ID</th>
                                <th className="py-4 px-6 text-xs font-bold">Waktu</th>
                                <th className="py-4 px-6 text-xs font-bold">Nama</th>
                                <th className="py-4 px-6 text-xs font-bold">Email</th>
                                <th className="py-4 px-6 text-xs font-bold">Event</th>
                                <th className="py-4 px-6 text-xs font-bold">Qty</th>
                                <th className="py-4 px-6 text-xs font-bold">Jumlah</th>
                                <th className="py-4 px-6 text-xs font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings?.length > 0 ? bookings.map((booking, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900">#{booking.order_id}</td>
                                    <td className="py-4 px-6 text-xs text-gray-900">
                                        <span className="font-medium">{booking.date}</span><br />
                                        <span className="text-gray-500">{booking.time}</span>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{booking.buyer_name}</td>
                                    <td className="py-4 px-6 text-sm font-medium text-gray-900">{booking.email}</td>
                                    <td className="py-4 px-6">
                                        <p className="text-xs font-bold text-gray-900 line-clamp-1">{booking.event_name}</p>
                                        <p className="text-xs text-gray-500">{booking.category}</p>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{booking.qty}</td>
                                    <td className="py-4 px-6 text-sm font-bold text-gray-900">{formatRupiah(booking.amount)}</td>
                                    <td className="py-4 px-6">
                                        {booking.status === 'PAID' ? (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-green-200 text-green-500 bg-white">
                                                Dibayar
                                            </span>
                                        ) : booking.status === 'PENDING' ? (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200 text-yellow-500 bg-white">
                                                Menunggu
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-200 text-red-500 bg-white">
                                                Dibatalkan
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="py-16 text-center text-gray-400 text-sm">
                                        Belum ada data booking.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                            Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1} dari {new Intl.NumberFormat('id-ID').format(pagination.total)}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePage(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-2 rounded-lg text-[#0099ff] bg-[#e0f2fe] hover:bg-sky-200 disabled:opacity-50 disabled:hover:bg-[#e0f2fe]"
                            >
                                <IconChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handlePage(p)}
                                    className={`w-8 h-8 rounded-lg text-sm font-bold border transition-colors ${
                                        pagination.current_page === p
                                            ? 'border-[#0099ff] text-[#0099ff] bg-white'
                                            : 'border-transparent text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePage(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-2 rounded-lg text-[#0099ff] bg-[#e0f2fe] hover:bg-sky-200 disabled:opacity-50 disabled:hover:bg-[#e0f2fe]"
                            >
                                <IconChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </DashboardLayout>
    )
}
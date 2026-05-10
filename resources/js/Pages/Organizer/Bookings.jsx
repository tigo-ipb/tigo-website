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
    IconChevronDown,
} from '@tabler/icons-react'

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

export default function Bookings({ bookings, stats, pagination, filters, events }) {

    const [search, setSearch] = useState(filters.search ?? '')
    const [eventId, setEventId] = useState(filters.event_id ?? '')

    const handleFilter = (newFilters) => {
        router.get(route('organizer.bookings'), {
            ...filters,
            ...newFilters,
            page: 1,
        }, { preserveState: true, replace: true })
    }

    const handleSearch = (e) => {
        e.preventDefault()
        handleFilter({ search, event_id: eventId })
    }

    const handleStatus = (status) => {
        handleFilter({ status })
    }

    const handlePage = (page) => {
        router.get(route('organizer.bookings'), {
            ...filters,
            page,
        }, { preserveState: true, replace: true })
    }

    // Donut chart - Bookings by category
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe'],
        labels: ['Hiburan & Festival', 'Edukasi', 'Seni & Budaya', 'Olahraga', 'Lainnya'],
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '70%',
                    labels: {
                        show: true,
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total Tiket',
                            color: '#64748b',
                            formatter: () => new Intl.NumberFormat('id-ID').format(stats.total_tickets_sold)
                        }
                    }
                }
            }
        },
        stroke: { show: false },
        legend: { show: false },
    }
    const donutSeries = [2000, 800, 500, 300, 200]

    // Area chart - Bookings overview
    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false }, sparkline: { enabled: false } },
        colors: ['#0ea5e9'],
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 100] }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#94a3b8', fontSize: '11px' } }
        },
        yaxis: {
            labels: {
                formatter: (v) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v,
                style: { colors: '#94a3b8' }
            }
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
        tooltip: { y: { formatter: (v) => v + ' booking' } }
    }
    const areaSeries = [{ name: 'Booking', data: [0, 0, 2, 5, 3, 8, 14, 18, 0, 0, 0, 0] }]

    return (
        <DashboardLayout>
            <Head title="Bookings" />

            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <IconShoppingCart size={28} stroke={1.5} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Total Bookings</p>
                        <h3 className="text-3xl font-black text-blue-500">
                            {new Intl.NumberFormat('id-ID').format(stats.total_bookings)}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <IconTicket size={28} stroke={1.5} />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Tiket Terjual</p>
                        <h3 className="text-3xl font-black text-blue-500">
                            {new Intl.NumberFormat('id-ID').format(stats.total_tickets_sold)}
                        </h3>
                    </div>
                </div>
            </div>

            {/* ===== CHARTS ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                {/* Bookings Overview - Area Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-900">Bookings Overview</h4>
                        <button className="bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                            Minggu ini <IconChevronDown size={14} />
                        </button>
                    </div>
                    <Chart options={areaOptions} series={areaSeries} type="area" height={200} />
                </div>

                {/* Bookings Category - Donut Chart */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-gray-900">Bookings Category</h4>
                        <button className="bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1">
                            Minggu ini <IconChevronDown size={14} />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="shrink-0">
                            <Chart options={donutOptions} series={donutSeries} type="donut" height={180} width={180} />
                        </div>
                        <div className="flex-1 space-y-3">
                            {['Hiburan & Festival', 'Edukasi', 'Seni & Budaya', 'Olahraga'].map((cat, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0"></span>
                                        <span className="text-gray-600">{cat}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-400">(0.0%)</span>
                                        <span className="font-bold text-gray-700 w-12 text-right">2,000</span>
                                        <span className="text-gray-400 w-12 text-right">(0.0%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== TABEL RIWAYAT BOOKING ===== */}
            <div className="bg-white rounded-2xl border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h4 className="font-bold text-lg text-gray-900">Riwayat Booking</h4>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Filter Event */}
                            <select
                                value={eventId}
                                onChange={(e) => setEventId(e.target.value)}
                                className="text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-600"
                            >
                                <option value="">Semua Event</option>
                                {events?.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>

                            {/* Search */}
                            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, email, atau event..."
                                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                />
                            </form>

                            {/* Filter Minggu */}
                            <button className="bg-blue-500 text-white text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1 shrink-0">
                                Minggu ini <IconChevronDown size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-2 mt-4">
                        {STATUS_TABS.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => handleStatus(tab.value)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                                    filters.status === tab.value || (tab.value === 'semua' && !filters.status)
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Order ID</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Waktu</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Nama</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Email</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Event</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Qty</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Jumlah</th>
                                <th className="py-3 px-4 text-xs font-bold text-blue-500">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings?.length > 0 ? bookings.map((booking, i) => (
                                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">#{booking.order_id}</td>
                                    <td className="py-4 px-4 text-xs text-gray-600">
                                        {booking.date}<br />
                                        <span className="text-gray-400">{booking.time}</span>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-bold text-gray-900">{booking.buyer_name}</td>
                                    <td className="py-4 px-4 text-sm text-gray-600">{booking.email}</td>
                                    <td className="py-4 px-4 text-xs">
                                        <p className="font-bold text-gray-900">{booking.event_name}</p>
                                        <p className="text-gray-400">{booking.category}</p>
                                    </td>
                                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{booking.qty}</td>
                                    <td className="py-4 px-4 text-sm font-bold text-gray-900">{formatRupiah(booking.amount)}</td>
                                    <td className="py-4 px-4">
                                        {booking.status === 'PAID' ? (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-green-300 text-green-500">
                                                Dibayar
                                            </span>
                                        ) : booking.status === 'PENDING' ? (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-300 text-yellow-500">
                                                Menunggu
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-red-300 text-red-500">
                                                Dibatalkan
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-400 text-sm">
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
                        <p className="text-xs text-gray-500">
                            Menampilkan {((pagination.current_page - 1) * pagination.per_page) + 1}–{Math.min(pagination.current_page * pagination.per_page, pagination.total)} dari {new Intl.NumberFormat('id-ID').format(pagination.total)}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePage(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                            >
                                <IconChevronLeft size={16} />
                            </button>
                            {Array.from({ length: Math.min(pagination.last_page, 5) }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => handlePage(p)}
                                    className={`w-8 h-8 rounded-lg text-xs font-medium ${
                                        pagination.current_page === p
                                            ? 'bg-blue-500 text-white'
                                            : 'text-gray-500 hover:bg-gray-100'
                                    }`}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                onClick={() => handlePage(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                            >
                                <IconChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-8 flex justify-between items-center text-gray-500 text-sm p-6 bg-white border border-gray-100 rounded-2xl">
                <p>Copyright @ 2026 Tigo</p>
            </footer>

        </DashboardLayout>
    )
}
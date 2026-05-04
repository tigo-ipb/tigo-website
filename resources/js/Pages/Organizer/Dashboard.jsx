import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconCalendarEvent, IconCheck, IconChevronDown, 
    IconTicket, IconSearch, IconCalendarWeek
} from '@tabler/icons-react';

// Import Shadcn Select
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function Dashboard({ auth, stats, topEvents, recentBookings, recentActivities, currentEvent, filters }) {
    
    // --- State Filter ---
    const [topEventFilter, setTopEventFilter] = useState(filters?.top_event || 'revenue');
    const [chartFilter, setChartFilter] = useState(filters?.chart_period || 'tahun_ini');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    

    // Fungsi Fetch saat Filter Berubah
    const handleFilterChange = (key, value) => {
        const query = { top_event: topEventFilter, chart_period: chartFilter, [key]: value };
        router.get(route('organizer.dashboard'), query, { preserveState: true, preserveScroll: true });
    };
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            handleFilterChange('search', searchTerm);
        }
    };

    // --- Metrik Donut ---
    const totalTickets = stats.total_tickets_sold + stats.total_tickets_available;
    const soldPercentage = totalTickets > 0 ? Math.round((stats.total_tickets_sold / totalTickets) * 100) : 0;
    const availablePercentage = totalTickets > 0 ? Math.round((stats.total_tickets_available / totalTickets) * 100) : 0;

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#e0f2fe'], 
        labels: ['Terjual', 'Tersedia'],
        dataLabels: { enabled: false },
        plotOptions: { pie: { donut: { size: '75%', labels: { show: true, name: { show: true, fontSize: '12px', color: '#64748b', offsetY: -10 }, value: { show: true, fontSize: '28px', fontWeight: 800, color: '#0f172a', offsetY: 5 }, total: { show: true, showAlways: true, label: 'Total Tiket', color: '#64748b', formatter: () => new Intl.NumberFormat('id-ID').format(totalTickets) } } } } },
        stroke: { show: false }, legend: { show: false }, tooltip: { enabled: true }
    };
    const donutSeries = [stats.total_tickets_sold, stats.total_tickets_available]; 

    // --- Metrik Area Chart (Dinamis dari Backend) ---
    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: ['#0ea5e9'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { 
            categories: stats.chart_labels, // Kategori dikendalikan server
            axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8' } }
        },
        yaxis: { 
            labels: { 
                formatter: (value) => {
                    if(value >= 1000000) return (value / 1000000).toFixed(0) + 'jt';
                    if(value >= 1000) return (value / 1000).toFixed(0) + 'k';
                    return value;
                }, style: { colors: '#94a3b8' }
            } 
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, legend: { show: false }
    };
    const areaSeries = [{ name: 'Pendapatan', data: stats.chart_data }];

    return (
        <DashboardLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* ================= BAGIAN KIRI ================= */}
                <div className="xl:col-span-2 space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><IconCalendarEvent size={28} stroke={1.5} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 mb-1">Total Event</p>
                                <h3 className="text-3xl font-black text-blue-500">{new Intl.NumberFormat('id-ID').format(stats.total_events)}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                            <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><IconCheck size={28} stroke={2} /></div>
                            <div>
                                <p className="text-xs font-bold text-gray-800 mb-1">Tiket Terjual</p>
                                <h3 className="text-3xl font-black text-blue-500">{new Intl.NumberFormat('id-ID').format(stats.total_tickets_sold)}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* CHART DONUT */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col h-full shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-lg text-gray-900">Penjualan Tiket</h4>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-center -mt-4">
                                    <Chart options={donutOptions} series={donutSeries} type="donut" height={260} />
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-xl border-l-4 border-blue-500">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Terjual</p>
                                            <p className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('id-ID').format(stats.total_tickets_sold)}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-600 text-sm font-bold px-3 py-1 rounded-lg">{soldPercentage}%</span>
                                    </div>
                                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border-l-4 border-gray-300">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500">Tersedia</p>
                                            <p className="text-lg font-bold text-gray-900">{new Intl.NumberFormat('id-ID').format(stats.total_tickets_available)}</p>
                                        </div>
                                        <span className="bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1 rounded-lg">{availablePercentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TOP EVENT DENGAN FILTER SHADCN */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-lg text-gray-900">Top Event</h4>
                                <Select 
                                    value={topEventFilter} 
                                    onValueChange={(val) => { setTopEventFilter(val); handleFilterChange('top_event', val); }}
                                >
                                    <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                        <SelectValue placeholder="Metrik" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                        <SelectItem value="revenue" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">Pendapatan</SelectItem>
                                        <SelectItem value="attendance" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">Attendance (Tiket)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-4">
                                {topEvents.length > 0 ? topEvents.map((event, i) => (
                                    <div key={i} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs shrink-0">{i + 1}</div>
                                            <p className="text-sm font-medium text-gray-700 truncate w-32 md:w-40">{event.name}</p>
                                        </div>
                                        <p className="text-sm font-bold text-green-500">
                                            {topEventFilter === 'revenue' 
                                                ? formatRupiah(event.revenue) 
                                                : `${new Intl.NumberFormat('id-ID').format(event.attendance)} Tiket`
                                            }
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400">Belum ada data penjualan</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* CHART AREA DENGAN FILTER SHADCN */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                            <h4 className="font-bold text-lg text-gray-900">Pendapatan Penjualan</h4>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-4 text-xs font-medium text-gray-500">
                                    <div className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-blue-500"></span> Aktual</div>
                                </div>
                                <Select 
                                    value={chartFilter} 
                                    onValueChange={(val) => { setChartFilter(val); handleFilterChange('chart_period', val); }}
                                >
                                    <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                        <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                        <SelectItem value="3_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
                                        <SelectItem value="6_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                        <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                        <SelectItem value="5_tahun" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-blue-600 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <Chart options={areaOptions} series={areaSeries} type="area" height={280} />
                    </div>

                </div>

                {/* ================= BAGIAN KANAN ================= */}
                <div className="space-y-6">
                    {/* (Bagian Event Saat Ini dan Aktivitas Terakhir tidak diubah format UI-nya) */}
                    
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-lg text-gray-900 mb-4">Event Saat Ini</h4>
                        {currentEvent ? (
                            <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                <div className="relative h-40 bg-gray-200">
                                    <img src={currentEvent.image} alt={currentEvent.name} className="w-full h-full object-cover" />
                                    <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-blue-500 text-xs font-bold px-3 py-1 rounded-full border border-blue-100 shadow-sm">
                                        {currentEvent.category}
                                    </span>
                                </div>
                                <div className="p-4 bg-blue-50/30">
                                    <h5 className="font-bold text-gray-900 text-base mb-1 truncate">{currentEvent.name}</h5>
                                    <p className="text-xs text-gray-500 mb-4 truncate">{currentEvent.venue}, {currentEvent.city}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-white rounded-lg border border-gray-100 text-blue-500"><IconCalendarEvent size={18} /></div>
                                            <div className="text-[10px] text-gray-600">
                                                <p className="font-bold text-gray-800">{currentEvent.date_format}</p>
                                                <p>{currentEvent.time_format}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => window.location.href = route('organizer.events.show', currentEvent.id)} className="bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">Lihat Detail</button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400">Tidak ada event aktif di waktu dekat.</div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-lg text-gray-900 mb-6">Aktivitas Terakhir</h4>
                        <div className="space-y-5">
                            {recentActivities?.length > 0 ? recentActivities.map((activity, index) => (
                               <div key={index} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors rounded-xl">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-sky-100 text-sky-500">
                                        {activity.type === 'ticket' ? <IconTicket size={20} /> : <IconCalendarWeek size={20} />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900">{activity.title} <span className="text-[#0ea5e9]">{activity.target}</span></p>
                                        <p className="text-[11px] text-gray-400 font-medium mt-1">{activity.time_ago}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 text-center py-4">Belum ada aktivitas</p>
                            )}
                        </div>
                    </div>

                </div>

                {/* ================= BAGIAN BAWAH (Tabel) ================= */}
                <div className="xl:col-span-3">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <h4 className="font-bold text-lg text-gray-900">Booking Terkini</h4>
                            <div className="relative w-full md:w-80">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                               <input 
                                    type="text" placeholder="Cari ID, nama..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-[#0ea5e9] focus:ring-1 focus:ring-[#0ea5e9]"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Order ID</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Waktu</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Nama</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Event</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Qty</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Jumlah</th>
                                        <th className="py-3 px-4 text-xs font-bold text-blue-500">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentBookings.length > 0 ? recentBookings.map((booking, i) => (
                                        <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                                            <td className="py-4 px-4 text-sm font-medium text-gray-900 uppercase">#{booking.order_id}</td>
                                            <td className="py-4 px-4 text-xs text-gray-600">{booking.date}<br/><span className="text-gray-400">{booking.time}</span></td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-900">{booking.buyer_name} <br/><span className="text-xs font-normal text-gray-500">{booking.email}</span></td>
                                            <td className="py-4 px-4 text-xs"><p className="font-bold text-gray-900">{booking.event_name}</p><p className="text-gray-400">{booking.category}</p></td>
                                            <td className="py-4 px-4 text-sm font-medium text-gray-900">{booking.qty}</td>
                                            <td className="py-4 px-4 text-sm font-bold text-gray-900">{formatRupiah(booking.amount)}</td>
                                            <td className="py-4 px-4">
                                                {booking.status === 'PENDING' ? (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-300 bg-yellow-50 text-yellow-600">Menunggu</span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-green-300 bg-green-50 text-green-600">Dibayar</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="8" className="py-8 text-center text-gray-400 text-sm">Belum ada data booking.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
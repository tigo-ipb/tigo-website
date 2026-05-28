import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import {
    IconCalendarEvent, IconSquareRoundedCheck,
    IconTicket, IconCalendarWeek, IconMapPin,
} from '@tabler/icons-react';
import Search from '@/Components/Search';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import StatCard from '@/Components/StatCard';

const PRIMARY = '#00a2ff';
const PRIMARY_LIGHT = '#dff2fe';

const selectTriggerClass =
    "h-[36px] px-4 bg-sky-500 border-0 rounded-[12px] text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const formatNumber = (number) => new Intl.NumberFormat('id-ID').format(number ?? 0);

export default function Dashboard({ stats, topEvents, recentBookings, recentActivities, currentEvent, filters }) {
    const [topEventFilter, setTopEventFilter] = useState(filters?.top_event || 'revenue');
    const [chartFilter, setChartFilter] = useState(filters?.chart_period || 'tahun_ini');
    const [ticketPeriod, setTicketPeriod] = useState(filters?.ticket_period || 'minggu_ini');
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');

    const handleFilterChange = (newFilters = {}) => {
        const query = {
            top_event: topEventFilter,
            chart_period: chartFilter,
            ticket_period: ticketPeriod,
            search: searchTerm,
            ...newFilters,
        };

        Object.keys(query).forEach(key => !query[key] && delete query[key]);

        router.get(route('organizer.dashboard'), query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const donutSold = stats.donut_tickets_sold ?? stats.total_tickets_sold;
    const donutAvailable = stats.donut_tickets_available ?? stats.total_tickets_available;
    const donutTotal = donutSold + donutAvailable;
    const soldPercentage = donutTotal > 0 ? Math.round((donutSold / donutTotal) * 100) : 0;
    const availablePercentage = donutTotal > 0 ? Math.round((donutAvailable / donutTotal) * 100) : 0;

    

    const chartTargetData = stats.chart_target ?? [];

    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: [PRIMARY, PRIMARY_LIGHT],
        labels: ['Terjual', 'Tersedia'],
        dataLabels: { enabled: false },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: true,
                        name: { show: true, fontSize: '11px', color: '#737373', offsetY: -8 },
                        value: { show: true, fontSize: '22px', fontWeight: 700, color: '#171717', offsetY: 4 },
                        total: {
                            show: true,
                            showAlways: true,
                            label: 'Total Tiket',
                            color: '#000000',
                            fontSize: '12px',
                            formatter: () => formatNumber(donutTotal),
                        },
                    },
                },
            },
        },
        stroke: { show: false },
        legend: { show: false },
    };
    const donutSeries = [donutSold, donutAvailable];

    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: [PRIMARY, '#d4d4d4'],
        fill: {
            type: ['gradient', 'solid'],
            gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
            opacity: [0.35, 0],
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: [3, 2], dashArray: [0, 6] },
        xaxis: {
            categories: stats.chart_labels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: '#a3a3a3', fontSize: '11px' } },
        },
        yaxis: {
            labels: {
                formatter: (value) => {
                   return formatNumber(value);
                },
                style: { colors: '#a3a3a3', fontSize: '11px' },
            },
        },
        grid: { borderColor: '#f5f5f5', strokeDashArray: 4 },
        legend: { show: false },
        tooltip: { shared: true },
    };
    const areaSeries = [
        { name: 'Aktual', data: stats.chart_data },
        { name: 'Target', data: chartTargetData },
    ];

    const ticketPeriodLabel = {
        minggu_ini: 'Minggu Ini',
        bulan_ini: 'Bulan Ini',
        semua: 'Semua Waktu',
    };

    const chartPeriodLabel = {
        tahun_ini: 'Tahun ini',
        '3_bulan': '3 Bulan',
        '6_bulan': '6 Bulan',
        tahun_kemarin: 'Tahun Kemarin',
        '5_tahun': '5 Tahun',
    };

    console.log(stats);

    return (
        <DashboardLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Kolom kiri */}
                    <div className="xl:col-span-2 space-y-6">
                        {/* Stat cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard
                                icon={IconCalendarEvent}
                                label="Total Event"
                                value={stats.total_events}
                            />
                            <StatCard
                                icon={IconSquareRoundedCheck}
                                label="Tiket Terjual"
                                value={stats.total_tickets_sold}
                            />
                        </div>

                        {/* Donut + Top Event */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm flex flex-col">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xl font-medium text-neutral-950">Penjualan Tiket</h4>
                                    <Select
                                        value={ticketPeriod}
                                        onValueChange={(val) => {
                                            setTicketPeriod(val);
                                            handleFilterChange({ ticket_period: val });
                                        }}
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue>{ticketPeriodLabel[ticketPeriod] || 'Minggu Ini'}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5">
                                            <SelectItem value="minggu_ini" className="font-medium text-sm rounded-xl cursor-pointer">Minggu Ini</SelectItem>
                                            <SelectItem value="bulan_ini" className="font-medium text-sm rounded-xl cursor-pointer">Bulan Ini</SelectItem>
                                            <SelectItem value="semua" className="font-medium text-sm rounded-xl cursor-pointer">Semua Waktu</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex justify-center -mt-2">
                                    <Chart options={donutOptions} series={donutSeries} type="donut" height={220} />
                                </div>
                                <div className="mt-2 space-y-2">
                                    <LegendRow
                                        label="Terjual"
                                        value={donutSold}
                                        percent={soldPercentage}
                                        active
                                    />
                                    <LegendRow
                                        label="Tersedia"
                                        value={donutAvailable}
                                        percent={availablePercentage}
                                    />
                                </div>
                            </div>

                            <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xl font-medium text-neutral-950">Top Event</h4>
                                    <Select
                                        value={topEventFilter}
                                        onValueChange={(val) => {
                                            setTopEventFilter(val);
                                            handleFilterChange({ top_event: val });
                                        }}
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue placeholder="Metrik" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5">
                                            <SelectItem value="revenue" className="font-medium text-sm rounded-xl cursor-pointer">Pendapatan</SelectItem>
                                            <SelectItem value="attendance" className="font-medium text-sm rounded-xl cursor-pointer">Attendance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                    {topEvents.length > 0 ? topEvents.map((event, i) => (
                                        <div key={i} className="flex justify-between items-center gap-2">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="w-6 h-6 rounded-[8px] bg-sky-100 text-sky-500 text-xs font-semibold flex items-center justify-center shrink-0">
                                                    {i + 1}
                                                </span>
                                                <p className="text-sm font-medium text-neutral-700 truncate">{event.name}</p>
                                            </div>
                                            <p className="text-sm font-semibold text-green-500 shrink-0">
                                                {topEventFilter === 'revenue'
                                                    ? formatRupiah(event.revenue)
                                                    : `${formatNumber(event.attendance)} Tiket`}
                                            </p>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-neutral-400 py-4 text-center">Belum ada data penjualan</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Area chart */}
                        <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h4 className="text-xl font-medium text-neutral-950">Pendapatan Penjualan</h4>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-3 text-xs font-medium text-neutral-500">
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-0.5 rounded-full bg-sky-500" /> Aktual
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <span className="w-3 h-0.5 rounded-full border-t-2 border-dashed border-neutral-300" /> Target
                                        </span>
                                    </div>
                                    <Select
                                        value={chartFilter}
                                        onValueChange={(val) => {
                                            setChartFilter(val);
                                            handleFilterChange({ chart_period: val });
                                        }}
                                    >
                                        <SelectTrigger className={selectTriggerClass}>
                                            <SelectValue>{chartPeriodLabel[chartFilter] || 'Tahun ini'}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5">
                                            <SelectItem value="tahun_ini" className="font-medium text-sm rounded-xl cursor-pointer">Tahun ini</SelectItem>
                                            <SelectItem value="3_bulan" className="font-medium text-sm rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
                                            <SelectItem value="6_bulan" className="font-medium text-sm rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                            <SelectItem value="tahun_kemarin" className="font-medium text-sm rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                            <SelectItem value="5_tahun" className="font-medium text-sm rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Chart options={areaOptions} series={areaSeries} type="area" height={260} />
                        </div>
                    </div>

                    {/* Kolom kanan */}
                    <div className="space-y-6">
                        <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm">
                            <h4 className="text-xl font-medium text-neutral-950 mb-4">Event Saat Ini</h4>
                            {currentEvent ? (
                                <div className="rounded-[16px] bg-sky-100 border border-neutral-300 overflow-hidden">
                                    <div className="relative h-36 bg-neutral-100">
                                        <img
                                            src={currentEvent.image}
                                            alt={currentEvent.name}
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute top-3 left-3 bg-sky-100 text-sky-500 text-[10px] font-semibold px-3 py-1 rounded-full">
                                            {currentEvent.category}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <h5 className="font-semibold text-neutral-950 text-xl mb-1 truncate">{currentEvent.name}</h5>
                                        <p className="text-xs text-black mb-3 flex items-center gap-1 truncate">
                                            {/* <IconMapPin size={14} className="shrink-0" /> */}
                                            {currentEvent.venue}{currentEvent.city ? `, ${currentEvent.city}` : ''}
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="w-9 h-9 bg-white text-sky-500 rounded-[10px] flex items-center justify-center shrink-0">
                                                    <IconCalendarEvent size={18} stroke={2} />
                                                </div>
                                                <div className="text-xs text-neutral-600 min-w-0">
                                                    <p className="font-semibold text-neutral-900 truncate">{currentEvent.date_format}</p>
                                                    <p className="truncate">{currentEvent.time_format}</p>
                                                </div>
                                            </div>
                                            <Link
                                                href={route('organizer.events.show', currentEvent.id)}
                                                className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-[10px] transition-colors shrink-0"
                                            >
                                                Lihat Detail
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-[16px] border border-dashed border-gray-200 p-8 text-center text-sm text-neutral-400">
                                    Tidak ada event aktif di waktu dekat.
                                </div>
                            )}
                        </div>

                        <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm">
                            <h4 className="text-xl font-medium text-neutral-950 mb-4">Aktivitas Terakhir</h4>
                            <div className="space-y-4">
                                {recentActivities?.length > 0 ? recentActivities.map((activity, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 bg-[#e6f4fe] text-sky-500">
                                            {activity.type === 'ticket'
                                                ? <IconTicket size={18} stroke={2} />
                                                : <IconCalendarWeek size={18} stroke={2} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-neutral-800 leading-snug">
                                                {activity.type === 'ticket' ? (
                                                    <>
                                                        <span className="font-semibold text-neutral-950">
                                                            {activity.title.replace(' membeli tiket', '')}
                                                        </span>
                                                        {' membeli tiket '}
                                                        <span className="font-semibold text-sky-500">{activity.target}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        {activity.title}{' '}
                                                        <span className="font-semibold text-sky-500">{activity.target}</span>
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-neutral-400 mt-1">{activity.time_ago}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-neutral-400 text-center py-4">Belum ada aktivitas</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Booking terkini */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-4 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <h4 className="text-xl font-medium text-neutral-950">Booking Terkini</h4>
                        <Search
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onSubmit={(val) => handleFilterChange({ search: val })}
                            placeholder="Cari ID, nama..."
                            className="w-full md:max-w-xs"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[900px]">
                            <thead>
                                <tr className="border-b border-neutral-300">
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Order ID</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Waktu</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Nama</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Email</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Event</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap text-center">Qty</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Jumlah</th>
                                    <th className="py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentBookings.length > 0 ? recentBookings.map((booking, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">
                                            {booking.order_id}
                                        </td>
                                        <td className="py-4 px-2 whitespace-nowrap">
                                            <div className="font-medium text-neutral-800">{booking.date}</div>
                                            <div className="text-xs text-neutral-500">{booking.time}</div>
                                        </td>
                                        <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">{booking.buyer_name}</td>
                                        <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">{booking.email}</td>
                                        <td className="py-4 px-2">
                                            <p className="text-neutral-950">{booking.event_name}</p>
                                            <p className="text-xs text-neutral-500">{booking.category}</p>
                                        </td>
                                        <td className="py-4 px-2 text-center font-medium text-neutral-950">{booking.qty}</td>
                                        <td className="py-4 px-2 font-medium text-neutral-950 whitespace-nowrap">{formatRupiah(booking.amount)}</td>
                                        <td className="py-4 px-2">
                                            <StatusBadge status={booking.status} />
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="8" className="py-10 text-center text-neutral-400 text-sm">
                                            Belum ada data booking.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}


function LegendRow({ label, value, percent, active }) {
    return (
        <div className={`flex items-center justify-between p-3`}>
            <div className='flex gap-2'>
            <div className={`w-2 h-12 rounded-full ${active? "bg-sky-500" : "bg-sky-100"}`}/>
            <div className="flex flex-col h-full">
                <p className="text-xs text-black">{label}</p>
                <p className="text-xl font-semibold text-black">{formatNumber(value)}</p>
            </div>
            </div>
            <div className={`text-lg font-semibold p-2.5 rounded-[8px] bg-sky-100 text-sky-500`}>
                {percent}%
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    if (status === 'PENDING') {
        return (
            <span className="px-3 py-1 rounded-[4px] text-[10px] font-semibold border border-amber-500 text-amber-500">
                Menunggu
            </span>
        );
    }
    return (
        <span className="px-3 py-1 rounded-[4px] text-[10px] font-semibold border border-green-500 text-green-500">
            Dibayar
        </span>
    );
}

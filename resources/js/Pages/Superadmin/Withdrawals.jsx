import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, router, Link, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconArrowDownLeft, IconTicket, IconCurrencyDollar, 
    IconBuildingBank, IconDeviceMobile, IconUser,
    IconEdit, IconTrash
} from '@tabler/icons-react';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import Modal from '@/Components/Modal';

// --- IMPORT KOMPONEN TIGO ---
import StatCard from '@/Components/StatCard';
import Search from '@/Components/Search';
import DynamicTable from '@/Components/Table';
import Pagination from '@/Components/Pagination';
import LegendRow from '@/Components/LegendRow';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

const selectTriggerClass = "h-[36px] px-4 bg-sky-500 border-0 rounded-full text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

function WithdrawalStatusBadge({ status }) {
    if (status === 'SUCCESS') return <span className="px-2 py-[2px] rounded-[4px] text-[10px] font-semibold border whitespace-nowrap border-green-500 text-green-600">Selesai</span>;
    if (status === 'PENDING') return <span className="px-2 py-[2px] rounded-[4px] text-[10px] font-semibold border whitespace-nowrap border-yellow-500 text-yellow-600">Diproses</span>;
    return <span className="px-2 py-[2px] rounded-[4px] text-[10px] font-semibold border border-red-500 whitespace-nowrap text-red-500">Ditolak</span>;
}

export default function WithdrawalManagement({ stats, statusCounts, charts, methodStats, withdrawals, filters }) {
    
    // ================= STATE FILTER (BULLETPROOF) =================
    const safeFilters = filters || {};
    const [search, setSearch] = useState(safeFilters.search || '');
    const [statusTab, setStatusTab] = useState(safeFilters.status || 'Semua');
    
    // 4 State Filter Waktu Independen
    const [filterDonut, setFilterDonut] = useState(safeFilters.filter_donut || 'minggu_ini');
    const [filterTren, setFilterTren] = useState(safeFilters.filter_tren || 'minggu_ini');
    const [filterVolume, setFilterVolume] = useState(safeFilters.filter_volume || 'minggu_ini');
    const [filterTable, setFilterTable] = useState(safeFilters.filter_table || 'minggu_ini');

    const updateFilter = (newFilters = {}) => {
        const query = {
            search: search,
            status: statusTab,
            filter_donut: filterDonut,
            filter_tren: filterTren,
            filter_volume: filterVolume,
            filter_table: filterTable,
            ...newFilters
        };

        // Bersihkan parameter kosong
        Object.keys(query).forEach(key => (!query[key] || query[key] === 'Semua') && delete query[key]);

        router.get(route('superadmin.withdrawals'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true 
        });
    };

    // ================= STATE & FUNGSI MODAL =================
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ url: '', text: '' });
    
    const [isEditWithdrawalOpen, setIsEditWithdrawalOpen] = useState(false);
    const { data: wdData, setData: setWdData, patch: putWd, processing: processingWd, reset: resetWd } = useForm({
        id: '', status: ''
    });

    const openDeleteModal = (url, text) => {
        setDeleteConfig({ url, text });
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        router.delete(deleteConfig.url, {
            preserveScroll: true,
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const openEditWithdrawal = (wd) => {
        setWdData({ id: wd._id || wd.id, status: wd.status });
        setIsEditWithdrawalOpen(true);
    };

    const submitEditWithdrawal = (e) => {
        e.preventDefault();
        putWd(route('superadmin.withdrawals.update', wdData.id), {
            preserveScroll: true,
            onSuccess: () => { setIsEditWithdrawalOpen(false); resetWd(); },
        });
    };

    // --- Kalkulasi Persentase Status ---
    const total = (statusCounts.selesai + statusCounts.diproses + statusCounts.ditolak) || 1;
    const pctSelesai = Math.round((statusCounts.selesai / total) * 100);
    const pctDiproses = Math.round((statusCounts.diproses / total) * 100);
    const pctDitolak = Math.round((statusCounts.ditolak / total) * 100);

    // --- Komponen Opsi Dropdown Reusable ---
    const filterOptions = (
        <>
            <SelectItem value="minggu_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Minggu Ini</SelectItem>
            <SelectItem value="bulan_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Bulan Ini</SelectItem>
            <SelectItem value="3_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
            <SelectItem value="6_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
            <SelectItem value="tahun_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
            <SelectItem value="tahun_kemarin" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
            <SelectItem value="5_tahun" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
            <SelectItem value="semua" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Semua Waktu</SelectItem>
        </>
    );

    // --- Konfigurasi Charts ---
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#10b981', '#facc15', '#ef4444'], // Hijau, Kuning, Merah
        labels: ['Selesai', 'Diproses', 'Ditolak'],
        dataLabels: { enabled: false },
        plotOptions: { 
            pie: { 
                donut: { 
                    size: '75%', 
                    labels: { 
                        show: true, 
                        name: { show: true, fontSize: '11px', color: '#64748b', offsetY: -10 }, 
                        value: { show: true, fontSize: '24px', fontWeight: 800, color: '#0f172a', offsetY: 5 }, 
                        total: { show: true, showAlways: true, label: 'Total Penarikan', color: '#64748b', formatter: () => (total === 1 && statusCounts.selesai === 0 ? 0 : total).toLocaleString('id-ID') } 
                    } 
                } 
            } 
        },
        stroke: { show: false }, legend: { show: false }
    };

    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: ['#0ea5e9'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.0, stops: [0, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: charts.tren.categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
        yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, legend: { show: false },
        markers: { size: 4, colors: ['#0ea5e9'], strokeColors: '#fff', strokeWidth: 2 }
    };

    const barOptions = {
        chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false } },
        colors: ['#0ea5e9'],
        plotOptions: { bar: { borderRadius: 2, columnWidth: '40%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: charts.volume.categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
        yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' }, formatter: (val) => formatRupiah(val) }, tickAmount: 4 },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };

    // ================= DEFINISI KOLOM TABEL =================
    const withdrawalColumns = [
        { 
            header: 'Withdrawal ID', 
            render: (row) => `WD-${(row.id || row._id || '').substring(0,6).toUpperCase()}`, 
            cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' 
        },
        { 
            header: 'User ID', 
            render: (row) => (row.organizer_id || 'UNKNOWN').substring(0,8).toUpperCase(), 
            cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' 
        },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <p className="text-xs font-medium text-neutral-800">{row.date}</p>
                    <p className="text-xs text-neutral-400">{row.time}</p>
                </div>
            ) 
        },
        { 
            header: 'Tujuan', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <p className="text-sm font-semibold text-neutral-900">{row.bank_code}</p>
                    <p className="text-xs text-neutral-500">{row.account_number}</p>
                </div>
            ) 
        },
        { header: 'Nama', accessor: 'account_name', cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Nominal', render: (row) => formatRupiah(row.amount), cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Status', render: (row) => <WithdrawalStatusBadge status={row.status} /> },
        { 
            header: 'Aksi', 
            headerClassName: 'text-center', 
            cellClassName: 'text-center', 
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => openEditWithdrawal(row)} className="p-1.5 bg-sky-50 text-sky-500 rounded-md hover:bg-sky-100 transition-colors">
                        <IconEdit size={16}/>
                    </button>
                    <button onClick={() => openDeleteModal(route('superadmin.withdrawals.destroy', row._id || row.id), `Penarikan ID ${(row.id || row._id || '').substring(0,8)}`)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors">
                        <IconTrash size={16}/>
                    </button>
                </div>
            ) 
        }
    ];

    return (
        <DashboardLayout header="Penarikan">
            <Head title="Penarikan" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                
                {/* 1. STATS CARDS ATAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconArrowDownLeft} label="Total Frekuensi Penarikan" value={stats.total_freq.toLocaleString('id-ID')} />
                    <StatCard icon={IconTicket} label="Total Fee Terkumpul" value={stats.total_fee} />
                    <StatCard icon={IconCurrencyDollar} label="Rata - Rata Penarikan" value={stats.avg_amount} />
                </div>

                {/* 2. CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* KIRI: Distribusi Status */}
                    <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-medium text-xl text-neutral-950">Distribusi Status</h4>
                            <Select value={filterDonut} onValueChange={(val) => { setFilterDonut(val); updateFilter({ filter_donut: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[120px]">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-center -mt-2">
                                <Chart options={donutOptions} series={[statusCounts.selesai, statusCounts.diproses, statusCounts.ditolak]} type="donut" height={280} />
                            </div>
                            <div className="mt-6 space-y-3">
                                {/* Legend Items */}
                                <LegendRow
                                        label="Selesai"
                                        value={statusCounts.selesai}
                                        percent={pctSelesai}
                                        color={'bg-green-500'}
                                    />
                                <LegendRow
                                    label="Diproses"
                                    value={statusCounts.diproses.toLocaleString('id-ID')}
                                    percent={pctDiproses}
                                    color={'bg-yellow-500'} />
                                <LegendRow
                                    label="Ditolak"
                                    value={statusCounts.ditolak.toLocaleString('id-ID')}
                                    percent={pctDitolak}
                                    color={'bg-red-500'} />
                            </div>
                        </div>
                    </div>

                    {/* KANAN: Tren & Volume */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Area Chart: Tren Penarikan */}
                        <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-xl text-neutral-950">Tren Penarikan</h4>
                                <Select value={filterTren} onValueChange={(val) => { setFilterTren(val); updateFilter({ filter_tren: val }); }}>
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[120px]">
                                        {filterOptions}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Chart options={areaOptions} series={[{ name: 'Frekuensi', data: charts.tren.data }]} type="area" height={220} />
                        </div>

                        {/* Bar Chart: Volume Penarikan */}
                        <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-medium text-xl text-neutral-950">Volume Penarikan</h4>
                                <Select value={filterVolume} onValueChange={(val) => { setFilterVolume(val); updateFilter({ filter_volume: val }); }}>
                                    <SelectTrigger className={selectTriggerClass}>
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[120px]">
                                        {filterOptions}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Chart options={barOptions} series={[{ name: 'Volume', data: charts.volume.data }]} type="bar" height={220} />
                        </div>
                    </div>
                </div>

                {/* 3. STATS CARDS METODE */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconBuildingBank} label="Transfer Bank" value={methodStats.bank.toLocaleString('id-ID')} />
                    <StatCard icon={IconDeviceMobile} label="E-Wallet" value={methodStats.ewallet.toLocaleString('id-ID')} />
                    <StatCard icon={IconUser} label="Virtual Account" value={methodStats.va.toLocaleString('id-ID')} />
                </div>

                {/* 4. TABEL RIWAYAT PENARIKAN */}
                <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col gap-6">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">
                            <h4 className="font-medium text-xl text-neutral-950 shrink-0">Riwayat Penarikan</h4>
                            
                            {/* Filter Tabs Style Baru */}
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                                {['Semua', 'Selesai', 'Diproses', 'Ditolak'].map((tab) => {
                                    let val = tab;
                                    if(tab === 'Selesai') val = 'SUCCESS';
                                    if(tab === 'Diproses') val = 'PENDING';
                                    if(tab === 'Ditolak') val = 'FAILED';

                                    const isActive = (safeFilters.status || 'Semua') === val;

                                    return (
                                        <button 
                                            key={tab} 
                                            type="button" 
                                            onClick={() => { setStatusTab(tab); updateFilter({ status: val }); }}
                                            className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-[16px] text-xs font-semibold transition-all shrink-0 capitalize ${
                                                isActive 
                                                    ? 'bg-sky-500 text-white shadow-sm' 
                                                    : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 cursor-pointer'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-3 items-center shrink-0">
                            {/* 🔥 Menggunakan Komponen Search Tigo 🔥 */}
                            <Search
                                value={search}
                                onChange={setSearch}
                                onSubmit={(val) => updateFilter({ search: val })}
                                placeholder="Cari ID, tujuan, nama..."
                                className="w-full sm:w-[240px]"
                            />
                            
                            <Select value={filterTable} onValueChange={(val) => { setFilterTable(val); updateFilter({ filter_table: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[130px]">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    {/* 🔥 Menggunakan Komponen Dynamic Table 🔥 */}
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={withdrawalColumns} 
                            data={withdrawals?.data} 
                            emptyMessage="Tidak ada data penarikan ditemukan."
                            minWidth="min-w-[1100px]" 
                        />
                    </div>
                </div>

                {/* 🔥 Menggunakan Komponen Pagination Tigo 🔥 */}
                {withdrawals && withdrawals.data && withdrawals.data.length > 0 && (
                    <Pagination
                        pagination={withdrawals}
                        onPageChange={(page) => updateFilter({ page })}
                    />
                )}

                {/* ================= MODAL COMPONENTS ================= */}
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus" maxWidth="max-w-sm">
                    <p className="text-neutral-600 mb-6">Apakah Anda yakin ingin menghapus <strong>{deleteConfig.text}</strong>? Data yang dihapus tidak dapat dikembalikan.</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">Ya, Hapus</button>
                    </div>
                </Modal>
                
                <Modal isOpen={isEditWithdrawalOpen} onClose={() => setIsEditWithdrawalOpen(false)} title="Update Status Penarikan">
                    <form onSubmit={submitEditWithdrawal} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Status Penarikan</label>
                            <Select value={wdData.status} onValueChange={(val) => setWdData('status', val)}>
                                <SelectTrigger className="w-full px-4 h-[42px] border border-neutral-300 rounded-[12px] focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm shadow-none">
                                    <SelectValue placeholder="Pilih status penarikan" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[200] p-1.5 min-w-[200px]">
                                    <SelectItem value="PENDING" className="font-medium text-sm text-neutral-700 focus:bg-yellow-50 focus:text-yellow-600 rounded-xl cursor-pointer py-2">
                                        Diproses (Pending)
                                    </SelectItem>
                                    <SelectItem value="SUCCESS" className="font-medium text-sm text-neutral-700 focus:bg-green-50 focus:text-green-600 rounded-xl cursor-pointer py-2">
                                        Selesai (Success)
                                    </SelectItem>
                                    <SelectItem value="FAILED" className="font-medium text-sm text-neutral-700 focus:bg-red-50 focus:text-red-600 rounded-xl cursor-pointer py-2">
                                        Ditolak (Failed)
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" onClick={() => setIsEditWithdrawalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Batal</button>
                            <button type="submit" disabled={processingWd} className="px-4 py-2 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50 transition-colors">Update Status</button>
                        </div>
                    </form>
                </Modal>

            </div>
        </DashboardLayout>
    );
}
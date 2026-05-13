import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, router, Link, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconArrowDownLeft, IconTicket, IconCurrencyDollar, 
    IconBuildingBank, IconDeviceMobile, IconUser,
    IconSearch, IconEdit, IconTrash
} from '@tabler/icons-react';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Modal from '@/Components/Modal';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);

export default function WithdrawalManagement({ stats, statusCounts, charts, methodStats, withdrawals, filters }) {
    
    // State Filter Dasar
    const [search, setSearch] = useState(filters?.search || '');
    const [statusTab, setStatusTab] = useState(filters?.status || 'Semua');
    
    // 4 State Filter Waktu Independen
    const [filterDonut, setFilterDonut] = useState(filters?.filter_donut || 'minggu_ini');
    const [filterTren, setFilterTren] = useState(filters?.filter_tren || 'minggu_ini');
    const [filterVolume, setFilterVolume] = useState(filters?.filter_volume || 'minggu_ini');
    const [filterTable, setFilterTable] = useState(filters?.filter_table || 'minggu_ini');

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

    const updateFilter = (key, value) => {
        // Ganti 'superadmin.withdrawals.index' jika nama route di web.php Anda berbeda
        router.get(route('superadmin.withdrawals'), {
            ...filters, [key]: value
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') updateFilter('search', search);
    };

    // --- Kalkulasi Persentase Status ---
    const total = (statusCounts.selesai + statusCounts.diproses + statusCounts.ditolak) || 1;
    const pctSelesai = Math.round((statusCounts.selesai / total) * 100);
    const pctDiproses = Math.round((statusCounts.diproses / total) * 100);
    const pctDitolak = Math.round((statusCounts.ditolak / total) * 100);

    // --- Komponen Opsi Dropdown Reusable ---
    const filterOptions = (
        <>
            <SelectItem value="minggu_ini" className="text-xs cursor-pointer focus:bg-sky-50">Minggu ini</SelectItem>
            <SelectItem value="bulan_ini" className="text-xs cursor-pointer focus:bg-sky-50">Bulan ini</SelectItem>
            <SelectItem value="3_bulan" className="text-xs cursor-pointer focus:bg-sky-50">3 Bulan Terakhir</SelectItem>
            <SelectItem value="6_bulan" className="text-xs cursor-pointer focus:bg-sky-50">6 Bulan Terakhir</SelectItem>
            <SelectItem value="tahun_ini" className="text-xs cursor-pointer focus:bg-sky-50">Tahun ini</SelectItem>
            <SelectItem value="tahun_kemarin" className="text-xs cursor-pointer focus:bg-sky-50">Tahun kemarin</SelectItem>
            <SelectItem value="5_tahun" className="text-xs cursor-pointer focus:bg-sky-50">5 Tahun Terakhir</SelectItem>
            <SelectItem value="semua" className="text-xs cursor-pointer focus:bg-sky-50">Semua Waktu</SelectItem>
        </>
    );

    // --- Konfigurasi Charts ---
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#10b981', '#eab308', '#ef4444'], // Hijau, Kuning, Merah
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
        yaxis: { labels: { style: { colors: '#94a3b8', fontSize: '11px' } }, tickAmount: 4 },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };
    

    return (
        <DashboardLayout header="Penarikan">
            <Head title="Penarikan" />

            <div className="space-y-6">
                
                {/* 1. STATS CARDS ATAS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconArrowDownLeft size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5 px-2">Total Frekuensi Penarikan</p>
                            <h3 className="text-2xl font-black text-sky-500">{stats.total_freq.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconTicket size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Total Fee Terkumpul</p>
                            <h3 className="text-2xl font-black text-sky-500">{formatRupiah(stats.total_fee)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconCurrencyDollar size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Rata - Rata Penarikan</p>
                            <h3 className="text-2xl font-black text-sky-500">{formatRupiah(stats.avg_amount)}</h3>
                        </div>
                    </div>
                </div>

                {/* 2. CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* KIRI: Distribusi Status */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg text-gray-900">Distribusi Status</h4>
                            <Select value={filterDonut} onValueChange={(val) => { setFilterDonut(val); updateFilter('filter_donut', val); }}>
                                <SelectTrigger className="bg-sky-500 text-white text-xs font-bold px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
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
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-green-500 rounded-full"></div>
                                        <div><p className="text-xs font-medium text-gray-500">Selesai</p><p className="text-sm font-bold text-gray-900">{statusCounts.selesai.toLocaleString('id-ID')}</p></div>
                                    </div>
                                    <span className="bg-green-50 text-green-600 text-sm font-bold px-3 py-1 rounded-lg">{pctSelesai}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-yellow-400 rounded-full"></div>
                                        <div><p className="text-xs font-medium text-gray-500">Diproses</p><p className="text-sm font-bold text-gray-900">{statusCounts.diproses.toLocaleString('id-ID')}</p></div>
                                    </div>
                                    <span className="bg-yellow-50 text-yellow-600 text-sm font-bold px-3 py-1 rounded-lg">{pctDiproses}%</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-8 bg-red-500 rounded-full"></div>
                                        <div><p className="text-xs font-medium text-gray-500">Ditolak</p><p className="text-sm font-bold text-gray-900">{statusCounts.ditolak.toLocaleString('id-ID')}</p></div>
                                    </div>
                                    <span className="bg-red-50 text-red-600 text-sm font-bold px-3 py-1 rounded-lg">{pctDitolak}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KANAN: Tren & Volume */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Area Chart: Tren Penarikan */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-gray-900">Tren Penarikan</h4>
                                <Select value={filterTren} onValueChange={(val) => { setFilterTren(val); updateFilter('filter_tren', val); }}>
                                    <SelectTrigger className="bg-sky-500 text-white text-xs font-bold px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                        {filterOptions}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Chart options={areaOptions} series={[{ name: 'Frekuensi', data: charts.tren.data }]} type="area" height={220} />
                        </div>

                        {/* Bar Chart: Volume Penarikan */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex-1">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg text-gray-900">Volume Penarikan</h4>
                                <Select value={filterVolume} onValueChange={(val) => { setFilterVolume(val); updateFilter('filter_volume', val); }}>
                                    <SelectTrigger className="bg-sky-500 text-white text-xs font-bold px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none">
                                        <SelectValue placeholder="Waktu" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
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
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconBuildingBank size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Transfer Bank</p>
                            <h3 className="text-2xl font-black text-sky-500">{methodStats.bank.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconDeviceMobile size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">E-Wallet</p>
                            <h3 className="text-2xl font-black text-sky-500">{methodStats.ewallet.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconUser size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Virtual Account</p>
                            <h3 className="text-2xl font-black text-sky-500">{methodStats.va.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                </div>

                {/* 4. TABEL RIWAYAT PENARIKAN */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 flex flex-col xl:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                            <h4 className="font-bold text-lg text-gray-900 mr-4 whitespace-nowrap">Riwayat Penarikan</h4>
                            {/* Filter Tabs */}
                            <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100 w-full md:w-auto overflow-x-auto">
                                {['Semua', 'Selesai', 'Diproses', 'Ditolak'].map((tab) => (
                                    <button 
                                        key={tab} onClick={() => { setStatusTab(tab); updateFilter('status', tab); }}
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                            statusTab === tab ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="Cari ID, tujuan, nama" 
                                    value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                            <Select value={filterTable} onValueChange={(val) => { setFilterTable(val); updateFilter('filter_table', val); }}>
                                <SelectTrigger className="bg-sky-500 text-white text-xs font-bold px-4 py-2 h-auto rounded-full border-0 focus:ring-0 shadow-none w-full md:w-32">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Withdrawal ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">User ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Waktu</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Tujuan</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Nama</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Nominal</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.data.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 uppercase">WD-{item.id.substring(0,6)}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 uppercase">{(item.organizer_id || 'UNKNOWN').substring(0,8)}</td>
                                        <td className="py-4 px-6 text-xs font-medium text-gray-800">
                                            {item.date} <br/> <span className="text-gray-400">{item.time}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-gray-900">{item.bank_code}</p>
                                            <p className="text-xs text-gray-500">{item.account_number}</p>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{item.account_name}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{formatRupiah(item.amount)}</td>
                                        <td className="py-4 px-6">
                                            {item.status === 'SUCCESS' ? (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-green-300 text-green-500 bg-white">Selesai</span>
                                            ) : item.status === 'PENDING' ? (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-yellow-400 text-yellow-500 bg-white">Diproses</span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-red-300 text-red-500 bg-white">Ditolak</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 flex justify-center gap-2">
                                           <button 
                                                onClick={() => openEditWithdrawal(item)}
                                                className="p-1.5 bg-blue-50 text-blue-500 rounded-md hover:bg-blue-100 transition-colors"
                                            >
                                                <IconEdit size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(route('superadmin.withdrawals.destroy', item._id || item.id), `Penarikan ID ${item.id?.substring(0,8)}`)}
                                                className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"
                                            >
                                                <IconTrash size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {withdrawals.data.length === 0 && (
                                    <tr><td colSpan="8" className="py-8 text-center text-gray-400 text-sm">Tidak ada data penarikan.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Custom */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 border-t border-gray-100 gap-4">
                        <span className="text-sm text-gray-900 font-medium">
                            Menampilkan <span className="mx-1">{withdrawals.from || 0}</span> dari <span className="mx-1">{withdrawals.total ? withdrawals.total.toLocaleString('id-ID') : 0}</span>
                        </span>
                        <div className="flex gap-1">
                            {withdrawals.links.map((link, key) => (
                                link.url ? (
                                    <Link 
                                        key={key} href={link.url} preserveState preserveScroll
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${
                                            link.active 
                                                ? 'border-[#0ea5e9] bg-white text-[#0ea5e9]' 
                                                : 'border-transparent bg-sky-50 text-sky-500 hover:bg-sky-100' 
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label.replace('&laquo; Previous', '<').replace('Next &raquo;', '>') }}
                                    />
                                ) : (
                                    <span 
                                        key={key}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border border-transparent bg-sky-50 text-sky-200 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label.replace('&laquo; Previous', '<').replace('Next &raquo;', '>') }}
                                    ></span>
                                )
                            ))}
                        </div>
                    </div>
                </div>
                  {/* Modal Konfirmasi Hapus (Universal) */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus" maxWidth="max-w-sm">
                <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus <strong>{deleteConfig.text}</strong>? Data yang dihapus tidak dapat dikembalikan.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                    <button onClick={confirmDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg">Ya, Hapus</button>
                </div>
            </Modal>
            <Modal isOpen={isEditWithdrawalOpen} onClose={() => setIsEditWithdrawalOpen(false)} title="Update Status Penarikan">
                <form onSubmit={submitEditWithdrawal} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status Penarikan</label>
                        <Select 
                            value={wdData.status} 
                            onValueChange={(val) => setWdData('status', val)}
                        >
                            <SelectTrigger className="w-full px-4 h-[42px] border border-gray-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-none">
                                <SelectValue placeholder="Pilih status penarikan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[200] p-1.5">
                                <SelectItem 
                                    value="PENDING" 
                                    className="font-medium text-sm text-gray-700 focus:bg-yellow-50 focus:text-yellow-600 rounded-lg cursor-pointer py-2"
                                >
                                    Diproses (Pending)
                                </SelectItem>
                                <SelectItem 
                                    value="SUCCESS" 
                                    className="font-medium text-sm text-gray-700 focus:bg-green-50 focus:text-green-600 rounded-lg cursor-pointer py-2"
                                >
                                    Selesai (Success)
                                </SelectItem>
                                <SelectItem 
                                    value="FAILED" 
                                    className="font-medium text-sm text-gray-700 focus:bg-red-50 focus:text-red-600 rounded-lg cursor-pointer py-2"
                                >
                                    Ditolak (Failed)
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditWithdrawalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" disabled={processingWd} className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">Update Status</button>
                    </div>
                </form>
            </Modal>
            </div>
        </DashboardLayout>
    );
}
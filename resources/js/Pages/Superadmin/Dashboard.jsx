import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, router, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconUsers, IconCalendarEvent, IconArrowDownLeft, 
    IconEdit, IconTrash
} from '@tabler/icons-react';

// --- IMPORT COMPONENTS ---
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import StatCard from '@/Components/StatCard';
import Search from '@/Components/Search';
import DynamicTable from '@/Components/Table';
import Modal from '@/Components/Modal';

// --- HELPERS ---
const PRIMARY = '#0ea5e9'; // sky-500
const PRIMARY_LIGHT = '#e0f2fe'; // sky-100

const selectTriggerClass =
    "h-[36px] px-4 bg-sky-500 border-0 rounded-full text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const formatNumber = (number) => new Intl.NumberFormat('id-ID').format(number ?? 0);

function WithdrawalStatusBadge({ status }) {
    if (status === 'SUCCESS') return <span className="px-3 py-1 rounded-md text-[10px] font-semibold border border-green-500 text-green-500">Selesai</span>;
    if (status === 'PENDING') return <span className="px-3 py-1 rounded-md text-[10px] font-semibold border border-yellow-500 text-yellow-500 bg-yellow-50">Diproses</span>;
    return <span className="px-3 py-1 rounded-md text-[10px] font-semibold border border-red-500 text-red-500">Ditolak</span>;
}

export default function SuperadminDashboard({ stats, chartData, withdrawals, users, filters }) {
    
    // --- State Filter ---
    const safeFilters = filters || {};
    const [chartYear, setChartYear] = useState(safeFilters.chart_year || 'tahun_ini');
    const [wPeriod, setWPeriod] = useState(safeFilters.w_period || 'minggu_ini');
    const [wSearch, setWSearch] = useState(safeFilters.w_search || '');
    const [uSearch, setUSearch] = useState(safeFilters.u_search || '');

    // Fungsi Fetch saat Filter Berubah
    const updateFilter = (newFilters = {}) => {
        const query = {
            chart_year: chartYear,
            w_period: wPeriod,
            w_search: wSearch,
            u_search: uSearch,
            ...newFilters
        };

        Object.keys(query).forEach(key => (!query[key] || query[key] === 'Semua') && delete query[key]);

        router.get(route('superadmin.dashboard'), query, { preserveState: true, preserveScroll: true, replace: true });
    };

    // --- Konfigurasi ApexCharts ---
    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: [PRIMARY, '#10b981'], // Biru untuk Pengguna, Hijau untuk Event
        fill: { 
            type: ['gradient', 'gradient'], 
            gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] } 
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { 
            categories: chartData.categories, 
            axisBorder: { show: false }, axisTicks: { show: false }, 
            labels: { style: { colors: '#94a3b8' } }
        },
        yaxis: { 
            labels: { 
                formatter: (value) => value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value, 
                style: { colors: '#94a3b8' }
            } 
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, 
        legend: { position: 'top', horizontalAlign: 'right', offsetY: -20, markers: { radius: 12 } }
    };

    const areaSeries = [
        { name: 'Pengguna', data: chartData.pengguna },
        { name: 'Event', data: chartData.event }
    ];

    // ================= STATE MODAL =================
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ url: '', text: '' });

    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const { data: userData, setData: setUserData, put: putUser, processing: processingUser, reset: resetUser } = useForm({
        id: '', name: '', email: '', phone_number: ''
    });

    const [isEditWithdrawalOpen, setIsEditWithdrawalOpen] = useState(false);
    const { data: wdData, setData: setWdData, patch: putWd, processing: processingWd, reset: resetWd } = useForm({
        id: '', status: ''
    });

    // ================= FUNGSI AKSI =================
    const openDeleteModal = (url, text) => { setDeleteConfig({ url, text }); setIsDeleteModalOpen(true); };
    const confirmDelete = () => { router.delete(deleteConfig.url, { preserveScroll: true, onSuccess: () => setIsDeleteModalOpen(false) }); };

    const openEditUser = (user) => { setUserData({ id: user._id || user.id, name: user.name, email: user.email, phone_number: user.phone_number }); setIsEditUserOpen(true); };
    const submitEditUser = (e) => { e.preventDefault(); putUser(route('superadmin.users.update', userData.id), { preserveScroll: true, onSuccess: () => { setIsEditUserOpen(false); resetUser(); } }); };

    const openEditWithdrawal = (wd) => { setWdData({ id: wd._id || wd.id, status: wd.status }); setIsEditWithdrawalOpen(true); };
    const submitEditWithdrawal = (e) => { e.preventDefault(); putWd(route('superadmin.withdrawals.update', wdData.id), { preserveScroll: true, onSuccess: () => { setIsEditWithdrawalOpen(false); resetWd(); } }); };

    // ================= DEFINISI KOLOM TABEL =================
    const withdrawalColumns = [
        { header: 'Withdrawal ID', render: (row) => (row.id || row._id || '').substring(0,8).toUpperCase(), cellClassName: 'font-medium text-neutral-900' },
        { header: 'User ID', render: (row) => row.organizer_id?.substring(0,8), cellClassName: 'font-medium text-neutral-900' },
        { 
            header: 'Waktu', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <div className="font-medium text-neutral-800">{row.date}</div>
                    <div className="text-xs text-neutral-500">{row.time}</div>
                </div>
            ) 
        },
        { 
            header: 'Tujuan', 
            render: (row) => (
                <div className="whitespace-nowrap">
                    <div className="font-semibold text-neutral-900">{row.bank_info?.bank_code}</div>
                    <div className="text-xs text-neutral-500">{row.bank_info?.account_number}</div>
                </div>
            ) 
        },
        { header: 'Nama', render: (row) => row.bank_info?.account_name, cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
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

    const userColumns = [
        { header: 'User ID', render: (row) => (row.id || row._id || '').substring(0,8), cellClassName: 'font-medium text-neutral-900' },
        { header: 'Username', accessor: 'username', cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' },
        { header: 'Email', accessor: 'email', cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Nama', accessor: 'name', cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Kode', accessor: 'phone_code', cellClassName: 'font-medium text-neutral-900' },
        { header: 'Nomor HP', accessor: 'phone_number', cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' },
        { header: 'Tanggal Lahir', accessor: 'birth_date', cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' },
        { 
            header: 'Aksi', 
            headerClassName: 'text-center', 
            cellClassName: 'text-center', 
            render: (row) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => openEditUser(row)} className="p-1.5 bg-sky-50 text-sky-500 rounded-md hover:bg-sky-100 transition-colors">
                        <IconEdit size={16}/>
                    </button>
                    <button onClick={() => openDeleteModal(route('superadmin.users.destroy', row._id || row.id), `Pengguna ${row.name}`)} className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors">
                        <IconTrash size={16}/>
                    </button>
                </div>
            ) 
        }
    ];

    return (
        <DashboardLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconUsers} label="Total Pengguna" value={formatNumber(stats.users)} />
                    <StatCard icon={IconCalendarEvent} label="Total Semua Event" value={formatNumber(stats.events)} />
                    <StatCard icon={IconArrowDownLeft} label="Total Penarikan" value={formatNumber(stats.withdrawals)} />
                </div>

                {/* 2. CHART AREA */}
                <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h4 className="font-medium text-xl text-neutral-950">Pertumbuhan Pengguna & Event</h4>
                        <Select value={chartYear} onValueChange={(val) => { setChartYear(val); updateFilter({ chart_year: val }); }}>
                            <SelectTrigger className={selectTriggerClass}>
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5">
                                <SelectItem value="tahun_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                <SelectItem value="tahun_kemarin" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                <SelectItem value="3_tahun" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">3 Tahun Terakhir</SelectItem>
                                <SelectItem value="5_tahun" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                <SelectItem value="10_tahun" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">10 Tahun Terakhir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="-ml-2">
                        <Chart options={areaOptions} series={areaSeries} type="area" height={280} />
                    </div>
                </div>

                {/* 3. TABEL RIWAYAT PENARIKAN */}
                <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center flex-wrap gap-4 w-full md:w-auto">
                            <h4 className="font-medium text-xl text-neutral-950">Riwayat Penarikan</h4>
                            {/* Tabs Status */}
                            <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full xl:w-auto">
                                {['Semua', 'Selesai', 'Diproses', 'Ditolak'].map((tab) => {
                                    // Mapping value backend
                                    let val = tab;
                                    if(tab === 'Selesai') val = 'SUCCESS';
                                    if(tab === 'Diproses') val = 'PENDING';
                                    if(tab === 'Ditolak') val = 'FAILED';

                                    return (
                                        <button 
                                            key={tab} type="button" onClick={() => updateFilter({ w_status: val })}
                                            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-[16px] text-xs font-semibold transition-all shrink-0 capitalize ${
                                                (safeFilters.w_status || 'Semua') === val ? 'bg-sky-500 text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 cursor-pointer'
                                            }`}
                                        >
                                            {tab}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Search 
                                value={wSearch} 
                                onChange={setWSearch} 
                                onSubmit={(val) => updateFilter({ w_search: val })} 
                                placeholder="Cari ID, tujuan, nama" 
                                className="w-full md:w-64"
                            />
                            <Select value={wPeriod} onValueChange={(val) => { setWPeriod(val); updateFilter({ w_period: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Periode" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[120px]">
                                    <SelectItem value="minggu_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Minggu Ini</SelectItem>
                                    <SelectItem value="bulan_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Bulan Ini</SelectItem>
                                    <SelectItem value="3_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
                                    <SelectItem value="6_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                    <SelectItem value="semua" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Semua Waktu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={withdrawalColumns} 
                            data={withdrawals.data} 
                            emptyMessage="Data penarikan tidak ditemukan pada periode ini." 
                            minWidth="min-w-[1000px]"
                        />
                    </div>
                </div>

                {/* 4. TABEL PENGGUNA */}
                <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h4 className="font-medium text-xl text-neutral-950">Daftar Pengguna Terakhir</h4>
                        <Search 
                            value={uSearch} 
                            onChange={setUSearch} 
                            onSubmit={(val) => updateFilter({ u_search: val })} 
                            placeholder="Cari email, username, nama..." 
                            className="w-full md:w-80"
                        />
                    </div>
                    
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={userColumns} 
                            data={users.data} 
                            emptyMessage="Data pengguna tidak ditemukan." 
                            minWidth="min-w-[1000px]"
                        />
                    </div>
                </div>

            </div>

            {/* Modal Konfirmasi Hapus (Universal) */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus" maxWidth="max-w-sm">
                <p className="text-neutral-600 mb-6">Apakah Anda yakin ingin menghapus <strong>{deleteConfig.text}</strong>? Data yang dihapus tidak dapat dikembalikan.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Batal</button>
                    <button onClick={confirmDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors">Ya, Hapus</button>
                </div>
            </Modal>

            {/* Modal Edit Pengguna */}
            <Modal isOpen={isEditUserOpen} onClose={() => setIsEditUserOpen(false)} title="Edit Data Pengguna">
                <form onSubmit={submitEditUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={userData.name} onChange={e => setUserData('name', e.target.value)} className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                        <input type="email" value={userData.email} onChange={e => setUserData('email', e.target.value)} className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nomor Handphone</label>
                        <input type="text" value={userData.phone_number} onChange={e => setUserData('phone_number', e.target.value)} className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-sky-500 focus:border-sky-500 text-sm" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditUserOpen(false)} className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">Batal</button>
                        <button type="submit" disabled={processingUser} className="px-4 py-2 text-sm font-bold text-white bg-sky-500 hover:bg-sky-600 rounded-lg disabled:opacity-50 transition-colors">Simpan Perubahan</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Penarikan */}
            <Modal isOpen={isEditWithdrawalOpen} onClose={() => setIsEditWithdrawalOpen(false)} title="Update Status Penarikan">
                <form onSubmit={submitEditWithdrawal} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Status Penarikan</label>
                        <Select value={wdData.status} onValueChange={(val) => setWdData('status', val)}>
                            <SelectTrigger className="w-full px-4 h-[42px] border border-neutral-300 rounded-xl focus:ring-1 focus:ring-sky-500 focus:border-sky-500 text-sm shadow-none">
                                <SelectValue placeholder="Pilih status penarikan" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border border-neutral-300 shadow-xl z-[200] p-1.5 w-[var(--radix-select-trigger-width)]">
                                <SelectItem value="PENDING" className="font-medium text-sm text-neutral-700 focus:bg-yellow-50 focus:text-yellow-600 rounded-lg cursor-pointer py-2">
                                    Diproses (Pending)
                                </SelectItem>
                                <SelectItem value="SUCCESS" className="font-medium text-sm text-neutral-700 focus:bg-green-50 focus:text-green-600 rounded-lg cursor-pointer py-2">
                                    Selesai (Success)
                                </SelectItem>
                                <SelectItem value="FAILED" className="font-medium text-sm text-neutral-700 focus:bg-red-50 focus:text-red-600 rounded-lg cursor-pointer py-2">
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

        </DashboardLayout>
    );
}
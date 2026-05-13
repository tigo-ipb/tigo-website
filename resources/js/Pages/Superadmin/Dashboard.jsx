import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; // Sesuaikan layout superadmin Anda
import { Head, router, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconUsers, IconCalendarEvent, IconArrowDownLeft, 
    IconSearch, IconEdit, IconTrash
} from '@tabler/icons-react';

// Import Shadcn Select
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Modal from '@/Components/Modal';

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function SuperadminDashboard({ stats, chartData, withdrawals, users, filters }) {
    
    // --- State Filter ---
    const [chartYear, setChartYear] = useState(filters?.chart_year || 'tahun_ini');
    const [wPeriod, setWPeriod] = useState(filters?.w_period || 'minggu_ini');
    const [wSearch, setWSearch] = useState(filters?.w_search || '');
    const [uSearch, setUSearch] = useState(filters?.u_search || '');

    // Fungsi Fetch saat Filter Berubah
    const updateFilter = (key, value) => {
        router.get(route('superadmin.dashboard'), {
            ...filters,
            [key]: value
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e, key, value) => {
        if (e.key === 'Enter') updateFilter(key, value);
    };

    // --- Konfigurasi ApexCharts ---
    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: ['#0ea5e9', '#10b981'], // Biru untuk Pengguna, Hijau untuk Event
        fill: { 
            type: 'gradient', 
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
                formatter: (value) => {
                    if(value >= 1000) return (value / 1000).toFixed(1) + 'k';
                    return value;
                }, 
                style: { colors: '#94a3b8' }
            } 
        },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, 
        legend: { position: 'top', horizontalAlign: 'right', offsetY: -20, markers: { radius: 12 } }
    };

    // Pastikan nama properti data sesuai dengan yang dikirim dari Controller (pengguna & event)
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
    // 1. Fungsi Hapus Universal (Bisa untuk User / Withdrawal)
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

    // 2. Fungsi Edit Pengguna
    const openEditUser = (user) => {
        setUserData({ id: user._id || user.id, name: user.name, email: user.email, phone_number: user.phone_number });
        setIsEditUserOpen(true);
    };

    const submitEditUser = (e) => {
        e.preventDefault();
        putUser(route('superadmin.users.update', userData.id), {
            preserveScroll: true,
            onSuccess: () => { setIsEditUserOpen(false); resetUser(); },
        });
    };

    // 3. Fungsi Edit Penarikan
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

    return (
        <DashboardLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><IconUsers size={28} stroke={1.5} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-1">Total Pengguna</p>
                            <h3 className="text-3xl font-black text-blue-500">{new Intl.NumberFormat('id-ID').format(stats.users)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><IconCalendarEvent size={28} stroke={1.5} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-1">Total Semua Event</p>
                            <h3 className="text-3xl font-black text-blue-500">{new Intl.NumberFormat('id-ID').format(stats.events)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center"><IconArrowDownLeft size={28} stroke={1.5} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-1">Total Penarikan</p>
                            <h3 className="text-3xl font-black text-blue-500">{new Intl.NumberFormat('id-ID').format(stats.withdrawals)}</h3>
                        </div>
                    </div>
                </div>

                {/* 2. CHART AREA */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-lg text-gray-900">Pertumbuhan Pengguna & Event</h4>
                        <Select value={chartYear} onValueChange={(val) => { setChartYear(val); updateFilter('chart_year', val); }}>
                            <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full flex items-center gap-1 border-0 focus:ring-0 shadow-none">
                                <SelectValue placeholder="Tahun" />
                            </SelectTrigger>
                            <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                {/* Opsi Khusus Tahunan */}
                                <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                <SelectItem value="3_tahun" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">3 Tahun Terakhir</SelectItem>
                                <SelectItem value="5_tahun" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                <SelectItem value="10_tahun" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">10 Tahun Terakhir</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="-ml-2">
                        <Chart options={areaOptions} series={areaSeries} type="area" height={320} />
                    </div>
                </div>

                {/* 3. TABEL RIWAYAT PENARIKAN */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <h4 className="font-bold text-lg text-gray-900">Riwayat Penarikan</h4>
                            {/* Tabs Status */}
                            <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100 hidden md:flex">
                                {['Semua', 'Selesai', 'Diproses', 'Ditolak'].map((tab) => (
                                    <button 
                                        key={tab} onClick={() => updateFilter('w_status', tab)}
                                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            (filters.w_status || 'Semua') === tab ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="Cari ID, tujuan, nama" 
                                    value={wSearch} onChange={(e) => setWSearch(e.target.value)} onKeyDown={(e) => handleSearch(e, 'w_search', wSearch)}
                                    className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <Select value={wPeriod} onValueChange={(val) => { setWPeriod(val); updateFilter('w_period', val); }}>
                                <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none min-w-[110px]">
                                    <SelectValue placeholder="Periode" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    {/* Opsi Lengkap Format Bawah */}
                                    <SelectItem value="minggu_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Minggu Ini</SelectItem>
                                    <SelectItem value="bulan_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Bulan Ini</SelectItem>
                                    <SelectItem value="3_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
                                    <SelectItem value="6_bulan" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
                                    <SelectItem value="tahun_ini" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Tahun Ini</SelectItem>
                                    <SelectItem value="tahun_kemarin" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Tahun Kemarin</SelectItem>
                                    <SelectItem value="5_tahun" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
                                    <SelectItem value="semua" className="font-medium text-xs text-gray-700 focus:bg-blue-50 rounded-xl cursor-pointer">Semua Waktu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Withdrawal ID</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">User ID</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Waktu</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Tujuan</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Nama</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Nominal</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Status</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {withdrawals.data.map((item, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{(item.id || item._id || '').substring(0,8).toUpperCase()}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{item.organizer_id?.substring(0,8)}</td>
                                        <td className="py-4 px-6 text-xs text-gray-600">{item.date}<br/><span className="text-gray-400">{item.time}</span></td>
                                        <td className="py-4 px-6 text-sm text-gray-900 font-bold">{item.bank_info?.bank_code}<br/><span className="text-xs font-normal text-gray-500">{item.bank_info?.account_number}</span></td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{item.bank_info?.account_name}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{formatRupiah(item.amount)}</td>
                                        <td className="py-4 px-6">
                                            {item.status === 'SUCCESS' ? <span className="px-3 py-1 rounded-md text-[10px] font-bold border border-green-200 text-green-500">Selesai</span> : item.status === 'PENDING' ? <span className="px-3 py-1 rounded-md text-[10px] font-bold border border-yellow-300 text-yellow-500">Diproses</span> : <span className="px-3 py-1 rounded-md text-[10px] font-bold border border-red-200 text-red-500">Ditolak</span>}
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
                            </tbody>
                             {withdrawals.data.length === 0 && (
                                    <tr><td colSpan="8" className="py-8 text-center text-gray-400 text-sm">Data penarikan tidak ditemukan pada periode ini.</td></tr>
                                )}
                        </table>
                    </div>
                </div>

                {/* 4. TABEL PENGGUNA */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-gray-900">Daftar Pengguna Terakhir</h4>
                        <div className="relative w-full md:w-80">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" placeholder="Cari email, username, nama..." 
                                value={uSearch} onChange={(e) => setUSearch(e.target.value)} onKeyDown={(e) => handleSearch(e, 'u_search', uSearch)}
                                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">User ID</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Username</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Email</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Nama</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Kode</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Nomor Handphone</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500">Tanggal Lahir</th>
                                    <th className="py-3 px-6 text-xs font-bold text-blue-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{(user.id || user._id || '').substring(0,8)}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{user.email}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{user.name}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.phone_code}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.phone_number}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.birth_date}</td>
                                        <td className="py-4 px-6 flex justify-center gap-2">
                                            <button 
                                                onClick={() => openEditUser(user)}
                                                className="p-1.5 bg-blue-50 text-blue-500 rounded-md hover:bg-blue-100 transition-colors"
                                            >
                                                <IconEdit size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => openDeleteModal(route('superadmin.users.destroy', user._id || user.id), `Pengguna ${user.name}`)}
                                                className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100 transition-colors"
                                            >
                                                <IconTrash size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                             {users.data.length === 0 && (
                                    <tr><td colSpan="8" className="py-8 text-center text-gray-400 text-sm">Data pengguna tidak ditemukan.</td></tr>
                                )}
                        </table>
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

            {/* Modal Edit Pengguna */}
            <Modal isOpen={isEditUserOpen} onClose={() => setIsEditUserOpen(false)} title="Edit Data Pengguna">
                <form onSubmit={submitEditUser} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                        <input type="text" value={userData.name} onChange={e => setUserData('name', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={userData.email} onChange={e => setUserData('email', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Handphone</label>
                        <input type="text" value={userData.phone_number} onChange={e => setUserData('phone_number', e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 text-sm" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsEditUserOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                        <button type="submit" disabled={processingUser} className="px-4 py-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50">Simpan Perubahan</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Edit Penarikan */}
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
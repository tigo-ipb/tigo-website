import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, Link, router, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconUser, IconTicket, IconCalendarEvent, IconSearch, IconEdit, IconTrash 
} from '@tabler/icons-react';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import Modal from '@/Components/Modal';

const formatRupiah = (number) => new Intl.NumberFormat('id-ID').format(number);

// PERUBAHAN PROPS: stats dipecah menjadi topStats dan donutStats sesuai Controller
export default function UserManagement({ topStats, donutStats, chartData, users, filters }) {
    
    // ================= STATE FILTER =================
    const [search, setSearch] = useState(filters?.search || '');
    
    // 3 State Filter Waktu Independen
    const [filterRole, setFilterRole] = useState(filters?.filter_role || 'minggu_ini');
    const [filterGrowth, setFilterGrowth] = useState(filters?.filter_growth || 'minggu_ini');
    const [filterTable, setFilterTable] = useState(filters?.filter_table || 'semua');

    const updateFilter = (key, value) => {
        router.get(route('superadmin.users'), {
            ...filters, [key]: value
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') updateFilter('search', search);
    };

    // --- Komponen Opsi Dropdown Reusable ---
    const filterOptions = (
        <>
            <SelectItem value="minggu_ini" className="text-xs cursor-pointer focus:bg-blue-50">Minggu ini</SelectItem>
            <SelectItem value="bulan_ini" className="text-xs cursor-pointer focus:bg-blue-50">Bulan ini</SelectItem>
            <SelectItem value="3_bulan" className="text-xs cursor-pointer focus:bg-blue-50">3 Bulan Terakhir</SelectItem>
            <SelectItem value="6_bulan" className="text-xs cursor-pointer focus:bg-blue-50">6 Bulan Terakhir</SelectItem>
            <SelectItem value="tahun_ini" className="text-xs cursor-pointer focus:bg-blue-50">Tahun ini</SelectItem>
            <SelectItem value="tahun_kemarin" className="text-xs cursor-pointer focus:bg-blue-50">Tahun kemarin</SelectItem>
            <SelectItem value="5_tahun" className="text-xs cursor-pointer focus:bg-blue-50">5 Tahun Terakhir</SelectItem>
            <SelectItem value="semua" className="text-xs cursor-pointer focus:bg-blue-50">Semua Waktu</SelectItem>
        </>
    );

    // --- Persentase Donut (Menggunakan donutStats) ---
    const totalDonut = donutStats.total > 0 ? donutStats.total : 1;
    const pemesanPct = Math.round((donutStats.pemesan / totalDonut) * 100);
    const penyelenggaraPct = Math.round((donutStats.penyelenggara / totalDonut) * 100);

    // --- Konfigurasi Donut Chart ---
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#e0f2fe'], 
        labels: ['Pemesan', 'Penyelenggara'],
        dataLabels: { enabled: false },
        plotOptions: { 
            pie: { 
                donut: { 
                    size: '75%', 
                    labels: { 
                        show: true, 
                        name: { show: true, fontSize: '12px', color: '#64748b', offsetY: -10 }, 
                        value: { show: true, fontSize: '28px', fontWeight: 800, color: '#0f172a', offsetY: 5 }, 
                        total: { show: true, showAlways: true, label: 'Total Pengguna', color: '#64748b', formatter: () => (donutStats.total === 0 ? 0 : formatRupiah(donutStats.total)) } 
                    } 
                } 
            } 
        },
        stroke: { show: false }, legend: { show: false }, tooltip: { enabled: true }
    };
    const donutSeries = [donutStats.pemesan, donutStats.penyelenggara]; 

    // --- Konfigurasi Area Chart ---
    const areaOptions = {
        chart: { type: 'area', fontFamily: 'inherit', toolbar: { show: false } },
        colors: ['#0ea5e9'],
        fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.0, stops: [0, 100] } },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 3 },
        xaxis: { categories: chartData.categories, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { colors: '#94a3b8', fontSize: '11px' } } },
        yaxis: { labels: { formatter: (value) => value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value, style: { colors: '#94a3b8', fontSize: '11px' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }, legend: { show: false },
        markers: { size: 5, colors: ['#0ea5e9'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 7 } }
    };
    const areaSeries = [{ name: 'Pengguna Baru', data: chartData.growth }];

    // ================= STATE MODAL =================
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ url: '', text: '' });

    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const { data: userData, setData: setUserData, put: putUser, processing: processingUser, reset: resetUser } = useForm({
        id: '', name: '', email: '', phone_number: ''
    });

    // ================= FUNGSI AKSI =================
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

    return (
        <DashboardLayout header="Pengguna">
            <Head title="Pengguna" />

            <div className="space-y-6">
                
                {/* 1. STATS CARDS (Menggunakan topStats - Sepanjang Masa) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-blue-50 text-blue-500"><IconUser size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Total Pengguna</p>
                            <h3 className="text-2xl font-black text-blue-500">{formatRupiah(topStats.total)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-blue-50 text-blue-500"><IconTicket size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Total Pemesan</p>
                            <h3 className="text-2xl font-black text-blue-500">{formatRupiah(topStats.pemesan)}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-blue-50 text-blue-500"><IconCalendarEvent size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Total Penyelenggara</p>
                            <h3 className="text-2xl font-black text-blue-500">{formatRupiah(topStats.penyelenggara)}</h3>
                        </div>
                    </div>
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Donut Chart (Menggunakan donutStats & filterRole) */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-bold text-lg text-gray-900">Role Pengguna</h4>
                            <Select value={filterRole} onValueChange={(val) => { setFilterRole(val); updateFilter('filter_role', val); }}>
                                <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-center -mt-4">
                                <Chart options={donutOptions} series={donutSeries} type="donut" height={260} />
                            </div>
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between bg-blue-500 text-white p-3 rounded-xl border-l-4 border-blue-700">
                                    <div>
                                        <p className="text-xs font-medium opacity-80">Pemesan</p>
                                        <p className="text-lg font-bold">{formatRupiah(donutStats.pemesan)}</p>
                                    </div>
                                    <span className="bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-lg">{pemesanPct}%</span>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border-l-4 border-blue-100">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500">Penyelenggara</p>
                                        <p className="text-lg font-bold text-gray-900">{formatRupiah(donutStats.penyelenggara)}</p>
                                    </div>
                                    <span className="bg-blue-50 text-blue-600 text-sm font-bold px-3 py-1 rounded-lg">{penyelenggaraPct}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Area Chart (Menggunakan filterGrowth) */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg text-gray-900">Pertumbuhan Pengguna</h4>
                            <Select value={filterGrowth} onValueChange={(val) => { setFilterGrowth(val); updateFilter('filter_growth', val); }}>
                                <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-1.5 h-auto rounded-full border-0 focus:ring-0 shadow-none">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 mt-2">
                            <Chart options={areaOptions} series={areaSeries} type="area" height={280} />
                        </div>
                    </div>
                </div>

                {/* 3. TABEL PENGGUNA */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        <h4 className="font-bold text-lg text-gray-900">Daftar Pengguna</h4>
                        
                        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                            <div className="relative w-full md:w-80">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="Cari email, username, nama..." 
                                    value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            {/* <Select value={filterTable} onValueChange={(val) => { setFilterTable(val); updateFilter('filter_table', val); }}>
                                <SelectTrigger className="bg-blue-500 text-white text-xs font-medium px-4 py-2 h-auto rounded-full border-0 focus:ring-0 shadow-none w-full md:w-32">
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    {filterOptions}
                                </SelectContent>
                            </Select> */}
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">User ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Role</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Username</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Email</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Nama</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Kode</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500">Nomor Handphone</th>
                                    <th className="py-4 px-6 text-xs font-bold text-blue-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.map((user, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 uppercase">U-{(user.id || user._id || '').substring(0,7)}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 capitalize">{user.role === 'organizer' ? 'Penyelenggara' : 'Pemesan'}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.username}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{user.email}</td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{user.name}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.phone_code || '+62'}</td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900">{user.phone_number}</td>
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
                                {users.data.length === 0 && (
                                    <tr><td colSpan="8" className="py-8 text-center text-gray-400 text-sm">Data pengguna tidak ditemukan pada periode ini.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Custom */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 border-t border-gray-100 gap-4">
                        <span className="text-sm text-gray-500 font-medium">
                            Menampilkan {users.from || 0} dari {users.total ? formatRupiah(users.total) : 0}
                        </span>
                        <div className="flex gap-1">
                            {users.links.map((link, key) => (
                                link.url ? (
                                    <Link 
                                        key={key} href={link.url} preserveState preserveScroll
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                            link.active 
                                                ? 'border-[#0ea5e9] bg-white text-[#0ea5e9]' 
                                                : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50' 
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span 
                                        key={key}
                                        className="px-4 py-2 rounded-xl text-sm font-bold border border-transparent text-gray-300 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    ></span>
                                )
                            ))}
                        </div>
                    </div>
                </div>

                {/* ================= MODAL COMPONENTS ================= */}
                <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Konfirmasi Hapus" maxWidth="max-w-sm">
                    <p className="text-gray-600 mb-6">Apakah Anda yakin ingin menghapus <strong>{deleteConfig.text}</strong>? Data yang dihapus tidak dapat dikembalikan.</p>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</button>
                        <button onClick={confirmDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg">Ya, Hapus</button>
                    </div>
                </Modal>
                
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
                
            </div>
        </DashboardLayout>
    );
}
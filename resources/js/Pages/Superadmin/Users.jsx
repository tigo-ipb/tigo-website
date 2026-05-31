import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, router, useForm } from '@inertiajs/react';
import Chart from 'react-apexcharts';
import { 
    IconUser, IconTicket, IconCalendarEvent, IconEdit, IconTrash 
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

const formatRupiah = (number) => new Intl.NumberFormat('id-ID').format(number);

const selectTriggerClass = "h-[36px] px-4 bg-sky-500 border-0 rounded-full text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0";

export default function UserManagement({ topStats, donutStats, chartData, users, filters }) {
    
    // ================= STATE FILTER (BULLETPROOF) =================
    const safeFilters = filters || {};
    const [search, setSearch] = useState(safeFilters.search || '');
    
    // 3 State Filter Waktu Independen
    const [filterRole, setFilterRole] = useState(safeFilters.filter_role || 'minggu_ini');
    const [filterGrowth, setFilterGrowth] = useState(safeFilters.filter_growth || 'minggu_ini');

    const handleFilterChange = (newFilters = {}) => {
        const query = {
            search: search,
            filter_role: filterRole,
            filter_growth: filterGrowth,
            ...newFilters
        };

        // Bersihkan filter kosong
        Object.keys(query).forEach(key => (!query[key] || query[key] === 'semua') && delete query[key]);

        router.get(route('superadmin.users'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true
        });
    };

    // --- Komponen Opsi Dropdown Reusable ---
    const filterOptions = (
        <>
            <SelectItem value="minggu_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Minggu ini</SelectItem>
            <SelectItem value="bulan_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Bulan ini</SelectItem>
            <SelectItem value="3_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">3 Bulan Terakhir</SelectItem>
            <SelectItem value="6_bulan" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">6 Bulan Terakhir</SelectItem>
            <SelectItem value="tahun_ini" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun ini</SelectItem>
            <SelectItem value="tahun_kemarin" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Tahun kemarin</SelectItem>
            <SelectItem value="5_tahun" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">5 Tahun Terakhir</SelectItem>
            <SelectItem value="semua" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 rounded-xl cursor-pointer">Semua Waktu</SelectItem>
        </>
    );

    // --- Persentase Donut ---
    const totalDonut = donutStats.total > 0 ? donutStats.total : 1;
    const pemesanPct = Math.round((donutStats.pemesan / totalDonut) * 100);
    const penyelenggaraPct = Math.round((donutStats.penyelenggara / totalDonut) * 100);

    // --- Konfigurasi Donut Chart ---
    const donutOptions = {
        chart: { type: 'donut', fontFamily: 'inherit' },
        colors: ['#0ea5e9', '#e0f2fe'], // sky-500 & sky-100
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

    // ================= DEFINISI KOLOM TABEL =================
    const userColumns = [
        { 
            header: 'User ID', 
            render: (row) => `U-${(row.id || row._id || '').substring(0,7).toUpperCase()}`, 
            cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' 
        },
        { 
            header: 'Role', 
            render: (row) => row.role === 'organizer' ? 'Penyelenggara' : 'Pemesan', 
            cellClassName: 'font-medium text-neutral-900 capitalize whitespace-nowrap' 
        },
        { header: 'Username', accessor: 'username', cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' },
        { header: 'Email', accessor: 'email', cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Nama', accessor: 'name', cellClassName: 'font-semibold text-neutral-900 whitespace-nowrap' },
        { header: 'Kode', render: (row) => row.phone_code || '+62', cellClassName: 'font-medium text-neutral-900' },
        { header: 'Nomor Handphone', accessor: 'phone_number', cellClassName: 'font-medium text-neutral-900 whitespace-nowrap' },
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
        <DashboardLayout header="Pengguna">
            <Head title="Pengguna" />

            <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard icon={IconUser} label="Total Pengguna" value={formatRupiah(topStats.total)} />
                    <StatCard icon={IconTicket} label="Total Pemesan" value={formatRupiah(topStats.pemesan)} />
                    <StatCard icon={IconCalendarEvent} label="Total Penyelenggara" value={formatRupiah(topStats.penyelenggara)} />
                </div>

                {/* 2. CHARTS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Donut Chart */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-medium text-xl text-neutral-950">Role Pengguna</h4>
                            <Select value={filterRole} onValueChange={(val) => { setFilterRole(val); handleFilterChange({ filter_role: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5">
                                    {filterOptions}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-center -mt-4">
                                <Chart options={donutOptions} series={donutSeries} type="donut" height={260} />
                            </div>
                            <div className="mt-4 space-y-3">
                                <LegendRow
                                        label="Pemesan"
                                        value={formatRupiah(donutStats.pemesan)}
                                        percent={pemesanPct}
                                        color={'bg-sky-500'}
                                    />
                                <LegendRow
                                        label="Penyelenggara"
                                        value={formatRupiah(donutStats.penyelenggara)}
                                        percent={penyelenggaraPct}
                                        color={'bg-sky-100'}
                                    />
                            </div>
                        </div>
                    </div>

                    {/* Area Chart */}
                    <div className="lg:col-span-2 bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm flex flex-col">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <h4 className="font-medium text-xl text-neutral-950">Pertumbuhan Pengguna</h4>
                            <Select value={filterGrowth} onValueChange={(val) => { setFilterGrowth(val); handleFilterChange({ filter_growth: val }); }}>
                                <SelectTrigger className={selectTriggerClass}>
                                    <SelectValue placeholder="Waktu" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="w-[var(--radix-select-trigger-width)] bg-white rounded-[20px] border border-neutral-300 shadow-xl z-[100] p-1.5 min-w-[120px]">
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
                <div className="bg-white rounded-[24px] border border-neutral-300 shadow-sm p-4 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h4 className="font-medium text-xl text-neutral-950">Daftar Pengguna</h4>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* 🔥 Menggunakan Komponen Search Tigo 🔥 */}
                            <Search
                                value={search}
                                onChange={setSearch}
                                onSubmit={(val) => handleFilterChange({ search: val })}
                                placeholder="Cari email, username, nama..."
                                className="w-full md:w-80"
                            />
                        </div>
                    </div>
                    
                    {/* 🔥 Menggunakan Komponen DynamicTable 🔥 */}
                    <div className="overflow-x-auto">
                        <DynamicTable 
                            columns={userColumns} 
                            data={users?.data} 
                            emptyMessage="Data pengguna tidak ditemukan."
                            minWidth="min-w-[1000px]" 
                        />
                    </div>
                </div>

                {/* 🔥 Menggunakan Komponen Pagination Tigo 🔥 */}
                {users && users.data && users.data.length > 0 && (
                    <Pagination
                        pagination={users}
                        onPageChange={(page) => handleFilterChange({ page })}
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
                
            </div>
        </DashboardLayout>
    );
}
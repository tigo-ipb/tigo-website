import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    IconWallet, IconClockHour4, IconArrowBearRight, IconArrowDownLeft,
    IconBuildingBank, IconDeviceMobile, IconUserCircle, 
    IconTrash, IconSearch, IconFilter, IconCheck, IconX,
    IconPlus 
} from '@tabler/icons-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import StatCard from '@/Components/StatCard';
import Search from '@/Components/Search';
import Pagination from '@/Components/Pagination';
import DynamicTable from '@/Components/Table';

export default function Index({ balances, methods, history, filters }) {
    
    // --- State untuk Filter & Pencarian ---
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [activeTab, setActiveTab] = useState(filters?.status || 'Semua');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'terbaru');

    // --- State untuk Modal & Toast ---
    const [methodToDelete, setMethodToDelete] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // --- Helper Format Rupiah ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
    };

    // --- Helper Format Tanggal ---
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        };
    };

    // --- Fungsi Bantuan Toast ---
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

    // --- Aksi Hapus Metode Rekening (Eksekusi dari Modal) ---
    const executeDeleteMethod = () => {
        if (methodToDelete) {
            router.delete(route('organizer.wallet.destroyMethod', methodToDelete), {
                preserveScroll: true,
                onSuccess: (page) => {
                    setMethodToDelete(null); 
                    // Tangkap pesan sukses dari backend, atau pakai teks default
                    showToast(page.props.flash?.success || 'Metode penarikan berhasil dihapus!', 'success');
                },
                onError: () => {
                    setMethodToDelete(null); 
                    showToast('Gagal menghapus metode penarikan!', 'error');
                }
            });
        }
    };

    const handleFilterChange = (key, value) => {
                const query = { 
                    search: searchTerm,
                    status: activeTab,
                    sort: sortOrder,
                    [key]: value 
                };
                
                // Memakai replace: true agar saat user klik tombol "Back" di browser,
                // dia tidak perlu melewati riwayat filter satu-satu.
                router.get(route('organizer.wallet.index'), query, { 
                    preserveState: true, 
                    preserveScroll: true,
                    replace: true 
                });
            };

    // --- Aksi Cari (Tekan Enter) ---
    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            handleFilterChange('search', searchTerm);
        }
    }
;
    // Komponen Kartu Metode Penarikan
    const MethodCard = ({ method, icon: Icon, colorClass = "text-sky-500 bg-sky-50" }) => (
        <div className="border border-neutral-300 rounded-2xl p-4 px-4 flex items-center justify-between bg-white gap-4">
            <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                    <Icon size={24} stroke={2} />
                </div>
                <div className="min-w-0">
                    <h4 className="font-semibold text-neutral-950 text-[14px] leading-tight truncate">{method.bank_code}</h4>
                    <p className="text-xs text-neutral-500 mt-1">{method.account_number}</p>
                </div>
            </div>
            <div className="text-xs text-neutral-500 truncate hidden sm:block">
                {method.account_name}
            </div>
            <button 
                onClick={(e) => {
                    e.preventDefault(); 
                    setMethodToDelete(method._id || method.id);
                }}
                className="text-red-500 hover:text-red-600 transition-colors p-1 shrink-0"
            >
                <IconTrash size={24} stroke={1.5} />
            </button>
        </div>
    );

    const walletColumns = [
        { 
            header: 'Withdrawal ID', 
            cellClassName: 'font-medium text-neutral-950',
            render: (row) => `WD-${(row?._id || row?.id || '000000').toString().substring(0,6).toUpperCase()}` 
        },
        { 
            header: 'Waktu', 
            render: (row) => {
                const dt = formatDate(row.created_at);
                return (
                    <>
                        <div className="font-medium text-neutral-950">{dt.date}</div>
                        <div className="text-xs text-neutral-400">{dt.time}</div>
                    </>
                );
            }
        },
        { 
            header: 'Tujuan', 
            render: (row) => (
                <>
                    <div className="font-medium text-neutral-950">{row.bank_info?.bank_code}</div>
                    <div className="text-xs text-neutral-400">{row.bank_info?.account_number}</div>
                </>
            )
        },
        { 
            header: 'Nama', 
            cellClassName: 'font-medium text-neutral-950 whitespace-nowrap',
            render: (row) => row.bank_info?.account_name 
        },
        { 
            header: 'Nominal', 
            cellClassName: 'font-semibold text-neutral-950 whitespace-nowrap',
            render: (row) => formatRupiah(row.amount) 
        },
        { 
            header: 'Fee', 
            cellClassName: 'text-red-500 font-medium whitespace-nowrap',
            render: () => `-${formatRupiah(2775)}` // dummyFee 
        },
        { 
            header: 'Diterima', 
            cellClassName: 'text-green-500 font-semibold whitespace-nowrap',
            render: (row) => formatRupiah(row.amount - 2775) // dummyFee 
        },
        { 
            header: 'Status', 
            render: (row) => {
                let statusColor, statusText;
                if(row.status === 'SUCCESS') { 
                    statusColor = 'text-green-500 border-green-500'; 
                    statusText = 'Berhasil'; 
                } else if(row.status === 'PENDING' || row.status === 'PROCESSING') { 
                    statusColor = 'text-yellow-500 border-yellow-500'; 
                    statusText = 'Diproses'; 
                } else { 
                    statusColor = 'text-red-500 border-red-500'; 
                    statusText = 'Gagal'; 
                }
                return (
                    <span className={`px-2 py-[2px] rounded-[4px] text-[10px] font-semibold border whitespace-nowrap ${statusColor}`}>
                        {statusText}
                    </span>
                );
            }
        },
    ];

    return (
        <DashboardLayout header={"Wallet"}>
            <Head title="Wallet Dashboard" />

            <div className="flex flex-col h-full w-full gap-6">

                {/* =========================================
                    1. TOP STATS CARDS & TARIK SALDO
                ========================================== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Saldo Aktif */}
                    <StatCard icon={IconWallet} label="Saldo Aktif" value={balances.active} />

                    {/* Saldo Pending */}
                    <StatCard icon={IconClockHour4} label="Saldo Pending" value={balances.pending} />

                    {/* Total Penarikan */}
                    <StatCard icon={IconArrowBearRight} label="Total Penarikan" value={balances.total} />
                </div>

                <Button asChild className="w-full py-6 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-medium text-base">
                    <Link href={route('organizer.wallet.withdrawForm')} className="flex items-center justify-center gap-2">
                        <IconArrowDownLeft size={16} stroke={2.5} /> Tarik Saldo
                    </Link>
                </Button>

                {/* =========================================
                    2. INFORMASI ADMIN & WAKTU (3 KOLOM)
                ========================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Waktu Proses */}
                    <div className="bg-white border border-neutral-300 rounded-[24px] p-4">
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">Estimasi Waktu Proses</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-sky-500 font-medium"><IconBuildingBank size={18} className="mr-2"/> Transfer Bank</span>
                                <span className="text-sky-500 font-medium">1-3 Hari Kerja</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#00C951] font-medium"><IconDeviceMobile size={18} className="mr-2"/> E-Wallet</span>
                                <span className="text-[#00C951] font-medium">1-2 Hari Kerja</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-sky-700 font-medium"><IconUserCircle size={18} className="mr-2"/> Virtual Account</span>
                                <span className="text-sky-700 font-medium">1-3 Hari Kerja</span>
                            </div>
                        </div>
                    </div>

                    {/* Biaya Admin */}
                    <div className="bg-white border border-neutral-300 rounded-[24px] p-4">
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">Biaya Admin</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-sky-500 font-medium"><IconBuildingBank size={18} className="mr-2"/> Transfer Bank</span>
                                <span className="text-red-500 font-medium">Rp2.775</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#00C951] font-medium"><IconDeviceMobile size={18} className="mr-2"/> E-Wallet</span>
                                <span className="text-red-500 font-medium">Rp2.775</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-sky-700 font-medium"><IconUserCircle size={18} className="mr-2"/> Virtual Account</span>
                                <span className="text-red-500 font-medium">Rp2.775</span>
                            </div>
                        </div>
                    </div>

                    {/* Batas Penarikan */}
                    <div className="bg-white border border-neutral-300 rounded-[24px] p-4">
                        <h3 className="text-lg font-medium text-neutral-900 mb-4">Batas Penarikan</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-950 font-medium">Minimal</span>
                                <span className="text-neutral-950 font-semibold">Rp100.000</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-950 font-medium">Maks / Transaksi</span>
                                <span className="text-neutral-950 font-semibold">Rp100.000.000</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-neutral-950 font-medium">Penarikan / Hari</span>
                                <span className="text-neutral-950 font-semibold">20 kali</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    3. METODE PENARIKAN (DAFTAR REKENING)
                ========================================== */}
                <div className="bg-white p-4 rounded-[24px] border border-neutral-300 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h2 className="text-xl font-medium text-neutral-900">Metode Penarikan</h2>
                        <Button asChild className="rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-semibold cursor-pointer p-2 h-auto text-xs">
                            <Link href={route('organizer.wallet.createMethod')} className="flex items-center gap-2">
                                <IconPlus size={16} stroke={2.5} />
                                Tambah Metode Penarikan
                            </Link>
                        </Button>
                    </div>

                    {/* Transfer Bank */}
                    {methods.bank.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 mb-3 tracking-wider">Transfer Bank</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods.bank.map(m => <MethodCard key={m.id} method={m} icon={IconBuildingBank} colorClass="text-sky-500 bg-sky-50" />)}
                            </div>
                        </div>
                    )}

                    {/* E-Wallet */}
                    {methods['e-wallet'].length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 mb-3 tracking-wider">E-Wallet</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods['e-wallet'].map(m => <MethodCard key={m.id} method={m} icon={IconDeviceMobile} colorClass="text-[#00C951] bg-[#00C951]/10" />)}
                            </div>
                        </div>
                    )}

                    {/* Virtual Account */}
                    {methods.virtual_account.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 mb-3 tracking-wider">Virtual Account</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods.virtual_account.map(m => <MethodCard key={m.id} method={m} icon={IconUserCircle} colorClass="text-sky-700 bg-sky-50" />)}
                            </div>
                        </div>
                    )}

                    {(methods.bank.length === 0 && methods['e-wallet'].length === 0 && methods.virtual_account.length === 0) && (
                        <div className="text-center py-6 text-neutral-400 text-sm">Belum ada metode penarikan yang ditambahkan.</div>
                    )}
                </div>

                {/* =========================================
                    4. TABEL RIWAYAT PENARIKAN
                ========================================== */}
                <div className="bg-white border border-neutral-300 rounded-[24px] p-4 flex flex-col gap-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        
                        {/* Kiri: Judul & Tab Pilter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
                            <h2 className="text-xl font-medium text-neutral-950 shrink-0">Riwayat Penarikan</h2>
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide w-full sm:w-auto">
                                {['Semua', 'Berhasil', 'Diproses', 'Gagal'].map(tab => (
                                    <button 
                                        key={tab}
                                        type="button"
                                        onClick={() => { 
                                            setActiveTab(tab); 
                                            handleFilterChange('status', tab); 
                                        }}
                                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 ${
                                            activeTab === tab 
                                                ? "bg-sky-500 text-white" 
                                                : "bg-neutral-100 text-neutral-400 hover:bg-neutral-200"
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kanan: Search & Sortir */}
                        <div className="flex w-full lg:w-auto gap-3 items-center shrink-0">
                            <Search
                                value={searchTerm}
                                onChange={setSearchTerm}
                                onSubmit={(val) => handleFilterChange('search', val)}
                                placeholder="Cari ID, tujuan, nama..."
                                className="flex-1 lg:w-[240px] xl:w-[280px]"
                            />
                            <Select 
                                value={sortOrder} 
                                onValueChange={(val) => { 
                                    setSortOrder(val); 
                                    handleFilterChange('sort', val); 
                                }}
                            >
                                <SelectTrigger className="px-4 py-2 bg-sky-500 border-0 rounded-[16px] text-xs font-semibold text-white hover:bg-sky-600 transition-colors focus:ring-0 focus:ring-offset-0 shadow-none shrink-0">
                                    <SelectValue placeholder="Sortir" />
                                </SelectTrigger>
                                <SelectContent position="popper" sideOffset={4} className="bg-white rounded-[20px] border border-neutral-300 z-[100] p-1.5 min-w-[120px]">
                                    <SelectItem value="terbaru" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 cursor-pointer rounded-xl py-2.5 px-3">
                                        Terbaru
                                    </SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-xs text-neutral-700 focus:bg-sky-50 focus:text-sky-500 cursor-pointer rounded-xl py-2.5 px-3">
                                        Terlama
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                         <DynamicTable 
                            columns={walletColumns} 
                            data={history?.data} 
                            emptyMessage="Belum ada transaksi ditemukan."
                            minWidth="min-w-[1000px]" 
                        />
                    </div>
                </div>

                <Pagination
                    pagination={history}
                    onPageChange={(page) => handleFilterChange('page', page)}
                />

            </div>

            {/* =========================================
                MODAL HAPUS METODE PENARIKAN
            ========================================== */}
            {methodToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMethodToDelete(null)}></div>
                    <div className="bg-white rounded-[24px] border border-neutral-300 w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-white">
                                <IconTrash size={36} stroke={1.5} />
                            </div>
                            <h3 className="text-2xl font-medium text-neutral-900 mb-2">Hapus Rekening?</h3>
                            <p className="text-sm text-neutral-500 mb-8 leading-relaxed">
                                Apakah Anda yakin ingin menghapus metode penarikan ini? Anda harus menambahkannya kembali jika ingin melakukan penarikan ke rekening ini.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setMethodToDelete(null)} className="flex-1 py-3.5 px-4 bg-neutral-100 text-neutral-700 font-medium rounded-xl hover:bg-neutral-200 transition-colors">
                                    Batal
                                </button>
                                <button onClick={executeDeleteMethod} className="flex-1 py-3.5 px-4 bg-red-500 text-white font-medium rounded-xl hover:bg-red-600 transition-colors">
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================
                TOAST NOTIFICATION
            ========================================== */}
            <div 
                className={`fixed bottom-8 right-8 z-[100] transition-all duration-300 transform ${
                    toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                }`}
            >
                <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-neutral-300 bg-white">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                    }`}>
                        {toast.type === 'success' ? <IconCheck size={24} stroke={2.5} /> : <IconX size={24} stroke={2.5} />}
                    </div>
                    <p className="font-medium text-neutral-800 text-sm">{toast.message}</p>
                </div>
            </div>

        </DashboardLayout>
    );
}
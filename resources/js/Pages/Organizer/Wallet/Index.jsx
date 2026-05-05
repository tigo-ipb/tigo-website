import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    IconWallet, IconClockHour4, IconArrowUpRight, 
    IconBuildingBank, IconDeviceMobile, IconUserCircle, 
    IconTrash, IconSearch, IconFilter, IconCheck, IconX 
} from '@tabler/icons-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    const MethodCard = ({ method, icon: Icon }) => (
        <div className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between bg-white hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-[#0ea5e9] rounded-xl flex items-center justify-center">
                    <Icon size={24} stroke={2} />
                </div>
                <div>
                    <h4 className="font-bold text-gray-900 leading-tight">{method.bank_code}</h4>
                    <p className="text-xs text-gray-500">{method.account_number}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <span className="text-sm text-gray-500 hidden md:block">{method.account_name}</span>
                <button 
                    onClick={(e) => {
                        e.preventDefault(); 
                        setMethodToDelete(method._id || method.id); // Gunakan fallback OR seperti ini
                    }}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                >
                    <IconTrash size={20} stroke={2} />
                </button>
            </div>
        </div>
    );

    return (
        <DashboardLayout header={"Wallet"}>
            <Head title="Wallet Dashboard" />

            <div className="flex flex-col h-full w-full gap-6">

                {/* =========================================
                    1. TOP STATS CARDS & TARIK SALDO
                ========================================== */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Saldo Aktif */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#0ea5e9] rounded-full flex items-center justify-center shrink-0">
                            <IconWallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Saldo</p>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{formatRupiah(balances.active)}</h2>
                        </div>
                    </div>

                    {/* Saldo Pending */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#0ea5e9] rounded-full flex items-center justify-center shrink-0">
                            <IconClockHour4 size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Saldo Pending</p>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{formatRupiah(balances.pending)}</h2>
                        </div>
                    </div>

                    {/* Total Penarikan */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#0ea5e9] rounded-full flex items-center justify-center shrink-0">
                            <IconArrowUpRight size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium mb-1">Total Penarikan</p>
                            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">{formatRupiah(balances.total)}</h2>
                        </div>
                    </div>
                </div>

                {/* Tombol Besar Tarik Saldo */}
                <Button asChild className="w-full py-6 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-base shadow-sm">
                    <Link href={route('organizer.wallet.withdrawForm')}>
                        <IconArrowUpRight size={20} className="mr-2" /> Tarik Saldo
                    </Link>
                </Button>

                {/* =========================================
                    2. INFORMASI ADMIN & WAKTU (3 KOLOM)
                ========================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Waktu Proses */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Estimasi Waktu Proses</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#0ea5e9] font-medium"><IconBuildingBank size={18} className="mr-2"/> Transfer Bank</span>
                                <span className="text-[#0ea5e9] font-bold">1-3 Hari Kerja</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#10b981] font-medium"><IconDeviceMobile size={18} className="mr-2"/> E-Wallet</span>
                                <span className="text-[#10b981] font-bold">1-2 Hari Kerja</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#0ea5e9] font-medium"><IconUserCircle size={18} className="mr-2"/> Virtual Account</span>
                                <span className="text-[#0ea5e9] font-bold">1-3 Hari Kerja</span>
                            </div>
                        </div>
                    </div>

                    {/* Biaya Admin */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Biaya Admin</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#0ea5e9] font-medium"><IconBuildingBank size={18} className="mr-2"/> Transfer Bank</span>
                                <span className="text-red-500 font-bold">Rp6.500</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#10b981] font-medium"><IconDeviceMobile size={18} className="mr-2"/> E-Wallet</span>
                                <span className="text-red-500 font-bold">Rp2.500</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="flex items-center text-[#0ea5e9] font-medium"><IconUserCircle size={18} className="mr-2"/> Virtual Account</span>
                                <span className="text-red-500 font-bold">Rp4.500</span>
                            </div>
                        </div>
                    </div>

                    {/* Batas Penarikan */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Batas Penarikan</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Minimal</span>
                                <span className="text-gray-900 font-bold">Rp100.000</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Maks / Transaksi</span>
                                <span className="text-gray-900 font-bold">Rp100.000.000</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">Penarikan / Hari</span>
                                <span className="text-gray-900 font-bold">20 kali</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* =========================================
                    3. METODE PENARIKAN (DAFTAR REKENING)
                ========================================== */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 className="text-xl font-bold text-gray-900">Metode Penarikan</h2>
                        <Button asChild className="rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white">
                            <Link href={route('organizer.wallet.createMethod')}>+ Tambah Metode Penarikan</Link>
                        </Button>
                    </div>

                    {/* Transfer Bank */}
                    {methods.bank.length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Transfer Bank</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods.bank.map(m => <MethodCard key={m._id} method={m} icon={IconBuildingBank} />)}
                            </div>
                        </div>
                    )}

                    {/* E-Wallet */}
                    {methods['e-wallet'].length > 0 && (
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">E-Wallet</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods['e-wallet'].map(m => <MethodCard key={m._id} method={m} icon={IconDeviceMobile} />)}
                            </div>
                        </div>
                    )}

                    {/* Virtual Account */}
                    {methods.virtual_account.length > 0 && (
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Virtual Account</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {methods.virtual_account.map(m => <MethodCard key={m._id} method={m} icon={IconUserCircle} />)}
                            </div>
                        </div>
                    )}

                    {(methods.bank.length === 0 && methods['e-wallet'].length === 0 && methods.virtual_account.length === 0) && (
                        <div className="text-center py-6 text-gray-400 text-sm">Belum ada metode penarikan yang ditambahkan.</div>
                    )}
                </div>

                {/* =========================================
                    4. TABEL RIWAYAT PENARIKAN
                ========================================== */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                        
                        {/* Kiri: Judul & Tab Pilter */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-900 mr-4">Riwayat Penarikan</h2>
                            <div className="flex bg-gray-50 p-1 rounded-full border border-gray-100">
                                {['Semua', 'Berhasil', 'Diproses', 'Gagal'].map(tab => (
                                    <button 
                                        key={tab}
                                        onClick={() => { 
                                            setActiveTab(tab); 
                                            handleFilterChange('status', tab); 
                                        }}
                                        className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${
                                            activeTab === tab ? 'bg-[#0ea5e9] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Kanan: Search Bar */}
                        <div className="flex items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <Input 
                                    type="text" 
                                    placeholder="Cari ID, tujuan, nama..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    onKeyDown={handleSearch}
                                    className="pl-10 rounded-full border-gray-200 h-10 w-full"
                                />
                            </div>
                            <Select 
                                value={sortOrder} 
                                onValueChange={(val) => { 
                                    setSortOrder(val); 
                                    handleFilterChange('sort', val); 
                                }}
                            >
                                <SelectTrigger className="bg-[#0ea5e9] w-28 text-white text-xs font-medium px-4 py-2 h-auto rounded-full flex justify-between items-center gap-1 border-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 shadow-none">
                                    <SelectValue placeholder="Sortir" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-2xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    <SelectItem value="terbaru" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Terbaru</SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-xs text-gray-700 focus:bg-blue-50 focus:text-[#0ea5e9] rounded-xl cursor-pointer">Terlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b border-gray-200 text-[#0ea5e9] font-bold">
                                    <th className="py-4 px-2">Withdrawal ID</th>
                                    <th className="py-4 px-2">Waktu</th>
                                    <th className="py-4 px-2">Tujuan</th>
                                    <th className="py-4 px-2">Nama</th>
                                    <th className="py-4 px-2">Nominal</th>
                                    <th className="py-4 px-2">Fee</th>
                                    <th className="py-4 px-2">Diterima</th>
                                    <th className="py-4 px-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-700">
                                {history?.data?.length > 0 ? history.data.map((item, index) => {
                                    // Status Logic
                                    let statusColor, statusText;
                                    if(item.status === 'SUCCESS') { statusColor = 'text-green-500 border-green-200'; statusText = 'Berhasil'; }
                                    else if(item.status === 'PENDING' || item.status === 'PROCESSING') { statusColor = 'text-yellow-500 border-yellow-200'; statusText = 'Diproses'; }
                                    else { statusColor = 'text-red-500 border-red-200'; statusText = 'Gagal'; }

                                    const dummyFee = 6500; 

                                    return (
                                        <tr key={index} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="py-5 px-2 text-gray-900">
                                                WD-{(item?._id || item?.id || '000000').toString().substring(0,6).toUpperCase()}
                                            </td>
                                            <td className="py-4 px-2">
                                                <div>{formatDate(item.created_at).date}</div>
                                                <div className="text-xs text-gray-400">{formatDate(item.created_at).time}</div>
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="font-medium text-gray-900">{item.bank_info?.bank_code}</div>
                                                <div className="text-xs text-gray-400">{item.bank_info?.account_number}</div>
                                            </td>
                                            <td className="py-4 px-2 font-medium">{item.bank_info?.account_name}</td>
                                            <td className="py-4 px-2 font-bold">{formatRupiah(item.amount)}</td>
                                            <td className="py-4 px-2 text-red-500 font-medium">-{formatRupiah(dummyFee)}</td>
                                            <td className="py-4 px-2 text-green-500 font-bold">{formatRupiah(item.amount - dummyFee)}</td>
                                            <td className="py-4 px-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColor} bg-white`}>
                                                    {statusText}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="8" className="py-8 text-center text-gray-400">Belum ada riwayat penarikan</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                   {/* Pagination */}
                    {history.links && history.links.length > 3 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500 font-medium">
                                Menampilkan {history.from} dari {history.total}
                            </span>
                            <div className="flex gap-1">
                                {history.links.map((link, key) => (
                                    link.url ? (
                                        // JIKA URL ADA (HALAMAN BISA DIKLIK)
                                        <Link 
                                            key={key} 
                                            href={link.url}
                                            preserveState preserveScroll
                                            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${
                                                link.active 
                                                    ? 'border-[#0ea5e9] bg-white text-[#0ea5e9]' 
                                                    : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50' 
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ) : (
                                        // JIKA URL NULL (TOMBOL PREV/NEXT MATI)
                                        <span 
                                            key={key}
                                            className="px-4 py-2 rounded-xl text-sm font-bold border border-transparent text-gray-300 cursor-not-allowed"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        ></span>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* =========================================
                MODAL HAPUS METODE PENARIKAN
            ========================================== */}
            {methodToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMethodToDelete(null)}></div>
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-sm">
                                <IconTrash size={36} stroke={1.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hapus Rekening?</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                                Apakah Anda yakin ingin menghapus metode penarikan ini? Anda harus menambahkannya kembali jika ingin melakukan penarikan ke rekening ini.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setMethodToDelete(null)} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                    Batal
                                </button>
                                <button onClick={executeDeleteMethod} className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200">
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
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl border bg-white ${
                    toast.type === 'success' ? 'border-green-100' : 'border-red-100'
                }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                    }`}>
                        {toast.type === 'success' ? <IconCheck size={24} stroke={2.5} /> : <IconX size={24} stroke={2.5} />}
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{toast.message}</p>
                </div>
            </div>

        </DashboardLayout>
    );
}
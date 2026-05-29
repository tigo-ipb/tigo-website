import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { 
    IconBuildingBank, IconDeviceMobile, IconUserCircle, 
    IconCircleCheckFilled, IconCircle, IconChevronRight 
} from '@tabler/icons-react';

export default function Withdraw({ wallet, methods }) {
    // Tombol nominal cepat sesuai gambar
    const quickNominals = [50000, 100000, 1000000, 5000000, 10000000, 25000000];

    const { data, setData, post, processing, errors } = useForm({
        withdrawal_method_id: '',
        amount: '',
    });

    // --- Helper Format Rupiah ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number || 0);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('organizer.wallet.withdraw'));
    };

    // =========================================
    // HEADER BREADCRUMBS UNTUK NAVBAR
    // ==========================================
    const customHeader = (
        <div className="flex items-center justify-center text-lg font-medium">
            <Link href={route('organizer.wallet.index')} className="text-neutral-900 hover:text-sky-500 transition-colors">
                Wallet
            </Link>
            <IconChevronRight size={20} className="mx-2 text-neutral-400" />
            <span className="text-sky-500">Tarik Saldo</span>
        </div>
    );

    // =========================================
    // KOMPONEN KARTU PILIHAN REKENING
    // ==========================================
    const MethodCard = ({ method, icon: Icon, type }) => {
        const isSelected = data.withdrawal_method_id === method.id;
        
        let colorClass = "text-sky-500 bg-sky-50";
        if (type === 'e-wallet') {
            colorClass = "text-[#00C951] bg-[#00C951]/10";
        } else if (type === 'virtual_account') {
            colorClass = "text-sky-700 bg-sky-50";
        }

        return (
            <div 
                onClick={() => setData('withdrawal_method_id', method.id)}
                className={`border rounded-2xl p-4 px-4 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-sky-500 bg-sky-50/50' : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon size={24} stroke={2} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-medium text-neutral-950 leading-tight truncate">{method.bank_code}</h4>
                        <p className="text-xs text-neutral-500 mt-1">{method.account_number}</p>
                    </div>
                </div>
                <div className="text-sm text-neutral-500 truncate hidden sm:block">
                    {method.account_name}
                </div>
                <div className="flex items-center shrink-0 ml-2">
                    {isSelected ? (
                        <IconCircleCheckFilled size={24} className="text-sky-500" />
                    ) : (
                        <IconCircle size={24} className="text-neutral-300" stroke={1.5} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout header={customHeader}>
            <Head title="Tarik Saldo" />

            <div className="flex flex-col h-full w-full gap-6">
                
                {/* Notifikasi Error (Jika Saldo Kurang / API Xendit Gagal) */}
                {errors.amount && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-[24px] border border-neutral-300 font-medium text-sm">
                        {errors.amount}
                    </div>
                )}
                {errors.api_error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-[24px] border border-neutral-300 font-medium text-sm">
                        {errors.api_error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* =========================================
                        BAGIAN 1: PILIH METODE PENARIKAN
                    ========================================== */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 flex flex-col gap-4">
                        <h2 className="text-xl font-medium text-neutral-950">Pilih Metode Penarikan</h2>

                        {/* Transfer Bank */}
                        {methods.bank.length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">Transfer Bank</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods.bank.map(method => <MethodCard key={method.id} method={method} icon={IconBuildingBank} type="bank" />)}
                                </div>
                            </div>
                        )}

                        {/* E-Wallet */}
                        {methods['e-wallet'].length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">E-Wallet</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods['e-wallet'].map(method => <MethodCard key={method.id} method={method} icon={IconDeviceMobile} type="e-wallet" />)}
                                </div>
                            </div>
                        )}

                        {/* Virtual Account */}
                        {methods.virtual_account.length > 0 && (
                            <div>
                                <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-wider">Virtual Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods.virtual_account.map(method => <MethodCard key={method.id} method={method} icon={IconUserCircle} type="virtual_account" />)}
                                </div>
                            </div>
                        )}

                        {/* State Kosong Jika Belum Punya Rekening */}
                        {(methods.bank.length === 0 && methods['e-wallet'].length === 0 && methods.virtual_account.length === 0) && (
                            <div className="text-center py-10 border-2 border-dashed border-neutral-300 rounded-[24px]">
                                <p className="text-neutral-500 mb-4 font-medium">Anda belum memiliki metode penarikan tersimpan.</p>
                                <Button asChild variant="outline" className="rounded-xl border border-neutral-300 text-sky-500 hover:bg-sky-50 hover:text-sky-600">
                                    <Link href={route('organizer.wallet.createMethod')}>+ Tambah Rekening Sekarang</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* =========================================
                        BAGIAN 2: JUMLAH PENARIKAN
                    ========================================== */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-xl font-medium text-neutral-950">Jumlah Penarikan</h2>
                            <div className="text-sm font-medium text-neutral-950 px-4 py-2 rounded-full border border-neutral-300">
                                Saldo Aktif: <span className="font-semibold text-sky-500">{formatRupiah(wallet?.available_balance || 0)}</span>
                            </div>
                        </div>

                        <div className="border border-neutral-300 rounded-[24px] p-4 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">Nominal</label>
                                
                                <div className="relative">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-400 font-medium text-lg">Rp</span>
                                    <Input 
                                        type="number" 
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        className="pl-12 h-12 rounded-xl text-lg font-medium border-neutral-300 focus:ring-sky-500 focus:border-sky-500"
                                        placeholder="0"
                                        min="50000"
                                        max={wallet?.available_balance || 0}
                                        required 
                                    />
                                </div>
                            </div>

                            {/* Tombol Nominal Cepat */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 w-full">
                                {quickNominals.map((nom) => (
                                    <button
                                        key={nom}
                                        type="button"
                                        onClick={() => setData('amount', nom)}
                                        disabled={nom > (wallet?.available_balance || 0)}
                                        className={`py-2.5 px-3 rounded-full text-sm font-medium flex items-center justify-center border text-center ${
                                            Number(data.amount) === nom 
                                                ? 'bg-sky-500 text-white border-transparent' 
                                                : nom > (wallet?.available_balance || 0)
                                                    ? 'bg-neutral-50 text-neutral-300 cursor-not-allowed border-neutral-300 opacity-70'
                                                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 border-transparent'
                                        }`}
                                    >
                                        {formatRupiah(nom).replace(',00', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="text-[11px] font-medium text-neutral-400 text-center">
                            Dengan melanjutkan, Anda setuju bahwa transaksi tidak dapat dibatalkan setelah dikonfirmasi
                        </p>
                    </div>

                    {/* =========================================
                        TOMBOL ACTION
                    ========================================== */}
                    <div className="flex gap-[10px] p-4 border border-neutral-300 bg-white rounded-[24px]">
                        <Link 
                            href={route('organizer.wallet.index')}
                            className="flex-1 rounded-xl text-white bg-red-500 hover:bg-red-600 font-semibold text-sm h-[40px] flex items-center justify-center transition-colors"
                        >
                            Kembali
                        </Link>
                        <button 
                            type="submit" 
                            disabled={processing || !data.withdrawal_method_id || data.amount < 50000} 
                            className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm h-[40px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Memproses...' : 'Tarik Saldo'}
                        </button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
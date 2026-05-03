import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <div className="flex items-center text-lg font-bold">
            <Link href={route('organizer.wallet.index')} className="text-gray-900 hover:text-[#0ea5e9] transition-colors">
                Wallet
            </Link>
            <IconChevronRight size={20} className="mx-2 text-gray-400" />
            <span className="text-[#0ea5e9]">Tarik Saldo</span>
        </div>
    );

    // =========================================
    // KOMPONEN KARTU PILIHAN REKENING
    // ==========================================
    const MethodCard = ({ method, icon: Icon }) => {
        const isSelected = data.withdrawal_method_id === method.id;
        
        return (
            <div 
                onClick={() => setData('withdrawal_method_id', method.id)}
                className={`border-2 rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all ${
                    isSelected ? 'border-[#0ea5e9] bg-[#f0f9ff]' : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-[#0ea5e9] rounded-xl flex items-center justify-center shrink-0">
                        <Icon size={24} stroke={2} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 leading-tight">{method.bank_code}</h4>
                        <p className="text-xs text-gray-500 font-medium">{method.account_number}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <span className="text-sm font-semibold text-gray-500 hidden md:block">{method.account_name}</span>
                    {isSelected ? (
                        <IconCircleCheckFilled size={26} className="text-[#0ea5e9]" />
                    ) : (
                        <IconCircle size={26} className="text-gray-300" stroke={1.5} />
                    )}
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout header={customHeader}>
            <Head title="Tarik Saldo" />

            <div className="max-w-4xl mx-auto space-y-6 pt-4">
                
                {/* Notifikasi Error (Jika Saldo Kurang / API Xendit Gagal) */}
                {errors.amount && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold text-sm">
                        {errors.amount}
                    </div>
                )}
                {errors.api_error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold text-sm">
                        {errors.api_error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* =========================================
                        BAGIAN 1: PILIH METODE PENARIKAN
                    ========================================== */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">Pilih Metode Penarikan</h2>

                        {/* Transfer Bank */}
                        {methods.bank.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Transfer Bank</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods.bank.map(method => <MethodCard key={method.id} method={method} icon={IconBuildingBank} />)}
                                </div>
                            </div>
                        )}

                        {/* E-Wallet */}
                        {methods['e-wallet'].length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">E-Wallet</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods['e-wallet'].map(method => <MethodCard key={method.id} method={method} icon={IconDeviceMobile} />)}
                                </div>
                            </div>
                        )}

                        {/* Virtual Account */}
                        {methods.virtual_account.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Virtual Account</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {methods.virtual_account.map(method => <MethodCard key={method.id} method={method} icon={IconUserCircle} />)}
                                </div>
                            </div>
                        )}

                        {/* State Kosong Jika Belum Punya Rekening */}
                        {(methods.bank.length === 0 && methods['e-wallet'].length === 0 && methods.virtual_account.length === 0) && (
                            <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl">
                                <p className="text-gray-500 mb-4 font-medium">Anda belum memiliki metode penarikan tersimpan.</p>
                                <Button asChild variant="outline" className="rounded-xl border-[#0ea5e9] text-[#0ea5e9] hover:bg-[#e0f2fe] hover:text-[#0ea5e9]">
                                    <Link href={route('organizer.wallet.createMethod')}>+ Tambah Rekening Sekarang</Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* =========================================
                        BAGIAN 2: JUMLAH PENARIKAN
                    ========================================== */}
                    <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6 gap-4">
                            <h2 className="text-xl font-bold text-gray-900">Jumlah Penarikan</h2>
                            <div className="text-sm font-semibold text-gray-500 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                                Saldo Aktif: <span className="font-bold text-[#0ea5e9]">{formatRupiah(wallet?.available_balance || 0)}</span>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-[24px] p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-3">Nominal</label>
                            
                            <div className="relative mb-6">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">Rp</span>
                                <Input 
                                    type="number" 
                                    value={data.amount}
                                    onChange={e => setData('amount', e.target.value)}
                                    className="pl-12 h-14 rounded-xl text-lg font-bold border-gray-200 focus:ring-[#0ea5e9]"
                                    placeholder="0"
                                    min="50000" // Minimal penarikan (sesuai aturan umum payment gateway)
                                    max={wallet?.available_balance || 0}
                                    required 
                                />
                            </div>

                            {/* Tombol Nominal Cepat */}
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {quickNominals.map((nom) => (
                                    <button
                                        key={nom}
                                        type="button"
                                        onClick={() => setData('amount', nom)}
                                        disabled={nom > (wallet?.available_balance || 0)}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                                            Number(data.amount) === nom 
                                                ? 'bg-[#0ea5e9] text-white shadow-md' 
                                                : nom > (wallet?.available_balance || 0)
                                                    ? 'bg-gray-50 text-gray-300 cursor-not-allowed border border-gray-100 opacity-70'
                                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                                        }`}
                                    >
                                        {formatRupiah(nom).replace(',00', '')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="text-[11px] font-semibold text-gray-400 mt-6 text-center">
                            Dengan melanjutkan, Anda setuju bahwa transaksi tidak dapat dibatalkan setelah dikonfirmasi
                        </p>
                    </div>

                    {/* =========================================
                        TOMBOL ACTION
                    ========================================== */}
                    <div className="flex gap-[10px] p-4 border border-neutral-300 bg-white rounded-[24px]">
                        <Button 
                            asChild 
                            variant="outline" 
                            className="flex-1 py-6 rounded-xl border-none text-white hover:text-white bg-red-500 hover:bg-red-600 font-bold text-base h-auto"
                        >
                            <Link href={route('organizer.wallet.index')}>Kembali</Link>
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || !data.withdrawal_method_id || data.amount < 50000} 
                            className="flex-1 py-6 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-base shadow-sm h-auto disabled:opacity-50"
                        >
                            {processing ? 'Memproses...' : 'Tarik Saldo'}
                        </Button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
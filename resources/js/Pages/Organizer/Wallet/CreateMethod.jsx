import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { IconBuildingBank, IconDeviceMobile, IconUserCircle, IconChevronDown, IconChevronRight } from '@tabler/icons-react';

export default function CreateMethod() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'bank', 
        bank_code: 'Mandiri', 
        account_number: '',
        account_name: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('organizer.wallet.storeMethod'));
    };

    const getLabels = () => {
        if (data.type === 'e-wallet') {
            return { provider: 'Pilih E-Wallet', number: 'Nomor E-Wallet', name: 'Nama Pemilik E-Wallet' };
        }
        if (data.type === 'virtual_account') {
            return { provider: 'Pilih Bank', number: 'Nomor Virtual Account', name: 'Nama Pemilik Virtual Account' };
        }
        return { provider: 'Pilih Bank', number: 'Nomor Rekening', name: 'Nama Pemilik Rekening' };
    };

    const labels = getLabels();

    const customHeader = (
        <div className="flex items-center justify-center text-lg font-medium">
            <Link href={route('organizer.wallet.index')} className="text-neutral-950 hover:text-sky-500 transition-colors">
                Wallet
            </Link>
            <IconChevronRight size={20} className="mx-2 text-neutral-500" />
            <span className="text-sky-500">Tambah Metode Penarikan</span>
        </div>
    );

    return (
        <DashboardLayout header={customHeader}>
            <Head title="Tambah Metode Penarikan" />

            <div className="flex flex-col h-full w-full gap-6">
                
                <div className="bg-white p-4 rounded-[24px] border border-neutral-300 flex flex-col gap-4">
                    <h2 className="text-xl font-medium text-neutral-950">Tambah Metode Penarikan</h2>

                    {/* CUSTOM TABS */}
                    <div className="flex gap-4 border border-neutral-300 p-1.5 rounded-full bg-white w-full">
                        <button 
                            type="button"
                            onClick={() => setData({ ...data, type: 'bank', bank_code: 'Mandiri' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-medium transition-all ${
                                data.type === 'bank' ? 'bg-sky-500 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                            }`}
                        >
                            <IconBuildingBank size={18} className="mr-2" stroke={2} /> Transfer bank
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setData({ ...data, type: 'e-wallet', bank_code: 'DANA' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-medium transition-all ${
                                data.type === 'e-wallet' ? 'bg-sky-500 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                            }`}
                        >
                            <IconDeviceMobile size={18} className="mr-2" stroke={2} /> E-Wallet
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setData({ ...data, type: 'virtual_account', bank_code: 'BCA VA' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-medium transition-all ${
                                data.type === 'virtual_account' ? 'bg-sky-500 text-white' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                            }`}
                        >
                            <IconUserCircle size={18} className="mr-2" stroke={2} /> Virtual Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="border border-neutral-300 rounded-[24px] p-4 flex flex-col gap-4">
                            
                            {/* Pilih Provider */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-950 mb-2">{labels.provider}</label>
                                <div className="relative">
                                    <select 
                                        value={data.bank_code} 
                                        onChange={e => setData('bank_code', e.target.value)}
                                        className="w-full appearance-none p-[10px] pl-4 pr-10 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white text-sm text-neutral-950 transition-all cursor-pointer h-12 shadow-none"
                                        required
                                    >
                                        {data.type === 'bank' && (
                                            <>
                                                <option value="Mandiri">Mandiri</option>
                                                <option value="BCA">BCA</option>
                                                <option value="BNI">BNI</option>
                                                <option value="BRI">BRI</option>
                                            </>
                                        )}
                                        {data.type === 'e-wallet' && (
                                            <>
                                                <option value="DANA">DANA</option>
                                                <option value="OVO">OVO</option>
                                                <option value="GoPay">GoPay</option>
                                                <option value="ShopeePay">ShopeePay</option>
                                            </>
                                        )}
                                        {data.type === 'virtual_account' && (
                                            <>
                                                <option value="BCA VA">BCA VA</option>
                                                <option value="Mandiri VA">Mandiri VA</option>
                                                <option value="BNI VA">BNI VA</option>
                                            </>
                                        )}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                                        <IconChevronDown size={20} stroke={2} />
                                    </div>
                                </div>
                                {errors.bank_code && <span className="text-xs text-red-500 mt-1">{errors.bank_code}</span>}
                            </div>

                            {/* Nomor Rekening */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-950 mb-2">{labels.number}</label>
                                <Input 
                                    type="text" 
                                    value={data.account_number}
                                    onChange={e => setData('account_number', e.target.value)}
                                    placeholder="Masukkan nomor..."
                                    className="h-12 rounded-xl border-neutral-300 text-sm focus:ring-sky-500" 
                                    required 
                                />
                                {errors.account_number && <span className="text-xs text-red-500 mt-1">{errors.account_number}</span>}
                            </div>

                            {/* Nama Pemilik */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-950 mb-2">{labels.name}</label>
                                <Input 
                                    type="text" 
                                    value={data.account_name}
                                    onChange={e => setData('account_name', e.target.value)}
                                    placeholder="Masukkan nama lengkap sesuai akun"
                                    className="h-12 rounded-xl border-neutral-300 text-sm focus:ring-sky-500" 
                                    required 
                                />
                                {errors.account_name && <span className="text-xs text-red-500 mt-1">{errors.account_name}</span>}
                                <p className="text-[11px] font-medium text-neutral-500 text-center mt-2">
                                    Pastikan nama sesuai agar proses penarikan tidak terhambat
                                </p>
                            </div>

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
                                disabled={processing} 
                                className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold text-sm h-[40px] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Rekening'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
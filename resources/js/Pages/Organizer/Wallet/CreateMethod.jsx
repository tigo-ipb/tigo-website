import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        <div className="flex items-center text-lg font-bold">
            <Link href={route('organizer.wallet.index')} className="text-gray-900 hover:text-blue-500 transition-colors">
                Wallet
            </Link>
            <IconChevronRight size={20} className="mx-2 text-gray-400" />
            <span className="text-[#0ea5e9]">Tambah Metode Penarikan</span>
        </div>
    );

    return (
        <DashboardLayout header={customHeader}>
            <Head title="Tambah Metode Penarikan" />

            <div className="max-w-4xl mx-auto space-y-6 pt-4">
                
                {/* Main Content Card (Breadcrumb di sini sudah dihapus) */}
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-8">Tambah Metode Penarikan</h2>

                    {/* CUSTOM TABS */}
                    <div className="flex gap-4 border border-gray-100 p-1.5 rounded-full mb-8 bg-white shadow-sm w-full">
                        <button 
                            onClick={() => setData({ ...data, type: 'bank', bank_code: 'Mandiri' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-bold transition-all ${
                                data.type === 'bank' ? 'bg-[#0ea5e9] text-white' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <IconBuildingBank size={18} className="mr-2" stroke={2} /> Transfer bank
                        </button>
                        
                        <button 
                            onClick={() => setData({ ...data, type: 'e-wallet', bank_code: 'DANA' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-bold transition-all ${
                                data.type === 'e-wallet' ? 'bg-[#0ea5e9] text-white' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <IconDeviceMobile size={18} className="mr-2" stroke={2} /> E-Wallet
                        </button>
                        
                        <button 
                            onClick={() => setData({ ...data, type: 'virtual_account', bank_code: 'BCA VA' })}
                            className={`flex-1 flex justify-center items-center py-3 rounded-full text-sm font-bold transition-all ${
                                data.type === 'virtual_account' ? 'bg-[#0ea5e9] text-white' : 'text-gray-400 hover:bg-gray-50'
                            }`}
                        >
                            <IconUserCircle size={18} className="mr-2" stroke={2} /> Virtual Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="border border-gray-200 rounded-[24px] p-6 space-y-6 mb-8">
                            
                            {/* Pilih Provider */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{labels.provider}</label>
                                <div className="relative">
                                    <select 
                                        value={data.bank_code} 
                                        onChange={e => setData('bank_code', e.target.value)}
                                        className="w-full appearance-none p-[10px] pl-4 pr-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent bg-white text-sm text-gray-800 shadow-sm transition-all cursor-pointer h-12"
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
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                        <IconChevronDown size={20} stroke={2} />
                                    </div>
                                </div>
                                {errors.bank_code && <span className="text-xs text-red-500 mt-1">{errors.bank_code}</span>}
                            </div>

                            {/* Nomor Rekening */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{labels.number}</label>
                                <Input 
                                    type="text" 
                                    value={data.account_number}
                                    onChange={e => setData('account_number', e.target.value)}
                                    placeholder="Masukkan nomor..."
                                    className="h-12 rounded-xl border-gray-200" 
                                    required 
                                />
                                {errors.account_number && <span className="text-xs text-red-500 mt-1">{errors.account_number}</span>}
                            </div>

                            {/* Nama Pemilik */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">{labels.name}</label>
                                <Input 
                                    type="text" 
                                    value={data.account_name}
                                    onChange={e => setData('account_name', e.target.value)}
                                    placeholder="Masukkan nama lengkap sesuai akun"
                                    className="h-12 rounded-xl border-gray-200" 
                                    required 
                                />
                                {errors.account_name && <span className="text-xs text-red-500 mt-1">{errors.account_name}</span>}
                                <span className="text-[10px] text-gray-400 mt-2 block text-right font-medium">
                                    Pastikan nama sesuai agar proses penarikan tidak terhambat
                                </span>
                            </div>

                        </div>

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
                                disabled={processing} 
                                className="flex-1 py-6 rounded-xl bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-bold text-base shadow-sm h-auto"
                            >
                                {processing ? 'Menyimpan...' : 'Simpan Rekening'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
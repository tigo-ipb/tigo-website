import { Head, Link, useForm } from '@inertiajs/react';
import { IconChevronRight } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useState } from 'react';
export default function Password() {
    const { data, setData, patch, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.password.update'), {
            preserveScroll: true,
            // Jika sukses, kosongkan form password
            onSuccess: () => reset(),
        });
    };

    return (
        <GuestLayout>
            <div className="min-h-[calc(100vh-80px)] bg-white font-sans pb-12">
                <Head title="Ganti Password - Tigo" />

                <main className="max-w-3xl mx-auto px-4 pt-8">
                    
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm mb-6">
                        <Link href="/" className="text-gray-800 hover:text-sky-500">Dashboard</Link>
                        <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <Link href={route('profile.index')} className="text-gray-800 hover:text-sky-500">Profile</Link>
                        <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <span className="text-sky-500 font-medium">Password</span>
                    </div>

                    <h1 className="text-3xl font-medium text-gray-900 mb-6">Password</h1>

                    {/* Form Password */}
                    <form onSubmit={submit}>
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 mb-6 space-y-6">
                            
                            {/* Input Password Saat Ini */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Password saat ini</label>
                                 <div className="relative">
                                <input
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    value={data.current_password}
                                    onChange={(e) => setData('current_password', e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                    placeholder="********"
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                </button>
                                </div>
                                {errors.current_password && <p className="mt-1.5 text-xs text-red-500">{errors.current_password}</p>}
                            </div>

                            {/* Input Password Baru */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Password baru</label>
                                <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                    placeholder="Masukkan password baru"
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                </button>
                                </div>
                                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
                            </div>

                        </div>

                        {/* Tombol Simpan */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 bg-[#0099ff] hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>

                </main>
            </div>
        </GuestLayout>
    );
}
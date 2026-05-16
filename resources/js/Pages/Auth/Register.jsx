import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        username: '',
        email: '',
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <div className="min-h-screen bg-white flex flex-col font-sans">
                <Head title="Register" />

                {/* Content Form */}
                <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                    <h1 className="text-5xl font-black text-sky-500 mb-8 text-center tracking-tight">
                        Buat Akun Baru
                    </h1>

                    {/* Card Form */}
                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm">
                        <form onSubmit={submit} className="space-y-5">

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Masukkan username"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 transition-all"
                                    autoFocus
                                />
                                {errors.username && (
                                    <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Masukkan email"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 transition-all"
                                />
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 pr-11 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? <IconEyeOff size={20} stroke={1.5} /> : <IconEye size={20} stroke={1.5} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
                                )}
                            </div>

                            {/* Tombol Buat */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-[#bde4f8] hover:bg-sky-300 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors text-sm mt-2"
                            >
                                {processing ? 'Memproses...' : 'Buat'}
                            </button>
                        </form>

                        {/* Divider ATAU */}
                        <div className="relative flex items-center justify-center my-6">
                            <div className="absolute border-t border-gray-200 w-full"></div>
                            <span className="bg-white px-4 text-xs text-gray-500 relative">atau</span>
                        </div>

                        {/* Tombol Lanjutkan dengan Google */}
                    <a 
                            href={route('google.login', { role: 'organizer' })} 
                            className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                            Lanjutkan dengan Google
                        </a>

                        {/* Link Sudah punya akun */}
                        <p className="text-center text-xs text-gray-400 mt-6">
                            Sudah punya akun?{' '}
                            <Link href={route('login')} className="text-sky-500 font-bold hover:text-sky-600 transition-colors">
                                Masuk
                            </Link>
                        </p>
                    </div>
                </main>
            </div>
        </GuestLayout>
    );
}
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="Masuk - Tigo" />

            {/* Header */}
            <header className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/tigo-logo.svg" alt="Tigo" className="h-8" />
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl font-black text-blue-500 mb-2 text-center">
                    Your Ticket on the Go!
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center">
                    Apakah kamu siap untuk event selanjutnya?
                </p>

                {/* Card */}
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Username/Email
                            </label>
                            <input
                                type="text"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan username/email"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400"
                                autoFocus
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Masukkan password"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400 pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember & Lupa Password */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-100"
                                />
                                <span className="text-sm text-gray-600">Ingat saya</span>
                            </label>
                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                                >
                                    Lupa password?
                                </Link>
                            )}
                        </div>

                        {/* Tombol Masuk */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            {processing ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>

                    {/* Daftar */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        Belum punya akun?{' '}
                        <Link href={route('register')} className="text-blue-500 font-bold hover:text-blue-600">
                            Buat akun
                        </Link>
                    </p>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100">
                Copyright @ 2026 Tigo
            </footer>
        </div>
    );
}
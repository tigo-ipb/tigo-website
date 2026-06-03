import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';
export default function ConfirmPassword() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="Konfirmasi Password" />

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl font-black text-sky-500 mb-3 text-center">
                    Konfirmasi Password
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
                    Ini adalah area aman. Mohon konfirmasi password kamu sebelum melanjutkan.
                </p>

                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-5">
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
                                    autoFocus
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

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-blue-400 hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            {processing ? 'Memproses...' : 'Konfirmasi'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
        </GuestLayout>
    );
}
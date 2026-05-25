import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';

const RESET_PASSWORD_ILLUSTRATION = '/images/reset-password.svg';

export default function ResetPassword({ token, email }) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const isFormValid = data.password.trim() && data.password_confirmation.trim();

    return (
        <GuestLayout>
            <div className="min-h-screen bg-white flex flex-col font-sans">
                <Head title="Reset Password" />

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                    <h1 className="text-4xl font-black text-sky-500 mb-2 text-center">
                        Reset Password
                    </h1>
                    <p className="text-neutral-950 text-sm mb-6 text-center">
                        Masukkan password baru untuk akunmu.
                    </p>

                    <img
                        src={RESET_PASSWORD_ILLUSTRATION}
                        alt="Reset Password"
                        className="w-64 h-auto mb-6 object-contain"
                    />

                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-4 shadow-sm">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-950 mb-2">
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan password baru"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 pr-11"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-xs text-red-500">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="Masukkan ulang password"
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400 pr-11"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                    >
                                        {showConfirm ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="mt-2 text-xs text-red-500">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !isFormValid}
                                className={`w-full py-3 bg-sky-500 text-white font-semibold rounded-xl transition-colors text-sm ${(processing || !isFormValid)
                                    ? 'opacity-25 cursor-not-allowed'
                                    : 'hover:bg-sky-600 cursor-pointer'
                                    }`}
                            >
                                {processing ? 'Memproses...' : 'Ganti'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </GuestLayout>
    );
}

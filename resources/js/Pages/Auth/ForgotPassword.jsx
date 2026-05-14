import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <GuestLayout>
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="Lupa Password - Tigo" />

            {/* Content */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl font-black text-blue-500 mb-6 text-center">
                    Lupa Password
                </h1>

                {/* Ilustrasi */}
                <img
                    src="https://res.cloudinary.com/djua9v3au/image/upload/v1/tigo/forgot-password-illustration.png"
                    alt="Lupa Password"
                    className="w-64 mb-6"
                    onError={(e) => e.target.style.display = 'none'}
                />

                <p className="text-gray-500 text-sm mb-8 text-center">
                    Kamu akan dikirimkan email untuk konfirmasi reset password
                </p>

                {status && (
                    <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg w-full max-w-md">
                        {status}
                    </div>
                )}

                {/* Card */}
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="Masukkan email"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 placeholder-gray-400"
                                autoFocus
                            />
                            {errors.email && (
                                <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            {processing ? 'Memproses...' : 'Kirim'}
                        </button>
                    </form>
                </div>
            </main>

        </div>
        </GuestLayout>
    );
}
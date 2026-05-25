import { Head, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

const FORGOT_PASSWORD_ILLUSTRATION = '/images/forgot-password.png';

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
            <div className="min-h-screen bg-white flex flex-col font-sans">
                <Head title="Lupa Password" />

                <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                    <h1 className="text-4xl font-black text-sky-500 mb-2 text-center">
                        Lupa Password
                    </h1>
                    <p className="text-neutral-950 text-sm mb-6 text-center">
                        Kamu akan dikirimkan email untuk konfirmasi reset password
                    </p>

                    <img
                        src={FORGOT_PASSWORD_ILLUSTRATION}
                        alt="Lupa Password"
                        className="w-64 h-auto mb-6 object-contain"
                    />

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg w-full max-w-md">
                            {status}
                        </div>
                    )}

                    <div className="w-full max-w-md bg-white border border-gray-200 rounded-3xl p-4 shadow-sm">
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-950 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Masukkan email"
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder-gray-400"
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="mt-2 text-xs text-red-500">{errors.email}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !data.email.trim()}
                                className={`w-full py-3 bg-sky-500 text-white font-semibold rounded-xl transition-colors text-sm ${(processing || !data.email.trim())
                                    ? 'opacity-25 cursor-not-allowed'
                                    : 'hover:bg-sky-600 cursor-pointer'
                                    }`}
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

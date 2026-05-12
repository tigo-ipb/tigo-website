import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();
        post(route('verification.send'));
    };

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Head title="Verifikasi Email - Tigo" />

            {/* Header */}
            <header className="px-8 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <img src="/tigo-logo.svg" alt="Tigo" className="h-8" />
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                <h1 className="text-4xl font-black text-blue-500 mb-3 text-center">
                    Verifikasi Email
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
                    Terima kasih sudah mendaftar! Sebelum memulai, mohon verifikasi email kamu dengan mengklik link yang sudah kami kirimkan. Jika tidak menerima email, kami akan mengirimkan yang baru.
                </p>

                {status === 'verification-link-sent' && (
                    <div className="mb-6 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg w-full max-w-md text-center">
                        Link verifikasi baru sudah dikirimkan ke email kamu.
                    </div>
                )}

                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                    <form onSubmit={submit} className="space-y-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 bg-blue-400 hover:bg-blue-500 disabled:opacity-60 text-white font-bold rounded-xl transition-colors text-sm"
                        >
                            {processing ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
                        </button>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-full py-3 border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium rounded-xl transition-colors text-sm text-center block"
                        >
                            Keluar
                        </Link>
                    </form>
                </div>
            </main>

            <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-100">
                Copyright @ 2026 Tigo
            </footer>
        </div>
    );
}
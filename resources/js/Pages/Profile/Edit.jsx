import { Head, Link, useForm } from '@inertiajs/react';
import { IconChevronRight } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function EditProfile({ user }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        bio: user.bio || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
    <GuestLayout>
        <div className="min-h-screen bg-white font-sans pb-12">
            <Head title="Edit Profile - Tigo" />

            <main className="max-w-3xl mx-auto px-4 pt-8">
                
                {/* Breadcrumb */}
                <div className="flex items-center text-sm mb-6">
                    <Link href="/" className="text-gray-800 hover:text-sky-500">Dashboard</Link>
                    <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <Link href={route('profile.index')} className="text-gray-800 hover:text-sky-500">Profile</Link>
                    <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <span className="text-sky-500 font-medium">Edit Profile</span>
                </div>

                <h1 className="text-3xl font-medium text-gray-900 mb-6">Edit Profile</h1>

                {/* Profile Card (Display Only) */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative group cursor-pointer">
                            {user.profile_photo ? (
                                <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full pattern-dots text-gray-300"></div>
                            )}
                            {/* Overlay ganti foto (Opsional untuk fitur ganti foto nantinya) */}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-medium">Ganti Foto</span>
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{user.username || 'Aryorm'}</h2>
                            <p className="text-sm text-gray-500 mb-3">{user.name}</p>
                            <p className="text-sm text-gray-700 leading-relaxed mb-5">
                                {user.bio || 'Belum ada bio yang ditambahkan.'}
                            </p>
                            
                            <div className="flex gap-3">
                                <button className="px-6 py-2 bg-[#0099ff] text-white text-sm font-medium rounded-xl">
                                    Edit Profile
                                </button>
                                <button className="px-6 py-2 bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-500 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                                    Share Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Edit */}
                <form onSubmit={submit}>
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 mb-6 space-y-6">
                        
                        {/* Input Nama */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Nama</label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                placeholder="Masukkan nama lengkap"
                            />
                            {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                        </div>

                        {/* Input Bio */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-2">Bio</label>
                            <textarea
                                value={data.bio}
                                onChange={(e) => setData('bio', e.target.value)}
                                rows="4"
                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 resize-none"
                                placeholder="Tuliskan sesuatu tentang dirimu..."
                            ></textarea>
                            {errors.bio && <p className="mt-1.5 text-xs text-red-500">{errors.bio}</p>}
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
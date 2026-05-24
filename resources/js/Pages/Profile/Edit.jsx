import { Head, Link, useForm } from '@inertiajs/react';
import { IconChevronRight } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useRef, useState } from 'react'; // 🔥 Tambahkan ini

export default function EditProfile({ user }) {
    // 1. State untuk preview foto secara lokal
    const [photoPreview, setPhotoPreview] = useState(null);
    const fileInputRef = useRef(null);

    // 2. Tambahkan profile_photo dan _method ke dalam form
    const { data, setData, post, processing, errors } = useForm({
        name: user.name || '',
        bio: user.bio || '',
        profile_photo: null, 
        _method: 'patch', // 🔥 Trik Laravel: Pakai POST tapi diakui sebagai PATCH agar file bisa terkirim
    });

    // 3. Fungsi saat file dipilih
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('profile_photo', file); // Simpan file ke form data
            setPhotoPreview(URL.createObjectURL(file)); // Buat URL lokal sementara untuk preview
        }
    };

    // 4. Trigger klik pada hidden input file
    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const submit = (e) => {
        e.preventDefault();
        // 🔥 Gunakan post() karena patch() tidak mendukung upload file di Inertia/Laravel
        post(route('profile.update'), {
            preserveScroll: true,
        });
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

                    {/* Profile Card (Klik untuk Ganti Foto) */}
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8">
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            
                            {/* 🔥 Area Klik Ganti Foto */}
                            <div 
                                onClick={triggerFileInput}
                                className="w-32 h-32 shrink-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden relative group cursor-pointer"
                            >
                                {/* Prioritaskan photoPreview (foto baru), lalu user.profile_photo (foto lama) */}
                                {(photoPreview || user.profile_photo) ? (
                                    <img 
                                        src={photoPreview || user.profile_photo} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full pattern-dots text-gray-300"></div>
                                )}
                                
                                {/* Overlay ganti foto */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-medium">Ganti Foto</span>
                                </div>

                                {/* 🔥 Hidden Input File */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handlePhotoChange}
                                />
                            </div>

                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">{user.username || 'Username'}</h2>
                                <p className="text-sm text-gray-500 mb-3">{user.name}</p>
                                <p className="text-sm text-gray-700 leading-relaxed mb-5">
                                    {user.bio || 'Belum ada bio yang ditambahkan.'}
                                </p>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={triggerFileInput} 
                                        className="px-6 py-2 bg-[#0099ff] hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-colors"
                                    >
                                        Pilih Foto Baru
                                    </button>
                                </div>
                                {/* Tampilkan error validasi gambar jika ada */}
                                {errors.profile_photo && <p className="mt-2 text-xs text-red-500">{errors.profile_photo}</p>}
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
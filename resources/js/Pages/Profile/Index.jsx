import { Head, Link } from '@inertiajs/react';
import { 
    IconUser, 
    IconLanguage, 
    IconLock, 
    IconChevronRight, 
    IconLogout 
} from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function ProfileIndex({ user }) {
    return (
        <GuestLayout>
        <div className="min-h-screen bg-white font-sans pb-12">
            <Head title="Profile - Tigo" />

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 pt-8">
                
                {/* Breadcrumb */}
                <div className="flex items-center text-sm mb-6">
                    <Link href="/" className="text-gray-800 hover:text-sky-500">Dashboard</Link>
                    <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                    <span className="text-sky-500 font-medium">Profile</span>
                </div>

                <h1 className="text-3xl font-medium text-gray-900 mb-6">Profile</h1>

                {/* Profile Card */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                        {/* Foto Profile Placeholder */}
                        <div className="w-32 h-32 shrink-0 bg-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
                            {user.profile_photo ? (
                                <img src={user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full pattern-dots text-gray-300"></div> // Placeholder sesuai desain
                            )}
                        </div>

                        {/* Info & Tombol */}
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-900">{user.username || 'Aryorm'}</h2>
                            <p className="text-sm text-gray-500 mb-3">{user.name}</p>
                            <p className="text-sm text-gray-700 leading-relaxed mb-5">
                                {user.bio || 'Lorem ipsum dolor sit amet consectetur. Scelerisque tincidunt sapien amet eget pharetra integer ultricies. Enim fames orci volutpat at aliquet.'}
                            </p>
                            
                            <div className="flex gap-3">
                                {/* Nanti href-nya kita arahkan ke route('profile.edit') */}
                                <Link href={route('profile.edit')} className="px-6 py-2 bg-[#0099ff] hover:bg-sky-500 text-white text-sm font-medium rounded-xl transition-colors">
                                    Edit Profile
                                </Link>
                                <button className="px-6 py-2 bg-white border border-gray-300 hover:border-sky-500 hover:text-sky-500 text-gray-700 text-sm font-medium rounded-xl transition-colors">
                                    Share Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-2xl font-medium text-gray-900 mb-4">Setting</h2>

                {/* Settings Menu List */}
                <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden mb-6">
                    
                    {/* Item: Akun */}
                    {/* Nanti href-nya diarahkan ke route('profile.account') */}
                    <Link href={route('profile.account')} className="flex items-center p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mr-4">
                            <IconUser stroke={1.5} size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900">Akun</h3>
                            <p className="text-xs text-gray-500">Perbaharui nama kamu, email, dan detail personal</p>
                        </div>
                        <IconChevronRight className="text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </Link>

                    {/* Item: Bahasa */}
                    <Link href="#" className="flex items-center p-5 border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mr-4">
                            <IconLanguage stroke={1.5} size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900">Bahasa</h3>
                            <p className="text-xs text-gray-500">Pilih bahasa yang akan kamu gunakan</p>
                        </div>
                        <IconChevronRight className="text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </Link>

                    {/* Item: Password */}
                    <Link href={route('profile.password')} className="flex items-center p-5 hover:bg-gray-50 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 mr-4">
                            <IconLock stroke={1.5} size={20} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-bold text-gray-900">Password</h3>
                            <p className="text-xs text-gray-500">Atur password kamu atau memperbaharuinya</p>
                        </div>
                        <IconChevronRight className="text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </Link>
                </div>

                {/* Log Out Button */}
                <Link 
                    href={route('logout')} 
                    method="post" 
                    as="button"
                    className="w-full py-4 bg-[#0099ff] hover:bg-sky-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
                >
                    <IconLogout stroke={2} size={20} />
                    Log Out
                </Link>

            </main>
        </div>
        </GuestLayout>
    );
}
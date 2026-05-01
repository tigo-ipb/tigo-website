import { Link, usePage } from '@inertiajs/react';
import { 
    IconLayoutDashboard, 
    IconTicket, 
    IconBook, 
    IconCoin, 
    IconLogout,
    IconX, // Tambahkan icon Close
    IconPlus
} from '@tabler/icons-react';

// Tangkap props isOpen dan setIsSidebarOpen
export default function Sidebar({ isOpen, setIsSidebarOpen }) {
    const { url } = usePage();

    const menuItems = [
        { name: 'Dashboard', href: '/organizer/dashboard', icon: IconLayoutDashboard },
        { name: 'Events', href: '/organizer/events', icon: IconTicket },
        { name: 'Bookings', href: '/organizer/bookings', icon: IconBook },
        { name: 'Finance', href: '/organizer/finance', icon: IconCoin },
    ];

    return (
        <aside 
            // Lebar sidebar di mobile kita buat w-64 (cukup nyaman) atau w-full jika ingin menutup layar.
            // z-30 agar berada di atas Backdrop (z-20) dan Navbar (z-10)
            className={`w-[252px] bg-white border-r border-gray-100 flex flex-col fixed h-screen z-30 transition-transform duration-300 ease-in-out ${
                isOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
            {/* Header Sidebar (Logo + Tombol Close) */}
            <div className="p-6 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src="/images/logo-tigo.png" alt="Tigo Logo" className="w-10 h-10 object-contain" />
                    <span className="text-2xl font-bold text-blue-500">Tigo</span>
                </div>
                
                {/* Tombol Close hanya muncul di layar kecil (lg:hidden) */}
                <button 
                    className="p-1 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <IconX size={24} />
                </button>
            </div>

            {/* Navigation Menu */}
            <nav className="px-4 gap-2 py-6 flex flex-col">
                <Link 
                href={route('organizer.events.create')}
                className="bg-sky-500 text-white max-w-[228px] h-12 px-3 py-2 rounded-[12px] text-xs font-bold shadow-sm hover:bg-sky-600 transition flex items-center justify-center"
                >
                    <IconPlus size={20} className="inline-block mr-[10px]" />
                    Tambahkan Event Baru
                </Link>
                {menuItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            // Tutup otomatis sidebar jika menu diklik di mobile
                            onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                                isActive 
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-blue-500'
                            }`}
                        >
                            <item.icon size={22} stroke={isActive ? 2.5 : 2} />
                            <span className="font-semibold">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-6 mt-auto border-t border-gray-50">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-4 px-4 py-3 text-red-500 bg-red-50 rounded-2xl hover:bg-red-500 hover:text-white transition-all font-bold"
                >
                    <IconLogout size={22} stroke={2.5} />
                    <span>Keluar</span>
                </Link>
            </div>
        </aside>
    );
}
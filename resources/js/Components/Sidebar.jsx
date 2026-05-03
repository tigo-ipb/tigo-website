import { Link, usePage } from '@inertiajs/react';
import { IconLayoutDashboard, IconTicket, IconBook, IconCoin, IconLogout, IconPlus, IconWallet } from '@tabler/icons-react';

export default function Sidebar({ isMobile, setIsMobileOpen }) {
    const { url } = usePage();
    const { auth } = usePage().props;


    const menuItems = [
        { name: 'Dashboard', href: '/organizer/dashboard', icon: IconLayoutDashboard },
        { name: 'Events', href: '/organizer/events', icon: IconTicket },
        { name: 'Bookings', href: '/organizer/bookings', icon: IconBook },
        { name: 'Finance', href: '/organizer/finance', icon: IconCoin },
        { name: 'Wallet', href: '/organizer/wallet', icon: IconWallet },
    ];

    return (
        <div className="flex h-full flex-col bg-white">
            {/* Header / Logo */}
            <div className="flex h-16 shrink-0 items-center px-6 py-[21px]">
                <Link href={auth.user.role === 'organizer' ? '/organizer/dashboard' : '/superadmin/dashboard'} className="flex items-center justify-center gap-3 w-full">
                    <img src="/tigo-logo.svg" alt="Tigo Logo" className="w-12 h-12 object-contain" />
                </Link>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
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
                            // Tutup sidebar otomatis di mobile jika menu diklik
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                                isActive
                                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
                            }`}
                        >
                            <item.icon size={22} stroke={isActive ? 2.5 : 2} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Area Bawah (Opsional jika ingin tombol logout di sidebar juga) */}
            <div className="p-4 border-t border-slate-100">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-500 transition-all hover:bg-red-50"
                >
                    <IconLogout size={22} stroke={2} />
                    Keluar
                </Link>
            </div>
        </div>
    );
}
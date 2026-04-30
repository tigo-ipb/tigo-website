import { Link, usePage } from '@inertiajs/react';
import { 
    IconLayoutDashboard, 
    IconTicket, 
    IconBook, 
    IconCoin, 
    IconLogout 
} from '@tabler/icons-react';

export default function Sidebar() {
    const { url } = usePage();

    const menuItems = [
        { name: 'Dashboard', href: '/organizer/dashboard', icon: IconLayoutDashboard },
        { name: 'Events', href: '/organizer/events', icon: IconTicket },
        { name: 'Bookings', href: '/organizer/bookings', icon: IconBook },
        { name: 'Finance', href: '/organizer/finance', icon: IconCoin },
    ];

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-screen z-20">
            {/* Logo */}
            <div className="p-8 flex items-center gap-3">
                <img src="/images/logo-tigo.png" alt="Tigo Logo" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-bold text-blue-500">Tigo</span>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 px-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 ${
                                isActive 
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' 
                                : 'text-slate-400 hover:bg-slate-50 hover:text-blue-500'
                            }`}
                        >
                            <item.icon size={22} stroke={2} />
                            <span className="font-semibold">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout Button */}
            <div className="p-6">
                <Link
                    href={route('logout')}
                    method="post"
                    as="button"
                    className="w-full flex items-center gap-4 px-4 py-3 text-white bg-blue-500 rounded-2xl hover:bg-blue-600 transition-all shadow-md shadow-blue-100"
                >
                    <IconLogout size={22} stroke={2} />
                    <span className="font-semibold">Keluar</span>
                </Link>
            </div>
        </aside>
    );
}
import { Link, usePage } from '@inertiajs/react';
import { IconLayoutDashboard, IconTicket, IconBook, IconCoin, IconLogout, IconPlus, IconWallet, IconFileExport, IconUser, IconArrowDownLeftCircle } from '@tabler/icons-react';

export default function Sidebar({ isMobile, setIsMobileOpen }) {
    const { url } = usePage();
    const { auth } = usePage().props;

    const menuItemsOrganizer = [
        { name: 'Dashboard', href: '/organizer/dashboard', icon: IconLayoutDashboard },
        { name: 'Events', href: '/organizer/events', icon: IconTicket },
        { name: 'Bookings', href: '/organizer/bookings', icon: IconBook },
        { name: 'Finance', href: '/organizer/finance', icon: IconCoin },
        { name: 'Wallet', href: '/organizer/wallet', icon: IconWallet },
        { name: 'Export', href: '/organizer/export', icon: IconFileExport },
    ];

    const menuItemsAdmin = [
        { name: 'Dashboard', href: '/superadmin/dashboard', icon: IconLayoutDashboard },
        { name: 'Pengguna', href: '/superadmin/users', icon: IconUser },
        { name: 'Events', href: '/superadmin/events', icon: IconTicket },
        { name: 'Penarikan', href: '/superadmin/withdrawals', icon: IconArrowDownLeftCircle },
    ];

    const menuItems = auth.user.role === 'organizer' ? menuItemsOrganizer : menuItemsAdmin;

    const linkClass = (isActive) =>
        `flex items-center gap-3 px-6 py-3 text-[20px] font-semibold transition-all relative ${
            isActive
                ? 'bg-sky-50 text-sky-500 shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-sky-500'
        }`;

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white border-r border-neutral-300">
            {/* Logo — tetap di atas */}
            <div className="flex h-16 shrink-0 items-center px-6">
                <Link
                    href={auth.user.role === 'organizer' ? '/organizer/dashboard' : '/superadmin/dashboard'}
                    className="flex w-full items-center justify-center"
                >
                    <img src="/tigo-logo.svg" alt="Tigo Logo" className="h-12 w-12 object-contain" />
                </Link>
            </div>

            {/* Hanya bagian ini yang scroll */}
            <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain py-4">
                {auth.user.role === 'organizer' && (
                    <Link
                        href={route('organizer.events.create')}
                        onClick={() => isMobile && setIsMobileOpen(false)}
                        className="mx-auto mb-4 flex h-12 max-w-[228px] items-center justify-center rounded-[12px] bg-sky-500 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-sky-600"
                    >
                        <IconPlus size={20} className="mr-[10px] inline-block" />
                        Tambahkan Event Baru
                    </Link>
                )}

                {menuItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => isMobile && setIsMobileOpen(false)}
                            className={linkClass(isActive)}
                        >
                            {isActive && (
                                <div className="absolute left-0 h-full w-2 rounded-r-lg bg-sky-500" />
                            )}
                            <item.icon size={22} stroke={isActive ? 2.5 : 2} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Keluar — tidak ikut scroll */}
            <div className="shrink-0 border-t border-slate-100 bg-white p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
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

import { usePage, Link } from '@inertiajs/react';
import { IconBell, IconChevronDown, IconMenuDeep } from '@tabler/icons-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/Components/ui/sheet';
import { Button } from './ui/button';
import Sidebar from './Sidebar';

export default function Navbar({ header, toggleDesktop, isMobileOpen, setIsMobileOpen }) {
    const { auth } = usePage().props;

    return (
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 font-sans md:px-6">
            <div className="flex items-center gap-2">
                <div className="lg:hidden">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-neutral-500 hover:bg-[#f0f2f5] hover:text-sky-500"
                            >
                                <IconMenuDeep size={22} stroke={2} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-64 p-0">
                            <Sidebar isMobile setIsMobileOpen={setIsMobileOpen} />
                        </SheetContent>
                    </Sheet>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDesktop}
                    className="hidden h-10 w-10 rounded-xl text-neutral-500 hover:bg-[#f0f2f5] hover:text-sky-500 lg:flex"
                >
                    <IconMenuDeep size={22} stroke={2} />
                </Button>
            </div>

            <h1 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-neutral-950 md:text-xl">
                {header || 'Dashboard'}
            </h1>

            <div className="flex items-center gap-3 md:gap-4">
                <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f4fe] text-sky-500 transition-colors hover:bg-sky-100 hover:text-sky-600 md:h-10 md:w-10"
                    title="Notifikasi"
                >
                    <IconBell size={20} stroke={2} />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 rounded-xl border-0 pl-3 outline-none transition-colors hover:bg-[#f0f2f5] focus:outline-none md:gap-3 md:pl-4 md:border-l md:border-gray-100">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-sky-500 bg-sky-50 text-sm font-bold uppercase text-sky-500 md:h-10 md:w-10">
                            {auth.user.name.charAt(0)}
                        </div>
                        <div className="hidden text-left md:block">
                            <p className="text-sm font-bold text-neutral-950">{auth.user.name}</p>
                            <p className="text-xs capitalize text-neutral-400">{auth.user.role}</p>
                        </div>
                        <IconChevronDown size={16} className="hidden text-neutral-400 md:block" stroke={2} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="z-[60] mt-2 w-56 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
                    >
                        <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-xl focus:bg-sky-50"
                        >
                            <Link href="/profile" className="w-full font-semibold text-neutral-950">
                                Profil Saya
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2 bg-gray-100" />

                        <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-xl focus:bg-red-50"
                        >
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="w-full font-semibold text-red-500 focus:text-red-600"
                            >
                                Keluar
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}

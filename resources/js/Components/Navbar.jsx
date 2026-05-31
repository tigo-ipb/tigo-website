import { usePage, Link } from '@inertiajs/react';
import { IconBell, IconChevronDown, IconMenuDeep, IconUserCircle } from '@tabler/icons-react';
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
        <header className="sticky top-0 h-20 z-50 flex shrink-0 items-center border-b border-neutral-300 bg-white px-4 font-sans md:px-6">
            <div className="flex items-center gap-2 shrink-0">
                <div className="lg:hidden">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-xl text-black hover:bg-sky-100 hover:text-sky-500 scale-x-[-1]"
                            >
                                <IconMenuDeep size={22} stroke={2} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="h-full w-64 p-0">
                            <Sidebar isMobile setIsMobileOpen={setIsMobileOpen} />
                        </SheetContent>
                    </Sheet>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDesktop}
                    className="hidden h-11 w-11 rounded-xl text-black hover:bg-sky-100 hover:text-sky-500 lg:flex scale-x-[-1]"
                >
                    <IconMenuDeep className='!w-7 !h-7' size={42} stroke={2} />
                </Button>
            </div>

            <div className="flex-1 px-3">
                <h1 className="text-center text-lg md:text-xl font-semibold text-neutral-950 ">
                    {header || 'Dashboard'}
                </h1>
            </div>

            <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-100 text-sky-500 transition-colors hover:bg-sky-200 hover:text-sky-600 md:h-10 md:w-10"
                    title="Notifikasi"
                >
                    <IconBell size={20} stroke={2} />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger className="flex cursor-pointer items-center gap-2 border-0 outline-none transition-all focus:outline-none md:gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-500 md:h-10 md:w-10 overflow-hidden">
                            {auth.user.profile_photo ? (
                                <img src={auth.user.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <IconUserCircle size={22} stroke={2} />
                            )}
                        </div>
                        <span className="hidden text-sm font-semibold text-neutral-950 md:block">
                            {auth.user.name}
                        </span>
                        <IconChevronDown size={16} className="hidden text-neutral-950 md:block" stroke={2} />
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        align="end"
                        className="z-[60] mt-2 w-56 rounded-2xl border border-neutral-300 bg-white p-2 shadow-lg"
                    >
                        <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-xl focus:bg-sky-50"
                        >
                            <Link href="/profile" className="w-full font-semibold text-neutral-950">
                                Profil Saya
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator className="my-2 bg-neutral-300" />

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

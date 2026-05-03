import { usePage, Link } from '@inertiajs/react';
import { IconBell, IconChevronDown, IconMenuDeep } from '@tabler/icons-react';

// Import komponen Shadcn (Pastikan Anda sudah install: npx shadcn-ui@latest add dropdown-menu)
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from './ui/button';
import Sidebar from './Sidebar';

export default function Navbar({ header, toggleDesktop, isMobileOpen, setIsMobileOpen }) {
    const { auth } = usePage().props;

    return (
        // Ubah z-index menjadi z-50 agar dropdown tidak tertimpa elemen lain di bawahnya
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-between px-10 sticky top-0 z-50">

           <div className="lg:hidden">
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-600">
                            <IconMenuDeep size={24} />
                        </Button>
                    </SheetTrigger>
                    {/* side="left" agar muncul dari kiri seperti sidebar */}
                    <SheetContent side="left" className="w-64 p-0">
                        <Sidebar isMobile setIsMobileOpen={setIsMobileOpen} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* DESKTOP SIDEBAR TRIGGER */}
            <Button 
                variant="ghost"
                size='icon'  
                onClick={toggleDesktop} 
                className="hidden lg:flex text-black hover:text-sky-600 text-[42px]"
            >
                <IconMenuDeep size={42} />
            </Button>
            
            <div className="flex items-center justify-center">
                {<h1 className="text-2xl font-bold text-slate-800">{header || "Dashboard"}</h1>}
            </div>

            <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-blue-500 transition-colors p-2 bg-slate-50 rounded-full">
                    <IconBell size={24} />
                </button>
                
                {/* --- SHADCN DROPDOWN MENU --- */}
                <DropdownMenu>
                    {/* Trigger (Tombol yang diklik) */}
                    <DropdownMenuTrigger className="flex items-center gap-3 pl-6 border-l border-slate-100 outline-none focus:outline-none hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-blue-600 font-bold uppercase">
                            {auth.user.name.charAt(0)}
                        </div>
                        <div className="text-left hidden md:block">
                            <p className="text-sm font-bold text-slate-800">{auth.user.name}</p>
                            <p className="text-xs text-slate-400 capitalize">{auth.user.role}</p>
                        </div>
                        <IconChevronDown size={16} className="text-slate-400" />
                    </DropdownMenuTrigger>
                    
                    {/* Isi Dropdown */}
                    <DropdownMenuContent align="end" className="w-56 mt-2 bg-white z-[60] p-2 rounded-2xl shadow-lg border-gray-100">
                        <DropdownMenuItem asChild className="cursor-pointer rounded-xl hover:bg-blue-50 focus:bg-blue-50">
                            <Link href="/profile" className="w-full font-bold text-slate-700">
                                Profil Saya
                            </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-2 bg-slate-100" />
                        
                        <DropdownMenuItem asChild className="cursor-pointer rounded-xl hover:bg-red-50 focus:bg-red-50">
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button" 
                                className="w-full font-bold text-red-500 focus:text-red-600"
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
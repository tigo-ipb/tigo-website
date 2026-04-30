import { usePage } from '@inertiajs/react';
import { IconBell, IconChevronDown } from '@tabler/icons-react';

export default function Navbar() {
    const { auth } = usePage().props;

    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-50 flex items-center justify-between px-10 sticky top-0 z-10">
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

            <div className="flex items-center gap-6">
                <button className="text-slate-400 hover:text-blue-500 transition-colors p-2 bg-slate-50 rounded-full">
                    <IconBell size={24} />
                </button>
                
                <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center text-blue-600 font-bold">
                        {auth.user.name.charAt(0)}
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold text-slate-800">{auth.user.name}</p>
                        <p className="text-xs text-slate-400 capitalize">{auth.user.role}</p>
                    </div>
                    <IconChevronDown size={16} className="text-slate-400" />
                </div>
            </div>
        </header>
    );
}
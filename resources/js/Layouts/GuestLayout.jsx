import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import Footer from '@/Components/Footer';
import Notification from '@/Components/Notification';

export default function GuestLayout({ children }) {
    return (
       <div className="h-screen overflow-hidden bg-white flex flex-col">
        <Notification />
            <header className="px-8 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <img src="/tigo-logo.svg" alt="Tigo" className="h-8" />
                </div>
            </header>
                {children}
            <Footer auth={true}/>
        </div>
    );
}

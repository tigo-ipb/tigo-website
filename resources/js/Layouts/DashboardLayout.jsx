import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';
import Footer from '@/Components/Footer';
import Notification from '@/Components/Notification';

export default function DashboardLayout({ header, children }) {
    // State untuk Desktop Sidebar (Bisa di-collapse)
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

    // State untuk Mobile Sidebar (Diurus oleh Shadcn Sheet di Navbar)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-white">
            {/* DESKTOP SIDEBAR */}
            <Notification />
            <aside
                className={`hidden lg:block h-screen shrink-0 transition-all duration-300 bg-white ${isDesktopSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
                    }`}
            >
                <Sidebar />
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex min-h-0 flex-1 flex-col w-full overflow-hidden">
                <Navbar
                    header={header}
                    toggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                <main className="flex flex-1 flex-col min-h-0 overflow-y-auto p-4 md:p-6">
                    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
                        {children}
                            <div className="mt-auto shrink-0 pt-6">
                                <Footer />
                            </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
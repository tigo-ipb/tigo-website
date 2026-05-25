import React, { useState } from 'react';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';
import Footer from '@/Components/Footer';
import Notification from '@/Components/Notification';

export default function DashboardLayout({ header, children, hideFooter = false }) {
    // State untuk Desktop Sidebar (Bisa di-collapse)
    const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

    // State untuk Mobile Sidebar (Diurus oleh Shadcn Sheet di Navbar)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen w-full bg-white">
            {/* DESKTOP SIDEBAR */}
            <Notification />
            <aside
                className={`hidden lg:block transition-all duration-300 bg-white shrink-0 ${isDesktopSidebarOpen ? 'w-64' : 'w-0 overflow-hidden border-none'
                    }`}
            >
                {/* Komponen Sidebar dipanggil dengan mode desktop */}
                <Sidebar />
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-col flex-1 w-full overflow-hidden">
                <Navbar
                    header={header}
                    toggleDesktop={() => setIsDesktopSidebarOpen(!isDesktopSidebarOpen)}
                    isMobileOpen={isMobileSidebarOpen}
                    setIsMobileOpen={setIsMobileSidebarOpen}
                />

                <main className="flex flex-1 flex-col min-h-0 p-4 md:p-6">
                    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
                        {children}
                        {!hideFooter && (
                            <div className="mt-auto shrink-0 pt-6">
                                <Footer />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
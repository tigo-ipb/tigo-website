import React, { useState, useEffect } from 'react';
import Sidebar from '../Components/Sidebar';
import Navbar from '../Components/Navbar';

export default function DashboardLayout({ header, children }) {
    // State sidebar. Default true jika di desktop, false jika di mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Mengecek ukuran layar saat pertama kali di-load
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true); // Desktop: Buka
            } else {
                setIsSidebarOpen(false); // Mobile/Tablet: Tutup
            }
        };

        // Panggil sekali saat mount
        handleResize();

        // Event listener jika user me-resize browser (misal dari potrait ke landscape)
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex min-h-screen bg-slate-50 overflow-x-auto relative">
            
            {/* BACKDROP OVERLAY UNTUK MOBILE */}
            {/* Hanya muncul jika sidebar terbuka DAN di layar kecil (< 1024px) */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 lg:hidden transition-opacity"
                    onClick={() => setIsSidebarOpen(false)} // Klik layar gelap untuk menutup sidebar
                ></div>
            )}

            {/* Kirim state dan setter ke Sidebar agar bisa ditutup dari dalam */}
            <Sidebar isOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
            
            {/* 
                LOGIKA ML (MARGIN-LEFT) RESPONSIVE:
                - Selalu ml-0 (penuh) di mobile
                - Jika di layar besar (lg:) dan sidebar open, baru pakai ml-64 
            */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${isSidebarOpen ? 'lg:ml-[252px]' : 'ml-0'}`}>
                <Navbar header={header} toggleSidebar={toggleSidebar} />
                
                {/* Padding konten diperkecil di mobile (p-4 md:p-10) agar tidak sempit */}
                <main className="p-4 md:p-4 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
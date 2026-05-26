import React from 'react';
import { IconBrandWhatsapp } from '@tabler/icons-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <div className={`w-full bg-white border border-neutral-300 rounded-[24px] px-6 py-3.5 shadow-sm flex items-center justify-between gap-4 font-sans mt-auto shrink-0`}>
            {/* Sisi Kiri: Teks Hak Cipta Sesuai Mockup */}
            <p className="text-xs sm:text-sm text-black font-medium select-none">
                Copyright @ 2026 Tigo
            </p>

            {/* Sisi Kanan: Tombol Kontak WhatsApp Bulat Sesuai Mockup */}
            <a
                href={"https://wa.me/628123456789"}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] flex items-center justify-center bg-sky-100 text-sky-500 hover:bg-sky-200 hover:text-sky-600 hover:scale-105 transition-all shadow-sm shrink-0 border border-sky-100/50 cursor-pointer"
                title="Hubungi kami melalui WhatsApp"
            >
                <IconBrandWhatsapp size={18} stroke={2.5} />
            </a>
        </div>
    );
}

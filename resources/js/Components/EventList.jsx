import React from 'react';
import { IconClock, IconMapPin, IconTicket, IconDots } from '@tabler/icons-react';

// Komponen EventItem Tunggal (Merepresentasikan setiap baris event)
export function EventItem({ event, onActionClick, actionMenu }) {
    const {
        image,
        category = "Hiburan & Festival",
        title = "IPB Innovation Expo",
        dateTime = "Sab, 13 Januari • 10.00 - 21.00",
        location = "Grand Ballroom Sudirman",
        soldPercentage = 65,
        price = "Free"
    } = event;

    return (
        <div className="w-full bg-white border border-gray-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col xl:flex-row items-start xl:items-center gap-6 font-sans">
            
            {/* 1. Thumbnail Event */}
            <div className="w-full xl:w-48 h-32 xl:h-24 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                {image ? (
                    <img 
                        src={image} 
                        alt={title} 
                        className="w-full h-full object-cover" 
                    />
                ) : (
                    // Placeholder jika gambar tidak ada
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                        <div className="grid grid-cols-5 grid-rows-4 gap-1 w-full h-full p-2 opacity-20">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <div key={i} className="bg-gray-400 rounded-sm"></div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Tag & Judul Event */}
            <div className="flex-1 min-w-0 space-y-2">
                <span className="inline-block px-3 py-1 border border-sky-400 text-sky-500 text-[10px] font-semibold rounded-lg uppercase tracking-wider bg-sky-50/20">
                    {category}
                </span>
                <h3 className="text-xl font-bold text-neutral-950 truncate xl:whitespace-normal xl:line-clamp-2" title={title}>
                    {title}
                </h3>
            </div>

            {/* 3. Waktu & Lokasi */}
            <div className="flex flex-col gap-2 shrink-0 text-sm text-neutral-600 xl:w-64">
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                        <IconClock size={15} stroke={2.5} />
                    </div>
                    <span className="font-medium truncate">{dateTime}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                        <IconMapPin size={15} stroke={2.5} />
                    </div>
                    <span className="font-medium truncate">{location}</span>
                </div>
            </div>

            {/* 4. Progress Bar Tiket Terjual */}
            <div className="flex flex-col gap-1.5 shrink-0 xl:w-44 w-full">
                {/* Track Progress */}
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${soldPercentage}%` }}
                    ></div>
                </div>
                {/* Teks Deskripsi */}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-neutral-950">{soldPercentage}%</span>
                    <span className="text-xs text-neutral-400 font-medium">Tiket terjual</span>
                </div>
            </div>

            {/* 5. Badge Harga */}
            <div className="flex items-center gap-3 bg-[#e6f4fe] px-5 py-3 rounded-2xl shrink-0 min-w-[140px] shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center text-sky-500 shrink-0">
                    <IconTicket size={18} stroke={2} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-sky-500/80 font-bold uppercase tracking-wider">Mulai dari</span>
                    <span className="text-base font-black text-sky-500 leading-tight">{price}</span>
                </div>
            </div>

            {/* 6. Tombol Aksi (Three Dots) */}
            {actionMenu ? actionMenu(event) : (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onActionClick) onActionClick(event);
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-800 hover:bg-gray-50 transition-colors shrink-0 self-end xl:self-center cursor-pointer"
                    title="Opsi Event"
                >
                    <IconDots size={24} />
                </button>
            )}

        </div>
    );
}

// Komponen EventList Utama (Membungkus kumpulan EventItem)
export default function EventList({ events = [], onEventActionClick, actionMenu }) {
    if (!events || events.length === 0) {
        return (
            <div className="w-full bg-white border border-gray-100 rounded-3xl p-12 text-center text-neutral-400 font-medium">
                Belum ada event yang tersedia saat ini.
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            {events.map((event, index) => (
                <EventItem 
                    key={event.id || index} 
                    event={event} 
                    onActionClick={onEventActionClick}
                    actionMenu={actionMenu}
                />
            ))}
        </div>
    );
}

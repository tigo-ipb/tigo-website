// resources/js/Components/Notification.jsx
import React, { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';

export default function Notification() {
    const { flash, errors } = usePage().props;
    const [isVisible, setIsVisible] = useState(false);
    const [notif, setNotif] = useState({ type: '', message: '' });

    useEffect(() => {
        let timeout;
        
        // Cek apakah ada flash success, flash error, atau error validasi dari Laravel
        if (flash?.success) {
            setNotif({ type: 'success', message: flash.success });
            setIsVisible(true);
        } else if (flash?.error) {
            setNotif({ type: 'error', message: flash.error });
            setIsVisible(true);
        } else if (errors && Object.keys(errors).length > 0) {
            // Ambil pesan error validasi pertama yang muncul
            const firstError = errors[Object.keys(errors)[0]];
            setNotif({ type: 'error', message: firstError });
            setIsVisible(true);
        }

        // Hilangkan notifikasi setelah 3.5 detik
        if (isVisible) {
            timeout = setTimeout(() => {
                setIsVisible(false);
            }, 3500);
        }

        return () => clearTimeout(timeout);
    }, [flash, errors]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-6 right-6 z-[999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border ${
                notif.type === 'success' 
                    ? 'bg-white border-green-100' 
                    : 'bg-white border-red-100'
            }`}>
                {/* Ikon */}
                <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                    notif.type === 'success' 
                        ? 'bg-green-50 text-green-500' 
                        : 'bg-red-50 text-red-500'
                }`}>
                    {notif.type === 'success' ? <IconCheck size={20} /> : <IconAlertCircle size={20} />}
                </div>

                {/* Teks Pesan */}
                <div className="mr-4">
                    <p className={`text-sm font-bold ${notif.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        {notif.type === 'success' ? 'Berhasil!' : 'Terjadi Kesalahan'}
                    </p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">{notif.message}</p>
                </div>

                {/* Tombol Close Manual */}
                <button 
                    onClick={() => setIsVisible(false)} 
                    className="p-1 ml-auto text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
                >
                    <IconX size={16} />
                </button>
            </div>
        </div>
    );
}
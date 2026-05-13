// resources/js/Components/Modal.jsx
import React, { useEffect } from 'react';
import { IconX } from '@tabler/icons-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md' }) {
    // Mencegah scroll pada background saat modal terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
            {/* Overlay gelap dengan efek blur */}
            <div 
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Kotak Modal */}
            <div className={`relative bg-white rounded-2xl shadow-xl w-full ${maxWidth} overflow-hidden transform transition-all`}>
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-lg text-gray-900">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <IconX size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
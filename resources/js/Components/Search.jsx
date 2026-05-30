import React from 'react';
import { IconSearch } from '@tabler/icons-react';

export default function Search({ 
    value = "", 
    onChange, 
    onSubmit, 
    placeholder = "Cari nama, event, atau yang lain",
    className = "" 
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) {
            onSubmit(value);
        }
    };

    return (
        <form 
            onSubmit={handleSubmit}
            className={`relative w-full bg-white border border-neutral-300 rounded-full hover:border-neutral-300 transition-all ${className}`}
        >
            {/* Input Pencarian */}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange && onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-transparent pl-3 pr-12 py-2 text-xs border-0 focus:ring-0 focus:outline-none text-neutral-800 placeholder-neutral-300 font-medium rounded-full"
            />

            {/* Tombol Kaca Pembesar di Sisi Kanan */}
            <button
                type="submit"
                className="absolute right-5 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-300 transition-colors flex items-center justify-center cursor-pointer"
                title="Cari"
            >
                <IconSearch size={20} stroke={1.5} />
            </button>
        </form>
    );
}

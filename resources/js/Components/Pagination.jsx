import React from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

export default function Pagination({ pagination, onPageChange }) {
    if (!pagination) return null;

    const {
        current_page,
        last_page = 1,
        per_page,
        total,
        from,
        to
    } = pagination;

    // Menghitung jumlah data yang ditampilkan pada halaman saat ini
    const showingCount = (to && from) ? (to - from + 1) : Math.min(per_page || 10, total || 0);

    // Fungsi untuk menghasilkan susunan halaman dengan ellipsis (...)
    const getPages = (currentPage, lastPage) => {
        const pages = [];
        
        if (lastPage <= 5) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
            return pages;
        }

        // Selalu tampilkan halaman 1
        pages.push(1);

        if (currentPage <= 3) {
            // Dekat dengan awal
            pages.push(2);
            pages.push(3);
            pages.push('...');
            pages.push(lastPage);
        } else if (currentPage >= lastPage - 2) {
            // Dekat dengan akhir
            pages.push('...');
            pages.push(lastPage - 2);
            pages.push(lastPage - 1);
            pages.push(lastPage);
        } else {
            // Di tengah-tengah
            pages.push('...');
            pages.push(currentPage - 1);
            pages.push(currentPage);
            pages.push(currentPage + 1);
            pages.push('...');
            pages.push(lastPage);
        }

        return pages;
    };

    const pages = getPages(current_page, last_page);

    return (
        <div className="w-full bg-white border border-neutral-300 rounded-[24px] px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans">
            {/* Sisi Kiri: Info Jumlah Data */}
            <div className="text-sm text-neutral-950 font-medium flex items-center gap-4">
                <span>Menampilkan</span>
                <span className="text-sky-500 font-semibold">{showingCount}</span>
                <span>dari</span>
                <span>{new Intl.NumberFormat('id-ID').format(total)}</span>
            </div>

            {/* Sisi Kanan: Navigasi Halaman */}
            <div className="flex items-center gap-2">
                {/* Tombol Sebelumnya (Chevron Left) */}
                <button
                    type="button"
                    onClick={() => current_page > 1 && onPageChange && onPageChange(current_page - 1)}
                    className={`w-9 h-9 rounded-[8px] flex items-center justify-center bg-sky-100 text-sky-500 transition-colors shrink-0 ${
                        current_page === 1
                            ? 'opacity-50 cursor-default'
                            : 'cursor-pointer hover:bg-sky-500 hover:text-sky-100'
                    }`}
                >
                    <IconChevronLeft size={16} stroke={3} />
                </button>

                {/* Tombol Angka Halaman */}
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className="w-9 h-9 flex items-center justify-center text-neutral-300 select-none text-sm font-medium"
                            >
                                ...
                            </span>
                        );
                    }

                    const isActive = page === current_page;

                    return (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange && onPageChange(page)}
                            className={`w-9 h-9 rounded-[8px] text-sm font-semibold flex items-center justify-center transition-all shrink-0 ${
                                isActive
                                    ? 'bg-transparent text-neutral-950 border border-sky-500'
                                    : 'text-neutral-500 hover:text-sky-500 hover:bg-sky-100'
                            }`}
                        >
                            {page}
                        </button>
                    );
                })}

                {/* Tombol Selanjutnya (Chevron Right) */}
                <button
                    type="button"
                    onClick={() => current_page < last_page && onPageChange && onPageChange(current_page + 1)}
                    className={`w-9 h-9 rounded-[8px] flex items-center justify-center bg-sky-100 text-sky-500 transition-colors shrink-0 ${
                        current_page === last_page
                            ? 'opacity-50 cursor-default'
                            : 'cursor-pointer hover:bg-sky-500 hover:text-sky-100'
                    }`}
                >
                    <IconChevronRight size={16} stroke={3} />
                </button>
            </div>
        </div>
    );
}

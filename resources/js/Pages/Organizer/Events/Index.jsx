import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    IconSearch, 
    IconFilter, 
    IconCalendarEvent,
    IconMapPin,
    IconDots,
    IconTicket,
    IconCheck,
    IconFileText,
    IconHistory,
    IconChevronDown,
    IconChevronLeft,
    IconChevronRight,
    IconEdit,
    IconTrash,
    IconPower,
    IconX
} from '@tabler/icons-react';

const formatRupiah = (number) => {
    if (number === 0 || !number) return 'Free';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function Index({ events }) {
   const [activeTab, setActiveTab] = useState('active');
    
    // STATE UNTUK POPUP DROPDOWN
    const [openDropdown, setOpenDropdown] = useState(null);

    const [eventToDelete, setEventToDelete] = useState(null);

    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Fungsi pembantu untuk memanggil toast
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        // Sembunyikan otomatis setelah 3 detik
        setTimeout(() => {
            setToast(prev => ({ ...prev, visible: false }));
        }, 3000);
    };

     // --- LOGIKA FILTER TAB ---
    // Sekarang membandingkan status murni dari database ('active' atau 'draft')
    // Serta mengecek apakah event sudah lewat (untuk tab History)
    const filteredEvents = events?.filter(event => {
        // Cek apakah tanggal event sudah lewat (menjadi History)
        const isPastEvent = new Date(event.date_end) < new Date();

        if (activeTab === 'history') {
            return isPastEvent; // Tab Riwayat: Tampilkan semua event yang sudah lewat
        }
        
        if (activeTab === 'active') {
            // Tab Active: Status 'active' DAN event belum lewat
            return event.status === 'active' && !isPastEvent;
        }

        if (activeTab === 'draft') {
            // Tab Draft: Status 'draft' DAN event belum lewat
            return event.status === 'draft' && !isPastEvent;
        }

        return true; 
    }) || [];

    console.log('Filtered Events:', filteredEvents);

    // 1. Fungsi untuk membuka Modal Konfirmasi
    const confirmDelete = (id) => {
        setEventToDelete(id);
        setOpenDropdown(null); // Tutup dropdown action menu
    };

    // 2. Fungsi untuk mengeksekusi penghapusan (dipanggil dari dalam Modal)
    // --- FUNGSI HAPUS ---
    const executeDelete = () => {
        if (eventToDelete) {
            router.delete(route('organizer.events.destroy', eventToDelete), {
                onSuccess: (page) => {
                    setEventToDelete(null); 
                    // Tangkap pesan sukses dari backend, atau pakai teks default
                    showToast(page.props.flash?.success || 'Event berhasil dihapus!', 'success');
                },
                onError: () => {
                    setEventToDelete(null); 
                    showToast('Gagal menghapus event!', 'error');
                }
            });
        }
    };

    // --- FUNGSI UBAH STATUS ---
    const handleToggleStatus = (id, currentStatus) => {
        if (!id) return showToast('ID Event tidak valid', 'error');

        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        
        router.post(route('organizer.events.update-status', id), {
            _method: 'patch',
            status: newStatus
        }, {
            preserveScroll: true, 
            onSuccess: (page) => {
                setOpenDropdown(null); 
                // Tangkap pesan sukses dari controller
                showToast(page.props.flash?.success || `Status berhasil diubah menjadi ${newStatus}!`, 'success');
            },
            onError: () => {
                showToast('Gagal mengubah status event.', 'error');
            }
        });
    };

    return (
        <DashboardLayout>
            <Head title="Events" />

            <div className="flex flex-col h-full w-full">
                {/* Toolbar Section */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 w-full">
                    
                    {/* Tabs (Active, Draft, Riwayat) */}
                    <div className="flex gap-2 w-full xl:w-auto">
                        <button 
                            onClick={() => setActiveTab('active')}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-blue-500 text-white shadow-sm shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <IconCheck size={18} stroke={activeTab === 'active' ? 2.5 : 2} /> Active
                        </button>
                        <button 
                            onClick={() => setActiveTab('draft')}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'draft' ? 'bg-blue-500 text-white shadow-sm shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <IconFileText size={18} stroke={activeTab === 'draft' ? 2.5 : 2} /> Draft
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-blue-500 text-white shadow-sm shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <IconHistory size={18} stroke={activeTab === 'history' ? 2.5 : 2} /> Riwayat
                        </button>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex w-full xl:w-auto gap-3 items-center">
                        <div className="relative flex-1 min-w-[250px]">
                            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari nama, event..." 
                                className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700 placeholder-gray-400"
                            />
                        </div>
                        
                        <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full border border-gray-200 transition-colors">
                            <IconFilter size={18} />
                        </button>

                        <button className="hidden md:flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors min-w-[160px]">
                            Semua Kategori <IconChevronDown size={16} />
                        </button>

                        <button className="hidden md:flex items-center justify-between gap-3 px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors min-w-[140px]">
                            <div className="flex items-center gap-2">
                                <IconCalendarEvent size={18} /> Bulan Ini
                            </div>
                            <IconChevronDown size={16} />
                        </button>
                    </div>
                </div>

                {/* Event List */}
                <div className="flex-1 space-y-4 mb-8">
                    {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                        <div onClick={() => window.location.href = route('organizer.events.show', event.id)} key={event.id} className="bg-white p-4 rounded-[24px] border border-gray-200 flex flex-col xl:flex-row items-center gap-8 hover:shadow-sm transition-shadow w-full cursor-pointer">
                            
                            <div className="flex flex-col xl:flex-row items-center gap-4 w-full xl:w-auto">
                                {/* 1. Thumbnail Asli dari Cloudinary */}
                                <div className="w-full xl:w-40 h-[90px] rounded-xl bg-gray-100 shrink-0 overflow-hidden relative">
                                    <img src={event.image || 'https://via.placeholder.com/400x200?text=No+Image'} alt={event.name} className="w-full h-full object-cover" />
                                </div>

                                {/* 2. Kategori & Judul Asli */}
                                <div className="flex flex-col justify-center flex-1 w-[200px] w-full">
                                    <span className="inline-block px-3 py-1 bg-white text-blue-500 text-xs font-bold rounded-lg border border-blue-400 w-fit mb-2">
                                        {event.category}
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900 truncate">{event.name}</h3>
                                </div>
                            </div>

                            <div className="flex flex-col xl:flex-row items-center gap-6 w-full xl:w-auto flex-1 justify-end">
                                {/* 3. Jadwal & Lokasi Asli */}
                                <div className="flex flex-col gap-2 shrink-0 min-w-[220px] w-full xl:w-auto">
                                    <div className="flex items-center gap-2 text-xs text-gray-800 font-medium">
                                        <IconCalendarEvent size={18} className="text-blue-500" stroke={2} />
                                        <span>{event.schedule}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-800 font-medium">
                                        <IconMapPin size={18} className="text-blue-500" stroke={2} />
                                        <span className="truncate max-w-[200px]">{event.venue}</span>
                                    </div>
                                </div>

                                {/* 4. Progress Bar Tiket Dinamis */}
                                <div className="shrink-0 w-full xl:w-48 flex flex-col justify-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div 
                                            className="bg-blue-500 h-2.5 rounded-full" 
                                            style={{ width: `${event.sold_percentage || 0}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[20px] font-bold text-gray-900">{event.sold_percentage || 0}%</span>
                                        <span className="text-xs text-gray-800">Tiket terjual</span>
                                    </div>
                                </div>

                                {/* 5. Harga & Aksi Dinamis */}
                                <div className="flex items-center gap-4 shrink-0 w-full xl:w-auto justify-end">
                                    <div
                                        className="flex items-center gap-3 px-4 py-2.5 bg-[#e0f2fe] rounded-xl hover:bg-blue-100 transition-colors"
                                    >
                                        <div className="text-blue-500">
                                            <IconTicket size={24} stroke={2} /> 
                                        </div>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-[10px] font-medium text-blue-400">Mulai dari</span>
                                            <span className="text-[14px] font-bold text-blue-500">{formatRupiah(event.lowest_price)}</span>
                                        </div>
                                    </div>
                                    {/* WRAPPER DROPDOWN ACTION MENU */}
                                    <div className="relative z-30">
                                        <button 
                                            onClick={(e) =>{
                                                e.preventDefault();  // Mencegah aksi bawaan link
                                                e.stopPropagation(); 
                                                setOpenDropdown(openDropdown === event.id ? null : event.id)}} 
                                            className="text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition" 
                                        >
                                            <IconDots size={24} stroke={2.5} />
                                        </button>

                                        {/* POPUP DROPDOWN MUNCUL JIKA ID SAMA */}
                                        {openDropdown === event.id && (
                                            <>
                                                {/* Layar tak terlihat untuk menutup dropdown jika di-klik di luar */}
                                                <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                                                
                                                <div className="absolute right-0 top-12 w-40 bg-white rounded-2xl shadow-lg border border-gray-100 z-20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                                                    <Link 
                                                        href={route('organizer.events.edit', event.id)} 
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-500 w-full text-left"
                                                    >
                                                        <IconEdit size={18} stroke={2} /> Edit Event
                                                    </Link>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation(); 
                                                            confirmDelete(event.id); // <--- UBAH JADI INI
                                                        }}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-left"
                                                    >
                                                        <IconTrash size={18} stroke={2} /> Hapus
                                                    </button>
                                                    {/* TAMBAHAN BARU: Tombol Toggle Status (Hanya muncul jika bukan event lama) */}
                                                    {(activeTab === 'active' || activeTab === 'draft') && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleToggleStatus(event.id, event.status || 'active');
                                                            }}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-orange-500 w-full text-left border-b border-gray-50 mb-1"
                                                        >
                                                            <IconPower size={18} stroke={2} /> 
                                                            {event.status === 'active' ? 'Jadikan Draft' : 'Aktifkan Event'}
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    {/* END WRAPPER DROPDOWN */}
                                </div>
                            </div>
                        </div>
                    )) : (
                        /* Tampilan Jika Data Database Kosong */
                        <div className="bg-white border border-gray-200 border-dashed rounded-[24px] py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <IconCalendarEvent size={32} stroke={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Belum Ada Event</h3>
                            <p className="text-sm text-gray-500 mb-6">Anda belum memiliki event di tab ini.</p>
                            <Link 
                                href={route('organizer.events.create')}
                                className="bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-blue-600 transition"
                            >
                                Buat Event Baru
                            </Link>
                        </div>
                    )}
                </div>

                {/* Pagination (Tampil Jika Data Ada) */}
                {filteredEvents.length > 0 && (
                    <div className="bg-white border border-gray-100 rounded-[20px] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm font-medium text-gray-600">
                            Menampilkan <span className="mx-1">{filteredEvents.length}</span> dari <span className="mx-1">{events.length}</span> event
                        </div>
                        
                        <div className="flex items-center gap-1">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors">
                                <IconChevronLeft size={18} />
                            </button>
                            
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-blue-500 text-blue-500 font-bold text-sm">
                                1
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent text-gray-500 font-bold text-sm hover:bg-gray-50 transition-colors">
                                2
                            </button>
                            <span className="w-8 flex justify-center text-gray-400">...</span>

                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-400 hover:bg-blue-100 transition-colors">
                                <IconChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

            </div>
            {/* --- TOAST NOTIFICATION (MENGAMBANG DI KANAN BAWAH) --- */}
            <div 
                className={`fixed bottom-8 right-8 z-[100] transition-all duration-300 transform ${
                    toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
                }`}
            >
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl border bg-white ${
                    toast.type === 'success' ? 'border-green-100' : 'border-red-100'
                }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'
                    }`}>
                        {toast.type === 'success' ? <IconCheck size={24} stroke={2.5} /> : <IconX size={24} stroke={2.5} />}
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{toast.message}</p>
                </div>
            </div>
            
        </DashboardLayout>
    );
}
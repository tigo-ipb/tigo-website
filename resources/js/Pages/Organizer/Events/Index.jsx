import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    IconSearch, IconFilter, IconCalendarEvent, IconMapPin, IconDots, 
    IconTicket, IconCheck, IconFileText, IconHistory, IconChevronDown, 
    IconChevronLeft, IconChevronRight, IconEdit, IconTrash, IconPower, IconX
} from '@tabler/icons-react';

// Import komponen Select dari Shadcn UI
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

const formatRupiah = (number) => {
    if (number === 0 || !number) return 'Free';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function Index({ events, filters }) {
    // --- Inisialisasi State dari Filter Backend ---
    const [activeTab, setActiveTab] = useState(filters?.tab || 'active');
    const [search, setSearch] = useState(filters?.search || '');
    const [category, setCategory] = useState(filters?.category || 'Semua Kategori');
    const [timeFilter, setTimeFilter] = useState(filters?.time || 'Semua Waktu');

    const [openDropdown, setOpenDropdown] = useState(null);
    const [eventToDelete, setEventToDelete] = useState(null);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Daftar Kategori sesuai Database Anda
    const categoryOptions = [
        'Semua Kategori', 
        'Hiburan & Festival', 
        'Edukasi', 
        'Seni & Budaya', 
        'Olahraga'
    ];
    const timeOptions = ['Semua Waktu', 'Bulan Ini'];

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
    };

    // --- FUNGSI REQUEST FILTER KE SERVER ---
    const fetchFilteredData = (newFilters = {}) => {
        const query = { 
            tab: activeTab, 
            search: search, 
            category: category, 
            time: timeFilter, 
            ...newFilters // Override dengan filter terbaru
        };

        // Hapus query yang kosong agar URL bersih
        Object.keys(query).forEach(key => !query[key] && delete query[key]);

        router.get(route('organizer.events.index'), query, { 
            preserveState: true, 
            preserveScroll: true 
        });
    };

    // Handler Perubahan Filter
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        fetchFilteredData({ tab });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') fetchFilteredData({ search });
    };

    // --- FUNGSI HAPUS & STATUS ---
    const confirmDelete = (id) => { setEventToDelete(id); setOpenDropdown(null); };

    const executeDelete = () => {
        if (eventToDelete) {
            router.delete(route('organizer.events.destroy', eventToDelete), {
                preserveScroll: true,
                onSuccess: (page) => {
                    setEventToDelete(null); 
                    showToast(page.props.flash?.success || 'Event berhasil dihapus!', 'success');
                },
                onError: () => { setEventToDelete(null); showToast('Gagal menghapus event!', 'error'); }
            });
        }
    };

    const handleToggleStatus = (id, currentStatus) => {
        if (!id) return showToast('ID Event tidak valid', 'error');
        const newStatus = currentStatus === 'active' ? 'draft' : 'active';
        router.post(route('organizer.events.update-status', id), { _method: 'patch', status: newStatus }, {
            preserveScroll: true, 
            onSuccess: (page) => {
                setOpenDropdown(null); 
                showToast(page.props.flash?.success || `Status berhasil diubah menjadi ${newStatus}!`, 'success');
            },
            onError: () => showToast('Gagal mengubah status event.', 'error')
        });
    };

    return (
        <DashboardLayout header={"Events"}>
            <Head title="Events" />

            <div className="flex flex-col h-full w-full">
                {/* Toolbar Section */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6 w-full">
                    
                    {/* Tabs (Active, Draft, Riwayat) */}
                    <div className="flex gap-2 w-full xl:w-auto">
                        {['active', 'draft', 'history'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-blue-500 text-white shadow-sm shadow-blue-200' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                            >
                                {tab === 'active' && <IconCheck size={18} stroke={activeTab === tab ? 2.5 : 2} />}
                                {tab === 'draft' && <IconFileText size={18} stroke={activeTab === tab ? 2.5 : 2} />}
                                {tab === 'history' && <IconHistory size={18} stroke={activeTab === tab ? 2.5 : 2} />}
                                {tab === 'history' ? 'Riwayat' : tab}
                            </button>
                        ))}
                    </div>

                    {/* Filters & Search */}
                    <div className="flex w-full xl:w-auto gap-3 items-center">
                        <div className="relative flex-1 min-w-[250px]">
                            <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari nama event (Tekan Enter)..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full pl-11 pr-4 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-100 text-gray-700 placeholder-gray-400"
                            />
                        </div>

                        {/* Dropdown Kategori Menggunakan Shadcn */}
                        <div className="hidden md:block">
                            <Select 
                                value={category} 
                                onValueChange={(val) => {
                                    setCategory(val);
                                    fetchFilteredData({ category: val });
                                }}
                            >
                                <SelectTrigger className="w-[180px] h-[42px] px-5 py-2.5 bg-gray-50 border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-200 data-[state=open]:border-gray-200 data-[state=open]:ring-0 shadow-none">
                                    <SelectValue placeholder="Kategori" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-[20px] border border-gray-100 shadow-xl z-[100] p-1.5 min-w-[180px]">
                                    {categoryOptions.map(cat => (
                                        <SelectItem 
                                            key={cat} 
                                            value={cat}
                                            className="font-medium text-sm text-gray-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer rounded-xl py-2.5 px-3"
                                        >
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Dropdown Waktu Menggunakan Shadcn */}
                        <div className="hidden md:block">
                            <Select 
                                value={timeFilter} 
                                onValueChange={(val) => {
                                    setTimeFilter(val);
                                    fetchFilteredData({ time: val });
                                }}
                            >
                                <SelectTrigger className="w-[150px] h-[42px] px-5 py-2.5 bg-gray-50 border-gray-200 rounded-full text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-gray-200 data-[state=open]:border-gray-200 data-[state=open]:ring-0 shadow-none">
                                    <div className="flex items-center gap-2">
                                        {timeFilter === 'Bulan Ini' && <IconCalendarEvent size={16} className="text-blue-500" />}
                                        <SelectValue placeholder="Waktu" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-[20px] border border-gray-100 shadow-xl z-[100] p-1.5 min-w-[150px]">
                                    {timeOptions.map(time => (
                                        <SelectItem 
                                            key={time} 
                                            value={time}
                                            className="font-medium text-sm text-gray-700 focus:bg-blue-50 focus:text-blue-600 cursor-pointer rounded-xl py-2.5 px-3"
                                        >
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Event List */}
                <div className="flex-1 space-y-4 mb-8">
                    {events.data && events.data.length > 0 ? events.data.map((event) => (
                        <div onClick={() => window.location.href = route('organizer.events.show', event.id)} key={event.id} className="bg-white p-4 rounded-[24px] border border-gray-200 flex flex-col xl:flex-row items-center gap-8 hover:shadow-sm transition-shadow w-full cursor-pointer">
                            <div className="flex flex-col xl:flex-row items-center gap-4 w-full xl:w-auto">
                                <div className="w-full xl:w-40 h-[90px] rounded-xl bg-gray-100 shrink-0 overflow-hidden relative">
                                    <img src={event.image} alt={event.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col justify-center flex-1 w-[200px] w-full">
                                    <span className="inline-block px-3 py-1 bg-white text-blue-500 text-xs font-bold rounded-lg border border-blue-400 w-fit mb-2">
                                        {event.category}
                                    </span>
                                    <h3 className="text-2xl font-bold text-gray-900 truncate">{event.name}</h3>
                                </div>
                            </div>

                            <div className="flex flex-col xl:flex-row items-center gap-6 w-full xl:w-auto flex-1 justify-end">
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

                                <div className="shrink-0 w-full xl:w-48 flex flex-col justify-center">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${event.sold_percentage || 0}%` }}></div>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[20px] font-bold text-gray-900">{event.sold_percentage || 0}%</span>
                                        <span className="text-xs text-gray-800">Tiket terjual</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0 w-full xl:w-auto justify-end">
                                    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#e0f2fe] rounded-xl hover:bg-blue-100 transition-colors">
                                        <div className="text-blue-500"><IconTicket size={24} stroke={2} /></div>
                                        <div className="flex flex-col items-start leading-tight">
                                            <span className="text-[10px] font-medium text-blue-400">Mulai dari</span>
                                            <span className="text-[14px] font-bold text-blue-500">{formatRupiah(event.lowest_price)}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action Dropdown */}
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <button 
                                            onClick={(e) =>{ e.preventDefault(); e.stopPropagation(); setOpenDropdown(openDropdown === event.id ? null : event.id)}} 
                                            className="text-gray-900 hover:bg-gray-100 p-2 rounded-xl transition" 
                                        >
                                            <IconDots size={24} stroke={2.5} />
                                        </button>

                                        {openDropdown === event.id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpenDropdown(null) }}></div>
                                                <div className="absolute right-0 top-12 w-40 bg-white rounded-2xl shadow-lg border border-gray-100 z-20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                                                    <Link href={route('organizer.events.edit', event.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-500 w-full text-left">
                                                        <IconEdit size={18} stroke={2} /> Edit Event
                                                    </Link>
                                                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDelete(event.id); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-left">
                                                        <IconTrash size={18} stroke={2} /> Hapus
                                                    </button>
                                                    {(activeTab === 'active' || activeTab === 'draft') && (
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(event.id, event.status || 'active'); }}
                                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-orange-500 w-full text-left border-b border-gray-50 mb-1"
                                                        >
                                                            <IconPower size={18} stroke={2} /> {event.status === 'active' ? 'Jadikan Draft' : 'Aktifkan Event'}
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white border border-gray-200 border-dashed rounded-[24px] py-16 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mb-4">
                                <IconCalendarEvent size={32} stroke={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">Data Tidak Ditemukan</h3>
                            <p className="text-sm text-gray-500 mb-6">Coba ubah filter pencarian atau buat event baru.</p>
                            <Link href={route('organizer.events.create')} className="bg-blue-500 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-blue-600 transition">
                                Buat Event Baru
                            </Link>
                        </div>
                    )}
                </div>

                {/* SERVER-SIDE PAGINATION */}
                {events.links && events.links.length > 3 && (
                    <div className="bg-white border border-gray-100 rounded-[20px] p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-sm font-medium text-gray-600">
                            Menampilkan <span className="mx-1">{events.from || 0}</span> ke <span className="mx-1">{events.to || 0}</span> dari total <span className="font-bold mx-1 text-gray-900">{events.total}</span> event
                        </div>
                        
                        <div className="flex items-center gap-1">
                            {events.links.map((link, key) => (
                                <Link 
                                    key={key} 
                                    href={link.url}
                                    preserveState preserveScroll
                                    className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                                        link.active 
                                            ? 'border border-blue-500 bg-white text-blue-500' 
                                            : link.url 
                                                ? 'bg-transparent text-gray-500 hover:bg-gray-50' 
                                                : 'text-gray-300 cursor-not-allowed hidden'
                                    }`}
                                    dangerouslySetInnerHTML={{ 
                                        __html: link.label.replace('&laquo; Previous', '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18" width="18"><path d="M15 6l-6 6l6 6"></path></svg>')
                                                          .replace('Next &raquo;', '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="18" width="18"><path d="M9 6l6 6l-6 6"></path></svg>') 
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL & TOAST COMPONENT */}
            {eventToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEventToDelete(null)}></div>
                    <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md p-8 relative z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-4 border-white shadow-sm"><IconTrash size={36} stroke={1.5} /></div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Hapus Event?</h3>
                            <p className="text-sm text-gray-500 mb-8 leading-relaxed">Apakah Anda yakin ingin menghapus event ini? Semua data, jadwal, tiket, dan foto yang terkait akan <span className="font-bold text-red-500">terhapus permanen</span> dari sistem.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setEventToDelete(null)} className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                                <button onClick={executeDelete} className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-sm shadow-red-200">Ya, Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={`fixed bottom-8 right-8 z-[100] transition-all duration-300 transform ${toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
                <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-xl border bg-white ${toast.type === 'success' ? 'border-green-100' : 'border-red-100'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500'}`}>
                        {toast.type === 'success' ? <IconCheck size={24} stroke={2.5} /> : <IconX size={24} stroke={2.5} />}
                    </div>
                    <p className="font-bold text-gray-800 text-sm">{toast.message}</p>
                </div>
            </div>

        </DashboardLayout>
    );
}
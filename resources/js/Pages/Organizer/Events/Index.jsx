    import React, { useState } from 'react';
    import DashboardLayout from '@/Layouts/DashboardLayout';
    import { Head, Link, router } from '@inertiajs/react';
    import {
        IconCalendarEvent, IconMapPin, IconDots, IconTicket, IconSquareRoundedCheck,
        IconFileText, IconHistory, IconEdit, IconTrash,
        IconPower, IconX, IconArchive, IconAdjustmentsHorizontal,
        IconCheck
    } from '@tabler/icons-react';

    // Import Shadcn UI
    import {
        Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
    } from "@/Components/ui/select";

    // Import Reusable Components
    import Search from '@/Components/Search';
    import EventList from '@/Components/EventList';
    import Pagination from '@/Components/Pagination';

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

        // Daftar Kategori sesuai Database Anda
        const categoryOptions = [
            'Semua Kategori',
            'Hiburan & Festival',
            'Edukasi',
            'Seni & Budaya',
            'Olahraga'
        ];
        const timeOptions = ['Semua Waktu', 'Bulan Ini'];

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

        // --- FUNGSI HAPUS & STATUS ---
        const confirmDelete = (id) => { setEventToDelete(id); setOpenDropdown(null); };

        const executeDelete = () => {
            if (eventToDelete) {
                router.delete(route('organizer.events.destroy', eventToDelete), {
                    preserveScroll: true,
                    onSuccess: (page) => {
                        setEventToDelete(null);
                    },
                    onError: () => { setEventToDelete(null) }
                });
            }
        };

        const handleToggleStatus = (id, currentStatus) => {
            const newStatus = currentStatus === 'active' ? 'archive' : (currentStatus === 'draft' ? 'active' : 'active');
            router.post(route('organizer.events.update-status', id), { _method: 'patch', status: newStatus }, {
                preserveScroll: true,
                onSuccess: (page) => {
                    setOpenDropdown(null);
                }
            });
        };

        // Map Event untuk EventList
        const formattedEvents = events?.data ? events.data.map(event => ({
            id: event.id,
            image: event.image,
            category: event.category,
            title: event.name,
            dateTime: event.schedule,
            location: event.venue,
            soldPercentage: event.sold_percentage || 0,
            price: formatRupiah(event.lowest_price)
        })) : [];

        // Dropdown aksi per event
        const renderActionMenu = (event) => {
            const originalEvent = events?.data?.find(e => e.id === event.id);
            if (!originalEvent) return null;

            return (
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === event.id ? null : event.id);
                        }}
                        className="text-neutral-400 hover:text-neutral-800 p-2 rounded-full hover:bg-gray-50 transition cursor-pointer flex items-center justify-center shrink-0 w-10 h-10"
                    >
                        <IconDots size={24} stroke={2} />
                    </button>

                    {openDropdown === event.id && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpenDropdown(null) }}></div>
                            <div className="absolute right-0 top-12 w-42 bg-white rounded-2xl shadow-lg border border-gray-100 z-20 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2 font-sans">
                                <Link href={route('organizer.events.edit', event.id)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-500 w-full text-left">
                                    <IconEdit size={18} stroke={2} /> Edit Event
                                </Link>
                                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); confirmDelete(event.id); }} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-left cursor-pointer">
                                    <IconTrash size={18} stroke={2} /> Hapus
                                </button>
                                {(activeTab === 'active' || activeTab === 'draft' || activeTab === 'archive') && (
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleStatus(event.id, originalEvent.status || 'active'); }}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-orange-500 w-full text-left cursor-pointer"
                                    >
                                        <IconPower size={18} stroke={2} /> {originalEvent.status === 'active' ? 'Archive Event' : 'Aktifkan Event' }
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            );
        };

        return (
            <DashboardLayout header={"Events"}>
                <Head title="Events" />

                <div className="flex flex-col flex-1 min-h-0 w-full gap-6">
                    {/* Toolbar Section */}
                    <div className="flex flex-col xl:flex-row justify-between items-center gap-4 w-full">

                        {/* Tabs (Active, Draft, Riwayat, Archive) */}
                        <div className="flex gap-2 w-full xl:w-auto overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'active', label: 'Active', icon: IconSquareRoundedCheck },
                                { id: 'draft', label: 'Draft', icon: IconFileText },
                                { id: 'history', label: 'Riwayat', icon: IconHistory },
                                { id: 'archive', label: 'Archive', icon: IconArchive }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-[12px] text-sm font-bold transition-all shrink-0 capitalize ${activeTab === tab.id ? 'bg-[#00a2ff] text-white shadow-sm shadow-[#00a2ff]/10' : 'bg-[#f0f2f5] text-neutral-400 hover:bg-gray-200 cursor-pointer'}`}
                                >
                                    <tab.icon size={18} stroke={activeTab === tab.id ? 2.5 : 2} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters & Search */}
                        <div className="flex w-full xl:w-auto gap-3 items-center">
                            <Search
                                value={search}
                                onChange={setSearch}
                                onSubmit={(val) => fetchFilteredData({ search: val })}
                                placeholder="Cari nama, event, atau yang lain"
                                className="max-w-[300px]"
                            />

                            {/* Filter Button */}
                            <button className="w-[42px] h-[42px] bg-[#f0f2f5] text-neutral-400 rounded-[12px] hover:bg-gray-200 flex items-center justify-center shrink-0 transition-colors cursor-pointer border-0" title="Filter Pengaturan">
                                <IconAdjustmentsHorizontal size={20} />
                            </button>

                            {/* Dropdown Kategori Menggunakan Shadcn */}
                            <div className="hidden md:block">
                                <Select
                                    value={category}
                                    onValueChange={(val) => {
                                        setCategory(val);
                                        fetchFilteredData({ category: val });
                                    }}
                                >
                                    <SelectTrigger className="w-[180px] h-[42px] px-5 py-2.5 bg-[#f0f2f5] border-0 rounded-[12px] text-sm font-bold text-neutral-500 hover:bg-gray-200 transition-colors focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 shadow-none shrink-0">
                                        <SelectValue placeholder="Kategori" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-[20px] border border-gray-100 shadow-xl z-[100] p-1.5 min-w-[180px]">
                                        {categoryOptions.map(cat => (
                                            <SelectItem
                                                key={cat}
                                                value={cat}
                                                className="font-medium text-sm text-gray-700 focus:bg-sky-50 focus:text-sky-600 cursor-pointer rounded-xl py-2.5 px-3"
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
                                    <SelectTrigger className="w-[150px] h-[42px] px-5 py-2.5 bg-[#f0f2f5] border-0 rounded-[12px] text-sm font-bold text-neutral-500 hover:bg-gray-200 transition-colors focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 shadow-none shrink-0">
                                        <div className="flex items-center gap-2">
                                            {timeFilter === 'Bulan Ini' && <IconCalendarEvent size={16} className="text-[#00a2ff]" />}
                                            <SelectValue placeholder="Waktu" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white rounded-[20px] border border-gray-100 shadow-xl z-[100] p-1.5 min-w-[150px]">
                                        {timeOptions.map(time => (
                                            <SelectItem
                                                key={time}
                                                value={time}
                                                className="font-medium text-sm text-gray-700 focus:bg-sky-50 focus:text-sky-600 cursor-pointer rounded-xl py-2.5 px-3"
                                            >
                                                {time}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Event List Container */}
                    <div className="flex-1 w-full">
                        {formattedEvents.length > 0 ? (
                            <EventList
                                events={formattedEvents}
                                actionMenu={renderActionMenu}
                            />
                        ) : (
                            <div className="bg-white border border-gray-200 border-dashed rounded-[24px] py-16 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-sky-50 text-sky-400 rounded-full flex items-center justify-center mb-4">
                                    <IconCalendarEvent size={32} stroke={1.5} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">Data Tidak Ditemukan</h3>
                                <p className="text-sm text-gray-500 mb-6">Coba ubah filter pencarian atau buat event baru.</p>
                                <Link href={route('organizer.events.create')} className="bg-sky-500 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-sm hover:bg-sky-600 transition">
                                    Buat Event Baru
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        pagination={events}
                        onPageChange={(page) => {
                            fetchFilteredData({ page });
                        }}
                    />
                </div>

                {/* MODAL COMPONENT */}
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

            </DashboardLayout>
        );
    }
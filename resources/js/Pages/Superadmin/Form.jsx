import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    IconUpload, IconPlus, IconTrash, IconMapPin, 
    IconTicket, IconEdit, IconFile, IconCalendar 
} from '@tabler/icons-react'; 

// --- IMPORT SHADCN COMPONENTS ---
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";
import DateModal from '@/Components/DateModal'; 

// --- Helper Format Tanggal untuk Tombol ---
const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Pilih Tanggal';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
};

// --- KELAS CSS STANDAR UNTUK SEMUA INPUT ---
const inputClass = "w-full !h-12 px-4 border-neutral-300 rounded-2xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-white";
const textareaClass = "w-full p-4 border-neutral-300 rounded-2xl text-sm focus:ring-sky-500 focus:border-sky-500 bg-white";

export default function Form({ event }) {
    const isEdit = !!event;

    // --- State Preview ---
    const [preview16x9, setPreview16x9] = useState(event?.banners?.['16x9'] || null);
    const [preview1x1, setPreview1x1] = useState(event?.banners?.['1x1'] || null);
    const [previewGalleries, setPreviewGalleries] = useState(
        Array(4).fill(null).map((_, i) => event?.galleries?.[i] || null)
    );

    // --- State Form ---
    const { data, setData, post, processing, transform } = useForm({
        name: event?.name || '',
        category_name: event?.category_name || 'Hiburan & Festival',
        format: event?.format || 'offline',
        description: event?.description || '',
        terms_conditions: event?.terms_string || '',
        venue: event?.location?.venue || '',
        address: event?.location?.address || '',
        map_link: event?.location?.map_link || '',
        schedules: event?.schedules || [{ date: '', time_start: '', time_end: '' }],
        ticket_types: event?.ticket_types 
            ? event.ticket_types.map(ticket => ({
                ...ticket,
                features: Array.isArray(ticket.features) ? ticket.features.join(' - ') : (ticket.features || '')
            })) 
            : [{ type_name: '', description: '', features: '', price: '', available_stock: '' }],
        banner_16x9: null,
        banner_1x1: null,
        galleries: [] 
    });

    // --- STATE UNTUK SCROLLSPY ---
    const [activeSection, setActiveSection] = useState('form-utama');

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) setActiveSection(entry.target.id);
            });
        }, { rootMargin: '-30% 0px -50% 0px' });

        const sections = ['form-utama', 'tanggal-lokasi', 'tiket'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    // --- Handlers Upload ---
    const handleBannerChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setData(field, file);
            const previewUrl = URL.createObjectURL(file);
            if (field === 'banner_16x9') setPreview16x9(previewUrl);
            if (field === 'banner_1x1') setPreview1x1(previewUrl);
        }
    };

    const handleGalleryChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            const newGalleries = [...data.galleries];
            newGalleries[index] = file;
            setData('galleries', newGalleries);
            
            const newPreviews = [...previewGalleries];
            newPreviews[index] = URL.createObjectURL(file);
            setPreviewGalleries(newPreviews);
        }
    };

    // --- Helpers Dynamic Form ---
    const addSchedule = () => setData('schedules', [...data.schedules, { date: '', time_start: '', time_end: '' }]);
    const removeSchedule = (index) => setData('schedules', data.schedules.filter((_, i) => i !== index));
    const updateSchedule = (index, field, value) => {
        const newSchedules = [...data.schedules];
        newSchedules[index][field] = value;
        setData('schedules', newSchedules);
    };

    const addTicket = () => setData('ticket_types', [...data.ticket_types, { type_name: '', description: '', features: '', price: '', available_stock: '' }]);
    const removeTicket = (index) => setData('ticket_types', data.ticket_types.filter((_, i) => i !== index));
    const updateTicket = (index, field, value) => {
        const newTickets = [...data.ticket_types];
        newTickets[index][field] = value;
        setData('ticket_types', newTickets);
    };

    // --- Submit ---
    const handleSubmit = (e) => {
        e.preventDefault();
        transform((currentData) => {
            const payload = { ...currentData };
            if (isEdit) payload._method = 'put';
            payload.galleries = currentData.galleries.filter(file => file);
            return payload;
        });
        
        // 🔥 Tetap menggunakan Route Superadmin 🔥
        post(isEdit ? route('superadmin.events.update', event.id) : route('superadmin.events.store'), {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout header={isEdit ? "Edit Event" : "Tambah Event"}>
            <Head title={isEdit ? "Edit Event" : "Tambah Event"} />

            <div className="rounded-t-[32px] w-full max-w-6xl mx-auto">
                
                <form onSubmit={handleSubmit} className="relative w-full">
                    
                    {/* GARIS BIRU VERTIKAL PENGHUBUNG */}
                    <div className="hidden xl:block absolute right-[62px] top-16 bottom-32 w-[4px] bg-sky-500 z-0 rounded-full"></div>

                    {/* =========================================
                        1. SECTION: FORM UTAMA 
                    ========================================== */}
                    <div id="form-utama" className="flex flex-col xl:flex-row gap-8 w-full mb-10 relative z-10 scroll-mt-24">
                        
                        <div className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-300 space-y-10">
                            {/* --- BANNER --- */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Banner Event</h2>
                                <div className="flex flex-col md:flex-row gap-6">
                                    <label className="flex-1 border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden min-h-[200px] group bg-neutral-50 hover:bg-neutral-100">
                                        <input type="file" className="hidden" onChange={e => handleBannerChange(e, 'banner_16x9')} accept="image/*" />
                                        {preview16x9 ? (
                                            <>
                                                <img src={preview16x9} alt="Preview 16:9" className="absolute inset-0 w-full h-full object-cover z-0" />
                                                <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                    <span className="text-white font-semibold flex items-center gap-2"><IconEdit size={20}/> Ganti Foto 16:9</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-8 text-center flex flex-col items-center z-10">
                                                <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-[14px] flex items-center justify-center mb-3">
                                                    <IconUpload size={22} stroke={2.5} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 leading-tight">Klik untuk upload banner</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP • Maks. 20MB • Rasio 16:9</span>
                                            </div>
                                        )}
                                    </label>

                                    <label className="w-full md:w-[250px] border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden aspect-square group bg-neutral-50 hover:bg-neutral-100">
                                        <input type="file" className="hidden" onChange={e => handleBannerChange(e, 'banner_1x1')} accept="image/*" />
                                        {preview1x1 ? (
                                            <>
                                                <img src={preview1x1} alt="Preview 1:1" className="absolute inset-0 w-full h-full object-cover z-0" />
                                                <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm text-center px-4">
                                                    <span className="text-white font-semibold flex flex-col items-center gap-1"><IconEdit size={20}/> Ganti Foto 1:1</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="p-4 text-center flex flex-col items-center z-10">
                                                <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-[14px] flex items-center justify-center mb-3">
                                                    <IconUpload size={22} stroke={2.5} />
                                                </div>
                                                <span className="text-sm font-semibold text-gray-900 leading-tight">Klik upload</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG • Maks. 15MB • 1:1</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* --- GALLERY --- */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gallery</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[0, 1, 2, 3].map((index) => (
                                        <label key={index} className="w-full border-2 border-dashed border-neutral-300 rounded-2xl flex flex-col items-center justify-center p-3 cursor-pointer transition relative overflow-hidden aspect-square group bg-white hover:bg-neutral-50">
                                            <input type="file" className="hidden" onChange={e => handleGalleryChange(e, index)} accept="image/*" />
                                            {previewGalleries[index] ? (
                                                <>
                                                    <img src={previewGalleries[index]} alt={`Gallery ${index + 1}`} className="absolute inset-0 w-full h-full object-cover z-0" />
                                                    <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm text-center">
                                                        <span className="text-white font-semibold flex flex-col items-center gap-1 text-xs"><IconEdit size={16}/> Ganti</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center flex flex-col items-center z-10 w-full">
                                                    <div className="w-10 h-10 bg-sky-100 text-sky-500 rounded-xl flex items-center justify-center mb-2">
                                                        <IconUpload size={18} stroke={2.5} />
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-gray-900 leading-tight">Klik upload</span>
                                                    <span className="text-[9px] text-gray-400 mt-1">Maks. 15MB</span>
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* --- INFORMASI EVENT --- */}
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Informasi Event</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Event</label>
                                        <Input className={inputClass} type="text" value={data.name} onChange={e => setData('name', e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori</label>
                                        <Select value={data.category_name} onValueChange={value => setData('category_name', value)}>
                                            <SelectTrigger className={inputClass}>
                                                <SelectValue placeholder="Pilih Kategori" />
                                            </SelectTrigger>
                                            <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)] bg-white border border-neutral-300 rounded-2xl shadow-xl z-[100] overflow-hidden">
                                                <SelectItem value="Hiburan & Festival" className="cursor-pointer focus:bg-sky-50 focus:text-sky-500 py-2.5">Hiburan & Festival</SelectItem>
                                                <SelectItem value="Edukasi" className="cursor-pointer focus:bg-sky-50 focus:text-sky-500 py-2.5">Edukasi</SelectItem>
                                                <SelectItem value="Seni & Budaya" className="cursor-pointer focus:bg-sky-50 focus:text-sky-500 py-2.5">Seni & Budaya</SelectItem>
                                                <SelectItem value="Olahraga" className="cursor-pointer focus:bg-sky-50 focus:text-sky-500 py-2.5">Olahraga</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tentang Event</label>
                                    <Textarea className={textareaClass} rows={4} value={data.description} onChange={e => setData('description', e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ketentuan</label>
                                    <Textarea className={textareaClass} rows={4} value={data.terms_conditions} onChange={e => setData('terms_conditions', e.target.value)} placeholder="Gunakan enter/baris baru untuk setiap poin" />
                                </div>
                            </div>
                        </div>

                        {/* KANAN: Ikon Scrollspy */}
                        <div className="hidden xl:flex w-32 shrink-0 flex-col items-center pt-8 border-t border-x rounded-t-2xl border-neutral-300 -mb-20">
                            <a href="#form-utama" className="flex flex-col items-center group w-full transition-all bg-white py-2">
                                <div className="bg-white p-[6px] rounded-2xl">
                                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-300 ${
                                        activeSection === 'form-utama' 
                                            ? 'bg-sky-100 text-sky-500 scale-110 ' 
                                            : 'bg-white text-gray-300 border-[3px] border-neutral-300 group-hover:border-sky-500 group-hover:text-sky-500'
                                    }`}>
                                        <IconFile size={24} stroke={3} />
                                    </div>
                                </div>
                                <span className={`text-[13px] font-semibold mt-2 text-center transition-colors ${
                                    activeSection === 'form-utama' ? 'text-sky-500' : 'text-gray-400'
                                }`}>Form Utama</span>
                            </a>
                        </div>
                    </div>

                    {/* =========================================
                        2. SECTION: TANGGAL & LOKASI 
                    ========================================== */}
                    <div id="tanggal-lokasi" className="flex flex-col xl:flex-row gap-8 w-full mb-10 relative z-10 scroll-mt-24">
                        
                        <div className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-300">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tanggal & Lokasi</h2>
                            
                            {data.schedules.map((schedule, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 items-end bg-white p-4 rounded-2xl border border-neutral-300">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Tanggal Event</label>
                                        <DateModal
                                            title="Pilih Tanggal Event"
                                            actionLabel="Simpan Tanggal"
                                            onAction={(dateStr) => updateSchedule(index, 'date', dateStr)}
                                            triggerNode={
                                                <button
                                                    type="button"
                                                    className="flex items-center justify-between w-full !h-12 px-4 bg-white border border-neutral-300 rounded-2xl text-sm text-neutral-900 font-medium hover:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-0 cursor-pointer transition-colors"
                                                >
                                                    <span>{formatDisplayDate(schedule.date)}</span>
                                                    <IconCalendar size={18} className="text-neutral-400 shrink-0" stroke={2} />
                                                </button>
                                            }
                                        />
                                    </div>

                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Jam Mulai</label>
                                        <Input className={inputClass} type="time" value={schedule.time_start} onChange={e => updateSchedule(index, 'time_start', e.target.value)} required />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Jam Berakhir</label>
                                        <Input className={inputClass} type="time" value={schedule.time_end} onChange={e => updateSchedule(index, 'time_end', e.target.value)} required />
                                    </div>
                                    {index > 0 && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeSchedule(index)} className="rounded-2xl shrink-0 h-12 w-12 hover:text-red-500 hover:bg-red-50">
                                            <IconTrash size={20} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                            
                            <div className="flex justify-center mb-8 border-b border-neutral-300 pb-8">
                                <Button type="button" onClick={addSchedule} className="rounded-full bg-sky-500 hover:bg-[#0284c7] text-white font-semibold">
                                    <IconPlus size={16} className="mr-2" /> Tambah Jadwal
                                </Button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Venue / Lokasi Event</label>
                                <Input className={inputClass} type="text" value={data.venue} onChange={e => setData('venue', e.target.value)} placeholder="Contoh: Gedung Dungkedung" required />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Detail Lokasi</label>
                                <Input className={inputClass} type="text" value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Jl. Raya Kemerdekaan No.17" required />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Lokasi Maps</label>
                                <Textarea className={textareaClass} rows={3} type="url" value={data.map_link} onChange={e => setData('map_link', e.target.value)} placeholder="https://maps.app.goo.gl/..." required/>
                            </div>
                        </div>

                        {/* KANAN: Ikon Scrollspy */}
                        <div className="hidden xl:flex w-32 shrink-0 flex-col items-center pt-8 border-x border-neutral-300 -mb-20">
                            <a href="#tanggal-lokasi" className="flex flex-col items-center group w-full transition-all bg-white py-2">
                                <div className="bg-white p-[6px] rounded-2xl">
                                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-300 ${
                                        activeSection === 'tanggal-lokasi' 
                                            ? 'bg-sky-100 text-sky-500 scale-110 ' 
                                            : 'bg-white text-gray-300 border-[3px] border-neutral-300 group-hover:border-sky-500 group-hover:text-sky-500'
                                    }`}>
                                        <IconMapPin size={24} stroke={3} />
                                    </div>
                                </div>
                                <span className={`text-[13px] font-semibold mt-2 text-center leading-tight transition-colors ${
                                    activeSection === 'tanggal-lokasi' ? 'text-sky-500' : 'text-gray-400'
                                }`}>Tanggal &<br/>Lokasi</span>
                            </a>
                        </div>
                    </div>

                    {/* =========================================
                        3. SECTION: TIKET 
                    ========================================== */}
                    <div id="tiket" className="flex flex-col xl:flex-row gap-8 w-full mb-4 relative z-10 scroll-mt-24">
                        
                        <div className="flex-1 bg-white p-4 rounded-[24px] border border-neutral-300">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Tiket</h2>
                            
                            {data.ticket_types.map((ticket, index) => (
                                <div key={index} className="border border-neutral-300 rounded-2xl p-4 md:p-6 mb-6 relative">
                                    {index > 0 && (
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeTicket(index)} className="absolute top-4 right-4 rounded-xl h-10 w-10 hover:text-red-500 hover:bg-red-50">
                                            <IconTrash size={16} />
                                        </Button>
                                    )}
                                    <div className="mb-4 pr-10">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Tiket</label>
                                        <Input className={inputClass} type="text" value={ticket.type_name} onChange={e => updateTicket(index, 'type_name', e.target.value)} required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Tiket</label>
                                        <Textarea className={textareaClass} rows={2} value={ticket.description} onChange={e => updateTicket(index, 'description', e.target.value)} placeholder="Deskripsi tiket" />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Fitur & Benefit </label>
                                        <Textarea className={textareaClass} rows={2} value={ticket.features} onChange={e => updateTicket(index, 'features', e.target.value)} placeholder="Contoh: VIP Lounge - E-Certificate - Free Drinks" />
                                        <span className="text-[10px] text-gray-400 inline-block mt-1">Pisahkan dengan tanda strip (-)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Harga Tiket (Rp)</label>
                                            <Input className={inputClass} type="number" value={ticket.price} onChange={e => updateTicket(index, 'price', e.target.value)} required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah Tiket (Kuota)</label>
                                            <Input className={inputClass} type="number" value={ticket.available_stock} onChange={e => updateTicket(index, 'available_stock', e.target.value)} required />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-center">
                                <Button type="button" onClick={addTicket} className="rounded-full bg-sky-500 hover:bg-[#0284c7] text-white font-semibold">
                                    <IconPlus size={16} className="mr-2" /> Tambah Tiket
                                </Button>
                            </div>
                        </div>

                        {/* KANAN: Ikon Scrollspy */}
                        <div className="hidden xl:flex w-32 shrink-0 flex-col items-center pt-8 border-x border-neutral-300">
                            <a href="#tiket" className="flex flex-col items-center group w-full transition-all bg-white py-2">
                                <div className="bg-white p-[6px] rounded-2xl">
                                    <div className={`w-14 h-14 rounded-[16px] flex items-center justify-center transition-all duration-300 ${
                                        activeSection === 'tiket' 
                                            ? 'bg-sky-100 text-sky-500 scale-110 ' 
                                            : 'bg-white text-gray-300 border-[3px] border-neutral-300 group-hover:border-sky-500 group-hover:text-sky-500'
                                    }`}>
                                        <IconTicket size={24} stroke={3} />
                                    </div>
                                </div>
                                <span className={`text-sm font-medium mt-2 text-center transition-colors ${
                                    activeSection === 'tiket' ? 'text-sky-500' : 'text-gray-400'
                                }`}>Tiket</span>
                            </a>
                        </div>
                    </div>

                    {/* =========================================
                        4. TOMBOL ACTION 
                    ========================================== */}
                    <div className="flex flex-col xl:flex-row gap-8 w-full mt-6 relative z-10 ">
                        <div className="flex-1 flex gap-[10px] p-4 max-h-72 border border-neutral-300 bg-white rounded-[24px]">
                            {/* 🔥 Route Batal Tetap Superadmin 🔥 */}
                            <Button type="button" asChild className="flex-1 py-2 rounded-xl border-gray-300 text-white !h-12 font-semibold text-sm bg-red-500 hover:bg-red-700">
                                <Link href={route('superadmin.events')}>Batal</Link>
                            </Button>
                            <Button type="submit" disabled={processing} className="flex-1 py-2 rounded-xl bg-sky-500 hover:bg-sky-700 text-white font-semibold !h-12 text-sm">
                                {processing ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Event'}
                            </Button>
                        </div>
                        {/* KANAN: Garis Biru Penutup */}
                        <div className="hidden xl:flex w-32 shrink-0 justify-center relative -mt-10 border-x border-neutral-300 border-b rounded-b-2xl">
                            <div className="absolute -top-6 bottom-0 w-[4px] bg-sky-500 rounded-b-full bottom-2"></div>
                        </div>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
}
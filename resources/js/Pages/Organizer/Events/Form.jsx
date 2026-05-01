import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { IconUpload, IconPlus, IconTrash, IconMapPin, IconTicket, IconEdit } from '@tabler/icons-react';

export default function Form({ event }) {
    const isEdit = !!event;

    // --- Inisialisasi State Preview Banner ---
    const [preview16x9, setPreview16x9] = useState(event?.banners?.['16x9'] || null);
    const [preview1x1, setPreview1x1] = useState(event?.banners?.['1x1'] || null);

    // --- Inisialisasi State Preview Gallery (4 Slot) ---
    // Mengisi array dengan 4 slot, jika mode Edit isi dengan foto lama, jika tidak isi null
    const [previewGalleries, setPreviewGalleries] = useState(
        Array(4).fill(null).map((_, i) => event?.galleries?.[i] || null)
    );

    // --- Inisialisasi State Form ---
    const { data, setData, post, processing, errors, transform } = useForm({
        name: event?.name || '',
        category_name: event?.category_name || 'Hiburan & Festival',
        description: event?.description || '',
        terms_conditions: event?.terms_string || '',
        venue: event?.location?.venue || '',
        address: event?.location?.address || '',
        map_link: event?.location?.map_link || '',
        schedules: event?.schedules || [{ date: '', time_start: '', time_end: '' }],
        ticket_types: event?.ticket_types || [{ type_name: '', description: '', features: '', price: '', available_stock: '' }],
        banner_16x9: null,
        banner_1x1: null,
        galleries: [] // Array untuk menampung file gallery
    });

    // --- Handler Khusus Upload & Preview Banners ---
    const handleBannerChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setData(field, file);
            const previewUrl = URL.createObjectURL(file);
            if (field === 'banner_16x9') setPreview16x9(previewUrl);
            if (field === 'banner_1x1') setPreview1x1(previewUrl);
        }
    };

    // --- Handler Khusus Upload & Preview Galleries ---
    const handleGalleryChange = (e, index) => {
        const file = e.target.files[0];
        if (file) {
            // 1. Simpan file asli ke dalam array data.galleries pada index yang sesuai
            const newGalleries = [...data.galleries];
            newGalleries[index] = file;
            setData('galleries', newGalleries);

            // 2. Buat URL Blob sementara untuk preview UI
            const newPreviews = [...previewGalleries];
            newPreviews[index] = URL.createObjectURL(file);
            setPreviewGalleries(newPreviews);
        }
    };

    // --- Helpers untuk Dynamic Form (Jadwal & Tiket) ---
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

    // --- Submit Handler ---
    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Transform data sebelum dikirim
        transform((currentData) => {
            const payload = { ...currentData };
            
            // Tambahkan method spoofing jika Edit Mode
            if (isEdit) payload._method = 'put';
            
            // Bersihkan array galleries dari slot yang kosong (null/undefined)
            // agar Laravel hanya menerima file yang benar-benar ada
            payload.galleries = currentData.galleries.filter(file => file);
            
            return payload;
        });

        // Selalu gunakan post() karena kita mengirim file (FormData)
        post(isEdit ? route('organizer.events.update', event.id) : route('organizer.events.store'), {
            forceFormData: true,
        });
    };

    return (
        <DashboardLayout>
            <Head title={isEdit ? "Edit Event" : "Tambah Event"} />

            <div className="flex flex-col xl:flex-row gap-8 relative items-start">
                
                {/* BAGIAN KIRI: Form Utama */}
                <div className="flex-1 w-full max-w-4xl space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* SECTION: BANNERS & GALLERY */}
                        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm" id="form-utama">
                            
                            {/* --- AREA BANNER UTAMA --- */}
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Banner Event</h2>
                            <div className="flex flex-col md:flex-row gap-6">
                                {/* Banner 16:9 */}
                                <label className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden min-h-[200px] group bg-gray-50 hover:bg-gray-100">
                                    <input type="file" className="hidden" onChange={e => handleBannerChange(e, 'banner_16x9')} accept="image/*" />
                                    
                                    {preview16x9 ? (
                                        <>
                                            <img src={preview16x9} alt="Preview 16:9" className="absolute inset-0 w-full h-full object-cover z-0" />
                                            <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-white font-bold flex items-center gap-2"><IconEdit size={20}/> Ganti Foto 16:9</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-8 text-center flex flex-col items-center z-10">
                                            <IconUpload className="text-blue-500 mb-2" size={32} />
                                            <span className="text-sm font-bold text-gray-700">Klik untuk upload banner</span>
                                            <span className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP • Maks. 20MB • Rasio 16:9</span>
                                        </div>
                                    )}
                                </label>

                                {/* Banner 1:1 */}
                                <label className="w-full md:w-[250px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition relative overflow-hidden aspect-square group bg-gray-50 hover:bg-gray-100">
                                    <input type="file" className="hidden" onChange={e => handleBannerChange(e, 'banner_1x1')} accept="image/*" />
                                    
                                    {preview1x1 ? (
                                        <>
                                            <img src={preview1x1} alt="Preview 1:1" className="absolute inset-0 w-full h-full object-cover z-0" />
                                            <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm text-center px-4">
                                                <span className="text-white font-bold flex flex-col items-center gap-1"><IconEdit size={20}/> Ganti Foto 1:1</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="p-6 text-center flex flex-col items-center z-10">
                                            <IconUpload className="text-blue-500 mb-2" size={32} />
                                            <span className="text-sm font-bold text-gray-700">Klik upload</span>
                                            <span className="text-xs text-gray-400 mt-1">Rasio 1:1</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* --- AREA GALLERY --- */}
                            <h3 className="text-lg font-bold text-gray-900 mt-10 mb-4">Gallery</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[0, 1, 2, 3].map((index) => (
                                    <label 
                                        key={index} 
                                        className="w-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-3 cursor-pointer transition relative overflow-hidden aspect-square group bg-white hover:bg-gray-50"
                                    >
                                        <input type="file" className="hidden" onChange={e => handleGalleryChange(e, index)} accept="image/*" />
                                        
                                        {previewGalleries[index] ? (
                                            <>
                                                <img src={previewGalleries[index]} alt={`Gallery ${index + 1}`} className="absolute inset-0 w-full h-full object-cover z-0" />
                                                <div className="absolute inset-0 bg-black/50 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm text-center">
                                                    <span className="text-white font-bold flex flex-col items-center gap-1 text-xs"><IconEdit size={16}/> Ganti</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center flex flex-col items-center z-10 w-full">
                                                {/* Icon Upload bergaya Kotak Biru */}
                                                <div className="w-12 h-12 bg-[#e0f2fe] text-blue-500 rounded-[14px] flex items-center justify-center mb-3">
                                                    <IconUpload size={22} stroke={2} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-900 leading-tight">Klik upload gallery</span>
                                                <span className="text-[9px] text-gray-400 mt-1 leading-tight px-1">PNG, JPG, WEBP • Maks. 15MB • Rasio 1:1</span>
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* SECTION: INFORMASI EVENT */}
                        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Informasi Event</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nama Event</label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Kategori</label>
                                    <select value={data.category_name} onChange={e => setData('category_name', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                                        <option value="Hiburan & Festival">Hiburan & Festival</option>
                                        <option value="Workshop & Seminar">Workshop & Seminar</option>
                                        <option value="Olahraga">Olahraga</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tentang Event</label>
                                <textarea rows="4" value={data.description} onChange={e => setData('description', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500" required></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Ketentuan</label>
                                <textarea rows="4" value={data.terms_conditions} onChange={e => setData('terms_conditions', e.target.value)} placeholder="Gunakan enter/baris baru untuk setiap poin" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500"></textarea>
                            </div>
                        </div>

                        {/* SECTION: TANGGAL & LOKASI */}
                        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm" id="tanggal-lokasi">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Tanggal & Lokasi</h2>
                            
                            {/* Dynamic Schedules */}
                            {data.schedules.map((schedule, index) => (
                                <div key={index} className="flex flex-col md:flex-row gap-4 mb-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Tanggal Event</label>
                                        <input type="date" value={schedule.date} onChange={e => updateSchedule(index, 'date', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Jam Mulai</label>
                                        <input type="time" value={schedule.time_start} onChange={e => updateSchedule(index, 'time_start', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-bold text-gray-700 mb-2">Jam Berakhir</label>
                                        <input type="time" value={schedule.time_end} onChange={e => updateSchedule(index, 'time_end', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                                    </div>
                                    {index > 0 && (
                                        <button type="button" onClick={() => removeSchedule(index)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100">
                                            <IconTrash size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            
                            <div className="flex justify-center mb-8 border-b border-gray-100 pb-8">
                                <button type="button" onClick={addSchedule} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-blue-600">
                                    <IconPlus size={16} /> Tambah Jadwal
                                </button>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Venue</label>
                                <input type="text" value={data.venue} onChange={e => setData('venue', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Lokasi </label>
                                <input type="text" value={data.address} onChange={e => setData('address', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Lokasi Maps</label>
                                <textarea value={data.map_link} onChange={e => setData('map_link', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                            </div>
                        </div>

                        {/* SECTION: TIKET */}
                        <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm" id="tiket">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Tiket</h2>
                            
                            {data.ticket_types.map((ticket, index) => (
                                <div key={index} className="border border-gray-200 rounded-2xl p-6 mb-6 relative">
                                    {index > 0 && (
                                        <button type="button" onClick={() => removeTicket(index)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg">
                                            <IconTrash size={18} />
                                        </button>
                                    )}
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nama Tiket</label>
                                        <input type="text" value={ticket.type_name} onChange={e => updateTicket(index, 'type_name', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Fitur & Benefit</label>
                                        <textarea rows="2" value={ticket.features} onChange={e => updateTicket(index, 'features', e.target.value)} placeholder="Contoh: VIP Lounge - E-Certificate - Free Drinks" className="w-full p-3 border border-gray-200 rounded-xl text-sm"></textarea>
                                        <span className="text-[10px] text-gray-400">Pisahkan dengan tanda strip (-)</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Harga Tiket</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rp</span>
                                                <input type="number" value={ticket.price} onChange={e => updateTicket(index, 'price', e.target.value)} className="w-full pl-12 pr-3 py-3 border border-gray-200 rounded-xl" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Jumlah Tiket (Kuota)</label>
                                            <input type="number" value={ticket.available_stock} onChange={e => updateTicket(index, 'available_stock', e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl" required />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-center">
                                <button type="button" onClick={addTicket} className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm hover:bg-blue-600">
                                    <IconPlus size={16} /> Tambah Tiket
                                </button>
                            </div>
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-4 pt-4">
                            <Link href={route('organizer.events.index')} className="flex-1 text-center py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition">
                                Kembali
                            </Link>
                            <button type="submit" disabled={processing} className="flex-1 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold transition disabled:opacity-50">
                                {processing ? 'Menyimpan...' : isEdit ? 'Update Event' : 'Buat Event'}
                            </button>
                        </div>

                    </form>
                </div>

                {/* BAGIAN KANAN: Stepper / Scrollspy Navbar */}
                <div className="hidden xl:block w-32 shrink-0 sticky top-28">
                    <div className="flex flex-col items-center relative">
                        <div className="absolute w-[2px] bg-blue-500 h-full left-1/2 -translate-x-1/2 z-0"></div>
                        <div className="relative z-10 flex flex-col items-center gap-32">
                            <a href="#form-utama" className="flex flex-col items-center group">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition">
                                    <IconUpload size={20} />
                                </div>
                                <span className="text-xs font-bold text-blue-500 mt-2 bg-slate-50 px-2">Form Utama</span>
                            </a>
                            <a href="#tanggal-lokasi" className="flex flex-col items-center group">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition">
                                    <IconMapPin size={20} />
                                </div>
                                <span className="text-xs font-bold text-blue-500 mt-2 bg-slate-50 px-2 text-center">Tanggal & Lokasi</span>
                            </a>
                            <a href="#tiket" className="flex flex-col items-center group">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition">
                                    <IconTicket size={20} />
                                </div>
                                <span className="text-xs font-bold text-blue-500 mt-2 bg-slate-50 px-2">Tiket</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
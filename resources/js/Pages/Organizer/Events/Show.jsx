import React from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    IconChevronRight, 
    IconClock, 
    IconMapPin, 
    IconCheck, 
    IconCurrencyDollar, 
    IconClockHour4, 
    IconSquareRoundedCheck
} from '@tabler/icons-react';

const formatRupiah = (number) => {
    if (number === 0) return 'Free';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

export default function Show({ event }) {
    const customHeader = (
        <div className="flex items-center justify-center text-lg font-bold">
            <Link href={route('organizer.events.index')} className="text-gray-900 hover:text-blue-500 transition-colors">
                Events
            </Link>
            <IconChevronRight size={20} className="mx-2 text-gray-400" />
            <span className="text-blue-500">Events Detail</span>
        </div>
    );

    return (
        <DashboardLayout header={customHeader}>
            <Head title={`Detail - ${event.name}`} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                
                {/* ================= BAGIAN KIRI (Info Utama) ================= */}
                <div className="xl:col-span-2 space-y-8">
                    
                    {/* Banner & Title Card */}
                    <div className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-sm">
                        {/* Banner Image */}
                        <div className="relative h-64 sm:h-80 w-full bg-gray-100">
                            <img 
                                src={event.banners?.['16x9'] || 'https://via.placeholder.com/800x450'} 
                                alt="Event Banner" 
                                className="w-full h-full object-cover"
                            />
                            {/* Badges */}
                            <div className="absolute top-4 left-4">
                                <span className="px-4 py-1.5 bg-white text-blue-500 text-xs font-bold rounded-full border border-blue-400">
                                    {event.category_name}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="flex items-center gap-2 px-4 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-full border border-gray-200">
                                    <span className={`w-2.5 h-2.5 rounded-full ${event.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div className="p-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-6">{event.name}</h1>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <IconClock size={20} className="text-blue-500" />
                                        <span>{event.schedule_format}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium text-gray-700">
                                        <IconMapPin size={20} className="text-blue-500" />
                                        <span>{event.location?.venue}</span>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs text-gray-500 font-medium mb-1">Mulai dari</p>
                                    <p className="text-2xl font-black text-gray-900">{formatRupiah(event.lowest_price)}</p>
                                </div>
                            </div>

                            <hr className="my-8 border-gray-100" />

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Tentang Event</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ketentuan Card */}
                    <div className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Ketentuan</h2>
                        {event.terms_conditions && event.terms_conditions.length > 0 ? (
                            <ol className="list-decimal list-outside ml-4 space-y-2 text-sm text-gray-600">
                                {event.terms_conditions.map((term, index) => (
                                    <li key={index} className="pl-2">{term}</li>
                                ))}
                            </ol>
                        ) : (
                            <p className="text-sm text-gray-400">Tidak ada ketentuan khusus.</p>
                        )}
                    </div>
                </div>

                {/* ================= BAGIAN KANAN (Widget) ================= */}
                <div className="space-y-8">
                    
                    {/* Widget Tiket Terjual & Keuangan */}
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tiket Terjual</h3>
                        
                        {/* Progress */}
                        <div className="mb-6">
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                <div 
                                    className="bg-blue-500 h-3 rounded-full" 
                                    style={{ width: `${event.stats.sold_percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900">{new Intl.NumberFormat('id-ID').format(event.stats.tickets_sold)}</span>
                                <span className="text-sm text-gray-600">dari {new Intl.NumberFormat('id-ID').format(event.stats.total_quota)} tiket</span>
                            </div>
                        </div>

                        {/* Income Cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-blue-500 flex items-center justify-center shrink-0">
                                    <IconCurrencyDollar size={24} stroke={2} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Dibayar</p>
                                    <p className="text-sm font-bold text-blue-500">{new Intl.NumberFormat('id-ID').format(event.stats.revenue_paid)}</p>
                                </div>
                            </div>
                            <div className="border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 text-blue-300 flex items-center justify-center shrink-0">
                                    <IconClockHour4 size={24} stroke={2} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">Belum Dibayar</p>
                                    <p className="text-sm font-bold text-blue-400">{new Intl.NumberFormat('id-ID').format(event.stats.revenue_unpaid)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Widget Tipe Tiket */}
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tipe Tiket</h3>
                        <div className="space-y-4">
                            {event.ticket_types.map((ticket, index) => (
                                <div 
                                    key={index} 
                                    className={`p-5 rounded-2xl border bg-sky-100 border-sky-500`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-lg font-bold text-gray-900">{ticket.type_name}</h4>
                                        <span className="text-lg font-bold text-blue-500">{formatRupiah(ticket.price)}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {ticket.features && ticket.features.map((feature, fIndex) => (
                                            <div key={fIndex} className="flex items-center gap-1.5 text-[10px] font-medium text-sky-500">
                                                <IconSquareRoundedCheck size={16} className="text-sky-500" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Widget Lokasi (Map Placeholder) */}
                    <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Lokasi</h3>
                        <iframe 
                            src={event.location.map_link} 
                            className="w-full h-48 border border-gray-100 rounded-2xl"
                            title="Event Location"
                        ></iframe>
                            {/* Jika Anda punya Google Maps iframe, bisa dimasukkan di sini */}
                            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl text-xs font-bold text-gray-500 shadow-sm border border-gray-100">
                                Area Maps
                            </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
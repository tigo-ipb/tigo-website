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
    console.log( event.status);
    const customHeader = (
        <div className="flex items-center justify-center text-lg md:text-xl font-semibold">
            <Link href={route('organizer.events.index')} className="text-gray-900 hover:text-blue-500 transition-colors">
                Events
            </Link>
            <IconChevronRight size={20} className="mx-2 text-gray-400" />
            <span className="text-blue-500">Event Detail</span>
        </div>
    );

    return (
        <DashboardLayout header={customHeader}>
            <Head title={`Detail - ${event.name}`} />

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
                
                {/* ================= BAGIAN KIRI (Info Utama) ================= */}
                <div className="xl:col-span-3 space-y-8">
                    
                    {/* Banner & Title Card */}
                    <div className="bg-white rounded-[24px] border border-neutral-300 overflow-hidden shadow-sm">
                        {/* Banner Image */}
                        <div className="relative h-64 sm:h-80 w-full bg-gray-100">
                            <img 
                                src={event.banners?.['16x9'] || 'https://via.placeholder.com/800x450'} 
                                alt="Event Banner" 
                                className="w-full h-full object-cover"
                            />
                            {/* Badges */}
                            <div className="absolute top-4 left-4">
                                <span className="px-4 py-1.5 bg-white text-blue-500 text-xs font-semibold rounded-lg border border-blue-400">
                                    {event.category_name}
                                </span>
                            </div>
                            <div className="absolute top-4 right-4">
                                <span className="flex items-center gap-2 px-4 py-1.5 bg-white text-gray-700 text-xs font-semibold rounded-lg border border-gray-200">
                                    <p className={`w-2.5 h-2.5 rounded-full capitalize ${event.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></p>
                                    {event.status}
                                </span>
                            </div>
                        </div>

                        {/* Title & Info */}
                        <div className="p-4">
                            <h1 className="text-2xl font-medium text-gray-900 mb-2">{event.name}</h1>
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-3 text-xs font-medium text-black">
                                        <IconClock size={20} className="text-blue-500" />
                                        <span>{event.schedule_format}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-medium text-black">
                                        <IconMapPin size={20} className="text-blue-500" />
                                        <span>{event.location?.venue}</span>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs text-black font-medium">Mulai dari</p>
                                    <p className="text-sm font-medium text-black">{formatRupiah(event.lowest_price)}</p>
                                </div>
                            </div>

                            <hr className="my-6 border-solid border-neutral-300" />

                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900 mb-2">Tentang Event</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-justify">
                                        {event.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Ketentuan Card */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm">
                        <h2 className="text-xl font-medium text-black mb-4">Ketentuan</h2>
                        {event.terms_conditions && event.terms_conditions.length > 0 ? (
                            <ol className="list-decimal list-outside ml-4 space-y-2 text-sm text-black">
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
                <div className="xl:col-span-2 space-y-6">
                    
                    {/* Widget Tiket Terjual & Keuangan */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm">
                        <h3 className="text-xl font-medium text-black mb-4">Tiket Terjual</h3>
                        {/* Progress */}
                        <div className="">
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                                <div 
                                    className="bg-sky-500 h-3 rounded-full" 
                                    style={{ width: `${event.stats.sold_percentage}%` }}
                                ></div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-gray-900">{new Intl.NumberFormat('id-ID').format(event.stats.tickets_sold)}</span>
                                <span className="text-xs text-neutral-950">dari {new Intl.NumberFormat('id-ID').format(event.stats.total_quota)} tiket</span>
                            </div>
                        </div>
                        {/* Income Cards */}
                    </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="border border-neutral-300 rounded-3xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                                    <IconCurrencyDollar size={24} stroke={2} />
                                </div>
                                <div>
                                    <p className="text-xs text-black">Dibayar</p>
                                    <p className="text-2xl font-semibold text-sky-500">{new Intl.NumberFormat('id-ID').format(event.stats.revenue_paid)}</p>
                                </div>
                            </div>
                            <div className="border border-neutral-300 rounded-3xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                                    <IconClockHour4 size={24} stroke={2} />
                                </div>
                                <div>
                                    <p className="text-xs text-black">Belum Dibayar</p>
                                    <p className="text-2xl font-semibold text-sky-500">{new Intl.NumberFormat('id-ID').format(event.stats.revenue_unpaid)}</p>
                                </div>
                            </div>
                        </div>

                    {/* Widget Tipe Tiket */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm">
                        <h3 className="text-xl font-medium text-black mb-4">Tipe Tiket</h3>
                        <div className="space-y-4">
                            {event.ticket_types.map((ticket, index) => (
                                <div 
                                    key={index} 
                                    className={`p-2 rounded-2xl border bg-sky-100 border-sky-500 flex justify-between items-center min-h-[60px]`}
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <h4 className="text-xl font-medium text-black">{ticket.type_name}</h4>
                                    {ticket.features != null && (
                                        <div className="flex flex-wrap gap-x-4 gap-y-2">
                                        {ticket.features && ticket.features.map((feature, fIndex) => (
                                            <div key={fIndex} className="flex items-center gap-1.5 text-[10px] font-medium text-sky-500">
                                                <IconSquareRoundedCheck size={16} className="text-sky-500" />
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                    )}
                                    </div>
                                    <p className="text-lg font-bold text-sky-500">{formatRupiah(ticket.price)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Widget Lokasi (Map Placeholder) */}
                    <div className="bg-white p-4 rounded-[24px] border border-neutral-300 shadow-sm">
                        <h3 className="text-xl font-medium text-black mb-4">Lokasi</h3>
                        <iframe 
                            src={event.location.map_link} 
                            className="w-full h-48 border border-neutral-300 rounded-2xl"
                            title="Event Location"
                        ></iframe>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
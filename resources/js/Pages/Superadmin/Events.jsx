import React, { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout'; 
import { Head, router, Link } from '@inertiajs/react';
import { 
    IconCalendarEvent, IconCalendarCheck, IconCalendarTime, 
    IconSearch, IconEdit, IconTrash
} from '@tabler/icons-react';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/Components/ui/select";

export default function Events({ stats, events, filters }) {
    
    const [search, setSearch] = useState(filters?.search || '');
    const [statusTab, setStatusTab] = useState(filters?.status || 'Semua');
    const [sort, setSort] = useState(filters?.sort || 'terbaru');

    const updateFilter = (key, value) => {
        router.get(route('superadmin.events'), {
            ...filters, [key]: value
        }, { preserveState: true, preserveScroll: true });
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter') updateFilter('search', search);
    };

    const handleTabChange = (tab) => {
        setStatusTab(tab);
        updateFilter('status', tab);
    };
    console.log(events);
    

    return (
        <DashboardLayout header="Events">
            <Head title="Events" />

            <div className="space-y-6">
                
                {/* 1. STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconCalendarEvent size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Total Event</p>
                            <h3 className="text-2xl font-black text-sky-500">{stats.total.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconCalendarCheck size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Active Event</p>
                            <h3 className="text-2xl font-black text-sky-500">{stats.active.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm">
                        <div className="p-4 rounded-xl bg-sky-50 text-sky-500"><IconCalendarTime size={24} stroke={2} /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-800 mb-0.5">Archived Event</p>
                            <h3 className="text-2xl font-black text-sky-500">{stats.archived.toLocaleString('id-ID')}</h3>
                        </div>
                    </div>
                </div>

                {/* 2. TABEL EVENTS */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 flex flex-col xl:flex-row justify-between items-center gap-4 border-b border-gray-100">
                        
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                            <h4 className="font-bold text-lg text-gray-900 mr-4">Events</h4>
                            {/* Filter Tabs */}
                            <div className="flex bg-gray-50 rounded-full p-1 border border-gray-100 w-full md:w-auto overflow-x-auto">
                                {['Semua', 'Active', 'Draft', 'Archive'].map((tab) => (
                                    <button 
                                        key={tab} onClick={() => handleTabChange(tab)}
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                                            statusTab === tab ? 'bg-sky-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
                            <div className="relative w-full md:w-64">
                                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="text" placeholder="Cari nama, event, atau yang lain" 
                                    value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleSearch}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-full text-xs focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                />
                            </div>
                            <Select value={sort} onValueChange={(val) => { setSort(val); updateFilter('sort', val); }}>
                                <SelectTrigger className="bg-sky-500 text-white text-xs font-bold px-4 py-2 h-auto rounded-full border-0 focus:ring-0 shadow-none w-full md:w-32">
                                    <SelectValue placeholder="Urutkan" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-xl border border-gray-100 shadow-xl z-[100] p-1.5">
                                    <SelectItem value="terbaru" className="font-medium text-xs text-gray-700 focus:bg-sky-50 cursor-pointer">Terbaru</SelectItem>
                                    <SelectItem value="terlama" className="font-medium text-xs text-gray-700 focus:bg-sky-50 cursor-pointer">Terlama</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Event ID</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Event</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Penyelenggara</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Waktu</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Alamat</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold text-sky-500 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.data.map((event, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 uppercase">EV-{event.id.substring(0,4)}</td>
                                        <td className="py-4 px-6">
                                            <p className="text-sm font-bold text-gray-900">{event.name}</p>
                                            <p className="text-xs text-gray-500">{event.category_name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-900">{event.organizer_name}</td>
                                        <td className="py-4 px-6 text-xs font-medium text-gray-800">
                                            {event.start_date} <br/> <span className="text-gray-400">{event.start_time}</span>
                                            <span className="mx-2 text-gray-300">-</span>
                                            {event.end_date} <br/> <span className="text-gray-400">{event.end_time}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-medium text-gray-900 max-w-[200px]">
                                            <p className="truncate">{event.venue}</p>
                                            <p className="text-xs text-gray-400 truncate">{event.address}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            {event.status === 'active' ? (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-green-300 text-green-500 bg-green-50">Active</span>
                                            ) : event.status === 'draft' ? (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-yellow-400 text-yellow-600 bg-yellow-50">Draft</span>
                                            ) : (
                                                <span className="px-3 py-1.5 rounded-md text-[10px] font-bold border border-gray-300 text-gray-500 bg-gray-50">Archive</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 flex justify-center gap-2">
                                            <Link href={route('superadmin.events.edit', event.id)} className="p-1.5 bg-sky-50 text-sky-500 rounded-md hover:bg-sky-100"><IconEdit size={16}/></Link>
                                            <button className="p-1.5 bg-red-50 text-red-500 rounded-md hover:bg-red-100"><IconTrash size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                                {events.data.length === 0 && (
                                    <tr><td colSpan="7" className="py-8 text-center text-gray-400 text-sm">Tidak ada data event.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Custom */}
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 border-t border-gray-100 gap-4">
                        <span className="text-sm text-gray-900 font-medium">
                            Menampilkan <span className="mx-1">{events.from || 0}</span> dari <span className="mx-1">{events.total ? events.total.toLocaleString('id-ID') : 0}</span>
                        </span>
                        <div className="flex gap-1">
                            {events.links.map((link, key) => (
                                link.url ? (
                                    <Link 
                                        key={key} href={link.url} preserveState preserveScroll
                                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border transition-colors ${
                                            link.active 
                                                ? 'border-[#0ea5e9] bg-white text-[#0ea5e9]' 
                                                : 'border-transparent bg-sky-50 text-sky-500 hover:bg-sky-100' 
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label.replace('&laquo; Previous', '<').replace('Next &raquo;', '>') }}
                                    />
                                ) : (
                                    <span 
                                        key={key}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border border-transparent bg-sky-50 text-sky-200 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label.replace('&laquo; Previous', '<').replace('Next &raquo;', '>') }}
                                    ></span>
                                )
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}
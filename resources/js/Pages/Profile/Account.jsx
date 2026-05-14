import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconChevronRight, IconCalendar } from '@tabler/icons-react';
import GuestLayout from '@/Layouts/GuestLayout';

// Import komponen shadcn/ui
import { Button } from "@/Components/ui/button";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function Account({ user }) {
    // State untuk kode negara dan kalender
    const [countryCodes, setCountryCodes] = useState([]);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Format tanggal untuk input bawaan jika dibutuhkan
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    const { data, setData, patch, processing, errors } = useForm({
        username: user.username || '',
        birth_date: formatDate(user.birth_date),
        phone_code: user.phone_code || '+62',
        phone_number: user.phone_number || '',
        email: user.email || '',
    });

    // Fetch data kode negara dari API (sama persis dengan SetupAccount)
    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=name,idd,cca2,flags')
            .then(res => res.json())
            .then(apiData => {
                const formatted = apiData
                    .filter(c => c.idd && c.idd.root)
                    .map(c => {
                        const suffix = c.idd.suffixes ? c.idd.suffixes[0] : '';
                        const code = `${c.idd.root}${suffix}`;
                        return {
                            code: code,
                            label: `${c.name.common} (${code})`,
                            cca2: c.cca2,
                            flag: c.flags.svg
                        };
                    })
                    .filter((value, index, self) =>
                        index === self.findIndex((t) => (t.code === value.code))
                    )
                    .sort((a, b) => a.label.localeCompare(b.label));

                setCountryCodes(formatted);
            })
            .catch(err => console.error("Gagal mengambil data kode negara:", err));
    }, []);

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.account.update'));
    };

    return (
        <GuestLayout>
            <div className="min-h-[calc(100vh-80px)] bg-white font-sans pb-12">
                <Head title="Pengaturan Akun - Tigo" />

                <main className="max-w-3xl mx-auto px-4 pt-8">
                    
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm mb-6">
                        <Link href="/" className="text-gray-800 hover:text-sky-500">Dashboard</Link>
                        <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <Link href={route('profile.index')} className="text-gray-800 hover:text-sky-500">Profile</Link>
                        <IconChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <span className="text-sky-500 font-medium">Akun</span>
                    </div>

                    <h1 className="text-3xl font-medium text-gray-900 mb-6">Akun</h1>

                    {/* Form Akun */}
                    <form onSubmit={submit}>
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 mb-6 space-y-6">
                            
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">Informasi akun untuk:</p>
                                <h2 className="text-xl font-bold text-gray-900">{user.username || user.name}</h2>
                            </div>

                            {/* Input Username */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Username</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                />
                                {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
                            </div>

                            {/* 🔥 KALENDER SHADCN (Sama seperti SetupAccount) 🔥 */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Tanggal lahir</label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`w-full h-[46px] justify-start text-left font-normal rounded-2xl border-gray-200 focus:ring-2 focus:ring-sky-100 focus:border-sky-400 transition-all hover:bg-white ${!data.birth_date ? "text-gray-400" : "text-gray-900"}`}
                                        >
                                            <IconCalendar className="mr-2 h-4 w-4 text-gray-500" stroke={1.5} />
                                            {data.birth_date ? (
                                                format(new Date(data.birth_date), "d MMMM yyyy", { locale: idLocale })
                                            ) : (
                                                <span>Pilih tanggal lahir</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[280px] p-3 bg-white border border-gray-200 rounded-xl shadow-lg" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={data.birth_date ? new Date(data.birth_date) : undefined}
                                            onSelect={(date) => {
                                                setData('birth_date', date ? format(date, "yyyy-MM-dd") : '');
                                                setIsCalendarOpen(false);
                                            }}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                            captionLayout='dropdown'
                                            className="w-full"
                                        />
                                    </PopoverContent>
                                </Popover>
                                {errors.birth_date && <p className="mt-1.5 text-xs text-red-500">{errors.birth_date}</p>}
                            </div>

                            {/* Input Kode & Nomor HP */}
                            <div className="flex gap-4">
                                {/* 🔥 SELECT SHADCN DENGAN BENDERA (Sama seperti SetupAccount) 🔥 */}
                                <div className="w-[140px]">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Kode</label>
                                    <Select value={data.phone_code} onValueChange={(value) => setData('phone_code', value)}>
                                        <SelectTrigger className="w-full h-[46px] border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-sky-100 focus:border-sky-400 bg-white">
                                            <SelectValue placeholder="Pilih" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-[300px] border-gray-200 rounded-xl">
                                            {countryCodes.length > 0 ? (
                                                countryCodes.map((country) => (
                                                    <SelectItem key={`code-${country.code}`} value={country.code} className="cursor-pointer hover:bg-sky-50">
                                                        <div className="flex items-center gap-2">
                                                            <img src={country.flag} alt={country.cca2} className="w-4 h-3 object-cover rounded-[2px]" />
                                                            <span className="truncate max-w-[70px]">{country.cca2} ({country.code})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-sm text-gray-500 text-center">Memuat...</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.phone_code && <p className="mt-1.5 text-xs text-red-500">{errors.phone_code}</p>}
                                </div>

                                {/* Nomor Handphone */}
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-900 mb-2">Nomor Handphone</label>
                                    <input
                                        type="text"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value.replace(/\D/g, ''))}
                                        className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                        placeholder="81234567890"
                                    />
                                    {errors.phone_number && <p className="mt-1.5 text-xs text-red-500">{errors.phone_number}</p>}
                                </div>
                            </div>

                            {/* Input Email */}
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400"
                                />
                                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>}
                            </div>

                        </div>

                        {/* Tombol Simpan */}
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-4 bg-[#0099ff] hover:bg-sky-500 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </form>

                </main>
            </div>
        </GuestLayout>
    );
}
import Footer from '@/Components/Footer';
import { Head, useForm } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { IconCalendar } from '@tabler/icons-react';
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

export default function SetupAccount({ user }) {
    const fileInputRef = useRef(null);
    const [countryCodes, setCountryCodes] = useState([]);
    
    // State baru untuk mengontrol Popover Kalender agar bisa ditutup otomatis
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        profile_photo: null,
        username: user?.username || '',
        name: user?.name || '',
        birth_date: '',
        phone_code: '+62',
        phone_number: '',
    });

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
                    // PERBAIKAN: Hapus duplikat berdasarkan "code", bukan label. 
                    // Jadi +1 atau +500 hanya akan muncul SATU KALI di dropdown.
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
        post(route('setup.account'));
    };

    const renderAvatarPreview = () => {
        if (data.profile_photo) {
            return (
                <img 
                    src={URL.createObjectURL(data.profile_photo)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                />
            );
        }
        
        return (
            <div 
                className="w-full h-full opacity-20"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1), repeating-linear-gradient(45deg, #cbd5e1 25%, #f8fafc 25%, #f8fafc 75%, #cbd5e1 75%, #cbd5e1)',
                    backgroundPosition: '0 0, 10px 10px',
                    backgroundSize: '20px 20px'
                }}
            ></div>
        );
    };

    return (
        <GuestLayout>
            <div className="min-h-screen bg-white flex flex-col font-sans">
                <Head title="Setup Akun" />
                <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
                    <h1 className="text-5xl font-black text-sky-500 mb-10 text-center tracking-tight">
                        Setup Akun
                    </h1>

                    <form onSubmit={submit} className="w-full max-w-4xl flex flex-col md:flex-row gap-6">
                        
                        {/* BAGIAN KIRI: Upload Foto */}
                        <div className="w-full md:w-[280px] bg-white border border-gray-200 rounded-[2rem] p-6 flex flex-col items-center h-fit shadow-sm">
                            <div className="w-48 h-48 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 mb-6 overflow-hidden relative">
                                {renderAvatarPreview()}
                            </div>
                            
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                className="hidden" 
                                onChange={e => setData('profile_photo', e.target.files[0])} 
                                accept="image/png, image/jpeg, image/webp" 
                            />
                            
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-full py-2.5 rounded-2xl border border-sky-500 text-sky-500 text-sm font-bold bg-white hover:bg-sky-50 transition-colors"
                            >
                                Pilih Foto
                            </button>
                            
                            <p className="text-[10px] text-gray-400 text-center mt-4 px-2 leading-relaxed">
                                PNG, JPG, WEBP • Maks. 15MB •<br/>Rasio 1:1
                            </p>
                            {errors.profile_photo && <p className="mt-1 text-xs text-red-500">{errors.profile_photo}</p>}
                        </div>

                        {/* BAGIAN KANAN: Form Input */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-[2rem] p-8 shadow-sm space-y-5">
                            
                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">Username</label>
                                <input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="Masukkan username"
                                    className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 transition-all"
                                />
                                {errors.username && <p className="mt-1.5 text-xs text-red-500">{errors.username}</p>}
                            </div>

                            {/* Nama */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">Nama</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Masukkan nama"
                                    className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 transition-all"
                                />
                                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
                            </div>

                            {/* Tanggal Lahir */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">Tanggal lahir</label>
                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button" // PERBAIKAN: Agar tidak bentrok dengan form submit
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
                                <PopoverContent className="w-[220px] p-3 bg-white border border-gray-200 rounded-xl shadow-lg" align="start">
                                            
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
                                                className="w-full" // <- Tambahkan ini agar kalender mengisi penuh 280px
                                            />
                                            
                                        </PopoverContent>
                                </Popover>
                                {errors.birth_date && <p className="mt-1.5 text-xs text-red-500">{errors.birth_date}</p>}
                            </div>

                            {/* Kode & Nomor Handphone */}
                            <div className="flex gap-4">
                                <div className="w-[140px]">
                                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Kode</label>
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

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Nomor Handphone</label>
                                    <input
                                        type="tel"
                                        value={data.phone_number}
                                        onChange={(e) => setData('phone_number', e.target.value)}
                                        placeholder="81234567890"
                                        className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400 placeholder-gray-400 transition-all"
                                    />
                                    {errors.phone_number && <p className="mt-1.5 text-xs text-red-500">{errors.phone_number}</p>}
                                </div>
                            </div>

                            {/* Email (Read-Only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={user?.email || 'email@contoh.com'}
                                    disabled
                                    className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl text-sm bg-gray-50 text-gray-400 cursor-not-allowed outline-none"
                                />
                            </div>

                            {/* Tombol Buat Akun */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 bg-[#bde4f8] hover:bg-sky-300 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors text-sm mt-4"
                            >
                                {processing ? 'Menyimpan...' : 'Buat Akun'}
                            </button>
                        </div>
                    </form>
                </main>
            </div>
        </GuestLayout>    
);
}
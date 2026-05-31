const formatNumber = (number) => new Intl.NumberFormat('id-ID').format(number ?? 0);
export default function LegendRow({ label, value, percent, color }) {
    return (
        <div className={`flex items-center justify-between p-3`}>
            <div className='flex gap-2'>
            <div className={`w-2 h-12 rounded-full ${color}`}/>
            <div className="flex flex-col h-full">
                <p className="text-xs text-black">{label}</p>
                <p className="text-xl font-semibold text-black">{formatNumber(value)}</p>
            </div>
            </div>
            <div className={`text-lg font-semibold p-2.5 rounded-[8px] ${color === 'bg-sky-500' || color === 'bg-sky-100' ? 'bg-sky-100 text-sky-500' : color === 'bg-green-500' ? 'bg-green-100 text-green-500' : color === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-500' : 'bg-red-200 text-red-500'}`}>
                {percent}%
            </div>
        </div>
    );
}
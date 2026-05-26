import React from 'react'
const formatNumber = (number) => new Intl.NumberFormat('id-ID').format(number ?? 0);

export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-neutral-300 rounded-[24px] p-4 flex items-center gap-4">
      <div className="w-12 h-12 bg-sky-100 text-sky-500 rounded-[8px] flex items-center justify-center shrink-0">
        <Icon size={32} stroke={2} />
      </div>
      <div>
        <p className="text-xs text-black font-medium mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-sky-500 leading-tight">{formatNumber(value)}</p>
      </div>
    </div>
  )
}

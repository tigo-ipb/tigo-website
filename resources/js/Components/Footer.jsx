import { IconBrandWhatsapp } from '@tabler/icons-react'
import React from 'react'

export default function Footer() {
    return (
                <div className="mt-6 flex justify-between items-center text-gray-500 text-sm p-4 bg-white border border-gray-100 rounded-[20px]">
                    <p>Copyright @ 2026 Tigo</p>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 cursor-pointer hover:bg-blue-100 transition">
                        <IconBrandWhatsapp size={20} />
                    </div>
                </div>
    )
}

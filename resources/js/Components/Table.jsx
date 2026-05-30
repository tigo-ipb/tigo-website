import React from 'react';

export default function DynamicTable({ 
    columns, 
    data, 
    emptyMessage = "Tidak ada data.",
    minWidth = "min-w-[900px]" // Default min-width agar responsif di mobile
}) {
    return (
        <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${minWidth}`}>
                <thead>
                    <tr className="border-b border-neutral-300">
                        {columns.map((col, index) => (
                            <th 
                                key={index} 
                                className={`py-3 px-2 text-xs font-medium text-sky-500 whitespace-nowrap ${col.headerClassName || ''}`}
                            >
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.length > 0 ? (
                        data.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                {columns.map((col, colIndex) => (
                                    <td 
                                        key={colIndex} 
                                        className={`py-4 px-2 ${col.cellClassName || ''}`}
                                    >
                                        {/* Jika ada fungsi 'render' kustom, jalankan. Jika tidak, cetak langsung nilainya */}
                                        {col.render ? col.render(row, rowIndex) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="py-10 text-center text-neutral-400 text-xs">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
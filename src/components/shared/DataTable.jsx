export default function DataTable({
    columns = [],
    data = [],
    footer,
    pagination,
    emptyMessage = "कोणतीही नोंद नाही"
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider devanagari ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''}`}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-400 devanagari">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIdx) => (
                                <tr key={rowIdx} className="hover:bg-slate-50 transition-colors">
                                    {columns.map((col, colIdx) => (
                                        <td
                                            key={colIdx}
                                            className={`px-6 py-4 text-sm ${col.align === 'right' ? 'text-right' : ''} ${col.align === 'center' ? 'text-center' : ''} ${col.className || ''}`}
                                        >
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                    {footer && (
                        <tfoot>
                            <tr className="bg-slate-50 font-bold">
                                {footer}
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {pagination && (
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
                    <p className="devanagari">{pagination.label}</p>
                    <div className="flex items-center gap-4">
                        <span>{pagination.info}</span>
                        <div className="flex items-center gap-1">
                            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">
                                <span className="material-icons-round text-sm">chevron_left</span>
                            </button>
                            {pagination.pages?.map((page, idx) => (
                                <button
                                    key={idx}
                                    className={`w-8 h-8 flex items-center justify-center rounded border ${page.active ? 'border-primary bg-primary text-white' : 'border-slate-200 hover:bg-slate-50'}`}
                                >
                                    {page.number}
                                </button>
                            ))}
                            <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 hover:bg-slate-50">
                                <span className="material-icons-round text-sm">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

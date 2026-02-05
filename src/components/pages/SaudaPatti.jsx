import { useState } from 'react';

export default function SaudaPatti() {
    const [rows, setRows] = useState([
        { cropType: '', quantity: '', rate: '', remarks: '' },
        { cropType: '', quantity: '', rate: '', remarks: '' },
        { cropType: '', quantity: '', rate: '', remarks: '' }
    ]);

    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;
        setRows(newRows);
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800">
            <div className="max-w-4xl mx-auto px-4 py-12">
                {/* Header */}
                <header className="text-center mb-10">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-teal-700 p-3 rounded-full shadow-lg">
                            <span className="material-icons-round text-white text-3xl">agriculture</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold devanagari text-slate-900">
                        कृषि उत्पन्न बाजार समिती, नाशिक
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">
                        Internal Trade Management System
                    </p>
                    <div className="mt-4 inline-block px-4 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold tracking-wide uppercase">
                        Sauda Patti Form (सौदापट्टी)
                    </div>
                </header>

                {/* Main Form Card */}
                <main className="bg-white shadow-xl rounded-2xl border border-slate-200 overflow-hidden">
                    <form className="p-8 space-y-8">
                        {/* Date and Transaction ID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 devanagari">
                                    दिनांक (Date)
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-md border-slate-300 focus:border-teal-600 focus:ring-teal-600"
                                />
                            </div>
                            <div className="space-y-1 text-right hidden md:block">
                                <p className="text-xs text-slate-400">
                                    Transaction ID: <span className="font-mono text-slate-600">#SP-2024-0031356</span>
                                </p>
                                <p className="text-xs text-slate-400 devanagari">परिशिष्ट क्रमांक १० उपविधी ४० प्रमाणे</p>
                            </div>
                        </div>

                        {/* Party Details */}
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-slate-600 devanagari">
                                        आडत्याचे / व्यापाऱ्याचे नांव (Agent/Trader Name)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter agent name"
                                        className="w-full rounded-md border-slate-300 focus:border-teal-600 focus:ring-teal-600"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-semibold text-slate-600 devanagari">
                                        खरेदीदाराचे नांव (Buyer Name)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter buyer name"
                                        className="w-full rounded-md border-slate-300 focus:border-teal-600 focus:ring-teal-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-slate-600 devanagari">
                                    मालधन्याचे नांव (Seller Name)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter seller name"
                                    className="w-full rounded-md border-slate-300 focus:border-teal-600 focus:ring-teal-600"
                                />
                            </div>
                        </div>

                        {/* Crop Details Table */}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 devanagari text-slate-700">
                                        <th className="p-4 border-b border-slate-200 font-bold">शेतीमालाचे प्रकार (Crop Type)</th>
                                        <th className="p-4 border-b border-slate-200 font-bold">परिमाण (Quantity/Weight)</th>
                                        <th className="p-4 border-b border-slate-200 font-bold">दर (Rate)</th>
                                        <th className="p-4 border-b border-slate-200 font-bold">शेरा (Remarks)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {rows.map((row, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.cropType}
                                                    onChange={(e) => updateRow(idx, 'cropType', e.target.value)}
                                                    className="w-full border-none bg-transparent focus:ring-0 devanagari"
                                                    placeholder={idx === 0 ? "उदा. कांदा" : ""}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.quantity}
                                                    onChange={(e) => updateRow(idx, 'quantity', e.target.value)}
                                                    className="w-full border-none bg-transparent focus:ring-0"
                                                    placeholder={idx === 0 ? "उदा. ५० क्विंटल" : ""}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    value={row.rate}
                                                    onChange={(e) => updateRow(idx, 'rate', e.target.value)}
                                                    className="w-full border-none bg-transparent focus:ring-0"
                                                    placeholder={idx === 0 ? "0.00" : ""}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={row.remarks}
                                                    onChange={(e) => updateRow(idx, 'remarks', e.target.value)}
                                                    className="w-full border-none bg-transparent focus:ring-0"
                                                    placeholder={idx === 0 ? "..." : ""}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Signature Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                            <div className="text-center p-4 border rounded-lg border-dashed border-slate-300">
                                <div className="h-12 border-b border-slate-200 mb-2"></div>
                                <p className="text-xs font-semibold devanagari text-slate-500">बाजार समिती सेवक</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg border-dashed border-slate-300">
                                <div className="h-12 border-b border-slate-200 mb-2"></div>
                                <p className="text-xs font-semibold devanagari text-slate-500">खरेदीदार</p>
                            </div>
                            <div className="text-center p-4 border rounded-lg border-dashed border-slate-300">
                                <div className="h-12 border-b border-slate-200 mb-2"></div>
                                <p className="text-xs font-semibold devanagari text-slate-500">आडत्या व्यापारी</p>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="bg-amber-50 p-4 rounded-lg">
                            <p className="text-xs text-amber-800 devanagari leading-relaxed">
                                <span className="font-bold">टीप:</span> सदर पावतीचे पेमेंट त्वरीत घेऊन जावे. ५ दिवसानंतर तक्रार ग्राह्य धरली जाणार नाही.
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4">
                            <button
                                type="button"
                                className="w-full sm:w-auto px-6 py-2.5 flex items-center justify-center gap-2 text-teal-700 font-semibold hover:bg-teal-50 rounded-lg transition-all border border-teal-700"
                            >
                                <span className="material-icons-round text-xl">file_download</span>
                                Download PDF
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-8 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-lg shadow-lg shadow-teal-700/20 transition-all flex items-center justify-center gap-2"
                            >
                                <span className="material-icons-round text-xl">save</span>
                                Save Record
                            </button>
                        </div>
                    </form>
                </main>

                {/* Footer */}
                <footer className="mt-8 text-center text-slate-400 text-sm">
                    <p>© 2024 TradeLink Internal Systems. Authorized Use Only.</p>
                </footer>
            </div>
        </div>
    );
}

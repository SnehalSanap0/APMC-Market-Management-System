import { useState } from 'react';

export default function HishobPatti() {
    const [formData, setFormData] = useState({
        receiptNo: '091105',
        date: '',
        agentName: '',
        sellerName: '',
        buyerName: '',
        items: [{ type: '', weight: '', rate: '', amountRs: '', amountPs: '' }],
        expenses: {
            commission: '',
            labor: '',
            weighing: ''
        }
    });

    const totalExpenses =
        (parseFloat(formData.expenses.commission) || 0) +
        (parseFloat(formData.expenses.labor) || 0) +
        (parseFloat(formData.expenses.weighing) || 0);

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen py-8 px-4">
            {/* Action Bar */}
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center no-print">
                <div className="flex items-center space-x-2">
                    <span className="material-icons-round text-blue-600">description</span>
                    <h1 className="text-xl font-bold tracking-tight">Hishob Patti Manager</h1>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
                    >
                        <span className="material-icons-round text-sm mr-2">print</span>
                        Print / Save PDF
                    </button>
                    <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition">
                        <span className="material-icons-round text-sm mr-2">save</span>
                        Save Record
                    </button>
                </div>
            </div>

            {/* Main Receipt Card */}
            <main className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-xl p-8 md:p-12 print-container">
                {/* Header */}
                <header className="text-center border-b-2 border-slate-100 pb-8 mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-slate-200">
                            <span className="material-icons-round text-3xl text-slate-600">agriculture</span>
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold devanagari mb-1">नाशिक कृषि उत्पन्न बाजार समिती</h2>
                    <p className="text-slate-500 devanagari">शेतकरी हिशोब पट्टी (Settlement Slip)</p>
                </header>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <label className="w-32 devanagari text-slate-600">क्रमांक (No.):</label>
                            <input
                                type="text"
                                value={formData.receiptNo}
                                onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                                className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-2 py-1 font-mono text-red-600 font-bold"
                            />
                        </div>
                        <div className="flex items-center">
                            <label className="w-32 devanagari text-slate-600">दिनांक (Date):</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-2 py-1"
                            />
                        </div>
                    </div>
                    <div className="flex flex-col justify-end space-y-4">
                        <div className="flex items-center">
                            <label className="w-40 devanagari text-slate-600">आडत्याचे नांव:</label>
                            <input
                                type="text"
                                value={formData.agentName}
                                onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                                placeholder="Agent Name"
                                className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-2 py-1"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <div className="flex items-center">
                        <label className="w-48 devanagari text-slate-600">मालधन्याचे नांव व पत्ता:</label>
                        <input
                            type="text"
                            value={formData.sellerName}
                            onChange={(e) => setFormData({ ...formData, sellerName: e.target.value })}
                            placeholder="Seller Name & Address"
                            className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-2 py-1"
                        />
                    </div>
                    <div className="flex items-center">
                        <label className="w-48 devanagari text-slate-600">खरेदीदाराचे नांव व पत्ता:</label>
                        <input
                            type="text"
                            value={formData.buyerName}
                            onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                            placeholder="Buyer Name & Address"
                            className="flex-1 bg-transparent border-b border-slate-300 focus:border-blue-600 focus:ring-0 px-2 py-1"
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-8 border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 devanagari text-sm">
                                <th className="border-b border-r border-slate-200 p-3 w-1/4">शेती मालाचा प्रकार व संख्या</th>
                                <th className="border-b border-r border-slate-200 p-3 text-center">वजन (Weight)</th>
                                <th className="border-b border-r border-slate-200 p-3 text-center">भाव (Rate)</th>
                                <th className="border-b border-r border-slate-200 p-3 text-center" colSpan={2}>एकूण रक्कम (Total)</th>
                                <th className="border-b border-slate-200 p-3">खर्चाचा तपशील (Expenses)</th>
                            </tr>
                            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider">
                                <th className="border-b border-r border-slate-200 px-3 py-1">Item</th>
                                <th className="border-b border-r border-slate-200 px-3 py-1 text-center">Qty</th>
                                <th className="border-b border-r border-slate-200 px-3 py-1 text-center">Price</th>
                                <th className="border-b border-r border-slate-200 px-3 py-1 text-center w-20">Rs.</th>
                                <th className="border-b border-r border-slate-200 px-3 py-1 text-center w-12">Ps.</th>
                                <th className="border-b border-slate-200 px-3 py-1">Particulars</th>
                            </tr>
                        </thead>
                        <tbody className="font-mono">
                            <tr>
                                <td className="border-b border-r border-slate-200 p-0">
                                    <input type="text" className="w-full border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 h-12 px-3" />
                                </td>
                                <td className="border-b border-r border-slate-200 p-0">
                                    <input type="number" className="w-full border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 h-12 px-3 text-center" />
                                </td>
                                <td className="border-b border-r border-slate-200 p-0">
                                    <input type="number" className="w-full border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 h-12 px-3 text-center" />
                                </td>
                                <td className="border-b border-r border-slate-200 p-0">
                                    <input type="number" className="w-full border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 h-12 px-3 text-center" />
                                </td>
                                <td className="border-b border-r border-slate-200 p-0">
                                    <input type="number" className="w-full border-none bg-transparent focus:ring-2 focus:ring-inset focus:ring-blue-600 h-12 px-3 text-center" />
                                </td>
                                <td className="border-b border-slate-200 p-3 flex justify-between items-center devanagari">
                                    <span>१ आडत (Comm.)</span>
                                    <input
                                        type="number"
                                        value={formData.expenses.commission}
                                        onChange={(e) => setFormData({ ...formData, expenses: { ...formData.expenses, commission: e.target.value } })}
                                        placeholder="0.00"
                                        className="w-20 bg-transparent border-b border-slate-200 text-right focus:ring-0"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-slate-200 p-3 flex justify-between items-center devanagari">
                                    <span>२ हमाली (Labor)</span>
                                    <input
                                        type="number"
                                        value={formData.expenses.labor}
                                        onChange={(e) => setFormData({ ...formData, expenses: { ...formData.expenses, labor: e.target.value } })}
                                        placeholder="0.00"
                                        className="w-20 bg-transparent border-b border-slate-200 text-right focus:ring-0"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-r border-slate-200 h-12"></td>
                                <td className="border-b border-slate-200 p-3 flex justify-between items-center devanagari">
                                    <span>३ मापाई (Weighing)</span>
                                    <input
                                        type="number"
                                        value={formData.expenses.weighing}
                                        onChange={(e) => setFormData({ ...formData, expenses: { ...formData.expenses, weighing: e.target.value } })}
                                        placeholder="0.00"
                                        className="w-20 bg-transparent border-b border-slate-200 text-right focus:ring-0"
                                    />
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50">
                                <td className="p-4 devanagari text-sm" colSpan={5}>
                                    <p className="font-bold">खर्च वजा जाता शिल्लक रक्कम रु.</p>
                                    <p className="text-xs text-slate-500 italic mt-1">नमूद केल्याप्रमाणे रोख मिळाले.</p>
                                </td>
                                <td className="p-4 border-l border-slate-200">
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="devanagari">एकूण खर्च:</span>
                                        <span>₹ {totalExpenses.toFixed(2)}</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Net Amount */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-12 flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-blue-800 devanagari font-bold text-lg">निव्वळ देय रक्कम (Net Payable Amount)</h3>
                        <p className="text-blue-600 text-sm">Total amount after deducting expenses</p>
                    </div>
                    <div className="text-3xl font-bold text-blue-900 font-mono">
                        ₹ 45,250.00
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-12 mt-16">
                    <div className="text-center">
                        <div className="border-t border-slate-300 pt-2">
                            <p className="devanagari font-medium">सही आडत्या</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Agent Signature</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-slate-300 pt-2">
                            <p className="devanagari font-medium">सही मालधनी</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Seller Signature</p>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <footer className="mt-12 pt-8 border-t border-slate-100 text-center text-xs text-slate-400 devanagari">
                    सदर पावतीचे पेमेंट त्वरीत घेऊन जावे. ५ दिवसानंतर तक्रार ग्राह्य धरली जाणार नाही.
                </footer>
            </main>

            {/* Info Box */}
            <div className="max-w-4xl mx-auto mt-8 px-4 no-print">
                <div className="bg-slate-100 rounded-lg p-4 flex items-start space-x-3">
                    <span className="material-icons-round text-slate-400">info</span>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        This digital Hishob Patti is for internal record keeping. Please ensure all weights and rates are verified before saving the transaction. Records are automatically synced with the central APMC database.
                    </p>
                </div>
            </div>
        </div>
    );
}

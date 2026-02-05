import { useState } from 'react';

const todaysReceipts = [
    { id: '20398', trader: 'पाटील ट्रेडर्स, नाशिक', mode: 'रोख', modeClass: 'bg-blue-100 text-blue-700', amount: '₹ १२,५००' },
    { id: '20397', trader: 'महेश भाजी भांडार', mode: 'UPI', modeClass: 'bg-purple-100 text-purple-700', amount: '₹ ८,०००' },
    { id: '20396', trader: 'सुदाम भाजी मार्केट', mode: 'रोख', modeClass: 'bg-blue-100 text-blue-700', amount: '₹ २२,०००' },
];

export default function JamaPavti() {
    const [formData, setFormData] = useState({
        receiptNo: '20399', date: '', traderName: '', amount: '', paymentMode: 'रोख (Cash)', amountInWords: ''
    });

    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen">
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-2 rounded-lg text-white"><span className="material-icons-round">receipt_long</span></div>
                    <div>
                        <h1 className="text-xl font-bold text-primary devanagari">जय सप्तश्रृंगी व्हिजीटेबल कंपनी</h1>
                        <p className="text-xs text-slate-500">जमा पावती व्यवस्थापन प्रणाली</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                    <span className="material-icons-round text-sm">calendar_today</span>
                    <span className="text-sm font-medium">२२/०५/२०२४</span>
                </div>
            </header>

            <main className="max-w-[1400px] mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-6">
                    <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <span className="material-icons-round text-primary">add_circle</span>
                            <span className="devanagari">नवीन पावती नोंदवा</span>
                        </h2>
                        <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">पावती क्रमांक</label>
                                <input type="text" value={formData.receiptNo} readOnly className="w-full bg-slate-50 border-slate-200 rounded-lg text-primary font-bold" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">दिनांक</label>
                                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border-slate-200 rounded-lg" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">व्यापाऱ्याचे नाव (श्री.)</label>
                                <input type="text" value={formData.traderName} onChange={(e) => setFormData({ ...formData, traderName: e.target.value })} placeholder="व्यापाऱ्याचे पूर्ण नाव" className="w-full bg-white border-slate-200 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">रक्कम (रुपये)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                    <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="0.00" className="w-full pl-8 bg-white border-slate-200 rounded-lg" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">पेमेंट मोड</label>
                                <select value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })} className="w-full bg-white border-slate-200 rounded-lg">
                                    <option>रोख (Cash)</option><option>चेक (Cheque)</option><option>ऑनलाईन (UPI)</option>
                                </select>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">अक्षरी रुपये</label>
                                <input type="text" value={formData.amountInWords} onChange={(e) => setFormData({ ...formData, amountInWords: e.target.value })} placeholder="उदा. पाच हजार रुपये फक्त" className="w-full bg-white border-slate-200 rounded-lg" />
                            </div>
                            <div className="md:col-span-2 flex gap-3 pt-4">
                                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                    <span className="material-icons-round">save</span><span className="devanagari">पावती सेव्ह करा</span>
                                </button>
                                <button type="button" className="px-6 py-3 border border-slate-200 rounded-lg font-medium hover:bg-slate-50 devanagari">रद्द करा</button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <h2 className="font-semibold flex items-center gap-2 text-slate-700">
                                <span className="material-icons-round text-slate-400">history</span><span className="devanagari">आजच्या पावत्या</span>
                            </h2>
                            <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded">Total: ₹ ४२,५००</span>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr><th className="px-6 py-3">नं.</th><th className="px-6 py-3">व्यापारी</th><th className="px-6 py-3">मोड</th><th className="px-6 py-3 text-right">रक्कम</th><th className="px-6 py-3 text-center">कृती</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {todaysReceipts.map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50 cursor-pointer">
                                        <td className="px-6 py-4 text-sm font-medium">{r.id}</td>
                                        <td className="px-6 py-4 text-sm devanagari">{r.trader}</td>
                                        <td className="px-6 py-4"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${r.modeClass}`}>{r.mode}</span></td>
                                        <td className="px-6 py-4 text-sm font-bold text-right">{r.amount}</td>
                                        <td className="px-6 py-4 text-center"><button className="text-slate-400 hover:text-primary"><span className="material-icons-round text-lg">print</span></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>

                <div className="lg:col-span-5">
                    <div className="sticky top-24">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-600 uppercase text-xs tracking-wider devanagari">पावती पूर्वदृश्य</h3>
                            <button className="flex items-center gap-1 text-primary text-sm font-bold"><span className="material-icons-round text-sm">print</span><span className="devanagari">प्रिंट काढा</span></button>
                        </div>
                        <div className="receipt-paper bg-white border-2 border-primary/20 rounded-sm shadow-xl p-8 text-primary relative overflow-hidden aspect-[1/1.4]">
                            <div className="absolute inset-2 border border-primary/40 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="text-center space-y-1 mb-6">
                                    <p className="text-xs font-bold">|| श्री ||</p>
                                    <h2 className="text-3xl font-bold devanagari">जय सप्तश्रृंगी व्हिजीटेबल कंपनी</h2>
                                    <p className="text-sm font-semibold devanagari">व्हेजीटेबल मर्चंट अॅन्ड कमिशन एजंट</p>
                                    <p className="text-xs devanagari">उपबाजार समिती आवार, एकलहरारोड, सिन्नर फाटा, नाशिकरोड</p>
                                </div>
                                <div className="flex justify-between items-end border-b border-primary/30 pb-4 mb-6">
                                    <div className="flex items-baseline gap-2"><span className="text-sm">नं.</span><span className="text-2xl font-bold">{formData.receiptNo}</span></div>
                                    <div className="flex items-baseline gap-2"><span className="text-sm">दिनांक</span><span className="text-lg border-b border-dotted border-primary min-w-[120px]">{formData.date || '२२/०५/२०२४'}</span></div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-end gap-3"><span className="text-lg">श्री.</span><div className="flex-1 border-b border-dotted border-primary pb-1 text-xl font-bold italic devanagari">{formData.traderName || 'पाटील ट्रेडर्स'}</div></div>
                                    <p className="text-lg mt-8 font-medium devanagari">आज रोजी रोख मिळाले ते तुमचे खाते जमा केले.</p>
                                    <div className="flex justify-between items-center mt-12">
                                        <div className="border-2 border-primary px-4 py-3 text-3xl font-black rounded-sm">रु. {formData.amount || '१२,५००'}/-</div>
                                        <div className="text-center pt-8"><div className="h-px w-32 bg-primary/40 mb-2"></div><p className="text-sm font-bold devanagari">पैसे वसूल करणार</p></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-8 right-8 text-center">
                                    <p className="text-sm italic font-medium devanagari">"दुनियामे सबसे बडी दौलत है इमानदारी!"</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button className="flex-1 bg-slate-800 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"><span className="material-icons-round">share</span><span className="devanagari">WhatsApp करा</span></button>
                            <button className="flex-1 bg-primary text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"><span className="material-icons-round">download</span><span className="devanagari">PDF डाऊनलोड</span></button>
                        </div>
                    </div>
                </div>
            </main>
            <footer className="mt-12 py-8 border-t border-slate-200 text-center text-slate-400 text-xs">
                <p className="devanagari">© २०२४ जय सप्तश्रृंगी व्हिजीटेबल कंपनी - सर्व हक्क राखीव</p>
            </footer>
        </div>
    );
}

import { Header, Footer, StatCard } from '../shared';

const recentTransactions = [
    { time: '०९:४५ AM', name: 'रविंद्र पाटील', detail: 'कांदा - २० बॅग', type: 'पट्टी नोंद', typeClass: 'bg-blue-100 text-blue-800', amount: '₹ १४,५००' },
    { time: '१०:१२ AM', name: 'म. तांत्रिक ट्रेडर्स', detail: 'जमा खाते', type: 'उधारी जमा', typeClass: 'bg-emerald-100 text-emerald-800', amount: '+ ₹ २,०००', amountClass: 'text-emerald-600' },
    { time: '१०:३० AM', name: 'संदीप गायकवाड', detail: 'टोमॅटो - ५० क्रेट', type: 'पट्टी नोंद', typeClass: 'bg-blue-100 text-blue-800', amount: '₹ ३२,८००' },
];

const recentTraders = [
    { initials: 'MK', name: 'महेश कुलकर्णी', location: 'सिन्नर फाटा' },
    { initials: 'AP', name: 'अतुल पवार', location: 'एकलहारा रोड' },
];

export default function MarketOperations() {
    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen">
            <Header title="जय सप्तश्रृंगी व्हिजीटेबल कंपनी" subtitle="Vegetable Merchant & Commission Agent" />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold devanagari">मार्केट ऑपरेशन्स डॅशबोर्ड</h2>
                        <p className="text-slate-500">आजचा अहवाल • सोमवार, २२ मे २०२४</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-3">
                        <div className="relative flex-grow md:w-64">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input type="text" placeholder="व्यापारी शोधा..." className="w-full pl-10 pr-4 py-2 bg-white border-slate-200 rounded-lg devanagari" />
                        </div>
                        <button className="bg-primary text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
                            <span className="material-icons-round text-sm">add</span>
                            <span className="devanagari">नवीन नोंद</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard icon="trending_up" iconBgClass="bg-emerald-50" iconTextClass="text-emerald-600" badge="+१२%" badgeClass="text-emerald-600 bg-emerald-100" label="आजची एकूण उलाढाल" value="₹ ४,५२,८००" subtext="काल पेक्षा जास्त" />
                    <StatCard icon="pending_actions" iconBgClass="bg-amber-50" iconTextClass="text-amber-600" label="प्रलंबित सेटलमेंट्स" value="२८" subtext="प्रतीक्षेत असलेली देयके" />
                    <StatCard icon="account_balance_wallet" iconBgClass="bg-primary/10" iconTextClass="text-primary" label="एकूण उधारी" value={<span className="text-primary">₹ ८,१२,०५०</span>} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span className="material-icons-round text-primary">list_alt</span>
                                    <span className="devanagari">दैनिक व्यवहार नोंदी</span>
                                </h3>
                                <button className="text-primary text-sm font-semibold hover:underline devanagari">सर्व पहा</button>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold devanagari">वेळ</th>
                                        <th className="px-6 py-3 font-semibold devanagari">तपशील</th>
                                        <th className="px-6 py-3 font-semibold devanagari">प्रकार</th>
                                        <th className="px-6 py-3 font-semibold text-right devanagari">रक्कम</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentTransactions.map((tx, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 text-sm text-slate-500">{tx.time}</td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium devanagari">{tx.name}</div>
                                                <div className="text-xs text-slate-400 devanagari">{tx.detail}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.typeClass}`}>{tx.type}</span>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-semibold ${tx.amountClass || ''}`}>{tx.amount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-xl">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <span className="material-icons-round text-primary">groups</span>
                                <span className="devanagari">नुकतेच व्यवहार केलेले व्यापारी</span>
                            </h3>
                            <div className="space-y-4">
                                {recentTraders.map((trader, idx) => (
                                    <div key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                                        <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">{trader.initials}</div>
                                        <div className="flex-grow">
                                            <p className="text-sm font-semibold devanagari">{trader.name}</p>
                                            <p className="text-xs text-slate-400 devanagari">{trader.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-primary/5 p-6 border border-primary/20 rounded-2xl">
                            <h3 className="font-bold text-primary mb-4 devanagari">त्वरित प्रवेश</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[{ icon: 'description', label: 'नवीन पट्टी' }, { icon: 'receipt_long', label: 'नवीन पावती' }, { icon: 'history_edu', label: 'उधारी नोंद' }, { icon: 'assessment', label: 'दैनिक रिपोर्ट' }].map((item, idx) => (
                                    <button key={idx} className="bg-white p-3 rounded-xl border border-primary/10 shadow-sm flex flex-col items-center gap-2 hover:shadow-md">
                                        <span className="material-icons-round text-primary">{item.icon}</span>
                                        <span className="text-[10px] font-bold uppercase devanagari">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

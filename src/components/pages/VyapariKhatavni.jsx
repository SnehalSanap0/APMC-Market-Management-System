import { Header, Footer, DataTable } from '../shared';

const ledgerData = [
    { date: '12/05/2024', detail: 'कांदा (नाशिक 1 नं) - #9801', weight: '450.00', rate: '22.50', debit: '10,125.00', credit: '—', balance: '10,125.00' },
    { date: '14/05/2024', detail: 'आल (जुना) - #9855', weight: '120.00', rate: '65.00', debit: '7,800.00', credit: '—', balance: '17,925.00' },
    { date: '15/05/2024', detail: 'कॅश पेमेंट (Rec #20399)', weight: '—', rate: '—', debit: '—', credit: '12,000.00', creditClass: 'text-green-600', balance: '5,925.00' },
    { date: '18/05/2024', detail: 'लसूण (देशी) - #9910', weight: '55.00', rate: '125.00', debit: '6,875.00', credit: '—', balance: '12,800.00' },
];

const columns = [
    { key: 'date', label: 'तारीख', render: (val) => <span className="font-medium">{val}</span> },
    { key: 'detail', label: 'तपशील / बिल नं.', render: (val) => <span className="devanagari">{val}</span> },
    { key: 'weight', label: 'वजन / नग', align: 'right', render: (val) => <span className={val === '—' ? 'text-slate-400' : ''}>{val}</span> },
    { key: 'rate', label: 'दर (₹)', align: 'right', render: (val) => <span className={val === '—' ? 'text-slate-400' : ''}>{val}</span> },
    { key: 'debit', label: 'चालू कलम', align: 'right', render: (val) => <span className={val === '—' ? 'text-slate-400' : 'font-semibold'}>{val}</span> },
    { key: 'credit', label: 'जमा', align: 'right', render: (val, row) => <span className={val === '—' ? 'text-slate-400' : 'font-semibold text-green-600'}>{val}</span> },
    { key: 'balance', label: 'नक्की बाकी', align: 'right', render: (val) => <span className="font-medium">{val}</span> },
];

export default function VyapariKhatavni() {
    return (
        <div className="bg-slate-50 text-slate-900 min-h-screen">
            <Header title="जय सप्तशृंगी व्हिजीटेबल कंपनी" subtitle="Vegetable Merchant & Commission Agent" />

            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <nav className="flex text-sm text-slate-500 mb-1">
                            <a href="#" className="hover:text-primary">Dashboard</a><span className="mx-2">/</span>
                            <a href="#" className="hover:text-primary">Traders</a><span className="mx-2">/</span>
                            <span className="text-slate-900 font-medium">Ledger</span>
                        </nav>
                        <h2 className="text-3xl font-bold devanagari">व्यापारी खतावणी <span className="text-slate-400 font-normal ml-2">#20399</span></h2>
                    </div>
                    <div className="flex gap-2">
                        <button className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <span className="material-icons-round text-sm">add</span><span className="devanagari">नवीन नोंद</span>
                        </button>
                        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50">
                            <span className="material-icons-round text-sm">print</span><span className="devanagari">प्रिंट</span>
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="flex items-start gap-4 col-span-1 md:col-span-2">
                            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-primary">
                                <span className="material-icons-round text-3xl">person</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold devanagari">श्री. गजानन रामभाऊ पाटील</h3>
                                <p className="text-slate-500 devanagari">सिन्नर फाटा, नाशिक रोड, नाशिक</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 text-sm text-slate-500"><span className="material-icons-round text-xs">phone</span> +91 98XXX-XXXXX</span>
                                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full uppercase">Active</span>
                                </div>
                            </div>
                        </div>
                        <div className="md:border-l md:pl-8 border-slate-100">
                            <p className="text-slate-500 text-sm devanagari mb-1">एकूण येणे (Debit)</p>
                            <p className="text-2xl font-bold">₹ 45,280.50</p>
                        </div>
                        <div className="md:border-l md:pl-8 border-slate-100">
                            <p className="text-slate-500 text-sm devanagari mb-1">नक्की बाकी (Balance)</p>
                            <p className="text-2xl font-bold text-primary">₹ 12,850.00</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                            <input type="text" placeholder="तपशील शोधा..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg devanagari" />
                        </div>
                        <input type="date" className="w-full md:w-48 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                        <span className="text-slate-400 hidden md:block">ते</span>
                        <input type="date" className="w-full md:w-48 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm" />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={ledgerData}
                    footer={<><td className="px-6 py-4 text-right devanagari" colSpan={4}>एकूण व्यवहार</td><td className="px-6 py-4 text-right">24,850.00</td><td className="px-6 py-4 text-right text-green-600">12,000.00</td><td className="px-6 py-4 text-right text-primary">12,850.00</td></>}
                    pagination={{ label: "मागील व्यवहार पहाण्यासाठी खाली स्क्रोल करा", info: "Showing 1-4 of 42 entries", pages: [{ number: 1, active: true }, { number: 2, active: false }] }}
                />

                <div className="mt-12 text-center">
                    <p className="italic text-slate-400 devanagari text-lg">"इमानदारी दुनियामे सबसे बडी दौलत है।"</p>
                </div>
            </main>
            <Footer />
        </div>
    );
}

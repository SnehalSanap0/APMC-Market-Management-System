import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
    ScrollText, FileText, FileCheck, BookOpen,
    BookMarked, TrendingUp, TrendingDown, Users,
    Store, IndianRupee, AlertCircle, ArrowRight,
    ClipboardList
} from 'lucide-react';
import { useLanguage } from '../../lib/language';

ChartJS.register(
    CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => `₹${(n ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const today = () => new Date().toISOString().split('T')[0];
const pastDays = (refDate, n) => {
    const d = new Date(refDate);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
};
const dayLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

// Primary palette — 7 shades from dark to pale, all derived from #9D174D
const PRIMARY = {
    900: '#4a0923',
    700: '#7b1239',
    500: '#9D174D',  // brand primary
    400: '#be185d',  // primary-light
    300: '#db2777',
    200: '#f472b6',
    100: '#fce7f3',
};
function QuickAction({ icon: Icon, label, sublabel, onClick }) {
    return (
        <button
            onClick={onClick}
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100
                        shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left w-full"
        >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{label}</p>
                <p className="text-xs text-slate-400 truncate">{sublabel}</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
    );
}


// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, trend, trendLabel, icon: Icon, accent }) {
    const isUp = trend > 0;
    const isNeutral = trend === null || trend === undefined;
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between">
                <p className="text-xs font-500 uppercase tracking-wider text-slate-400">{label}</p>
            </div>
            <div className="mt-auto">
                <p className="text-2xl font-black text-slate-900 leading-none">{value}</p>
                {sub && <p className="text-xs text-slate-400 mt-2">{sub}</p>}
            </div>
            {!isNeutral && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-primary' : 'text-rose-500'}`}>
                    {isUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    <span>{Math.abs(trend).toFixed(1)}% {trendLabel || (isUp ? 'vs yesterday' : 'vs yesterday')}</span>
                </div>
            )}
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard({ onNavigate }) {
    const { t } = useLanguage();
    const [selectedDate, setSelectedDate] = useState(today());
    const [loading, setLoading] = useState(true);

    // ─ state ─
    const [todayStats, setTodayStats] = useState({ pattis: 0, totalAmount: 0, payments: 0, paymentAmount: 0 });
    const [yesterdayStats, setYesterdayStats] = useState({ totalAmount: 0, paymentAmount: 0 });
    const [weeklyData, setWeeklyData] = useState([]);           // last 7 days patti totals
    const [merchantOutstanding, setMerchantOutstanding] = useState([]); // top debtors
    const [productBreakdown, setProductBreakdown] = useState([]); // today's product mix
    const [masterCounts, setMasterCounts] = useState({ merchants: 0, farmers: 0, products: 0 });
    const [recentPattis, setRecentPattis] = useState([]);
    const [settings, setSettings] = useState({ mobile_number: '', company_name: '' });

    useEffect(() => {
        fetchAll();
    }, [selectedDate]);

    async function fetchAll() {
        setLoading(true);
        const yesterday = pastDays(selectedDate, 1);
        const week = pastDays(selectedDate, 6); // selected date + 6 past days = 7

        const results = await Promise.all([
            // today's patti totals
            supabase.from('hishob_entries').select('id, net_amount').eq('date', selectedDate),
            supabase.from('hishob_entries').select('net_amount').eq('date', yesterday),
            // today's payments
            supabase.from('merchant_payments').select('id, amount').eq('date', selectedDate),
            supabase.from('merchant_payments').select('amount').eq('date', yesterday),
            // weekly entries — sum by date
            supabase.from('hishob_entries').select('date, net_amount').gte('date', week).lte('date', selectedDate),
            // weekly items for product breakdown this week (filter by entry date)
            supabase.from('hishob_items')
                .select('amount, products(name), hishob_entries!inner(date)')
                .gte('hishob_entries.date', week)
                .lte('hishob_entries.date', selectedDate),
            // merchant ledger for outstanding
            supabase.from('merchant_ledger').select('merchant_id, debit, credit, merchants(name)'),
            // master counts
            Promise.all([
                supabase.from('merchants').select('*', { count: 'exact', head: true }),
                supabase.from('farmers').select('*', { count: 'exact', head: true }),
                supabase.from('products').select('*', { count: 'exact', head: true }),
            ]),
            // recent 5 pattis
            supabase.from('hishob_entries')
                .select('receipt_no, net_amount, date, farmers(name)')
                .order('created_at', { ascending: false })
                .limit(5),
            // company settings for support details
            supabase.from('company_settings').select('*').single()
        ]);

        const [
            todayEntries, yesterdayEntries,
            todayPayments, yesterdayPayments,
            weekEntries, weekItems,
            ledger, counts, recent,
            companyRes
        ] = results;

        if (companyRes.data) setSettings(companyRes.data);
        // ── Today stats ──
        const tAmt = (todayEntries.data || []).reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
        const yAmt = (yesterdayEntries.data || []).reduce((s, r) => s + (parseFloat(r.net_amount) || 0), 0);
        const tPay = (todayPayments.data || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
        const yPay = (yesterdayPayments.data || []).reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);

        setTodayStats({
            pattis: (todayEntries.data || []).length,
            totalAmount: tAmt,
            payments: (todayPayments.data || []).length,
            paymentAmount: tPay,
        });
        setYesterdayStats({ totalAmount: yAmt, paymentAmount: yPay });

        // ── Weekly chart data ──
        const byDate = {};
        for (let i = 6; i >= 0; i--) {
            const d = pastDays(selectedDate, i);
            byDate[d] = 0;
        }
        (weekEntries.data || []).forEach(r => {
            if (byDate[r.date] !== undefined)
                byDate[r.date] += parseFloat(r.net_amount) || 0;
        });
        setWeeklyData(Object.entries(byDate).map(([date, amount]) => ({ date, amount })));

        // ── Product breakdown (this week) ──
        const prodMap = {};
        (weekItems.data || []).forEach(item => {
            const name = item.products?.name || 'Other';
            prodMap[name] = (prodMap[name] || 0) + (parseFloat(item.amount) || 0);
        });
        const sorted = Object.entries(prodMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
        setProductBreakdown(sorted);

        // ── Merchant outstanding ──
        const balMap = {};
        const nameMap = {};
        (ledger.data || []).forEach(r => {
            const id = r.merchant_id;
            nameMap[id] = r.merchants?.name || id;
            balMap[id] = (balMap[id] || 0) + (parseFloat(r.debit) || 0) - (parseFloat(r.credit) || 0);
        });
        const outstanding = Object.entries(balMap)
            .map(([id, bal]) => ({ name: nameMap[id], balance: bal }))
            .filter(x => x.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 5);
        setMerchantOutstanding(outstanding);

        // ── Master counts ──
        const [mc, fc, pc] = counts;
        setMasterCounts({ merchants: mc.count || 0, farmers: fc.count || 0, products: pc.count || 0 });

        // ── Recent pattis ──
        setRecentPattis(recent.data || []);

        setLoading(false);
    }

    // ─ derived trends ─
    const amtTrend = yesterdayStats.totalAmount > 0
        ? ((todayStats.totalAmount - yesterdayStats.totalAmount) / yesterdayStats.totalAmount) * 100
        : null;
    const payTrend = yesterdayStats.paymentAmount > 0
        ? ((todayStats.paymentAmount - yesterdayStats.paymentAmount) / yesterdayStats.paymentAmount) * 100
        : null;

    // ─ chart configs ─
    const PALETTE = ['#9D174D', '#be185d', '#db2777', '#f472b6', '#fce7f3', '#7b1239'];

    const barData = {
        labels: weeklyData.map(d => dayLabel(d.date)),
        datasets: [{
            label: t('विक्री (Sales)', 'Sales (₹)'),
            data: weeklyData.map(d => d.amount),
            backgroundColor: weeklyData.map((d, i) =>
                d.date === selectedDate ? '#9D174D' : '#f9a8d4'
            ),
            borderRadius: 6,
            borderSkipped: false,
        }]
    };
    const barOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN') } } },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 11 } } },
            y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v), font: { size: 11 } }, border: { display: false } }
        }
    };

    const doughnutData = {
        labels: productBreakdown.map(([n]) => n),
        datasets: [{
            data: productBreakdown.map(([, v]) => v),
            backgroundColor: PALETTE,
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 8,
        }]
    };
    const doughnutOptions = {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 }, padding: 12 } },
            tooltip: { callbacks: { label: ctx => ' ₹' + ctx.raw.toLocaleString('en-IN') } }
        }
    };

    const totalOutstanding = merchantOutstanding.reduce((s, m) => s + m.balance, 0);

    if (loading) return (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium">{t('डॅशबोर्ड लोड होत आहे...', 'Loading dashboard...')}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900">
                        {new Date().getHours() < 12 ? t('शुभ सकाळ 🌅', 'Good Morning 🌅') : new Date().getHours() < 17 ? t('शुभ दुपार ☀️', 'Good Afternoon ☀️') : t('शुभ संध्या 🌙', 'Good Evening 🌙')}
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input 
                        type="date"
                        value={selectedDate}
                        max={today()}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="text-sm border border-slate-200 rounded-lg px-3 py-2 text-slate-700 bg-white focus:outline-none focus:border-primary shadow-sm"
                    />
                    <button
                        onClick={fetchAll}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <span className="material-icons-round text-base">refresh</span>
                        <span className="hidden sm:inline">{t('ताजे करा', 'Refresh')}</span>
                    </button>
                </div>
            </div>

            {/* ── KPI Row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label={selectedDate === today() ? t('आजची पट्टी विक्री', "Today's Patti Sales") : t('निवडलेल्या दिवसाची विक्री', "Selected Day's Sales")}
                    value={fmt(todayStats.totalAmount)}
                    sub={`${todayStats.pattis} ${t('पट्ट्या तयार', 'pattis generated')}`}
                    trend={amtTrend}
                    icon={ScrollText}
                    accent="bg-primary/10 text-primary"
                />
                <StatCard
                    label={t('जमा झालेली रक्कम', 'Payments Collected')}
                    value={fmt(todayStats.paymentAmount)}
                    sub={`${todayStats.payments} ${t('पावत्या आज', 'receipts today')}`}
                    trend={payTrend}
                    icon={IndianRupee}
                    accent="bg-primary/20 text-primary"
                />
                <StatCard
                    label={t('एकूण शिल्लक', 'Total Outstanding')}
                    value={fmt(totalOutstanding)}
                    sub={`${merchantOutstanding.length} ${t('व्यापारी बाकी', 'merchants with dues')}`}
                    trend={null}
                    icon={AlertCircle}
                    accent="bg-rose-100 text-rose-700"
                />
                <StatCard
                    label={t('सक्रिय नोंदी', 'Active Masters')}
                    value={masterCounts.merchants + masterCounts.farmers + masterCounts.products}
                    sub={`${masterCounts.merchants} ${t('व्यापारी', 'merchants')} · ${masterCounts.farmers} ${t('शेतकरी', 'farmers')}`}
                    trend={null}
                    icon={Users}
                    accent="bg-slate-100 text-slate-600"
                />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Bar chart — 7-day sales */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-500 text-slate-800 mb-1">{t('७ दिवसांचा विक्री आलेख', '7-Day Sales Trend')}</h2>
                            <p className="text-xs text-slate-400">{t('हिशोब पट्टी एकूण रक्कम · आज ठळक', 'Hishob Patti net amounts · today highlighted')}</p>
                        </div>
                    </div>
                    <div className="h-52">
                        {weeklyData.some(d => d.amount > 0)
                            ? <Bar data={barData} options={barOptions} />
                            : <div className="h-full flex items-center justify-center text-slate-300 text-sm">{t('गेल्या ७ दिवसांत पट्टी नाही', 'No patti data for last 7 days')}</div>
                        }
                    </div>
                </div>

                {/* Doughnut — product mix */}
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="mb-4">
                        <h2 className="font-bold text-slate-800">{t('माल विभाजन', 'Product Mix')}</h2>
                        <p className="text-xs text-slate-400">{t('या आठवड्याची विक्री रक्कम', 'By sale amount this week')}</p>
                    </div>
                    <div className="h-52">
                        {productBreakdown.length > 0
                            ? <Doughnut data={doughnutData} options={doughnutOptions} />
                            : <div className="h-full flex items-center justify-center text-slate-300 text-sm">{t('या आठवड्यात माहिती नाही', 'No data this week')}</div>
                        }
                    </div>
                </div>
            </div>

            {/* ── Bottom Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Recent Pattis */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-800">{t('अलीकडील पट्ट्या', 'Recent Pattis')}</h2>
                        <button onClick={() => onNavigate?.('hishob-patti')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                            {t('सर्व पहा', 'View all')} <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-2">
                        {recentPattis.length === 0
                            ? <p className="text-slate-300 text-sm text-center py-6">{t('अजून पट्ट्या नाहीत', 'No pattis yet')}</p>
                            : recentPattis.map((p, i) => (
                                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-700 truncate">{p.farmers?.name || '—'}</p>
                                        <p className="text-xs text-slate-400 font-mono">{p.receipt_no} · {dayLabel(p.date)}</p>
                                    </div>
                                    <span className="text-sm font-bold text-slate-800 ml-2 shrink-0">{fmt(p.net_amount)}</span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Outstanding Merchants */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-slate-800">{t('जास्त शिल्लक', 'Top Outstanding')}</h2>
                        <button onClick={() => onNavigate?.('khatavni')} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1">
                            {t('खतावणी', 'Ledger')} <ArrowRight size={12} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {merchantOutstanding.length === 0
                            ? <p className="text-slate-300 text-sm text-center py-6">{t('सर्व साफ — शिल्लक नाही!', 'All clear — no outstanding!')}</p>
                            : merchantOutstanding.map((m, i) => {
                                const pct = Math.round((m.balance / totalOutstanding) * 100);
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-slate-700 truncate max-w-[60%]">{m.name}</span>
                                            <span className="text-sm font-bold text-primary">{fmt(m.balance)}</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/60 rounded-full" style={{ width: pct + '%' }} />
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                    <h2 className="font-bold text-slate-800 mb-4">{t('त्वरित प्रवेश', 'Quick Actions')}</h2>
                    <div className="space-y-2">
                        <QuickAction icon={ScrollText} label={t('नवीन हिशोब पट्टी', 'New Hishob Patti')} sublabel={t('शेतकरी विक्री नोंद', 'Record farmer sale')} onClick={() => onNavigate?.('hishob-patti')} />
                        <QuickAction icon={FileCheck} label={t('जमा पावती', 'Jama Pavti')} sublabel={t('पेमेंट नोंद', 'Record payment received')} onClick={() => onNavigate?.('jama-pavti')} />
                        <QuickAction icon={FileText} label={t('व्यापारी बिल', 'Merchant Bill')} sublabel={t('दैनंदिन बिल', 'View daily bill')} onClick={() => onNavigate?.('merchant-bill')} />
                        <QuickAction icon={ClipboardList} label={t('पट्टी नोंद', 'Patti Nond')} sublabel={t('दैनंदिन नोंदवही', 'Daily register')} onClick={() => onNavigate?.('patti-nond')} />
                        <QuickAction icon={BookOpen} label={t('व्यापारी खतावणी', 'Vyapari Khatavni')} sublabel={t('व्यापारी खाते', 'Merchant ledger')} onClick={() => onNavigate?.('khatavni')} />
                    </div>
                </div>
            </div>

            {/* ── Footer ── */}
            <p className="text-center text-xs text-slate-300 pb-2">
                © 2026 {t('श्री जय सप्तश्रृंगी व्हेजिटेबल कं.', 'Shri Jay Saptashrungi Vegetable Co.')} · {t('सर्व हक्क राखीव', 'All Rights Reserved')}
            </p>
        </div>
    );
}

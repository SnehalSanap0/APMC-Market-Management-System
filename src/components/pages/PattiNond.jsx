import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Printer } from 'lucide-react';
import { printWithFilename } from '../../lib/printWithFilename';
import { useLanguage } from '../../lib/language';
import PrintHeader from '../shared/PrintHeader';

export default function PattiNond() {
    const { t } = useLanguage();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([]);
    const [totals, setTotals] = useState({
        amount: 0,
        revenueStamp: 0,
        finalAmount: 0
    });

    useEffect(() => {
        const fetchNond = async () => {
            if (!date) return;
            setLoading(true);

            const { data, error } = await supabase
                .from('hishob_entries')
                .select(`
                    id,
                    receipt_no,
                    net_amount
                `)
                .eq('date', date)
                .order('receipt_no', { ascending: true });

            if (error) {
                console.error('Error fetching patti nond:', error);
                setLoading(false);
                return;
            }

            // Process data
            let totalAmt = 0;
            let totalStamp = 0;
            let totalFinal = 0;

            const processedEntries = (data || []).map(entry => {
                const amount = parseFloat(entry.net_amount) || 0;
                const revenueStamp = amount > 5000 ? 1 : 0;
                const finalAmount = amount - revenueStamp;

                totalAmt += amount;
                totalStamp += revenueStamp;
                totalFinal += finalAmount;

                return {
                    id: entry.id,
                    receipt_no: entry.receipt_no,
                    amount: amount,
                    revenueStamp: revenueStamp,
                    finalAmount: finalAmount
                };
            });

            setEntries(processedEntries);
            setTotals({
                amount: totalAmt,
                revenueStamp: totalStamp,
                finalAmount: totalFinal
            });

            setLoading(false);
        };
        fetchNond();
    }, [date]);

    // Helpers to split currency into traditional Rupee and Paise columns
    const getRs = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '';
        if (val === 0) return '0';
        return Math.floor(val).toString();
    };

    const getPaise = (val) => {
        if (val === null || val === undefined || isNaN(val)) return '';
        if (val === 0) return '00';
        return Math.round((val - Math.floor(val)) * 100).toString().padStart(2, '0');
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 print:bg-white print:p-0">
            <div className="max-w-6xl mx-auto space-y-6 print:space-y-4">

                {/* Header Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('पट्टी नोंद', 'Patti Nond')}</h1>
                    </div>

                    {/* Filters & Actions */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner">
                            <div className="flex items-center gap-2">
                                <span className="material-icons-round text-slate-400 pl-2">calendar_today</span>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-slate-700 font-medium font-mono cursor-pointer outline-none"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                const [y, m, d] = date.split('-');
                                printWithFilename(`PattiNond_${d}-${m}-${y}`);
                            }}
                            className="p-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2"
                            disabled={entries.length === 0}
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline font-medium text-sm">{t('लेजर प्रिंट करा', 'Print Ledger')}</span>
                        </button>
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-4">
                    <PrintHeader 
                        docTitle="पट्टी नोंद (Patti Nond)" 
                        rightInfo={[
                            { label: 'Date', value: new Date(date).toLocaleDateString('en-GB') }
                        ]}
                    />
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-sm shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none print:overflow-visible">
                    {loading ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
                            <p className="text-slate-500 font-medium">Loading register...</p>
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-400 print:hidden">
                            <span className="material-icons-round text-6xl mb-4 text-slate-200">receipt_long</span>
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No Pattis Found</h3>
                            <p>There are no Hishob Pattis generated for {new Date(date).toLocaleDateString('en-GB')}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="w-full text-center border-collapse border-b-2 border-l-2 border-r-2 border-green-800 text-green-900 devanagari print:text-xs">
                                <thead className="font-bold border-t-2 border-green-800 bg-green-50/10">
                                    <tr>
                                        <th rowSpan="2" className="border-r-2 border-b-2 border-green-800 p-2 font-medium w-24">पट्टी नं.</th>
                                        <th colSpan="2" className="border-r-2 border-b border-green-800 p-1 font-medium italic tracking-wide">मालाची किंमत</th>
                                        <th colSpan="2" className="border-r-2 border-b border-green-800 p-1 font-medium tracking-wide">आडत</th>
                                        <th colSpan="2" className="border-r-2 border-b border-green-800 p-1 font-medium tracking-wide">हमाली</th>
                                        <th colSpan="2" className="border-r-2 border-b border-green-800 p-1 font-medium tracking-wide">रे. स्टॅम्प</th>
                                        <th colSpan="2" className="border-r-2 border-b border-green-800 p-1 font-medium tracking-wide">एकूण खर्च</th>
                                        <th colSpan="2" className="border-b border-green-800 p-1 font-medium tracking-wide">नक्की बाकी</th>
                                    </tr>
                                    <tr className="border-b-2 border-green-800 text-sm">
                                        <th className="border-r border-green-800 p-1 font-normal w-20">रुपये</th>
                                        <th className="border-r-2 border-green-800 p-1 font-normal w-12">पैसे</th>

                                        <th className="border-r border-green-800 p-1 font-normal w-20">रुपये</th>
                                        <th className="border-r-2 border-green-800 p-1 font-normal w-12">पैसे</th>

                                        <th className="border-r border-green-800 p-1 font-normal w-20">रुपये</th>
                                        <th className="border-r-2 border-green-800 p-1 font-normal w-12">पैसे</th>

                                        <th className="border-r border-green-800 p-1 font-normal w-16">रुपये</th>
                                        <th className="border-r-2 border-green-800 p-1 font-normal w-12">पैसे</th>

                                        <th className="border-r border-green-800 p-1 font-normal w-20">रुपये</th>
                                        <th className="border-r-2 border-green-800 p-1 font-normal w-12">पैसे</th>

                                        <th className="border-r border-green-800 p-1 font-normal w-20">रुपये</th>
                                        <th className="p-1 font-normal w-12">पैसे</th>
                                    </tr>
                                </thead>
                                <tbody className="font-mono text-sm print:text-[11px] align-top">
                                    {entries.map((entry) => (
                                        <tr key={entry.id} className="border-b border-green-300/40 hover:bg-green-50/30">
                                            {/* Receipt No */}
                                            <td className="border-r-2 border-green-800 p-1 font-sans text-xs">{entry.receipt_no}</td>

                                            {/* मालाची किंमत (Gross Amount) */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2">{getRs(entry.amount)}</td>
                                            <td className="border-r-2 border-green-800 p-1 text-center">{getPaise(entry.amount)}</td>

                                            {/* आडत (Commission) - Empty */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2"></td>
                                            <td className="border-r-2 border-green-800 p-1 text-center"></td>

                                            {/* हमाली (Labor) - Empty */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2"></td>
                                            <td className="border-r-2 border-green-800 p-1 text-center"></td>

                                            {/* रे. स्टॅम्प (Revenue Stamp) */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2">{entry.revenueStamp > 0 ? getRs(entry.revenueStamp) : ''}</td>
                                            <td className="border-r-2 border-green-800 p-1 text-center">{entry.revenueStamp > 0 ? getPaise(entry.revenueStamp) : ''}</td>

                                            {/* एकूण खर्च (Total Expense) - Empty */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2"></td>
                                            <td className="border-r-2 border-green-800 p-1 text-center"></td>

                                            {/* नक्की बाकी (Final Amount) */}
                                            <td className="border-r border-green-400 p-1 text-right pr-2 font-bold">{getRs(entry.finalAmount)}</td>
                                            <td className="p-1 text-center font-bold">{getPaise(entry.finalAmount)}</td>
                                        </tr>
                                    ))}

                                    {/* Additional Blank Rows to fill page (like analog ledger) */}
                                    {Array.from({ length: Math.max(0, 15 - entries.length) }).map((_, i) => (
                                        <tr key={`blank-${i}`} className="border-b border-green-300/40 h-8">
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="border-r-2 border-green-800 p-1"></td>
                                            <td className="border-r border-green-400 p-1"></td>
                                            <td className="p-1"></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="font-bold border-t-2 border-green-800 bg-green-50/20 text-sm print:text-[12px]">
                                    <tr>
                                        <td className="border-r-2 border-green-800 p-2 devanagari text-right">एकूण</td>
                                        <td className="border-r border-green-400 p-2 text-right pr-2">{getRs(totals.amount)}</td>
                                        <td className="border-r-2 border-green-800 p-2 text-center">{getPaise(totals.amount)}</td>

                                        <td className="border-r border-green-400 p-2 text-right pr-2"></td>
                                        <td className="border-r-2 border-green-800 p-2 text-center"></td>

                                        <td className="border-r border-green-400 p-2 text-right pr-2"></td>
                                        <td className="border-r-2 border-green-800 p-2 text-center"></td>

                                        <td className="border-r border-green-400 p-2 text-right pr-2">{totals.revenueStamp > 0 ? getRs(totals.revenueStamp) : ''}</td>
                                        <td className="border-r-2 border-green-800 p-2 text-center">{totals.revenueStamp > 0 ? getPaise(totals.revenueStamp) : ''}</td>

                                        <td className="border-r border-green-400 p-2 text-right pr-2"></td>
                                        <td className="border-r-2 border-green-800 p-2 text-center"></td>

                                        <td className="border-r border-green-400 p-2 text-right pr-2">{getRs(totals.finalAmount)}</td>
                                        <td className="p-2 text-center">{getPaise(totals.finalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

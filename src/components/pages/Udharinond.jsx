import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../lib/language';
import { Printer } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printWithFilename } from '../../lib/printWithFilename';

export default function Udharinond() {
    const { t } = useLanguage();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (date) {
            fetchUdharinond();
        }
    }, [date]);

    const fetchUdharinond = async () => {
        setLoading(true);

        // Fetch all merchants
        const mRes = await supabase.from('merchants').select('id, name').order('name');

        // Fetch ledger up to this date
        const lRes = await supabase
            .from('merchant_ledger')
            .select('*')
            .lte('date', date);

        if (mRes.data && lRes.data) {
            const result = [];
            for (const m of mRes.data) {
                // Filter ledger for this merchant
                const mLedger = lRes.data.filter(l => l.merchant_id === m.id);

                // Magil Baki (Previous Balance) = Sum(debit) - Sum(credit) where date < selected date
                let magilBaki = 0;
                // Chalu Kalam (Current Debit) = Sum(debit) where date == selected date
                let chaluKalam = 0;
                // Jama (Current Credit) = Sum(credit) where date == selected date
                let jama = 0;

                mLedger.forEach(l => {
                    const de = parseFloat(l.debit) || 0;
                    const cr = parseFloat(l.credit) || 0;
                    if (l.date < date) {
                        magilBaki += de - cr;
                    } else if (l.date === date) {
                        chaluKalam += de;
                        jama += cr;
                    }
                });

                const ekunYene = magilBaki + chaluKalam;
                const nakkiBaki = ekunYene - jama;

                // Only show if there's *any* activity or balance
                if (magilBaki > 0 || chaluKalam > 0 || jama > 0 || nakkiBaki > 0) {
                    result.push({
                        id: m.id,
                        name: m.name,
                        magilBaki,
                        chaluKalam,
                        ekunYene,
                        jama,
                        nakkiBaki
                    });
                }
            }
            setEntries(result);
        }
        setLoading(false);
    };

    const totals = entries.reduce((acc, row) => ({
        magilBaki: acc.magilBaki + row.magilBaki,
        chaluKalam: acc.chaluKalam + row.chaluKalam,
        ekunYene: acc.ekunYene + row.ekunYene,
        jama: acc.jama + row.jama,
        nakkiBaki: acc.nakkiBaki + row.nakkiBaki
    }), { magilBaki: 0, chaluKalam: 0, ekunYene: 0, jama: 0, nakkiBaki: 0 });

    const formatCurrency = (val) => {
        if (!val || val === 0) return '-';
        return val.toFixed(2);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full print:p-0">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Controls - Hidden in Print */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{t('उधारीनोंद', 'Udharinond')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="border border-slate-300 bg-white px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none font-medium"
                        />
                        <button
                            onClick={() => {
                                const [y, m, d] = date.split('-');
                                printWithFilename(`Udharinond_${d}-${m}-${y}`);
                            }}
                            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 px-4"
                            disabled={entries.length === 0}
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline font-medium text-sm">{t('प्रिंट करा', 'Print')}</span>
                        </button>
                    </div>
                </div>

                {/* Print Context Layout */}
                <div className="print:block hidden bg-white">
                    <PrintHeader 
                        docTitle="व्यापारी उधारीनोंद · Udharinond"
                        rightInfo={[
                            { label: 'दिनांक / Date', value: new Date(date).toLocaleDateString('en-GB') }
                        ]}
                    />
                </div>

                {/* Table Layout */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-slate-300 print:text-sm font-marathi">
                            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-xs print:bg-transparent print:text-black print:text-base">
                                <tr>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black min-w-[200px]">व्यापाऱ्याचे नाव</th>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black text-right">चालु कलम</th>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black text-right">मागील बाकी</th>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black text-right">एकूण येणे</th>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black text-right">जमा</th>
                                    <th className="p-4 print:p-2 border border-slate-300 print:border-black text-right">नक्की बाकी</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 print:border-black">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 print:hidden">Loading...</td></tr>
                                ) : entries.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 print:hidden">No outstanding balances for this date.</td></tr>
                                ) : (
                                    entries.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 print:border-b print:border-black">
                                            <td className="p-3 print:p-2 font-bold border border-slate-300 print:border-black">
                                                {row.name}
                                            </td>
                                            <td className="p-3 print:p-2 text-right border border-slate-300 print:border-black font-semibold">
                                                {formatCurrency(row.chaluKalam)}
                                            </td>
                                            <td className="p-3 print:p-2 text-right border border-slate-300 print:border-black">
                                                {formatCurrency(row.magilBaki)}
                                            </td>
                                            <td className="p-3 print:p-2 text-right border border-slate-300 print:border-black font-semibold">
                                                {formatCurrency(row.ekunYene)}
                                            </td>
                                            <td className="p-3 print:p-2 text-right border border-slate-300 print:border-black font-bold">
                                                {formatCurrency(row.jama)}
                                            </td>
                                            <td className="p-3 print:p-2 text-right border border-slate-300 print:border-black font-bold text-lg print:text-base">
                                                {formatCurrency(row.nakkiBaki)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && entries.length > 0 && (
                                <tfoot className="bg-slate-100 text-slate-900 font-bold print:bg-transparent print:text-black">
                                    <tr className="print:border-t-2 print:border-black text-lg print:text-base">
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black uppercase text-sm tracking-wider">
                                            {t('एकूण', 'Total')}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black">
                                            {formatCurrency(totals.chaluKalam)}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black">
                                            {formatCurrency(totals.magilBaki)}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black">
                                            {formatCurrency(totals.ekunYene)}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black">
                                            {formatCurrency(totals.jama)}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300 print:border-black">
                                            {formatCurrency(totals.nakkiBaki)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

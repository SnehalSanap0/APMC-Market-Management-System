import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Printer } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printDocument } from '../../lib/printDocument';
import { useLanguage } from '../../lib/language';

export default function DhadaBook() {
    const { t } = useLanguage();
    const printRef = useRef(null);
    const [entries, setEntries] = useState([]);
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchDhadaBook();
    }, [date]);

    const fetchDhadaBook = async () => {
        setLoading(true);
        const [dhadaRes, depositsRes] = await Promise.all([
            supabase
                .from('dhada_entries')
                .select(`
                    *,
                    merchants (name),
                    merchant_bills (bill_no, gross_total, net_amount)
                `)
                .eq('date', date)
                .order('created_at', { ascending: false }),
            supabase
                .from('merchant_payments')
                .select('amount, merchant_id, payment_no')
                .eq('date', date)
                .order('created_at', { ascending: false })
        ]);

        if (dhadaRes.error) {
            console.error(dhadaRes.error);
        } else {
            const depositsList = depositsRes.data || [];
            // Guarantee one entry per merchant per day for UI reliability
            const deduplicated = (dhadaRes.data || []).reduce((acc, current) => {
                if (!acc.some(item => item.merchant_id === current.merchant_id)) {
                    // Match any jama pavti for this merchant on this day
                    const matchingJamaRows = depositsList.filter(d => d.merchant_id === current.merchant_id);
                    const matchingJama = matchingJamaRows.reduce((sum, d) => sum + d.amount, 0);
                    const matchingJamaNo = matchingJamaRows.length > 0 ? matchingJamaRows[0].payment_no : null;
                    acc.push({ ...current, jama_amount: matchingJama, jama_no: matchingJamaNo });
                }
                return acc;
            }, []);
            setEntries(deduplicated);
        }

        setLoading(false);
    };

    // Totals
    const totals = entries.reduce((acc, row) => ({
        jama: acc.jama + (row.jama_amount || 0),
        chaluKalam: acc.chaluKalam + ((row.merchant_bills && row.merchant_bills.gross_total) || 0),
        market: acc.market + (row.market_fee || 0),
        supervision: acc.supervision + (row.supervision_fee || 0),
        donation: acc.donation + (row.donation || 0),
        commission: acc.commission + (row.commission || 0),
        addedCharges: acc.addedCharges + (row.market_fee || 0) + (row.supervision_fee || 0) + (row.donation || 0) + (row.commission || 0),
        total: acc.total + ((row.merchant_bills && row.merchant_bills.net_amount) || row.total_income || 0)
    }), { jama: 0, chaluKalam: 0, market: 0, supervision: 0, donation: 0, commission: 0, addedCharges: 0, total: 0 });

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
            <div ref={printRef} className="max-w-7xl mx-auto space-y-6">

                {/* Header (Hidden in Print) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{t('धडा बुक', 'Dhada Book')}</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="border border-slate-300 bg-white px-3 py-2 rounded-lg focus:ring-primary focus:border-primary focus:outline-none focus:ring-1"
                        />
                        <button
                            onClick={() => {
                                const [y, m, d] = date.split('-');
                                printDocument(printRef.current, `DhadaBook_${d}-${m}-${y}`, { orientation: 'landscape' });
                            }}
                            className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 px-4"
                            disabled={entries.length === 0}
                        >
                            <Printer size={18} />
                            <span className="hidden sm:inline font-medium text-sm">{t('प्रिंट करा', 'Print')}</span>
                        </button>
                    </div>
                </div>

                {/* Print Header (Visible only in Print) */}
                <PrintHeader
                    docTitle="धडा बुक"
                    rightInfo={[
                        { label: 'Date', value: new Date(date).toLocaleDateString('en-GB') }
                    ]}
                />

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none print:overflow-visible">
                    <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full text-left text-sm whitespace-nowrap border-collapse border border-slate-300 print:text-xs">
                            <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs print:bg-transparent print:text-black">
                                <tr>
                                    {/* DEPOSITS (JAMA) SIDE */}
                                    <th className="p-4 print:p-2 border border-slate-300">
                                        <span className="print:hidden">{t('जमा पावती क्र.', 'Receipt No')}</span><span className="hidden print:inline">पावती क्र.</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300">
                                        <span className="print:hidden">{t('व्यापारी नाव', 'Merchant Name')}</span><span className="hidden print:inline">व्यापारी</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('जमा रक्कम', 'Deposit Amount')}</span><span className="hidden print:inline">जमा रक्कम</span>
                                    </th>

                                    {/* BILLS (NAVE) SIDE */}
                                    <th className="p-4 print:p-2 border border-slate-300">
                                        <span className="print:hidden">{t('बिल क्रमांक', 'Bill No')}</span><span className="hidden print:inline">बिल क्र.</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300">
                                        <span className="print:hidden">{t('व्यापारी नाव', 'Merchant Name')}</span><span className="hidden print:inline">व्यापारी</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('चालू कलाम', 'Chalu Kalam')}</span><span className="hidden print:inline">चालू कलाम</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('आदत', 'Commission')}</span><span className="hidden print:inline">मार्केट फी</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('मार्केट फी', 'Market fee')}</span><span className="hidden print:inline">सुपरविजन</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('सुपरविजन खर्च', 'Supervision Cost')}</span><span className="hidden print:inline">दान</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('धर्मादाय', 'Charity')}</span><span className="hidden print:inline">कमीशन</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('एकूण खर्च', 'Total Charges')}</span><span className="hidden print:inline">एकूण खर्च</span>
                                    </th>
                                    <th className="p-4 print:p-2 border border-slate-300 text-right">
                                        <span className="print:hidden">{t('एकूण रक्कम', 'Final Amount')}</span><span className="hidden print:inline">अंतिम रक्कम</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 print:divide-slate-800">
                                {loading ? (
                                    <tr><td colSpan="11" className="p-8 text-center text-slate-400">Loading entries...</td></tr>
                                ) : entries.length === 0 ? (
                                    <tr><td colSpan="11" className="p-8 text-center text-slate-400">No entries for this date.</td></tr>
                                ) : (
                                    entries.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 print:border-b print:border-slate-800">

                                            {/* DEPOSIT COLUMNS mapped to right side Merchant */}
                                            <td className="p-4 print:p-2 font-mono text-xs border border-slate-300 print:border-slate-800">
                                                {row.jama_no || '-'}
                                            </td>
                                            <td className="p-4 print:p-2 font-medium border border-slate-300 print:border-slate-800">
                                                {row.merchants?.name || '-'}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800 font-bold">
                                                {row.jama_amount ? `₹ ${row.jama_amount.toFixed(2)}` : ''}
                                            </td>

                                            {/* ENTRY COLUMNS */}
                                            <td className="p-4 print:p-2 font-mono text-xs border border-slate-300 print:border-slate-800">
                                                {row.merchant_bills?.bill_no || '-'}
                                            </td>
                                            <td className="p-4 print:p-2 font-medium border border-slate-300 print:border-slate-800">
                                                {row.merchants?.name || '-'}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800 font-bold">
                                                ₹ {(row.merchant_bills?.gross_total || 0).toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800">
                                                ₹ {row.market_fee.toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800">
                                                ₹ {row.supervision_fee.toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800">
                                                ₹ {row.donation.toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800">
                                                ₹ {row.commission.toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right border border-slate-300 print:border-slate-800 text-sm">
                                                ₹ {(row.market_fee + row.supervision_fee + row.donation + row.commission).toFixed(2)}
                                            </td>
                                            <td className="p-4 print:p-2 text-right font-bold border border-slate-300 print:border-slate-800 text-sm">
                                                ₹ {(row.merchant_bills?.net_amount || row.total_income || 0).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && entries.length > 0 && (
                                <tfoot className="bg-slate-100 text-slate-800 font-bold print:bg-transparent print:text-black">
                                    <tr>
                                        {/* DEPOSIT TOTALS */}
                                        <td colSpan="2" className="p-4 print:p-2 text-right border border-slate-300 uppercase text-xs tracking-wider">
                                            {t('एकूण जमा', 'Total')}
                                        </td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">
                                            ₹ {totals.jama.toFixed(2)}
                                        </td>

                                        {/* ENTRY TOTALS */}
                                        <td colSpan="2" className="p-4 print:p-2 border border-slate-300"></td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.chaluKalam.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.market.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.supervision.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.donation.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.commission.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.addedCharges.toFixed(2)}</td>
                                        <td className="p-4 print:p-2 text-right border border-slate-300">₹ {totals.total.toFixed(2)}</td>
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

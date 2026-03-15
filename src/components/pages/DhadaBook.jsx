import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function DhadaBook() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchDhadaBook();
    }, [date]);

    const fetchDhadaBook = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('dhada_entries')
            .select(`
                *,
                merchants (name),
                merchant_bills (bill_no, gross_total, net_amount)
            `)
            .eq('date', date)
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            // Guarantee one entry per merchant per day for UI reliability
            const deduplicated = (data || []).reduce((acc, current) => {
                if (!acc.some(item => item.merchant_id === current.merchant_id)) {
                    acc.push(current);
                }
                return acc;
            }, []);
            setEntries(deduplicated);
        }
        setLoading(false);
    };

    // Totals
    const totals = entries.reduce((acc, row) => ({
        chaluKalam: acc.chaluKalam + ((row.merchant_bills && row.merchant_bills.gross_total) || 0),
        market: acc.market + (row.market_fee || 0),
        supervision: acc.supervision + (row.supervision_fee || 0),
        donation: acc.donation + (row.donation || 0),
        commission: acc.commission + (row.commission || 0),
        total: acc.total + ((row.merchant_bills && row.merchant_bills.net_amount) || row.total_income || 0)
    }), { chaluKalam: 0, market: 0, supervision: 0, donation: 0, commission: 0, total: 0 });

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Dhada Book</h1>
                        <p className="text-slate-500 text-sm">Daily Income & Fee Register</p>
                    </div>
                    <div>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4 border-b">Bill No</th>
                                    <th className="p-4 border-b">Merchant</th>
                                    <th className="p-4 border-b text-right border-l border-slate-200">Chalu Kalam</th>
                                    <th className="p-4 border-b text-right">Market Fee (6%)</th>
                                    <th className="p-4 border-b text-right">Supervision (1%)</th>
                                    <th className="p-4 border-b text-right">Donation (0.05%)</th>
                                    <th className="p-4 border-b text-right">Comm. (₹1)</th>
                                    <th className="p-4 border-b text-right w-32 bg-slate-100 border-l border-slate-200">Final Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Loading entries...</td></tr>
                                ) : entries.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">No entries for this date.</td></tr>
                                ) : (
                                    entries.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-mono text-xs">{row.merchant_bills?.bill_no || '-'}</td>
                                            <td className="p-4 font-medium">{row.merchants?.name || '-'}</td>
                                            <td className="p-4 text-right border-l border-slate-100 font-medium">₹ {(row.merchant_bills?.gross_total || 0).toFixed(2)}</td>
                                            <td className="p-4 text-right">₹ {row.market_fee.toFixed(2)}</td>
                                            <td className="p-4 text-right">₹ {row.supervision_fee.toFixed(2)}</td>
                                            <td className="p-4 text-right">₹ {row.donation.toFixed(2)}</td>
                                            <td className="p-4 text-right">₹ {row.commission.toFixed(2)}</td>
                                            <td className="p-4 text-right font-bold bg-slate-50/50 border-l border-slate-100">₹ {(row.merchant_bills?.net_amount || row.total_income || 0).toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {!loading && entries.length > 0 && (
                                <tfoot className="bg-slate-900 text-white font-bold">
                                    <tr>
                                        <td colSpan="2" className="p-4 text-right text-slate-400 uppercase text-xs tracking-wider"></td>
                                        <td className="p-4 text-right text-white border-l border-slate-700">₹ {totals.chaluKalam.toFixed(2)}</td>
                                        <td className="p-4 text-right">₹ {totals.market.toFixed(2)}</td>
                                        <td className="p-4 text-right">₹ {totals.supervision.toFixed(2)}</td>
                                        <td className="p-4 text-right">₹ {totals.donation.toFixed(2)}</td>
                                        <td className="p-4 text-right">₹ {totals.commission.toFixed(2)}</td>
                                        <td className="p-4 text-right bg-slate-800 text-yellow-400 border-l border-slate-700">₹ {totals.total.toFixed(2)}</td>
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

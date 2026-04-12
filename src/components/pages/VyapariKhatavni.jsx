import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../lib/language';

export default function VyapariKhatavni() {
    const { t } = useLanguage();
    const [merchants, setMerchants] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [ledger, setLedger] = useState([]);
    const [loading, setLoading] = useState(false);

    async function fetchMasters() {
        const { data } = await supabase.from('merchants').select('*').order('name');
        if (data) setMerchants(data);
    }

    async function fetchLedger() {
        setLoading(true);
        // Fetch all ledger entries for this merchant ordered by date
        const { data, error } = await supabase
            .from('merchant_ledger')
            .select('*')
            .eq('merchant_id', selectedMerchant)
            .order('date', { ascending: true })
            .order('created_at', { ascending: true }); // Secondary sort for same-day sequence

        if (error) {
            console.error('Error fetching ledger:', error);
        } else if (data) {
            // Group by Date
            const groupedByDate = {};
            data.forEach((entry) => {
                // Handle different date formats gracefully
                const dateObj = new Date(entry.date);
                const dateKey = !isNaN(dateObj) ? dateObj.toISOString().split('T')[0] : entry.date;

                if (!groupedByDate[dateKey]) {
                    groupedByDate[dateKey] = {
                        id: dateKey,
                        date: entry.date,
                        totalDebit: 0,
                        totalCredit: 0,
                        references: new Set()
                    };
                }
                groupedByDate[dateKey].totalDebit += parseFloat(entry.debit) || 0;
                groupedByDate[dateKey].totalCredit += parseFloat(entry.credit) || 0;
                if (entry.reference_type) {
                    groupedByDate[dateKey].references.add(entry.reference_type);
                }
            });

            // Calculate Running Balance
            let runningBalance = 0;
            const processedData = Object.values(groupedByDate)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map(group => {
                    runningBalance = runningBalance + group.totalDebit - group.totalCredit;

                    let refTypeDesc = 'Transaction';
                    if (group.references.has('BILL') && group.references.has('PAYMENT')) {
                        refTypeDesc = 'Bill & Payment';
                    } else if (group.references.has('BILL')) {
                        refTypeDesc = 'Bill';
                    } else if (group.references.has('PAYMENT')) {
                        refTypeDesc = 'Payment';
                    } else if (group.references.size > 0) {
                        refTypeDesc = Array.from(group.references).join(', ');
                    }

                    return {
                        id: group.id,
                        date: group.date,
                        debit: group.totalDebit,
                        credit: group.totalCredit,
                        runningBalance,
                        description: refTypeDesc,
                        refsStr: Array.from(group.references).join(', ')
                    };
                });
            setLedger(processedData);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchMasters();
    }, []);

    useEffect(() => {
        if (selectedMerchant) {
            fetchLedger();
        } else {
            setLedger([]);
        }
    }, [selectedMerchant]);

    // Current Balance is the balance of the last entry
    const currentBalance = ledger.length > 0 ? ledger[ledger.length - 1].runningBalance : 0;

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header & Controls */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{t('व्यापारी खतावणी', 'Merchant Ledger')}</h1>
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            value={selectedMerchant}
                            onChange={e => setSelectedMerchant(e.target.value)}
                            style={{ backgroundColor: '#ffffff', color: '#0f172a', appearance: 'auto' }}
                            className="w-full border border-slate-300 px-3 py-2 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                        >
                            <option value="">{t('व्यापारी निवडा', 'Select Merchant')}</option>
                            {merchants.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedMerchant && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Summary Card */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-1">
                            <h3 className="text-slate-500 text-sm uppercase font-bold mb-2">Current Outstanding</h3>
                            <div className={`text-4xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                ₹ {Math.abs(currentBalance).toFixed(2)}
                                <span className="text-sm ml-2 font-normal text-slate-500">
                                    {currentBalance > 0 ? '(Debit/Dr)' : '(Credit/Cr)'}
                                </span>
                            </div>
                        </div>

                        {/* Ledger Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 col-span-1 md:col-span-2 overflow-hidden">
                            <div className="max-h-[600px] overflow-y-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 uppercase font-medium sticky top-0">
                                        <tr>
                                            <th className="p-4 border-b">Date</th>
                                            <th className="p-4 border-b">Description</th>
                                            <th className="p-4 border-b text-right">Debit (Bill)</th>
                                            <th className="p-4 border-b text-right">Credit (Paid)</th>
                                            <th className="p-4 border-b text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">Loading ledger...</td></tr>
                                        ) : ledger.length === 0 ? (
                                            <tr><td colSpan="5" className="p-8 text-center text-slate-400">No transactions found.</td></tr>
                                        ) : (
                                            ledger.map((row) => (
                                                <tr key={row.id} className="hover:bg-slate-50">
                                                    <td className="p-4 whitespace-nowrap">{new Date(row.date).toLocaleDateString()}</td>
                                                    <td className="p-4 font-medium text-slate-700">
                                                        {row.description}
                                                        {row.refsStr && <span className="text-xs text-slate-400 block font-normal">Refs: {row.refsStr}</span>}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-slate-600">
                                                        {row.debit > 0 ? `₹ ${row.debit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="p-4 text-right font-mono text-green-600 font-semibold">
                                                        {row.credit > 0 ? `₹ ${row.credit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="p-4 text-right font-mono font-bold text-slate-900 bg-slate-50/50">
                                                        ₹ {row.runningBalance.toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

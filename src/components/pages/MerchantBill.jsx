import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function MerchantBill() {
    const [loading, setLoading] = useState(false);

    // Masters
    const [merchants, setMerchants] = useState([]);

    // Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [billNo, setBillNo] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState('');

    // Fetched Data
    const [items, setItems] = useState([]);
    const [pattiCount, setPattiCount] = useState(0);

    // Fees Configuration (Constants as per spec)
    const RATES = {
        MARKET_FEE: 0.06,
        SUPERVISION: 0.01,
        DONATION: 0.0005,
        COMMISSION: 0.01
    };

    useEffect(() => {
        fetchMasters();
        generateBillNo();
    }, []);

    // Auto-fetch when Merchant or Date changes
    useEffect(() => {
        if (selectedMerchant && date) {
            fetchDailyTransactions();
        } else {
            setItems([]);
            setPattiCount(0);
        }
    }, [selectedMerchant, date]);

    const fetchMasters = async () => {
        const { data } = await supabase.from('merchants').select('*').order('name');
        if (data) setMerchants(data);
    };

    const generateBillNo = () => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setBillNo(`MB-${today}-${random}`);
    };

    const fetchDailyTransactions = async () => {
        setLoading(true);
        // 1. Get Hishob Entries for this Merchant + Date
        const { data: entries, error } = await supabase
            .from('hishob_entries')
            .select('id, receipt_no')
            .eq('merchant_id', selectedMerchant)
            .eq('date', date);

        if (error) {
            console.error(error);
            setLoading(false);
            return;
        }

        if (!entries || entries.length === 0) {
            setItems([]);
            setPattiCount(0);
            setLoading(false);
            return;
        }

        setPattiCount(entries.length);
        const entryIds = entries.map(e => e.id);

        // 2. Get Items for these entries
        const { data: billItems, error: itemsError } = await supabase
            .from('hishob_items')
            .select(`
                product_id,
                weight,
                rate,
                amount,
                products (name, unit)
            `)
            .in('entry_id', entryIds);

        if (itemsError) {
            console.error(itemsError);
        } else {
            // Map to local format
            const formattedItems = billItems.map(item => ({
                productId: item.product_id,
                productName: item.products?.name,
                unit: item.products?.unit,
                weight: item.weight,
                rate: item.rate,
                amount: item.amount
            }));
            setItems(formattedItems);
        }
        setLoading(false);
    };

    // Calculations
    const grossTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    const fees = {
        marketFee: grossTotal * RATES.MARKET_FEE,
        supervision: grossTotal * RATES.SUPERVISION,
        donation: grossTotal * RATES.DONATION,
        commission: grossTotal * RATES.COMMISSION
    };

    const totalCharges = Object.values(fees).reduce((sum, val) => sum + val, 0);
    const netAmount = grossTotal - totalCharges;

    // Save
    const handleSave = async () => {
        if (!selectedMerchant) return alert('Select a merchant');
        if (items.length === 0) return alert('No transactions found to generate bill.');

        setLoading(true);

        const { data: bill, error: billError } = await supabase
            .from('merchant_bills')
            .insert([{
                bill_no: billNo,
                date,
                merchant_id: selectedMerchant,
                gross_total: grossTotal,
                market_fee: fees.marketFee,
                supervision_fee: fees.supervision,
                donation: fees.donation,
                commission: fees.commission,
                total_charges: totalCharges,
                net_amount: netAmount
            }])
            .select()
            .single();

        if (billError) {
            alert('Error saving bill: ' + billError.message);
            setLoading(false);
            return;
        }

        // Save aggregated items
        const itemsToSave = items.map(item => ({
            bill_id: bill.id,
            product_id: item.productId,
            quantity: item.weight, // Using weight as quantity
            rate: item.rate,
            amount: item.amount
        }));

        const { error: itemsError } = await supabase.from('merchant_bill_items').insert(itemsToSave);

        if (itemsError) {
            alert('Error saving items: ' + itemsError.message);
        } else {
            alert('Merchant Bill Generated & Saved!');
            setSelectedMerchant('');
            setItems([]);
            generateBillNo();
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Merchant Daily Bill</h1>
                        <p className="text-slate-500 text-sm">Auto-generated from Daily Pattis</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Bill No</div>
                        <div className="font-mono font-bold text-lg">{billNo}</div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Merchant</label>
                            <select
                                value={selectedMerchant}
                                onChange={e => setSelectedMerchant(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                            >
                                <option value="">-- Choose Merchant --</option>
                                {merchants.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.shop_name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between">
                        <div className="text-slate-600">
                            Found <strong className="text-primary">{pattiCount}</strong> Hishob Pattis for this date.
                        </div>
                        {loading && <div className="text-sm text-blue-600 animate-pulse">Fetching transactions...</div>}
                    </div>

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <tr>
                                    <th className="p-3 border-b">Product</th>
                                    <th className="p-3 border-b text-center">Weight/Qty</th>
                                    <th className="p-3 border-b text-center">Rate</th>
                                    <th className="p-3 border-b text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">
                                            No transactions found for the selected date and merchant.
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-3 font-medium">
                                                {item.productName} <span className="text-slate-400 text-xs">({item.unit})</span>
                                            </td>
                                            <td className="p-3 text-center text-slate-600">{item.weight}</td>
                                            <td className="p-3 text-center text-slate-600">{item.rate}</td>
                                            <td className="p-3 text-right font-mono font-bold text-slate-700">
                                                {item.amount.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {items.length > 0 && (
                                <tfoot className="bg-slate-50 font-bold">
                                    <tr>
                                        <td colSpan="3" className="p-3 text-right text-slate-600">Total Business</td>
                                        <td className="p-3 text-right text-slate-900 border-t border-slate-300">
                                            ₹ {grossTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Fees Calculation */}
                    {items.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-4">Applied Charges</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Market Fee (6%)</span>
                                        <span className="font-mono">₹ {fees.marketFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Supervision (1%)</span>
                                        <span className="font-mono">₹ {fees.supervision.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Donation (0.05%)</span>
                                        <span className="font-mono">₹ {fees.donation.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">Commission (1%)</span>
                                        <span className="font-mono">₹ {fees.commission.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-700">
                                        <span>Total Charges</span>
                                        <span>₹ {totalCharges.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                                <div className="flex justify-between text-slate-600">
                                    <span>Gross Total</span>
                                    <span>₹ {grossTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>Less: Charges</span>
                                    <span>- ₹ {totalCharges.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
                                    <span>Net Payable</span>
                                    <span>₹ {netAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4">
                    <button className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || items.length === 0}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span className="material-icons-round">receipt_long</span>
                        {loading ? 'Saving...' : 'Generate Bill'}
                    </button>
                </div>
            </div>
        </div>
    );
}

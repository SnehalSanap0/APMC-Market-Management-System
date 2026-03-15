import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LockKeyhole, Printer } from 'lucide-react';

// Helper function to convert numbers to Indian Rupee words
function numberToWords(num) {
    if (num === 0) return 'Zero';
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const format = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + format(n % 100) : '');
        if (n < 100000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
        if (n < 10000000) return format(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? format(n % 100000) : '');
        return format(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? format(n % 10000000) : '');
    };
    
    // Handle decimals for paise (optional, rounding for now as it's common)
    const intPart = Math.floor(Math.round(num));
    return format(intPart).trim() + ' Rupees';
}

export default function MerchantBill() {
    const [loading, setLoading] = useState(false);

    // Masters
    const [merchants, setMerchants] = useState([]);

    // Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMerchant, setSelectedMerchant] = useState('');

    const [showKeyModal, setShowKeyModal] = useState(false);
    const [securityKey, setSecurityKey] = useState('');
    const [keyError, setKeyError] = useState('');

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
    const netAmount = grossTotal + totalCharges;

    const handleDownload = () => {
        if (securityKey !== '1234') {
            setKeyError('Invalid security key.');
            return;
        }
        setShowKeyModal(false);
        setSecurityKey('');
        setKeyError('');
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Merchant Daily Bill</h1>
                        <p className="text-slate-500 text-sm">Auto-generated from Daily Pattis</p>
                    </div>
                </div>

                {/* Print Header (Visible only when printing) */}
                <div className="hidden print:block text-center border-b border-slate-300 pb-6 mb-6">
                    <h1 className="text-3xl font-black text-slate-900 devanagari">श्री जय सप्तश्रृंगी व्हेजिटेबल कं.</h1>
                    <p className="text-slate-600 mt-1">व्यापारी आणि कमिशन एजंट</p>
                    <div className="flex justify-between items-end mt-6 text-left">
                        <div>
                            <p className="text-sm text-slate-500 uppercase font-bold">Bill To:</p>
                            <p className="font-bold text-lg text-slate-900">{merchants.find(m => m.id === selectedMerchant)?.name || 'Unknown'}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">Date: {new Date(date).toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100 print:hidden">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date <span className="text-red-500">*</span></label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Merchant <span className="text-red-500">*</span></label>
                            <select
                                value={selectedMerchant}
                                onChange={e => setSelectedMerchant(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                            >
                                <option value="">-- Choose Merchant --</option>
                                {merchants.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between print:hidden">
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
                                <div className="flex justify-between text-blue-600">
                                    <span>Add: Charges</span>
                                    <span>+ ₹ {totalCharges.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                                    <div className="flex justify-between text-xl font-bold text-slate-900">
                                        <span>Net Payable</span>
                                        <span>₹ {netAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right text-xs text-slate-600 font-medium uppercase tracking-wider">
                                        ( {numberToWords(netAmount)} Only )
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4 print:hidden">
                    <button
                        onClick={() => setShowKeyModal(true)}
                        disabled={loading || items.length === 0}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={20} />
                        Download / Print Bill
                    </button>
                </div>
            </div>

            {/* Security Key Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LockKeyhole size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Enter Security Key</h3>
                        <p className="text-slate-500 text-sm mb-6">Authentication is required to download or print this autogenerated bill.</p>

                        <input
                            type="password"
                            autoFocus
                            placeholder="Enter 4-digit key"
                            maxLength={4}
                            className="w-full text-center tracking-wide text-xl py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary mb-2 outline-none"
                            value={securityKey}
                            onChange={(e) => {
                                setSecurityKey(e.target.value);
                                setKeyError('');
                            }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleDownload(); }}
                        />
                        {keyError && <p className="text-red-500 text-sm mb-4">{keyError}</p>}

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowKeyModal(false);
                                    setSecurityKey('');
                                    setKeyError('');
                                }}
                                className="flex-1 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDownload}
                                className="flex-1 py-3 text-white bg-primary hover:bg-primary-light font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all"
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

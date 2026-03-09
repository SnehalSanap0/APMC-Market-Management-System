import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function JamaPavti() {
    const [loading, setLoading] = useState(false);
    const [merchants, setMerchants] = useState([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentNo, setPaymentNo] = useState('');
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [amount, setAmount] = useState('');
    const [mode, setMode] = useState('CASH');
    const [remarks, setRemarks] = useState('');

    // Receipt Modal
    const [showReceipt, setShowReceipt] = useState(false);
    const [lastPayment, setLastPayment] = useState(null);

    useEffect(() => {
        fetchMasters();
        generatePaymentNo();
    }, []);

    const fetchMasters = async () => {
        const { data } = await supabase.from('merchants').select('*').order('name');
        if (data) setMerchants(data);
    };

    const generatePaymentNo = () => {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setPaymentNo(`PAY-${today}-${random}`);
    };

    const handleSave = async () => {
        if (!selectedMerchant || !amount) return alert('Please select merchant and enter amount');

        setLoading(true);

        const paymentData = {
            payment_no: paymentNo,
            date,
            merchant_id: selectedMerchant,
            amount: parseFloat(amount),
            mode,
            remarks
        };

        const { data, error } = await supabase
            .from('merchant_payments')
            .insert([paymentData])
            .select('*, merchants(name, shop_name)')
            .single();

        if (error) {
            alert('Error saving payment: ' + error.message);
        } else {
            setLastPayment(data);
            setShowReceipt(true);
            // Reset form
            setAmount('');
            setRemarks('');
            generatePaymentNo();
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-green-600 p-6 text-white flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Jama Pavti (Payment Receipt)</h1>
                        <p className="text-green-100 text-sm">Record Merchant Payment</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-green-100">Receipt No</div>
                        <div className="font-mono font-bold text-lg">{paymentNo}</div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Select Merchant</label>
                            <select
                                value={selectedMerchant}
                                onChange={e => setSelectedMerchant(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="">-- Choose Merchant --</option>
                                {merchants.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.shop_name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received (₹)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-3xl font-bold border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-green-700"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                            <select
                                value={mode}
                                onChange={e => setMode(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI / GPay / PhonePe</option>
                                <option value="CHEQUE">Cheque</option>
                                <option value="BANK">Bank Transfer (NEFT/RTGS)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks (Optional)</label>
                            <input
                                type="text"
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                placeholder="Txn ID, Cheque No, etc."
                                className="w-full border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
                        <button className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg shadow-green-600/20 flex items-center gap-2"
                        >
                            <span className="material-icons-round">check_circle</span>
                            {loading ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {showReceipt && lastPayment && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-white p-8 max-w-md w-full rounded-xl relative">
                        <button
                            onClick={() => setShowReceipt(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <span className="material-icons-round">close</span>
                        </button>

                        <div className="text-center border-b-2 border-dashed border-slate-200 pb-6 mb-6">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">Payment Receipt</h2>
                            <p className="text-slate-500 text-sm mt-1">{new Date(lastPayment.created_at).toLocaleString()}</p>
                        </div>

                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Receipt No</span>
                                <span className="font-bold">{lastPayment.payment_no}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Merchant</span>
                                <span className="font-bold text-right">{lastPayment.merchants?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Mode</span>
                                <span>{lastPayment.mode}</span>
                            </div>
                            {lastPayment.remarks && (
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Remarks</span>
                                    <span>{lastPayment.remarks}</span>
                                </div>
                            )}
                            <div className="border-t-2 border-slate-900 pt-4 mt-4 flex justify-between text-lg font-bold">
                                <span>AMOUNT</span>
                                <span>₹ {lastPayment.amount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                onClick={() => window.print()}
                                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 flex justify-center gap-2"
                            >
                                <span className="material-icons-round">print</span> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

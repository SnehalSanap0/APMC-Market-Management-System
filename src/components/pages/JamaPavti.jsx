import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Printer } from 'lucide-react';

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

export default function JamaPavti() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('CREATE'); // CREATE, VIEW
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

    // View State
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMerchant, setViewMerchant] = useState('');
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        fetchMasters();
        generatePaymentNo();
    }, []);

    useEffect(() => {
        if (activeTab === 'VIEW' && viewDate && viewMerchant) {
            fetchPayments();
        }
    }, [activeTab, viewDate, viewMerchant]);

    const fetchPayments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('merchant_payments')
            .select('*, merchants(name)')
            .eq('date', viewDate)
            .eq('merchant_id', viewMerchant)
            .order('created_at', { ascending: false });
        
        if (!error) setPayments(data || []);
        setLoading(false);
    };

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
            .select('*, merchants(name)')
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
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900 w-full">
            {/* Tabs */}
            <div className="max-w-5xl mx-auto mb-6 flex gap-4 print:hidden">
                <button
                    onClick={() => setActiveTab('CREATE')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'CREATE' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    Create Payment
                </button>
                <button
                    onClick={() => setActiveTab('VIEW')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'VIEW' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    View Receipts
                </button>
            </div>

            {activeTab === 'CREATE' && (
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Jama Pavti (Payment Receipt)</h1>
                        <p className="text-slate-500 text-sm">Record Merchant Payment</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Receipt No</div>
                        <div className="font-mono font-bold text-lg">{paymentNo}</div>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Amount Received (₹) <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full px-4 py-3 text-3xl font-bold border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-slate-900"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode <span className="text-red-500">*</span></label>
                            <select
                                value={mode}
                                onChange={e => setMode(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
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
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                            className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-icons-round">save</span>
                            {loading ? 'Saving...' : 'Save Payment'}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {activeTab === 'VIEW' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                     <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center print:hidden">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">View Receipts</h1>
                            <p className="text-slate-500 text-sm">Review generated Jama Pavti</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 print:p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100 print:hidden">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={viewDate}
                                    onChange={e => setViewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Merchant (Agent)</label>
                                <select
                                    value={viewMerchant}
                                    onChange={e => setViewMerchant(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">Select Merchant</option>
                                    {merchants.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading && <div className="text-center py-4 print:hidden">Loading Receipts...</div>}
                        
                        {!loading && payments.length === 0 && viewMerchant && (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
                                No Jama Pavti found for this Merchant on {new Date(viewDate).toLocaleDateString('en-GB')}
                            </div>
                        )}

                        <div className="space-y-8 print:space-y-4">
                            {payments.map(payment => (
                                <div key={payment.id} className="border-2 border-slate-800 rounded-xl overflow-hidden print:border-slate-800 print:rounded-none page-break-after shadow-sm">
                                    <div className="text-center border-b-2 border-slate-800 p-4 bg-slate-100 print:bg-white">
                                        <h1 className="text-2xl font-black text-slate-900 devanagari">श्री जय सप्तश्रृंगी व्हेजिटेबल कं.</h1>
                                        <p className="text-slate-700 font-bold uppercase text-sm mt-1 tracking-widest">Jama Pavti / जमा पावती</p>
                                    </div>
                                    <div className="p-4 flex justify-between border-b-2 border-slate-800 bg-white">
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase mb-1">व्यापारी (Merchant):</p>
                                            <p className="font-bold text-lg text-slate-900">{payment.merchants?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold mb-1 text-slate-800">Date: {new Date(payment.date).toLocaleDateString('en-GB')}</p>
                                            <p className="text-sm font-bold text-slate-800">Receipt No: {payment.payment_no}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 bg-slate-50 print:bg-white relative">
                                        <div className="flex justify-between items-center mb-4">
                                            <div>
                                                <p className="text-sm text-slate-500 uppercase font-semibold">Payment Mode</p>
                                                <p className="font-bold text-slate-800 text-lg mt-1">{payment.mode}</p>
                                            </div>
                                            {payment.remarks && (
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-500 uppercase font-semibold">Remarks</p>
                                                    <p className="font-bold text-slate-800 mt-1">{payment.remarks}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t-2 border-slate-800 pt-4 mt-4 flex flex-col gap-2">
                                            <div className="flex justify-between items-center text-xl font-black">
                                                <span className="text-slate-700 uppercase">Received Amount:</span>
                                                <span className="font-mono text-2xl">₹ {payment.amount.toFixed(2)}</span>
                                            </div>
                                            <div className="text-right text-sm text-slate-600 font-bold uppercase tracking-wider">
                                                ( {numberToWords(payment.amount)} Only )
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-100 p-4 border-t border-slate-200 print:hidden flex justify-end">
                                        <button
                                            onClick={() => window.print()}
                                            className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 flex justify-center gap-2 items-center shadow-md bg-opacity-90 transition-all"
                                        >
                                            <Printer size={18} /> Print Receipt
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && lastPayment && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] print:hidden">
                    <div className="bg-white max-w-xl w-full rounded-2xl relative overflow-hidden shadow-2xl animate-in zoom-in-95">
                        <button
                            onClick={() => setShowReceipt(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10 print:hidden"
                        >
                            <span className="material-icons-round">close</span>
                        </button>

                        <div className="border-2 border-slate-800 m-8 rounded-xl overflow-hidden print:border-slate-800 print:rounded-none print:m-0 shadow-sm">
                            <div className="text-center border-b-2 border-slate-800 p-4 bg-slate-100 print:bg-white">
                                <h1 className="text-2xl font-black text-slate-900 devanagari">श्री जय सप्तश्रृंगी व्हेजिटेबल कं.</h1>
                                <p className="text-slate-700 font-bold uppercase text-sm mt-1 tracking-widest">Jama Pavti / जमा पावती</p>
                            </div>
                            <div className="p-4 flex justify-between border-b-2 border-slate-800 bg-white">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase mb-1">व्यापारी (Merchant):</p>
                                    <p className="font-bold text-lg text-slate-900">{lastPayment.merchants?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold mb-1 text-slate-800">Date: {new Date(lastPayment.date).toLocaleDateString('en-GB')}</p>
                                    <p className="text-sm font-bold text-slate-800">Receipt No: {lastPayment.payment_no}</p>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-50 print:bg-white relative">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <p className="text-sm text-slate-500 uppercase font-semibold">Payment Mode</p>
                                        <p className="font-bold text-slate-800 text-lg mt-1">{lastPayment.mode}</p>
                                    </div>
                                    {lastPayment.remarks && (
                                        <div className="text-right">
                                            <p className="text-sm text-slate-500 uppercase font-semibold">Remarks</p>
                                            <p className="font-bold text-slate-800 mt-1">{lastPayment.remarks}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t-2 border-slate-800 pt-4 mt-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-xl font-black">
                                        <span className="text-slate-700 uppercase">Received Amount:</span>
                                        <span className="font-mono text-2xl">₹ {lastPayment.amount.toFixed(2)}</span>
                                    </div>
                                    <div className="text-right text-sm text-slate-600 font-bold uppercase tracking-wider">
                                        ( {numberToWords(lastPayment.amount)} Only )
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 mx-8 print:hidden flex gap-4">
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="flex-1 text-slate-700 bg-slate-100 py-3 rounded-lg font-bold hover:bg-slate-200 transition-all"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setTimeout(() => window.print(), 200);
                                }}
                                className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 flex justify-center gap-2 items-center shadow-lg shadow-primary/20 transition-all"
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

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Printer } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printWithFilename } from '../../lib/printWithFilename';
import { useToast } from '../../lib/toast.jsx';
import { useLanguage } from '../../lib/language.jsx'

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
    const toast = useToast();
    const { t } = useLanguage();
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


    // View State
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewMerchant, setViewMerchant] = useState('');
    const [payments, setPayments] = useState([]);

    useEffect(() => {
        fetchMasters();
    }, []);

    // Re-generate payment number whenever the date changes
    useEffect(() => {
        generatePaymentNo(date);
    }, [date]);

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

    const generatePaymentNo = async (forDate) => {
        const { count } = await supabase
            .from('merchant_payments')
            .select('*', { count: 'exact', head: true })
            .eq('date', forDate);
        const seq = ((count ?? 0) + 1).toString().padStart(3, '0');
        const datePart = forDate.replace(/-/g, '');
        setPaymentNo(`JP-${datePart}-${seq}`);
    };

    const handleSave = async () => {
        if (!selectedMerchant || !amount) {
            toast.warning('Please select merchant and enter amount');
            return;
        }

        setLoading(true);

        const paymentData = {
            payment_no: paymentNo,
            date,
            merchant_id: selectedMerchant,
            amount: parseFloat(amount),
            mode,
            remarks
        };

        const { error } = await supabase
            .from('merchant_payments')
            .insert([paymentData]);

        if (error) {
            toast.error('Error saving payment: ' + error.message);
        } else {
            toast.success('जमा पावती जतन झाली! (Payment saved successfully)');
            setAmount('');
            setRemarks('');
            generatePaymentNo(date);
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
                    {t('नवीन जमा पावती', 'Create Payment')}
                </button>
                <button
                    onClick={() => setActiveTab('VIEW')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'VIEW' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    {t('जमा पावती पहा', 'View Receipts')}
                </button>
            </div>

            {activeTab === 'CREATE' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{t('जमा पावती', 'Jama Pavti')}</h1>
                            <p className="text-slate-500 text-sm">{t('व्यापारी जमा नोंदवा', 'Record Merchant Payment')}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">{t('पावती क्र.', 'Receipt No')}</div>
                            <div className="font-mono font-bold text-lg">{paymentNo}</div>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('दिनांक', 'Date')} <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('व्यापारी निवडा', 'Select Merchant')} <span className="text-red-500">*</span></label>
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('जमा रक्कम (₹)', 'Amount Received (₹)')} <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('जमा पद्धत', 'Payment Mode')} <span className="text-red-500">*</span></label>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('शेरा (पर्यायी)', 'Remarks (Optional)')}</label>
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
                            <h1 className="text-2xl font-bold text-slate-800">{t('जमा पावती पहा', 'View Receipts')}</h1>
                        </div>
                    </div>

                    <div className="p-8 space-y-6 print:p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100 print:hidden">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('दिनांक', 'Date')}</label>
                                <input
                                    type="date"
                                    value={viewDate}
                                    onChange={e => setViewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('व्यापारी', 'Merchant')}</label>
                                <select
                                    value={viewMerchant}
                                    onChange={e => setViewMerchant(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('व्यापारी निवडा', 'Select Merchant')}</option>
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
                                    <PrintHeader
                                        docTitle="जमा पावती · Jama Pavti"
                                        leftInfo={[
                                            { label: 'व्यापारी / Merchant', value: payment.merchants?.name },
                                        ]}
                                        rightInfo={[
                                            { label: 'तारीख / Date', value: new Date(payment.date + 'T00:00:00').toLocaleDateString('en-GB') },
                                            { label: 'पावती क्र / Receipt No', value: payment.payment_no },
                                        ]}
                                    />

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
                                            onClick={() => {
                                                const name = (payment.merchants?.name || 'Merchant').replace(/\s+/g, '_');
                                                printWithFilename(`${payment.payment_no}_${name}`);
                                            }}
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
        </div>
    );
}

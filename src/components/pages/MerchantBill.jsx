import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LockKeyhole, Printer } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printDocument } from '../../lib/printDocument';
import { useLanguage } from '../../lib/language';

// Helper function to convert numbers to Indian Rupee words
function numberToWords(num) {
    if (!num || num === 0) return 'Zero Rupees';

    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const format = (n) => {
        if (n < 20) return a[n] || '';
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + format(n % 100) : '');
        if (n < 100000) return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
        if (n < 10000000) return format(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? format(n % 100000) : '');
        return format(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? format(n % 10000000) : '');
    };

    // Handle decimals for paise (optional, rounding for now as it's common)
    const intPart = Math.floor(Math.round(absNum));
    let resultedWords = format(intPart)?.trim() || '';
    if (isNegative) resultedWords = 'Minus ' + resultedWords;
    return resultedWords + ' Rupees';
}

export default function MerchantBill() {
    const { t } = useLanguage();
    const printRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Masters
    const [merchants, setMerchants] = useState([]);

    // Form
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMerchant, setSelectedMerchant] = useState('');



    // Fetched Data
    const [items, setItems] = useState([]);
    const [vatapEntries, setVatapEntries] = useState([]);
    const [pattiCount, setPattiCount] = useState(0);
    const [billNo, setBillNo] = useState('');
    const [ledgerStats, setLedgerStats] = useState({ magilBaki: 0, jama: 0 });
    const [settings, setSettings] = useState(null);

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
            setVatapEntries([]);
            setPattiCount(0);
            setLedgerStats({ magilBaki: 0, jama: 0 });
        }
    }, [selectedMerchant, date]);

    const fetchMasters = async () => {
        const { data } = await supabase.from('merchants').select('*').order('name');
        if (data) setMerchants(data);
    };

    const fetchDailyTransactions = async () => {
        setLoading(true);
        setBillNo('');

        // Fetch items from hishob_items (inner join to filter by date)
        const { data: billItems, error: itemsError } = await supabase
            .from('hishob_items')
            .select(`
                id,
                weight,
                rate,
                amount,
                product_id,
                entry_id,
                products (name, unit),
                hishob_entries!inner (date, receipt_no)
            `)
            .eq('merchant_id', selectedMerchant)
            .eq('hishob_entries.date', date);

        if (itemsError) {
            console.error(itemsError);
            setLoading(false);
            return;
        }

        // We no longer exit early here, because the merchant might have ONLY vatap entries!
        // We will fetch everything and then decide if the page is truly empty.

        // Count unique entries (Pattis) this merchant was part of today
        const uniqueEntries = new Set((billItems || []).map(item => item.entry_id));
        setPattiCount(uniqueEntries.size);

        // Fetch the stored bill_no from merchant_bills
        const { data: billRecord } = await supabase
            .from('merchant_bills')
            .select('bill_no')
            .eq('merchant_id', selectedMerchant)
            .eq('date', date)
            .maybeSingle();
        if (billRecord?.bill_no) setBillNo(billRecord.bill_no);

        // Fetch Ledger
        const { data: ledger } = await supabase
            .from('merchant_ledger')
            .select('debit, credit, date')
            .eq('merchant_id', selectedMerchant)
            .lte('date', date);

        let mb = 0;
        let j = 0;
        if (ledger) {
            ledger.forEach(l => {
                const de = parseFloat(l.debit) || 0;
                const cr = parseFloat(l.credit) || 0;
                if (l.date < date) {
                    mb += (de - cr);
                } else if (l.date === date) {
                    j += cr;
                }
            });
        }
        setLedgerStats({ magilBaki: mb, jama: j });

        const { data: sData } = await supabase.from('company_settings').select('*').single();
        if (sData) setSettings(sData);

        // Fetch vatap entries for this merchant on this date (given or received)
        const [{ data: vatapGiven }, { data: vatapReceived }] = await Promise.all([
            supabase
                .from('vatap_entries')
                .select(`id, amount, weight, rate, from_merchant_id, to_merchant_id, products(name, unit), to_merchant:merchants!vatap_entries_to_merchant_id_fkey(name)`)
                .eq('from_merchant_id', selectedMerchant)
                .eq('date', date),
            supabase
                .from('vatap_entries')
                .select(`id, amount, weight, rate, from_merchant_id, to_merchant_id, products(name, unit), from_merchant:merchants!vatap_entries_from_merchant_id_fkey(name)`)
                .eq('to_merchant_id', selectedMerchant)
                .eq('date', date),
        ]);

        const combinedVatap = [
            ...(vatapGiven || []).map(v => ({ ...v, type: 'given' })),
            ...(vatapReceived || []).map(v => ({ ...v, type: 'received' })),
        ];
        
        if ((!billItems || billItems.length === 0) && combinedVatap.length === 0) {
            setItems([]);
            setVatapEntries([]);
            setPattiCount(0);
            setLoading(false);
            return;
        }

        setVatapEntries(combinedVatap);

        // Map to local format
        const formattedItems = (billItems || []).map(item => ({
            productId: item.product_id,
            productName: item.products?.name,
            unit: item.products?.unit,
            weight: item.weight,
            rate: item.rate,
            amount: item.amount
        }));

        setItems(formattedItems);
        setLoading(false);
    };

    // Calculations — include vatap adjustments in gross total
    const hishobTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const vatapAdjustment = vatapEntries.reduce((sum, v) => {
        const amt = parseFloat(v.amount) || 0;
        return v.type === 'received' ? sum + amt : sum - amt;
    }, 0);
    const grossTotal = hishobTotal + vatapAdjustment;

    const fees = {
        marketFee: grossTotal * RATES.MARKET_FEE,
        supervision: grossTotal * RATES.SUPERVISION,
        donation: grossTotal * RATES.DONATION,
        commission: items.length > 0 ? 1 : 0 // Flat 1 Rs charge instead of 1%
    };

    const totalCharges = Object.values(fees).reduce((sum, val) => sum + val, 0);
    const netAmount = grossTotal + totalCharges;
    const ekunYene = netAmount + ledgerStats.magilBaki;
    const nakkiBaki = ekunYene - ledgerStats.jama;

    const handleDownload = () => {
        const merchantName = (merchants.find(m => m.id === selectedMerchant)?.name || 'Merchant').replace(/\s+/g, '_');
        const filename = billNo
            ? `${billNo}_${merchantName}`
            : `MB-${date.replace(/-/g, '')}_${merchantName}`;
        setTimeout(() => printDocument(printRef.current, filename), 300);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
        <div ref={printRef} className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 print:overflow-visible print:shadow-none print:border-none print:max-w-none">
                {/* Screen header */}
                <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center print:hidden">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{t('व्यापारी बिल', 'Merchant Daily Bill')}</h1>
                    </div>
                    {billNo && (
                        <div className="text-right">
                            <p className="text-xs text-slate-500 uppercase font-bold">{t('बिल क्रमांक', 'Bill No')}</p>
                            <p className="font-mono font-black text-xl text-primary">{billNo}</p>
                        </div>
                    )}
                </div>

                {/* Print Header — consistent branding */}
                <div className="hidden print:block">
                    <PrintHeader
                        docTitle="व्यापारी बिल · Merchant Bill"
                        leftInfo={[
                            { label: 'व्यापारी / Bill To', value: merchants.find(m => m.id === selectedMerchant)?.name || '—' },
                        ]}
                        rightInfo={[
                            { label: 'तारीख / Date', value: new Date(date + 'T00:00:00').toLocaleDateString('en-GB') },
                            ...(billNo ? [{ label: 'बिल क्र / Bill No', value: billNo }] : []),
                        ]}
                    />
                </div>

                <div className="p-8 space-y-8">
                    {/* Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100 print:hidden">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('तारीख', 'Date')} <span className="text-red-500">*</span></label>
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
                                <option value="">{t('-- व्यापारी निवडा --', '-- Choose Merchant --')}</option>
                                {merchants.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Status Bar */}
                    <div className="flex items-center justify-between print:hidden">
                        <div className="text-slate-600">
                            {t('Found', 'Found')} <strong className="text-primary">{pattiCount}</strong> {t('Hishob Pattis for this date.', 'Hishob Pattis for this date.')}
                        </div>
                        {loading && <div className="text-sm text-blue-600 animate-pulse">{t('Fetching transactions...', 'Fetching transactions...')}</div>}
                    </div>

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden print:border-none">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <tr className="border-b-2 border-slate-800">
                                    <th className="p-3 border-r-2 border-slate-800">{t('माल', 'Product')}</th>
                                    <th className="p-3 border-r-2 border-slate-800 text-center">{t('वजन', 'Weight/Qty')}</th>
                                    <th className="p-3 border-r-2 border-slate-800 text-center">{t('दर', 'Rate')}</th>
                                    <th className="p-3 text-right">{t('रक्कम', 'Amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">
                                            {t('या तारखेसाठी आणि व्यापाऱ्यासाठी कोणतेही व्यवहार सापडले नाहीत.', 'No transactions found.')}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 border-b border-slate-200">
                                            <td className="p-3 font-medium border-r-2 border-slate-800">
                                                {item.productName} <span className="text-slate-400 text-xs">({item.unit})</span>
                                            </td>
                                            <td className="p-3 text-center text-slate-600 border-r-2 border-slate-800">{item.weight}</td>
                                            <td className="p-3 text-center text-slate-600 border-r-2 border-slate-800">{item.rate}</td>
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
                                        <td colSpan="3" className="p-3 text-right text-slate-600">{t('एकूण खरेदी', 'Total Business')}</td>
                                        <td className="p-3 text-right text-slate-900 border-t border-slate-300">
                                            ₹ {hishobTotal.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>

                    {/* Vatap Section */}
                    {vatapEntries.length > 0 && (
                        <div className="border border-amber-200 rounded-lg overflow-hidden print:border-none">
                            <div className="bg-amber-50 px-4 py-2 border-b border-amber-200">
                                <h3 className="font-semibold text-amber-800 text-sm uppercase tracking-wide">
                                    {t('वाटप (माल वितरण)', 'Vatap (Goods Distribution)')}
                                </h3>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-amber-50/50 text-slate-500 uppercase text-xs">
                                    <tr className="border-b-2 border-slate-800">
                                        <th className="px-4 py-2 border-r-2 border-slate-800">{t('प्रकार', 'Type')}</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800">{t('व्यापारी', 'Merchant')}</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800">{t('माल', 'Product')}</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800 text-center">{t('वजन', 'Wt')}</th>
                                        <th className="px-4 py-2 border-r-2 border-slate-800 text-center">{t('दर', 'Rate')}</th>
                                        <th className="px-4 py-2 text-right">{t('रक्कम', 'Amount')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-50">
                                    {vatapEntries.map((v, idx) => (
                                        <tr key={v.id || idx} className={`${v.type === 'received' ? 'bg-green-50/40' : 'bg-red-50/40'} border-b border-amber-100`}>
                                            <td className="px-4 py-2 border-r-2 border-slate-800">
                                                {v.type === 'received' ? (
                                                    <span className="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                                        {t('मिळाले', 'Received')}
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-semibold">
                                                        {t('दिले', 'Given')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 font-medium text-slate-700 border-r-2 border-slate-800">
                                                {v.type === 'received'
                                                    ? (v.from_merchant?.name || '—')
                                                    : (v.to_merchant?.name || '—')}
                                            </td>
                                            <td className="px-4 py-2 text-slate-600 border-r-2 border-slate-800">
                                                {v.products?.name}
                                                {v.products?.unit && (
                                                    <span className="text-slate-400 text-xs ml-1">({v.products.unit})</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-center text-slate-500 border-r-2 border-slate-800">{v.weight ?? '—'}</td>
                                            <td className="px-4 py-2 text-center text-slate-500 border-r-2 border-slate-800">{v.rate ?? '—'}</td>
                                            <td className={`px-4 py-2 text-right font-mono font-bold ${v.type === 'received' ? 'text-green-700' : 'text-red-700'}`}>
                                                {v.type === 'received' ? '+' : '−'} ₹ {parseFloat(v.amount).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Fees Calculation */}
                    {(items.length > 0 || vatapEntries.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-4">{t('लागू आकार', 'Applied Charges')}</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('आदत (6%)', 'Commission (6%)')}</span>
                                        <span className="font-mono">₹ {fees.marketFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('मार्केट फी (1%)', 'Market Fee (1%)')}</span>
                                        <span className="font-mono">₹ {fees.supervision.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('सुपरविजन खर्च (0.05%)', 'Supervision Cost (0.05%)')}</span>
                                        <span className="font-mono">₹ {fees.donation.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-600">{t('धर्मादाय', 'Charity')} (₹1)</span>
                                        <span className="font-mono">₹ {fees.commission.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-700">
                                        <span>{t('एकूण खर्च', 'Total Charges')}</span>
                                        <span>₹ {totalCharges.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                                <div className="flex justify-between text-slate-600">
                                    <span>{t('एकूण खरेदी', 'Total Business')}</span>
                                    <span>₹ {hishobTotal.toFixed(2)}</span>
                                </div>
                                {vatapAdjustment !== 0 && (
                                    <div className={`flex justify-between font-medium ${vatapAdjustment > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        <span>{t('वाटप समायोजन', 'Vatap Adjustment')}</span>
                                        <span>{vatapAdjustment > 0 ? '+' : '−'} ₹ {Math.abs(vatapAdjustment).toFixed(2)}</span>
                                    </div>
                                )}
                                {vatapAdjustment !== 0 && (
                                    <div className="flex justify-between font-semibold text-slate-800 border-t border-slate-200 pt-2">
                                        <span>{t('समायोजित एकूण', 'Adjusted Gross')}</span>
                                        <span>₹ {grossTotal.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-blue-600">
                                    <span>{t('एकूण खर्च', 'Add: Charges')}</span>
                                    <span>+ ₹ {totalCharges.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex flex-col gap-2">
                                    <div className="flex justify-between font-bold text-slate-800">
                                        <span>{t('चालू कलम', 'Chalu Kalam')}</span>
                                        <span>₹ {netAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>{t('मागील बाकी', 'Previous Balance')}</span>
                                        <span>+ ₹ {ledgerStats.magilBaki.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800">
                                        <span>{t('एकूण येणे', 'Total Due')}</span>
                                        <span>₹ {ekunYene.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>{t('जमा', 'Jama (Deposits)')}</span>
                                        <span>- ₹ {ledgerStats.jama.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t-2 border-slate-800 pt-3 mt-1 flex flex-col gap-2">
                                        <div className="flex justify-between text-xl font-bold text-slate-900">
                                            <span>{t('नक्की बाकी', 'Nakki Baki')}</span>
                                            <span>₹ {nakkiBaki.toFixed(2)}</span>
                                        </div>
                                        <div className="text-right text-xs text-slate-600 font-medium uppercase tracking-wider">
                                            ( {numberToWords(nakkiBaki)} Only )
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4 print:hidden">
                    <button
                        onClick={handleDownload}
                        disabled={loading || (items.length === 0 && vatapEntries.length === 0)}
                        className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Printer size={20} />
                        {t('बिल प्रिंट करा', 'Print Bill')}
                    </button>
                </div>
            </div>


        </div>
    );
}

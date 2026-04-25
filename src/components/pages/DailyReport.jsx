import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../lib/language';
import { Printer, Calendar, FileText, IndianRupee, ArrowLeftRight, Package } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printDocument } from '../../lib/printDocument';

export default function DailyReport() {
    const { t } = useLanguage();
    const printRef = useRef(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    
    // Data sections
    const [hishobs, setHishobs] = useState([]);
    const [vataps, setVataps] = useState([]);
    const [payments, setPayments] = useState([]);
    const [bills, setBills] = useState([]);

    useEffect(() => {
        fetchDailyData();
    }, [date]);

    async function fetchDailyData() {
        setLoading(true);
        const [hRes, vRes, pRes, bRes] = await Promise.all([
            supabase.from('hishob_entries').select('*, farmers(name)').eq('date', date).order('receipt_no'),
            supabase.from('vatap_entries').select('*, from_merchant:merchants!vatap_entries_from_merchant_id_fkey(name), to_merchant:merchants!vatap_entries_to_merchant_id_fkey(name), products(name)').eq('date', date),
            supabase.from('merchant_payments').select('*, merchants(name)').eq('date', date),
            supabase.from('merchant_bills').select('*, merchants(name)').eq('date', date)
        ]);

        setHishobs(hRes.data || []);
        setVataps(vRes.data || []);
        setPayments(pRes.data || []);
        setBills(bRes.data || []);
        setLoading(false);
    }

    const totalSales = hishobs.reduce((sum, h) => sum + (parseFloat(h.gross_total) || 0), 0);
    const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const totalVatap = vataps.reduce((sum, v) => sum + (parseFloat(v.amount) || 0), 0);

    return (
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Controls */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{t('दैनंदिन अहवाल', 'Daily Summary Report')}</h1>
                            <p className="text-sm text-slate-500">{t('आजचे सर्व व्यवहार एका ठिकाणी', 'All transactions for the day in one view')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none font-medium"
                        />
                        <button
                            onClick={() => printDocument(printRef.current, `DailyReport_${date}`, { orientation: 'portrait' })}
                            disabled={loading || (hishobs.length === 0 && vataps.length === 0 && payments.length === 0)}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50"
                        >
                            <Printer size={18} />
                            <span className="font-bold">{t('प्रिंट करा', 'Print Report')}</span>
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div ref={printRef} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:border-none print:shadow-none">
                    
                    {/* Print Only Header */}
                    <div className="hidden print:block">
                        <PrintHeader 
                            docTitle="दैनंदिन अहवाल · DAILY SUMMARY"
                            rightInfo={[{ label: 'अहवाल तारीख / Date', value: new Date(date + 'T00:00:00').toLocaleDateString('en-GB') }]}
                        />
                    </div>

                    <div className="p-8 print:p-0">
                        {loading ? (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-slate-500 font-medium">{t('माहिती संकलित होत आहे...', 'Aggregating daily data...')}</p>
                            </div>
                        ) : (hishobs.length === 0 && vataps.length === 0 && payments.length === 0) ? (
                            <div className="py-20 text-center space-y-4 text-slate-400">
                                <FileText size={48} className="mx-auto opacity-20" />
                                <p>{t('या तारखेसाठी कोणतेही व्यवहार उपलब्ध नाहीत.', 'No transactions found for this date.')}</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                
                                {/* 1. Farmer Sales (Pattis) */}
                                {hishobs.length > 0 && (
                                    <section className="mb-10">
                                        <div className="flex items-center gap-2 mb-3 border-l-4 border-primary pl-3 break-after-avoid">
                                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{t('शेतकरी पट्टी विक्री', 'Farmer Patti Sales')}</h2>
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{hishobs.length} {t('नोंदी', 'Entries')}</span>
                                        </div>
                                        <table className="w-full text-left text-sm border-collapse border-2 border-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50 border-b-2 border-slate-800">
                                                    <th className="p-2 border-r-2 border-slate-800 w-16">No.</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Farmer Name</th>
                                                    <th className="p-2 border-r-2 border-slate-800 text-right">Gross Total</th>
                                                    <th className="p-2 border-r-2 border-slate-800 text-right">Expenses</th>
                                                    <th className="p-2 text-right">Net Payable</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-300">
                                                {hishobs.map((h, i) => (
                                                    <tr key={h.id} className="border-b border-slate-200">
                                                        <td className="p-2 border-r-2 border-slate-800 font-mono text-[8pt] text-slate-500">{h.receipt_no.split('-').pop()}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 font-semibold">{h.farmers?.name}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-right font-mono">₹{parseFloat(h.gross_total).toFixed(2)}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-right font-mono text-rose-600">₹{parseFloat(h.total_expenses).toFixed(2)}</td>
                                                        <td className="p-2 text-right font-bold font-mono bg-slate-50/50">₹{parseFloat(h.net_amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-900">
                                                <tr>
                                                    <td colSpan="4" className="text-right p-2">{t('एकूण विक्री', 'Total Sales')}</td>
                                                    <td className="text-right p-2 font-mono text-lg">₹{totalSales.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </section>
                                )}

                                {/* 2. Merchant Payments (Jama Pavti) */}
                                {payments.length > 0 && (
                                    <section className="mb-10">
                                        <div className="flex items-center gap-2 mb-3 border-l-4 border-emerald-600 pl-3 break-after-avoid">
                                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{t('जमा पावती (पेमेंट)', 'Merchant Payments (Jama)')}</h2>
                                            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{payments.length} {t('नोंदी', 'Entries')}</span>
                                        </div>
                                        <table className="w-full text-left text-sm border-collapse border-2 border-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50 border-b-2 border-slate-800">
                                                    <th className="p-2 border-r-2 border-slate-800 w-16">No.</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Merchant Name</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Payment Method</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Note / Ref</th>
                                                    <th className="p-2 text-right">Amount Received</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-300">
                                                {payments.map((p) => (
                                                    <tr key={p.id} className="border-b border-slate-200">
                                                        <td className="p-2 border-r-2 border-slate-800 font-mono text-[8pt] text-slate-500">{p.payment_no}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 font-semibold">{p.merchants?.name}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 uppercase text-xs font-bold text-emerald-700">{p.mode}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-slate-500 italic">{p.remarks || '—'}</td>
                                                        <td className="p-2 text-right font-bold font-mono text-emerald-700 bg-emerald-50/30">₹{parseFloat(p.amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-emerald-50 font-bold border-t-2 border-emerald-800">
                                                <tr>
                                                    <td colSpan="4" className="text-right p-2">{t('एकूण जमा', 'Total Collection')}</td>
                                                    <td className="text-right p-2 font-mono text-lg text-emerald-800">₹{totalPayments.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </section>
                                )}

                                {/* 3. Vatap Entries */}
                                {vataps.length > 0 && (
                                    <section className="mb-10">
                                        <div className="flex items-center gap-2 mb-3 border-l-4 border-amber-500 pl-3 break-after-avoid">
                                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{t('वाटप व्यवहार', 'Vatap (Distributions)')}</h2>
                                            <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold">{vataps.length} {t('नोंदी', 'Entries')}</span>
                                        </div>
                                        <table className="w-full text-left text-sm border-collapse border-2 border-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50 border-b-2 border-slate-800">
                                                    <th className="p-2 border-r-2 border-slate-800">From Merchant</th>
                                                    <th className="p-2 border-r-2 border-slate-800">To Merchant</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Product / Note</th>
                                                    <th className="p-2 border-r-2 border-slate-800 text-center">Wt / Rate</th>
                                                    <th className="p-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-300">
                                                {vataps.map((v) => (
                                                    <tr key={v.id} className="border-b border-slate-200">
                                                        <td className="p-2 border-r-2 border-slate-800 text-rose-700 font-medium">{v.from_merchant?.name}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-emerald-700 font-medium">{v.to_merchant?.name}</td>
                                                        <td className="p-2 border-r-2 border-slate-800">
                                                            {v.product_id ? (
                                                                <span className="flex items-center gap-1"><Package size={10} className="text-slate-400" /> {v.products?.name}</span>
                                                            ) : (
                                                                <span className="italic text-slate-500">{v.note}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-center text-xs text-slate-400 font-mono">
                                                            {v.weight ? `${v.weight} × ${v.rate}` : '—'}
                                                        </td>
                                                        <td className="p-2 text-right font-bold font-mono">₹{parseFloat(v.amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-amber-50 font-bold border-t-2 border-amber-600">
                                                <tr>
                                                    <td colSpan="4" className="text-right p-2">{t('एकूण वाटप', 'Total Vatap')}</td>
                                                    <td className="text-right p-2 font-mono text-lg">₹{totalVatap.toFixed(2)}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </section>
                                )}

                                {/* 4. Merchant Bills */}
                                {bills.length > 0 && (
                                    <section className="mb-10">
                                        <div className="flex items-center gap-2 mb-3 border-l-4 border-blue-600 pl-3 break-after-avoid">
                                            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight">{t('व्यापारी बिले', 'Merchant Bills')}</h2>
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{bills.length} {t('नोंदी', 'Entries')}</span>
                                        </div>
                                        <table className="w-full text-left text-sm border-collapse border-2 border-slate-800">
                                            <thead>
                                                <tr className="bg-slate-50 border-b-2 border-slate-800">
                                                    <th className="p-2 border-r-2 border-slate-800 w-16">No.</th>
                                                    <th className="p-2 border-r-2 border-slate-800">Merchant Name</th>
                                                    <th className="p-2 border-r-2 border-slate-800 text-right">Taxable</th>
                                                    <th className="p-2 border-r-2 border-slate-800 text-right">Taxes/Other</th>
                                                    <th className="p-2 text-right">Final Bill Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-300">
                                                {bills.map((b) => (
                                                    <tr key={b.id} className="border-b border-slate-200">
                                                        <td className="p-2 border-r-2 border-slate-800 font-mono text-[8pt] text-slate-500">{b.bill_no || b.id.slice(0,8)}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 font-semibold">{b.merchants?.name}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-right font-mono italic">₹{parseFloat(b.gross_total || 0).toFixed(2)}</td>
                                                        <td className="p-2 border-r-2 border-slate-800 text-right font-mono text-slate-400">₹{(parseFloat(b.net_amount) - parseFloat(b.gross_total || 0)).toFixed(2)}</td>
                                                        <td className="p-2 text-right font-bold font-mono bg-blue-50/30">₹{parseFloat(b.net_amount).toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </section>
                                )}


                                {/* Daily Summary Footer (Print) */}

                                <div className="mt-12 border-t-4 border-slate-900 pt-8 grid grid-cols-3 gap-6">
                                    <div className="bg-slate-50 p-4 border-2 border-slate-900 rounded-xl">
                                        <p className="text-[9pt] font-black uppercase text-slate-500 mb-1">Total Sales (Patti)</p>
                                        <p className="text-xl font-black text-slate-900 font-mono">₹{totalSales.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 border-2 border-emerald-800 rounded-xl">
                                        <p className="text-[9pt] font-black uppercase text-emerald-700 mb-1">Total Collection (Jama)</p>
                                        <p className="text-xl font-black text-emerald-800 font-mono">₹{totalPayments.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-primary text-white p-4 shadow-lg rounded-xl border-2 border-slate-900">
                                        <p className="text-[10pt] font-black uppercase text-white/90 mb-1 tracking-tight">Net Cash Impact</p>
                                        <p className="text-2xl font-black font-mono">₹{(totalPayments - totalSales).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="pt-12 grid grid-cols-3 gap-12 text-center text-xs font-bold uppercase tracking-widest text-slate-400 print:mt-12">
                                    <div className="border-t border-slate-200 pt-2">Prepared By</div>
                                    <div className="border-t border-slate-200 pt-2">Verified By</div>
                                    <div className="border-t border-slate-200 pt-2">Authorized Signatory</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

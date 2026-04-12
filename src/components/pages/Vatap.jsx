import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, X, IndianRupee, Package } from 'lucide-react';
import { useToast } from '../../lib/toast.jsx';
import { useLanguage } from '../../lib/language';
import { autoUpdateMerchantBills } from '../../lib/merchantBillUtils';

// ── blank row factory ──────────────────────────────────────────────────────
const blankRow = () => ({
    type: 'product',   // 'product' | 'cash'
    toMerchantId: '',
    productId: '',
    weight: '',
    rate: '',
    amount: '',
    note: '',
});

export default function Vatap() {
    const { t } = useLanguage();
    const toast = useToast();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [fromMerchantId, setFromMerchantId] = useState('');
    const [merchants, setMerchants] = useState([]);
    const [products, setProducts] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Line-items: each row is one vatap entry (product or cash)
    const [rows, setRows] = useState([blankRow()]);

    useEffect(() => { fetchMasters(); }, []);
    useEffect(() => { fetchEntries(); }, [date]);

    const fetchMasters = async () => {
        const [mRes, pRes] = await Promise.all([
            supabase.from('merchants').select('*').order('name'),
            supabase.from('products').select('*').order('name'),
        ]);
        if (mRes.data) setMerchants(mRes.data);
        if (pRes.data) setProducts(pRes.data);
    };

    const isMulaProduct = (productId) => {
        const p = products.find(x => x.id === productId);
        if (!p) return false;
        const n = p.name.toLowerCase();
        return n.includes('मुळा') || n.includes('mula') || n.includes('mooli');
    };

    const fetchEntries = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('vatap_entries')
            .select(`
                *,
                from_merchant:merchants!vatap_entries_from_merchant_id_fkey ( name ),
                to_merchant:merchants!vatap_entries_to_merchant_id_fkey ( name ),
                products ( name, unit )
            `)
            .eq('date', date)
            .order('created_at', { ascending: true });

        if (!error) setEntries(data || []);
        else console.error(error);
        setLoading(false);
    };

    // ── row helpers ───────────────────────────────────────────────────────────

    const updateRow = (idx, field, value) => {
        setRows(prev => prev.map((row, i) => {
            if (i !== idx) return row;
            const updated = { ...row, [field]: value };

            // Switch type: clear irrelevant fields
            if (field === 'type') {
                updated.productId = '';
                updated.weight = '';
                updated.rate = '';
                updated.amount = '';
                updated.note = '';
            }

            // When switching to a mula product, clear rate
            if (field === 'productId' && updated.type === 'product') {
                if (isMulaProduct(value)) {
                    updated.rate = '';
                    updated.amount = '';
                }
            }

            // Auto-calc amount for product rows ONLY when not mula
            if (updated.type === 'product' && (field === 'weight' || field === 'rate' || field === 'productId')) {
                if (!isMulaProduct(updated.productId)) {
                    const w = parseFloat(updated.weight) || 0;
                    const r = parseFloat(updated.rate) || 0;
                    updated.amount = w && r ? ((w * r) / 100).toFixed(2) : updated.amount;
                }
            }

            return updated;
        }));
    };

    const addRow = () => setRows(prev => [...prev, blankRow()]);

    const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

    const resetForm = () => {
        setFromMerchantId('');
        setRows([blankRow()]);
    };

    // ── save ──────────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!fromMerchantId) {
            toast.warning(t('देणारा व्यापारी निवडा', 'Please select From Merchant'));
            return;
        }

        // Validate each row
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const n = i + 1;
            if (!row.toMerchantId) {
                toast.warning(t(`ओळ ${n}: घेणारा व्यापारी निवडा`, `Row ${n}: Select To Merchant`));
                return;
            }
            if (row.toMerchantId === fromMerchantId) {
                toast.warning(t(`ओळ ${n}: देणारा आणि घेणारा वेगळे असणे आवश्यक`, `Row ${n}: From and To merchant must differ`));
                return;
            }
            if (row.type === 'product' && !row.productId) {
                toast.warning(t(`ओळ ${n}: माल निवडा`, `Row ${n}: Select a Product`));
                return;
            }
            if (!row.amount || parseFloat(row.amount) <= 0) {
                toast.warning(t(`ओळ ${n}: रक्कम भरा`, `Row ${n}: Enter Amount`));
                return;
            }
        }

        setSaving(true);

        const insertRows = rows.map(row => ({
            date,
            from_merchant_id: fromMerchantId,
            to_merchant_id: row.toMerchantId,
            product_id: row.type === 'product' ? row.productId : null,
            weight: row.type === 'product' ? (parseFloat(row.weight) || null) : null,
            rate: row.type === 'product' ? (row.rate !== '' ? parseFloat(row.rate) : null) : null,
            amount: parseFloat(row.amount),
            note: row.type === 'cash' ? (row.note || null) : null,
        }));

        const { error } = await supabase.from('vatap_entries').insert(insertRows);

        if (error) {
            toast.error('Error saving vatap: ' + error.message);
        } else {
            const allIds = [fromMerchantId, ...rows.map(r => r.toMerchantId)];
            await autoUpdateMerchantBills(date, [...new Set(allIds)]);
            toast.success(t(
                `वाटप नोंद जतन झाली! (${rows.length} ओळी)`,
                `Vatap saved! (${rows.length} row${rows.length > 1 ? 's' : ''})`
            ));
            resetForm();
            fetchEntries();
        }
        setSaving(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* ── Add Vatap Form ── */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-slate-800">{t('वाटप नोंद', 'Vatap Entry')}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('प्रत्येक ओळीत माल वाटप किंवा रोख वाटप निवडा', 'Each row can be a product or cash vatap independently')}
                        </p>
                    </div>

                    <div className="p-6 space-y-5">

                        {/* Date + From Merchant */}
                        <div className="flex flex-wrap items-end gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('तारीख', 'Date')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="ml-auto min-w-[220px]">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('देणारा व्यापारी', 'From Merchant')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={fromMerchantId}
                                    onChange={e => setFromMerchantId(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('-- देणारा व्यापारी निवडा --', '-- Select From Merchant --')}</option>
                                    {merchants.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ── Line-items table ── */}
                        <div className="border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                                    <tr>
                                        <th className="p-3 border-b w-28">{t('प्रकार', 'Type')}</th>
                                        <th className="p-3 border-b min-w-[160px]">{t('घेणारा व्यापारी', 'To Merchant')}</th>
                                        <th className="p-3 border-b min-w-[160px]">{t('माल / टीप', 'Product / Note')}</th>
                                        <th className="p-3 border-b w-28 text-center">{t('वजन', 'Weight')}</th>
                                        <th className="p-3 border-b w-28 text-center">{t('दर', 'Rate')}</th>
                                        <th className="p-3 border-b w-36 text-right">{t('रक्कम', 'Amount')}</th>
                                        <th className="p-3 border-b w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">

                                    {rows.map((row, idx) => (
                                        <tr key={idx} className={row.type === 'cash' ? 'bg-amber-50/40' : ''}>
                                            {/* Type toggle */}
                                            <td className="p-2">
                                                <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs">
                                                    <button
                                                        onClick={() => updateRow(idx, 'type', 'product')}
                                                        className={`flex-1 flex items-center justify-center gap-1 py-2 font-medium transition-all ${row.type === 'product' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                                        title="Product Vatap"
                                                    >
                                                        <Package size={12} />
                                                        {t('माल', 'Prod')}
                                                    </button>
                                                    <button
                                                        onClick={() => updateRow(idx, 'type', 'cash')}
                                                        className={`flex-1 flex items-center justify-center gap-1 py-2 font-medium transition-all border-l border-slate-300 ${row.type === 'cash' ? 'bg-amber-500 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                                                        title="Rokh / Cash Vatap"
                                                    >
                                                        <IndianRupee size={12} />
                                                        {t('रोख', 'Cash')}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* To Merchant */}
                                            <td className="p-2">
                                                <select
                                                    value={row.toMerchantId}
                                                    onChange={e => updateRow(idx, 'toMerchantId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                >
                                                    <option value="">{t('व्यापारी निवडा', 'Select Merchant')}</option>
                                                    {merchants
                                                        .filter(m => m.id !== fromMerchantId)
                                                        .map(m => (
                                                            <option key={m.id} value={m.id}>{m.name}</option>
                                                        ))}
                                                </select>
                                            </td>

                                            {/* Product OR Note */}
                                            <td className="p-2">
                                                {row.type === 'product' ? (
                                                    <select
                                                        value={row.productId}
                                                        onChange={e => updateRow(idx, 'productId', e.target.value)}
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                    >
                                                        <option value="">{t('माल निवडा', 'Select Product')}</option>
                                                        {products.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={row.note}
                                                        onChange={e => updateRow(idx, 'note', e.target.value)}
                                                        placeholder={t('उदा. बार्डन साठी', 'e.g. for bardan')}
                                                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-400 italic"
                                                    />
                                                )}
                                            </td>

                                            {/* Weight */}
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={row.weight}
                                                    onChange={e => updateRow(idx, 'weight', e.target.value)}
                                                    placeholder="0"
                                                    disabled={row.type === 'cash'}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center disabled:bg-slate-100 disabled:text-slate-300"
                                                />
                                            </td>

                                            {/* Rate — disabled for cash and mula */}
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={row.rate}
                                                    onChange={e => updateRow(idx, 'rate', e.target.value)}
                                                    placeholder={isMulaProduct(row.productId) ? '—' : '0'}
                                                    disabled={row.type === 'cash' || isMulaProduct(row.productId)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center disabled:bg-slate-100 disabled:text-slate-300"
                                                />
                                            </td>

                                            {/* Amount — auto for non-mula product with weight+rate, manual otherwise */}
                                            <td className="p-2 text-right font-mono font-medium">
                                                {row.type !== 'cash' && !isMulaProduct(row.productId) && row.weight && row.rate ? (
                                                    <span className="pr-1">{parseFloat(row.amount || 0).toFixed(2)}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={row.amount}
                                                        onChange={e => updateRow(idx, 'amount', e.target.value)}
                                                        placeholder="0.00"
                                                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-1 text-right font-mono font-bold ${
                                                            row.type === 'cash'
                                                                ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-400 bg-amber-50'
                                                                : isMulaProduct(row.productId)
                                                                    ? 'border-primary focus:border-primary focus:ring-primary bg-amber-50'
                                                                    : 'border-slate-300 focus:border-primary focus:ring-primary'
                                                        }`}
                                                    />
                                                )}
                                            </td>

                                            {/* Remove */}
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeRow(idx)}
                                                    disabled={rows.length === 1}
                                                    className="text-slate-400 hover:text-red-500 disabled:opacity-0"
                                                    title={t('हटवा', 'Remove row')}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="7" className="p-2">
                                            <button
                                                type="button"
                                                onClick={addRow}
                                                className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 px-2"
                                            >
                                                <Plus size={16} /> {t('ओळ जोडा', 'Add Row')}
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Save */}
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {saving
                                    ? t('जतन होत आहे...', 'Saving...')
                                    : t('वाटप जतन करा', 'Save Vatap')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Entries Table ── */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-700">
                            {t('या तारखेचे वाटप व्यवहार', 'Vatap Entries for Selected Date')}
                        </h2>
                        {loading && (
                            <span className="text-sm text-blue-600 animate-pulse">
                                {t('लोड होत आहे...', 'Loading...')}
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3 border-b">#</th>
                                    <th className="px-4 py-3 border-b">{t('प्रकार', 'Type')}</th>
                                    <th className="px-4 py-3 border-b">{t('देणारा व्यापारी', 'From')}</th>
                                    <th className="px-4 py-3 border-b">{t('घेणारा व्यापारी', 'To')}</th>
                                    <th className="px-4 py-3 border-b">{t('माल / टीप', 'Product / Note')}</th>
                                    <th className="px-4 py-3 border-b text-center">{t('वजन', 'Wt')}</th>
                                    <th className="px-4 py-3 border-b text-center">{t('दर', 'Rate')}</th>
                                    <th className="px-4 py-3 border-b text-right">{t('रक्कम', 'Amount')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {entries.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-4 py-10 text-center text-slate-400">
                                            {loading
                                                ? t('लोड होत आहे...', 'Loading...')
                                                : t('या तारखेसाठी कोणतेही वाटप व्यवहार नाहीत.', 'No vatap entries for this date.')}
                                        </td>
                                    </tr>
                                ) : (
                                    entries.map((entry, idx) => {
                                        const isCash = !entry.product_id;
                                        return (
                                            <tr key={entry.id} className={`hover:bg-slate-50 ${isCash ? 'bg-amber-50/40' : ''}`}>
                                                <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                                <td className="px-4 py-3">
                                                    {isCash ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                                            <IndianRupee size={11} /> {t('रोख', 'Cash')}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                                                            <Package size={11} /> {t('माल', 'Prod')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-red-700">
                                                    {entry.from_merchant?.name || '—'}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-green-700">
                                                    {entry.to_merchant?.name || '—'}
                                                </td>
                                                <td className="px-4 py-3 text-slate-700">
                                                    {isCash ? (
                                                        <span className="italic text-amber-800">
                                                            {entry.note || t('रोख वाटप', 'Rokh Vatap')}
                                                        </span>
                                                    ) : (
                                                        <>
                                                            {entry.products?.name}
                                                            {entry.products?.unit && (
                                                                <span className="text-slate-400 text-xs ml-1">({entry.products.unit})</span>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600">
                                                    {entry.weight ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-600">
                                                    {entry.rate ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                                                    ₹ {parseFloat(entry.amount).toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                            {entries.length > 0 && (
                                <tfoot className="bg-slate-50 font-bold text-sm">
                                    <tr>
                                        <td colSpan="7" className="px-4 py-3 text-right text-slate-600">
                                            {t('एकूण वाटप रक्कम', 'Total Vatap Amount')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono border-t border-slate-300">
                                            ₹ {entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toFixed(2)}
                                        </td>
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

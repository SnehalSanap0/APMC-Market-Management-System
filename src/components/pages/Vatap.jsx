import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Trash2 } from 'lucide-react';
import { useToast } from '../../lib/toast.jsx';
import { useLanguage } from '../../lib/language';
import { autoUpdateMerchantBills } from '../../lib/merchantBillUtils';

function isMulaProduct(name = '') {
    return name.toLowerCase().includes('मुळा') || name.toLowerCase().includes('mooli');
}

export default function Vatap() {
    const { t } = useLanguage();
    const toast = useToast();

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [merchants, setMerchants] = useState([]);
    const [products, setProducts] = useState([]);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        fromMerchantId: '',
        toMerchantId: '',
        productId: '',
        weight: '',
        rate: '',
        amount: '',
    });

    useEffect(() => {
        fetchMasters();
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [date]);

    const fetchMasters = async () => {
        const [mRes, pRes] = await Promise.all([
            supabase.from('merchants').select('*').order('name'),
            supabase.from('products').select('*').order('name'),
        ]);
        if (mRes.data) setMerchants(mRes.data);
        if (pRes.data) setProducts(pRes.data);
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

    const handleFormChange = (field, value) => {
        setForm(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-calculate amount when weight or rate changes (non-mula)
            const selectedProduct = products.find(p => p.id === updated.productId);
            const isMula = selectedProduct ? isMulaProduct(selectedProduct.name) : false;

            if (!isMula && (field === 'weight' || field === 'rate' || field === 'productId')) {
                const w = parseFloat(updated.weight) || 0;
                const r = parseFloat(updated.rate) || 0;
                updated.amount = w && r ? ((w * r) / 100).toFixed(2) : '';
            }

            // Clear rate when switching to mula product
            if (field === 'productId' && selectedProduct && isMulaProduct(selectedProduct.name)) {
                updated.rate = '';
                updated.amount = '';
            }

            return updated;
        });
    };

    const handleSave = async () => {
        const { fromMerchantId, toMerchantId, productId, weight, rate, amount } = form;

        if (!fromMerchantId || !toMerchantId || !productId || !amount) {
            toast.warning(t(
                'कृपया सर्व आवश्यक माहिती भरा (देणारा व्यापारी, घेणारा व्यापारी, माल, रक्कम)',
                'Please fill all required fields (From Merchant, To Merchant, Product, Amount)'
            ));
            return;
        }

        if (fromMerchantId === toMerchantId) {
            toast.warning(t(
                'देणारा आणि घेणारा व्यापारी वेगळे असणे आवश्यक आहे',
                'From and To merchant must be different'
            ));
            return;
        }

        setSaving(true);
        const { error } = await supabase.from('vatap_entries').insert([{
            date,
            from_merchant_id: fromMerchantId,
            to_merchant_id: toMerchantId,
            product_id: productId,
            weight: parseFloat(weight) || null,
            rate: rate !== '' ? parseFloat(rate) : null,
            amount: parseFloat(amount),
        }]);

        if (error) {
            toast.error('Error saving vatap: ' + error.message);
        } else {
            // Update merchant bills for both affected merchants
            await autoUpdateMerchantBills(date, [fromMerchantId, toMerchantId]);
            toast.success(t('वाटप नोंद जतन झाली!', 'Vatap entry saved!'));
            setForm({ fromMerchantId: '', toMerchantId: '', productId: '', weight: '', rate: '', amount: '' });
            fetchEntries();
        }
        setSaving(false);
    };

    const handleDelete = async (entry) => {
        const { error } = await supabase
            .from('vatap_entries')
            .delete()
            .eq('id', entry.id);

        if (error) {
            toast.error('Error deleting vatap: ' + error.message);
        } else {
            // Revert merchant bill adjustments for both merchants
            await autoUpdateMerchantBills(date, [entry.from_merchant_id, entry.to_merchant_id]);
            toast.success(t('वाटप नोंद हटवली!', 'Vatap entry deleted!'));
            fetchEntries();
        }
    };

    const selectedProduct = products.find(p => p.id === form.productId);
    const isMula = selectedProduct ? isMulaProduct(selectedProduct.name) : false;

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Add Vatap Form */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    <div className="bg-slate-100 p-6 border-b border-slate-200">
                        <h1 className="text-2xl font-bold text-slate-800">{t('वाटप नोंद', 'Vatap Entry')}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('पट्ट्यांनंतर व्यापाऱ्यांमधील मालाचे वाटप नोंदवा', 'Record goods distribution among merchants after pattis')}
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Date */}
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {t('तारीख', 'Date')} <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>

                        {/* Form Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* From Merchant */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('देणारा व्यापारी', 'From Merchant')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.fromMerchantId}
                                    onChange={e => handleFormChange('fromMerchantId', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('-- देणारा व्यापारी निवडा --', '-- Select From Merchant --')}</option>
                                    {merchants.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* To Merchant */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('घेणारा व्यापारी', 'To Merchant')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.toMerchantId}
                                    onChange={e => handleFormChange('toMerchantId', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('-- घेणारा व्यापारी निवडा --', '-- Select To Merchant --')}</option>
                                    {merchants
                                        .filter(m => m.id !== form.fromMerchantId)
                                        .map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        {/* Product + Weight + Rate + Amount */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('माल', 'Product')} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.productId}
                                    onChange={e => handleFormChange('productId', e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('-- माल निवडा --', '-- Select Product --')}</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('वजन / प्रमाण', 'Weight / Qty')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.weight}
                                    onChange={e => handleFormChange('weight', e.target.value)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('दर', 'Rate')}
                                    {isMula && (
                                        <span className="ml-1 text-xs text-amber-600">
                                            ({t('मुळ्यासाठी लागू नाही', 'N/A for Mula')})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.rate}
                                    onChange={e => handleFormChange('rate', e.target.value)}
                                    disabled={isMula}
                                    placeholder="0"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-slate-100 disabled:text-slate-400"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {t('रक्कम', 'Amount')} <span className="text-red-500">*</span>
                                    {!isMula && (
                                        <span className="ml-1 text-xs text-slate-400">({t('स्वयंचलित', 'auto')})</span>
                                    )}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.amount}
                                    onChange={e => handleFormChange('amount', e.target.value)}
                                    readOnly={!isMula && form.weight && form.rate}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary-light shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {saving
                                    ? t('जतन होत आहे...', 'Saving...')
                                    : t('+ वाटप जोडा', '+ Add Vatap')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Entries Table */}
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
                                    <th className="px-4 py-3 border-b">{t('देणारा व्यापारी', 'From Merchant')}</th>
                                    <th className="px-4 py-3 border-b">{t('घेणारा व्यापारी', 'To Merchant')}</th>
                                    <th className="px-4 py-3 border-b">{t('माल', 'Product')}</th>
                                    <th className="px-4 py-3 border-b text-center">{t('वजन', 'Weight')}</th>
                                    <th className="px-4 py-3 border-b text-center">{t('दर', 'Rate')}</th>
                                    <th className="px-4 py-3 border-b text-right">{t('रक्कम', 'Amount')}</th>
                                    <th className="px-4 py-3 border-b text-center">{t('हटवा', 'Delete')}</th>
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
                                    entries.map((entry, idx) => (
                                        <tr key={entry.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                            <td className="px-4 py-3 font-medium text-red-700">
                                                {entry.from_merchant?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-green-700">
                                                {entry.to_merchant?.name || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-slate-700">
                                                {entry.products?.name}
                                                {entry.products?.unit && (
                                                    <span className="text-slate-400 text-xs ml-1">({entry.products.unit})</span>
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
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDelete(entry)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title={t('हटवा', 'Delete')}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {entries.length > 0 && (
                                <tfoot className="bg-slate-50 font-bold text-sm">
                                    <tr>
                                        <td colSpan="6" className="px-4 py-3 text-right text-slate-600">
                                            {t('एकूण वाटप रक्कम', 'Total Vatap Amount')}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono border-t border-slate-300">
                                            ₹ {entries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0).toFixed(2)}
                                        </td>
                                        <td className="border-t border-slate-300" />
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

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LockKeyhole, Printer } from 'lucide-react';
import PrintHeader from '../shared/PrintHeader';
import { printWithFilename } from '../../lib/printWithFilename';
import { useToast } from '../../lib/toast.jsx';
import { useLanguage } from '../../lib/language';

export default function HishobPatti() {
    const { t } = useLanguage();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('CREATE'); // CREATE, VIEW

    // Dropdown Ref
    const farmerDropdownRef = useRef(null);

    // Master Data
    const [farmers, setFarmers] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const [products, setProducts] = useState([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptNo, setReceiptNo] = useState(''); // Auto-generated or manual

    // Farmer Search/Add State
    const [farmerSearch, setFarmerSearch] = useState('');
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
    const [showAddFarmerModal, setShowAddFarmerModal] = useState(false);
    const [newFarmerData, setNewFarmerData] = useState({ name: '', mobile: '', village: '' });

    // Items State
    const [items, setItems] = useState([
        { productId: '', merchantId: '', weight: '', rate: '', amount: 0 }
    ]);

    // Expenses
    const [expenses, setExpenses] = useState({
        commission: 0,
        labor: 0,
        weighing: 0
    });

    // View State
    const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewFarmer, setViewFarmer] = useState('');
    const [pattis, setPattis] = useState([]);

    const [showKeyModal, setShowKeyModal] = useState(false);
    const [securityKey, setSecurityKey] = useState('');
    const [keyError, setKeyError] = useState('');

    useEffect(() => {
        fetchMasters();
    }, []);

    // Re-generate receipt number whenever the date changes
    useEffect(() => {
        generateReceiptNo(date);
    }, [date]);

    useEffect(() => {
        if (activeTab === 'VIEW' && viewDate && viewFarmer) {
            fetchPattis();
        }
    }, [activeTab, viewDate, viewFarmer]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (farmerDropdownRef.current && !farmerDropdownRef.current.contains(event.target)) {
                setShowFarmerDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchPattis = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('hishob_entries')
            .select(`
                *,
                farmers ( name, village ),
                hishob_items (
                    merchant_id,
                    weight, rate, amount,
                    products ( name )
                )
            `)
            .eq('date', viewDate)
            .order('created_at', { ascending: false });

        if (!error) {
            let filtered = data || [];
            if (viewFarmer) {
                filtered = filtered.filter(entry => entry.farmer_id === viewFarmer);
            }
            setPattis(filtered);
        } else {
            console.error(error);
        }
        setLoading(false);
    };

    const fetchMasters = async () => {
        const [fRes, mRes, pRes] = await Promise.all([
            supabase.from('farmers').select('*').order('name'),
            supabase.from('merchants').select('*').order('name'),
            supabase.from('products').select('*').order('name')
        ]);

        if (fRes.data) setFarmers(fRes.data);
        if (mRes.data) setMerchants(mRes.data);
        if (pRes.data) setProducts(pRes.data);
    };

    const generateReceiptNo = async (forDate) => {
        const datePart = forDate.replace(/-/g, '');
        const prefix = `HP-${datePart}-`;

        const { data: existing } = await supabase
            .from('hishob_entries')
            .select('receipt_no')
            .eq('date', forDate)
            .like('receipt_no', `${prefix}%`)
            .order('receipt_no', { ascending: false })
            .limit(1);

        let seq = 1;
        if (existing && existing.length > 0) {
            const lastSeq = parseInt(existing[0].receipt_no.replace(prefix, ''), 10);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
        }

        const no = `${prefix}${seq.toString().padStart(3, '0')}`;
        setReceiptNo(no);
        return no;
    };

    // --- Farmer Logic ---
    const filteredFarmers = farmers.filter(f =>
        f.name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
        (f.mobile && f.mobile.includes(farmerSearch))
    );

    const handleFarmerSelect = (farmer) => {
        setSelectedFarmer(farmer);
        setFarmerSearch(farmer.name);
        setShowFarmerDropdown(false);
    };

    const isMulaProduct = (productId) => {
        const product = products.find(p => p.id === productId);
        if (!product) return false;
        const name = product.name.toLowerCase();
        return name.includes('मुळा') || name.includes('mula') || name.includes('mooli');
    };

    const handleAddFarmer = async () => {
        if (!newFarmerData.name) {
            toast.warning('Name is required');
            return;
        }
        if (newFarmerData.mobile && newFarmerData.mobile.length !== 10) {
            toast.warning('Mobile number must be 10 digits');
            return;
        }

        const payload = {
            ...newFarmerData,
            mobile: newFarmerData.mobile || null,
        };

        const { data, error } = await supabase
            .from('farmers')
            .insert([payload])
            .select()
            .single();

        if (error) {
            toast.error('Error adding farmer: ' + error.message);
        } else {
            setFarmers([...farmers, data]);
            handleFarmerSelect(data);
            setShowAddFarmerModal(false);
            setNewFarmerData({ name: '', mobile: '', village: '' });
        }
    };

    // --- Items Logic ---
    const updateItem = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        const productId = field === 'productId' ? value : newItems[index].productId;
        const isMula = isMulaProduct(productId);

        if (isMula) {
            // When switching to mula, clear rate
            if (field === 'productId') {
                newItems[index].rate = '';
                newItems[index].amount = 0;
            }
            // Amount is entered directly — no auto-calculation
        } else {
            // Auto-calc amount from weight × rate
            if (field === 'rate' || field === 'weight' || field === 'productId') {
                const weight = parseFloat(newItems[index].weight) || 0;
                const rate = parseFloat(newItems[index].rate) || 0;
                newItems[index].amount = (weight * rate) / 100;
            }
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { productId: '', merchantId: '', weight: '', rate: '', amount: 0 }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // --- Calculations ---
    const grossTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalExpenses = (parseFloat(expenses.commission) || 0) + (parseFloat(expenses.labor) || 0) + (parseFloat(expenses.weighing) || 0);
    const netAmount = grossTotal - totalExpenses;

    // --- Save ---
    const handleSave = async () => {
        if (!selectedFarmer || items.some(i => !i.productId || !i.merchantId)) {
            toast.warning('Please select Farmer, Product, and Merchant for all items');
            return;
        }

        setLoading(true);

        // Generate a fresh receipt number at save time to avoid stale state conflicts
        const freshReceiptNo = await generateReceiptNo(date);

        // 1. Create Entry
        const { data: entry, error: entryError } = await supabase
            .from('hishob_entries')
            .insert([{
                receipt_no: freshReceiptNo,
                date,
                farmer_id: selectedFarmer.id,
                gross_total: grossTotal,
                total_expenses: totalExpenses,
                net_amount: netAmount
            }])
            .select()
            .single();

        if (entryError) {
            toast.error('Error saving patti: ' + entryError.message);
            setLoading(false);
            return;
        }

        // 2. Create Items
        const itemsToSave = items.map(item => ({
            entry_id: entry.id,
            product_id: item.productId,
            merchant_id: item.merchantId,
            weight: parseFloat(item.weight) || null,
            rate: item.rate !== '' ? parseFloat(item.rate) : null,
            amount: parseFloat(item.amount) || 0
        }));

        const { error: itemsError } = await supabase
            .from('hishob_items')
            .insert(itemsToSave);

        if (itemsError) {
            toast.error('Error saving items: ' + itemsError.message);
        } else {
            // AUTO-SAVE: Update/Create corresponding Merchant Bills & Dhada Entries
            await autoUpdateMerchantBills(date, itemsToSave.map(i => i.merchant_id));

            toast.success('हिशोब पट्टी जतन झाली! (Hishob Patti Saved Successfully!)');
            // Reset form
            setSelectedFarmer(null);
            setFarmerSearch('');
            setItems([{ productId: '', merchantId: '', weight: '', rate: '', amount: 0 }]);
            generateReceiptNo(date); // refresh for same date (count now +1)
        }
        setLoading(false);
    };

    const autoUpdateMerchantBills = async (billDate, merchantIds) => {
        const uniqueMerchants = [...new Set(merchantIds.filter(Boolean))];
        for (const merchantId of uniqueMerchants) {
            // Fetch all items for this merchant on this date
            const { data: allItems } = await supabase
                .from('hishob_items')
                .select(`
                    amount,
                    hishob_entries!inner(date)
                `)
                .eq('merchant_id', merchantId)
                .eq('hishob_entries.date', billDate);

            if (!allItems || allItems.length === 0) continue;

            const mGrossTotal = allItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

            const mFees = {
                marketFee: mGrossTotal * 0.06,
                supervision: mGrossTotal * 0.01,
                donation: mGrossTotal * 0.0005,
                commission: 1 // flat ₹1
            };
            const mTotalCharges = mFees.marketFee + mFees.supervision + mFees.donation + mFees.commission;
            const mNetAmount = mGrossTotal + mTotalCharges;

            // Check if bill exists
            const { data: existingBill } = await supabase
                .from('merchant_bills')
                .select('id')
                .eq('date', billDate)
                .eq('merchant_id', merchantId)
                .maybeSingle();

            if (existingBill) {
                // Update existing
                await supabase.from('merchant_bills').update({
                    gross_total: mGrossTotal,
                    market_fee: mFees.marketFee,
                    supervision_fee: mFees.supervision,
                    donation: mFees.donation,
                    commission: mFees.commission,
                    total_charges: mTotalCharges,
                    net_amount: mNetAmount
                }).eq('id', existingBill.id);

                await supabase.from('dhada_entries').update({
                    market_fee: mFees.marketFee,
                    supervision_fee: mFees.supervision,
                    donation: mFees.donation,
                    commission: mFees.commission,
                    total_income: mTotalCharges
                }).eq('bill_id', existingBill.id);
            } else {
                // Insert new
                const { count: mbCount } = await supabase
                    .from('merchant_bills')
                    .select('*', { count: 'exact', head: true })
                    .eq('date', billDate);
                const mbSeq = ((mbCount ?? 0) + 1).toString().padStart(3, '0');
                const newBillNo = `MB-${billDate.replace(/-/g, '')}-${mbSeq}`;
                const { data: newBill } = await supabase.from('merchant_bills').insert([{
                    date: billDate,
                    merchant_id: merchantId,
                    bill_no: newBillNo,
                    gross_total: mGrossTotal,
                    market_fee: mFees.marketFee,
                    supervision_fee: mFees.supervision,
                    donation: mFees.donation,
                    commission: mFees.commission,
                    total_charges: mTotalCharges,
                    net_amount: mNetAmount
                }]).select().single();

                if (newBill) {
                    await supabase.from('dhada_entries').insert([{
                        date: billDate,
                        merchant_id: merchantId,
                        bill_id: newBill.id,
                        market_fee: mFees.marketFee,
                        supervision_fee: mFees.supervision,
                        donation: mFees.donation,
                        commission: mFees.commission,
                        total_income: mTotalCharges
                    }]);
                }
            }
        }
    };

    const handleDownload = () => {
        if (securityKey !== '1234') {
            setKeyError('Invalid security key. Please try again.');
            return;
        }
        setShowKeyModal(false);
        setSecurityKey('');
        setKeyError('');
        // Build filename: use first patti's receipt_no + farmer name
        const first = pattis[0];
        const farmerSlug = (first?.farmers?.name || 'Farmer').replace(/\s+/g, '_');
        const filename = pattis.length === 1
            ? `${first.receipt_no}_${farmerSlug}`
            : `${first.receipt_no}_to_${pattis[pattis.length - 1].receipt_no}_${farmerSlug}`;
        setTimeout(() => printWithFilename(filename), 300);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            {/* Tabs */}
            <div className="max-w-5xl mx-auto mb-6 flex gap-4 print:hidden">
                <button
                    onClick={() => setActiveTab('CREATE')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'CREATE' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    {t('नवीन नोंद', 'Create New Entry')}
                </button>
                <button
                    onClick={() => setActiveTab('VIEW')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'VIEW' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    {t('रेजिस्टर पहा आणि प्रिंट करा', 'View & Print')}
                </button>
            </div>

            {activeTab === 'CREATE' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{t('हिशोब पट्टी नोंद', 'Hishob Patti Entry')}</h1>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">{t('पावती क्रमांक', 'Receipt No')}</div>
                            <div className="font-mono font-bold text-lg">{receiptNo}</div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Top Section: Date, Merchant, Farmer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('तारीख', 'Date')} <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Farmer Search + Add */}
                            <div className="relative" ref={farmerDropdownRef}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('शेतकरी', 'Farmer')} <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder={t('शेतकरी शोधा...', 'Search Farmer...')}
                                        value={farmerSearch}
                                        onChange={(e) => {
                                            setFarmerSearch(e.target.value);
                                            setShowFarmerDropdown(true);
                                            setSelectedFarmer(null);
                                        }}
                                        onFocus={() => setShowFarmerDropdown(true)}
                                        className={`w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${selectedFarmer ? 'bg-green-50 border-green-500 text-green-700 font-semibold' : ''}`}
                                    />
                                    {selectedFarmer && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 material-icons-round text-lg">check_circle</span>
                                    )}
                                </div>

                                {/* Dropdown */}
                                {showFarmerDropdown && !selectedFarmer && (
                                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                        {filteredFarmers.map(f => (
                                            <div
                                                key={f.id}
                                                onClick={() => handleFarmerSelect(f)}
                                                className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50"
                                            >
                                                <div className="font-medium">{f.name}</div>
                                                <div className="text-xs text-slate-500">{f.mobile} • {f.village}</div>
                                            </div>
                                        ))}
                                        <div
                                            onClick={() => { setShowAddFarmerModal(true); setShowFarmerDropdown(false); }}
                                            className="p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer font-medium flex items-center gap-2 sticky bottom-0"
                                        >
                                            <span className="material-icons-round text-sm">add</span> {t('नवीन शेतकरी जोडा', 'Add New Farmer')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-left min-w-[700px]">
                                <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                                    <tr>
                                        <th className="p-3 border-b min-w-[150px]">{t('माल', 'Product')}</th>
                                        <th className="p-3 border-b min-w-[150px]">{t('व्यापारी', 'Merchant')}</th>
                                        <th className="p-3 border-b w-32">{t('वजन', 'Weight')}</th>
                                        <th className="p-3 border-b w-32">{t('दर', 'Rate')}</th>
                                        <th className="p-3 border-b w-40 text-right">{t('रक्कम', 'Amount')}</th>
                                        <th className="p-3 border-b w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => {
                                        const isMula = isMulaProduct(item.productId);
                                        return (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <select
                                                    value={item.productId}
                                                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                >
                                                    <option value="">{t('माल निवडा', 'Select Product')}</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={item.merchantId}
                                                    onChange={e => updateItem(idx, 'merchantId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                >
                                                    <option value="">{t('व्यापारी निवडा', 'Select Merchant')}</option>
                                                    {merchants.map(m => (
                                                        <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={item.weight}
                                                    onChange={e => updateItem(idx, 'weight', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    placeholder={isMula ? '—' : '0.00'}
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                    disabled={isMula}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${isMula ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'border-slate-300'}`}
                                                />
                                            </td>
                                            <td className="p-2 text-right font-mono font-medium">
                                                {isMula ? (
                                                    <input
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={item.amount || ''}
                                                        onChange={e => updateItem(idx, 'amount', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 border border-primary rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right font-mono font-bold bg-amber-50"
                                                    />
                                                ) : (
                                                    item.amount.toFixed(2)
                                                )}
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    onClick={() => removeItem(idx)}
                                                    className="text-slate-400 hover:text-red-500"
                                                    disabled={items.length === 1}
                                                >
                                                    <span className="material-icons-round">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );})}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" className="p-2">
                                            <button
                                                onClick={addItem}
                                                className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 px-2"
                                            >
                                                <span className="material-icons-round text-lg">add</span> {t('माल जोडा', 'Add Item')}
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Expenses & Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-4">{t('खर्च', 'Expenses')}</h3>
                                <div className="space-y-3 max-w-xs">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">{t('आडत', 'Commission')}</label>
                                        <input
                                            type="number"
                                            value={expenses.commission}
                                            onChange={e => setExpenses({ ...expenses, commission: e.target.value })}
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">{t('हमाली', 'Labor (Hamali)')}</label>
                                        <input
                                            type="number"
                                            value={expenses.labor}
                                            onChange={e => setExpenses({ ...expenses, labor: e.target.value })}
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">{t('मापाई', 'Weighing (Mapai)')}</label>
                                        <input
                                            type="number"
                                            value={expenses.weighing}
                                            onChange={e => setExpenses({ ...expenses, weighing: e.target.value })}
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                                <div className="flex justify-between text-slate-600">
                                    <span>{t('एकूण रक्कम', 'Gross Total')}</span>
                                    <span>₹ {grossTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>{t('एकूण खर्च', 'Total Expenses')}</span>
                                    <span>- ₹ {totalExpenses.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
                                    <span>{t('निव्वळ देय', 'Net Payable')}</span>
                                    <span>₹ {netAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4">
                        <button className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
                            {t('रद्द करा', 'Cancel')}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-icons-round">save</span>
                            {loading ? t('जतन करत आहे...', 'Saving...') : t('नोंद जतन करा', 'Save Record')}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'VIEW' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                    <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center print:hidden">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{t('हिशोब पट्टी पहा', 'View Hishob Pattis')}</h1>
                            <p className="text-slate-500 text-sm">{t('तयार झालेल्या शेतकरी स्लिप्स पहा आणि प्रिंट करा', 'Review & print generated farmer slips')}</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 print:p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50 p-6 rounded-xl border border-emerald-100 print:hidden">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('तारीख', 'Date')}</label>
                                <input
                                    type="date"
                                    value={viewDate}
                                    onChange={e => setViewDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('शेतकरी', 'Farmer')}</label>
                                <select
                                    value={viewFarmer}
                                    onChange={e => setViewFarmer(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">{t('शेतकरी निवडा', 'Select Farmer')}</option>
                                    {farmers.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} {f.village ? `(${f.village})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loading && <div className="text-center py-4 print:hidden">{t('हिशोब पट्ट्या लोड होत आहेत...', 'Loading Pattis...')}</div>}

                        {!loading && pattis.length === 0 && viewFarmer && (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
                                {t('या शेतकऱ्यासाठी कोणतीही हिशोब पट्टी तयार झाली नाही', 'No Hishob Pattis generated for this Farmer')}
                            </div>
                        )}

                        <div className="space-y-8 print:space-y-4">
                            {pattis.map((patti) => (
                                <div key={patti.id} className="border-2 border-slate-800 rounded-xl overflow-hidden print:border-slate-800 print:rounded-none page-break-after">
                                    <PrintHeader
                                        docTitle="हिशोब पट्टी · Hishob Patti"
                                        leftInfo={[
                                            { label: 'शेतकरी / Farmer', value: patti.farmers?.name },
                                            { label: 'गाव / Village', value: patti.farmers?.village || '—' },
                                        ]}
                                        rightInfo={[
                                            { label: 'तारीख / Date', value: new Date(patti.date + 'T00:00:00').toLocaleDateString('en-GB') },
                                            { label: 'पावती क्र / Receipt No', value: patti.receipt_no },
                                        ]}
                                    />

                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b-2 border-slate-800 print:bg-white text-sm uppercase">
                                            <tr>
                                                <th className="p-3 border-r-2 border-slate-800">Product</th>
                                                <th className="p-3 border-r-2 border-slate-800">Merchant</th>
                                                <th className="p-3 border-r-2 border-slate-800 text-center">Weight</th>
                                                <th className="p-3 border-r-2 border-slate-800 text-center">Rate</th>
                                                <th className="p-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-400">
                                            {patti.hishob_items?.map((item, i) => (
                                                <tr key={i}>
                                                    <td className="p-3 border-r-2 border-slate-800 font-medium">{item.products?.name}</td>
                                                    <td className="p-3 border-r-2 border-slate-800 text-xs text-slate-600">{(merchants.find(m => m.id === (item.merchant_id || patti.merchant_id))?.name) || '-'}</td>
                                                    <td className="p-3 border-r-2 border-slate-800 text-center">{item.weight}</td>
                                                    <td className="p-3 border-r-2 border-slate-800 text-center">{item.rate}</td>
                                                    <td className="p-3 text-right font-mono font-bold">{item.amount.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="grid grid-cols-2 border-t-2 border-slate-800">
                                        <div className="p-4 border-r-2 border-slate-800">
                                            <h4 className="font-bold text-sm uppercase text-slate-500 border-b border-slate-300 pb-1 mb-2">खर्च (Expenses)</h4>
                                            <div className="text-sm space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Commission:</span>
                                                    <span className="font-mono">₹ -</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Labor/Hamali:</span>
                                                    <span className="font-mono">₹ -</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Weighing:</span>
                                                    <span className="font-mono">₹ -</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-50 print:bg-white">
                                            <div className="flex justify-between text-slate-700 font-bold mb-2">
                                                <span>Gross Total:</span>
                                                <span className="font-mono">₹ {patti.gross_total.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-red-600 font-bold border-b border-slate-400 pb-2 mb-2">
                                                <span>Expenses:</span>
                                                <span className="font-mono">- ₹ {patti.total_expenses.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-xl text-slate-900 font-black">
                                                <span>Net Payable:</span>
                                                <span className="font-mono">₹ {patti.net_amount.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {pattis.length > 0 && (
                        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4 print:hidden">
                            <button
                                onClick={() => setShowKeyModal(true)}
                                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 shadow-lg shadow-slate-900/20 flex items-center gap-2"
                            >
                                <Printer size={20} />
                                Print {pattis.length} Pattis
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Security Key Modal */}
            {showKeyModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-100 print:hidden">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <LockKeyhole size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Enter Security Key</h3>
                        <p className="text-slate-500 text-sm mb-6">Authentication is required to download or print these pattis.</p>

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

            {/* Add Farmer Modal */}
            {showAddFarmerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Farmer</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFarmerData.name}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg">+91</span>
                                    <input
                                        type="tel"
                                        placeholder="9876543210"
                                        value={newFarmerData.mobile}
                                        onChange={e => setNewFarmerData({ ...newFarmerData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
                                <input
                                    type="text"
                                    value={newFarmerData.village}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, village: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddFarmerModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddFarmer}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    Save Farmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

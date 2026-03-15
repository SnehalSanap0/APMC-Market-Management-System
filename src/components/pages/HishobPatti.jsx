import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { LockKeyhole, Printer } from 'lucide-react';

export default function HishobPatti() {
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
    const [viewMerchant, setViewMerchant] = useState('');
    const [pattis, setPattis] = useState([]);

    const [showKeyModal, setShowKeyModal] = useState(false);
    const [securityKey, setSecurityKey] = useState('');
    const [keyError, setKeyError] = useState('');

    useEffect(() => {
        fetchMasters();
        generateReceiptNo();
    }, []);

    useEffect(() => {
        if (activeTab === 'VIEW' && viewDate && viewMerchant) {
            fetchPattis();
        }
    }, [activeTab, viewDate, viewMerchant]);

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
            if (viewMerchant) {
                filtered = filtered.filter(entry => 
                    entry.hishob_items?.some(item => item.merchant_id === viewMerchant) || entry.merchant_id === viewMerchant
                );
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

    const generateReceiptNo = () => {
        // Simple generation for now: HP-YYYYMMDD-Random
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setReceiptNo(`HP-${today}-${random}`);
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

    const handleAddFarmer = async () => {
        if (!newFarmerData.name) return alert('Name is required');

        const { data, error } = await supabase
            .from('farmers')
            .insert([newFarmerData])
            .select()
            .single();

        if (error) {
            alert('Error adding farmer: ' + error.message);
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

        // Auto-calc amount if rate and weight are present
        if (field === 'rate' || field === 'weight') {
            const weight = parseFloat(newItems[index].weight) || 0;
            const rate = parseFloat(newItems[index].rate) || 0;
            newItems[index].amount = (weight * rate) / 100;
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
        if (!selectedFarmer || items.some(i => !i.productId || !i.merchantId)) return alert('Please select Farmer, Product, and Merchant for all items');

        setLoading(true);

        // 1. Create Entry
        const { data: entry, error: entryError } = await supabase
            .from('hishob_entries')
            .insert([{
                receipt_no: receiptNo,
                date,
                farmer_id: selectedFarmer.id,
                gross_total: grossTotal,
                total_expenses: totalExpenses,
                net_amount: netAmount
            }])
            .select()
            .single();

        if (entryError) {
            alert('Error saving patti: ' + entryError.message);
            setLoading(false);
            return;
        }

        // 2. Create Items
        const itemsToSave = items.map(item => ({
            entry_id: entry.id,
            product_id: item.productId,
            merchant_id: item.merchantId,
            weight: item.weight,
            rate: item.rate,
            amount: item.amount
        }));

        const { error: itemsError } = await supabase
            .from('hishob_items')
            .insert(itemsToSave);

        if (itemsError) {
            alert('Error saving items: ' + itemsError.message);
        } else {
            alert('Hishob Patti Saved Successfully!');
            // Reset form
            setSelectedFarmer(null);
            setFarmerSearch('');
            setItems([{ productId: '', merchantId: '', weight: '', rate: '', amount: 0 }]);
            generateReceiptNo();
        }
        setLoading(false);
    };

    const handleDownload = () => {
        if (securityKey !== '1234') {
            setKeyError('Invalid security key. Please try again.');
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
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            {/* Tabs */}
            <div className="max-w-5xl mx-auto mb-6 flex gap-4 print:hidden">
                <button
                    onClick={() => setActiveTab('CREATE')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'CREATE' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    नवीन नोंद (Create New Entry)
                </button>
                <button
                    onClick={() => setActiveTab('VIEW')}
                    className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'VIEW' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    रेजिस्टर पहा आणि प्रिंट करा (View & Print)
                </button>
            </div>

            {activeTab === 'CREATE' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">हिशोब पट्टी नोंद (Hishob Patti Entry)</h1>
                            <p className="text-slate-500 text-sm">नवीन सेटलमेंट स्लिप तयार करा (Create new settlement slip)</p>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">पावती क्रमांक (Receipt No)</div>
                            <div className="font-mono font-bold text-lg">{receiptNo}</div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Top Section: Date, Merchant, Farmer */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">तारीख (Date) <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>

                            {/* Farmer Search + Add */}
                            <div className="relative" ref={farmerDropdownRef}>
                                <label className="block text-sm font-medium text-slate-700 mb-1">शेतकरी (Farmer) <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="शेतकरी शोधा... (Search Farmer...)"
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
                                            <span className="material-icons-round text-sm">add</span> नवीन शेतकरी जोडा (Add New Farmer)
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
                                        <th className="p-3 border-b min-w-[150px]">माल (Product)</th>
                                        <th className="p-3 border-b min-w-[150px]">व्यापारी (Merchant)</th>
                                        <th className="p-3 border-b w-32">वजन (Weight)</th>
                                        <th className="p-3 border-b w-32">दर (Rate)</th>
                                        <th className="p-3 border-b w-40 text-right">रक्कम (Amount)</th>
                                        <th className="p-3 border-b w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="p-2">
                                                <select
                                                    value={item.productId}
                                                    onChange={e => updateItem(idx, 'productId', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                                >
                                                    <option value="">माल निवडा (Select Product)</option>
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
                                                    <option value="">व्यापारी निवडा (Select Merchant)</option>
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
                                                    placeholder="0.00"
                                                    value={item.rate}
                                                    onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                                />
                                            </td>
                                            <td className="p-2 text-right font-mono font-medium">
                                                {item.amount.toFixed(2)}
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
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="6" className="p-2">
                                            <button
                                                onClick={addItem}
                                                className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 px-2"
                                            >
                                                <span className="material-icons-round text-lg">add</span> माल जोडा (Add Item)
                                            </button>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Expenses & Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-4">खर्च (Expenses)</h3>
                                <div className="space-y-3 max-w-xs">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">आडत (Commission)</label>
                                        <input
                                            type="number"
                                            value={expenses.commission}
                                            onChange={e => setExpenses({ ...expenses, commission: e.target.value })}
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">Labor (Hamali)</label>
                                        <input
                                            type="number"
                                            value={expenses.labor}
                                            onChange={e => setExpenses({ ...expenses, labor: e.target.value })}
                                            className="w-32 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-right"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm text-slate-600">Weighing (Mapai)</label>
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
                                    <span>एकूण रक्कम (Gross Total)</span>
                                    <span>₹ {grossTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-red-600">
                                    <span>एकूण खर्च (Total Expenses)</span>
                                    <span>- ₹ {totalExpenses.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
                                    <span>निव्वळ देय (Net Payable)</span>
                                    <span>₹ {netAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4">
                        <button className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
                            रद्द करा (Cancel)
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <span className="material-icons-round">save</span>
                            {loading ? 'Saving...' : 'नोंद जतन करा (Save Record)'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'VIEW' && (
                <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none">
                    <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center print:hidden">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">View Hishob Pattis</h1>
                            <p className="text-slate-500 text-sm">Review & print generated farmer slips</p>
                        </div>
                    </div>

                    <div className="p-8 space-y-8 print:p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-emerald-50 p-6 rounded-xl border border-emerald-100 print:hidden">
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

                        {loading && <div className="text-center py-4 print:hidden">Loading Pattis...</div>}

                        {!loading && pattis.length === 0 && viewMerchant && (
                            <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-xl border border-slate-200 print:hidden">
                                No Hishob Pattis generated for this Merchant on {new Date(viewDate).toLocaleDateString('en-GB')}
                            </div>
                        )}

                        <div className="space-y-8 print:space-y-4">
                            {pattis.map((patti) => (
                                <div key={patti.id} className="border-2 border-slate-800 rounded-xl overflow-hidden print:border-slate-800 print:rounded-none page-break-after">
                                    <div className="text-center border-b-2 border-slate-800 p-4 bg-slate-100 print:bg-white">
                                        <h1 className="text-2xl font-black text-slate-900 devanagari">श्री जय सप्तश्रृंगी व्हेजिटेबल कं.</h1>
                                        <p className="text-slate-700 font-bold uppercase text-sm mt-1 tracking-widest">Hishob Patti / शेतकरी हिशोब पट्टी</p>
                                    </div>
                                    <div className="p-4 flex justify-between border-b-2 border-slate-800">
                                        <div>
                                            <p className="text-sm font-bold text-slate-500 uppercase">शेतकरी (Farmer):</p>
                                            <p className="font-bold text-lg text-slate-900">{patti.farmers?.name}</p>
                                            <p className="text-sm text-slate-700">गाव (Village): {patti.farmers?.village || '-'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold mb-1 text-slate-800">Date: {new Date(patti.date).toLocaleDateString('en-GB')}</p>
                                            <p className="text-sm font-bold text-slate-800">Receipt No: {patti.receipt_no}</p>
                                        </div>
                                    </div>

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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] print:hidden">
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
                                <input
                                    type="text"
                                    value={newFarmerData.mobile}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, mobile: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
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

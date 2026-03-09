import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HishobPatti() {
    const [loading, setLoading] = useState(false);

    // Master Data
    const [farmers, setFarmers] = useState([]);
    const [merchants, setMerchants] = useState([]);
    const [products, setProducts] = useState([]);

    // Form State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [receiptNo, setReceiptNo] = useState(''); // Auto-generated or manual
    const [selectedMerchant, setSelectedMerchant] = useState('');

    // Farmer Search/Add State
    const [farmerSearch, setFarmerSearch] = useState('');
    const [selectedFarmer, setSelectedFarmer] = useState(null);
    const [showFarmerDropdown, setShowFarmerDropdown] = useState(false);
    const [showAddFarmerModal, setShowAddFarmerModal] = useState(false);
    const [newFarmerData, setNewFarmerData] = useState({ name: '', mobile: '', village: '' });

    // Items State
    const [items, setItems] = useState([
        { productId: '', weight: '', rate: '', amount: 0 }
    ]);

    // Expenses
    const [expenses, setExpenses] = useState({
        commission: 0,
        labor: 0,
        weighing: 0
    });

    useEffect(() => {
        fetchMasters();
        generateReceiptNo();
    }, []);

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
            newItems[index].amount = weight * rate;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { productId: '', weight: '', rate: '', amount: 0 }]);
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
        if (!selectedFarmer || !selectedMerchant) return alert('Please select Farmer and Merchant');

        setLoading(true);

        // 1. Create Entry
        const { data: entry, error: entryError } = await supabase
            .from('hishob_entries')
            .insert([{
                receipt_no: receiptNo,
                date,
                farmer_id: selectedFarmer.id,
                merchant_id: selectedMerchant,
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
            setItems([{ productId: '', weight: '', rate: '', amount: 0 }]);
            generateReceiptNo();
        }
        setLoading(false);
    };

    return (
        <div className="bg-slate-50 min-h-screen p-4 md:p-8 text-slate-900">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-slate-100 p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Hishob Patti Entry</h1>
                        <p className="text-slate-500 text-sm">Create new settlement slip</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Receipt No</div>
                        <div className="font-mono font-bold text-lg">{receiptNo}</div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Top Section: Date, Merchant, Farmer */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                            />
                        </div>

                        {/* Farmer Search + Add */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Farmer</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search Farmer..."
                                    value={farmerSearch}
                                    onChange={(e) => {
                                        setFarmerSearch(e.target.value);
                                        setShowFarmerDropdown(true);
                                        setSelectedFarmer(null);
                                    }}
                                    onFocus={() => setShowFarmerDropdown(true)}
                                    className={`w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary ${selectedFarmer ? 'bg-green-50 border-green-500 text-green-700 font-semibold' : ''}`}
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
                                        <span className="material-icons-round text-sm">add</span> Add New Farmer
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Merchant (Agent)</label>
                            <select
                                value={selectedMerchant}
                                onChange={e => setSelectedMerchant(e.target.value)}
                                className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                            >
                                <option value="">Select Merchant</option>
                                {merchants.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.shop_name})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <tr>
                                    <th className="p-3 border-b">Product</th>
                                    <th className="p-3 border-b w-32">Weight</th>
                                    <th className="p-3 border-b w-32">Rate</th>
                                    <th className="p-3 border-b w-40 text-right">Amount</th>
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
                                                className="w-full border-slate-200 rounded focus:ring-primary focus:border-primary"
                                            >
                                                <option value="">Select Product</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={item.weight}
                                                onChange={e => updateItem(idx, 'weight', e.target.value)}
                                                className="w-full border-slate-200 rounded focus:ring-primary focus:border-primary"
                                            />
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={item.rate}
                                                onChange={e => updateItem(idx, 'rate', e.target.value)}
                                                className="w-full border-slate-200 rounded focus:ring-primary focus:border-primary"
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
                                    <td colSpan="5" className="p-2">
                                        <button
                                            onClick={addItem}
                                            className="text-primary hover:text-primary/80 text-sm font-semibold flex items-center gap-1 px-2"
                                        >
                                            <span className="material-icons-round text-lg">add</span> Add Item
                                        </button>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Expenses & Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-200 pt-8">
                        <div>
                            <h3 className="font-semibold text-slate-800 mb-4">Expenses</h3>
                            <div className="space-y-3 max-w-xs">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-600">Commission</label>
                                    <input
                                        type="number"
                                        value={expenses.commission}
                                        onChange={e => setExpenses({ ...expenses, commission: e.target.value })}
                                        className="w-32 border-slate-300 rounded text-right"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-600">Labor (Hamali)</label>
                                    <input
                                        type="number"
                                        value={expenses.labor}
                                        onChange={e => setExpenses({ ...expenses, labor: e.target.value })}
                                        className="w-32 border-slate-300 rounded text-right"
                                    />
                                </div>
                                <div className="flex justify-between items-center">
                                    <label className="text-sm text-slate-600">Weighing (Mapai)</label>
                                    <input
                                        type="number"
                                        value={expenses.weighing}
                                        onChange={e => setExpenses({ ...expenses, weighing: e.target.value })}
                                        className="w-32 border-slate-300 rounded text-right"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-xl space-y-3">
                            <div className="flex justify-between text-slate-600">
                                <span>Gross Total</span>
                                <span>₹ {grossTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-red-600">
                                <span>Total Expenses</span>
                                <span>- ₹ {totalExpenses.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-slate-200 pt-3 flex justify-between text-xl font-bold text-slate-900">
                                <span>Net Payable</span>
                                <span>₹ {netAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4">
                    <button className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-200 rounded-lg">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <span className="material-icons-round">save</span>
                        {loading ? 'Saving...' : 'Save Record'}
                    </button>
                </div>
            </div>

            {/* Add Farmer Modal */}
            {showAddFarmerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">Add New Farmer</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newFarmerData.name}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, name: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                                <input
                                    type="text"
                                    value={newFarmerData.mobile}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, mobile: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
                                <input
                                    type="text"
                                    value={newFarmerData.village}
                                    onChange={e => setNewFarmerData({ ...newFarmerData, village: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg"
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

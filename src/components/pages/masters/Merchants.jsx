import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Merchants() {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobile: '', opening_balance: 0 });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchMerchants();
    }, []);

    const fetchMerchants = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('merchants').select('*').order('name');
        if (error) console.error(error);
        else setMerchants(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            await supabase.from('merchants').update(formData).eq('id', editingId);
        } else {
            await supabase.from('merchants').insert([formData]);
        }
        setShowModal(false);
        setFormData({ name: '', mobile: '', opening_balance: 0 });
        setEditingId(null);
        fetchMerchants();
    };

    const handleEdit = (m) => {
        setFormData({ name: m.name, mobile: m.mobile, opening_balance: m.opening_balance });
        setEditingId(m.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete merchant?')) {
            await supabase.from('merchants').delete().eq('id', id);
            fetchMerchants();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Merchants Directory</h2>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', mobile: '', opening_balance: 0 }); }}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <span className="material-icons-round text-sm">add</span> Add Merchant
                </button>
            </div>

            {loading ? <div className="text-center py-12">Loading...</div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <th className="p-4 border-b">Name</th>
                                <th className="p-4 border-b">Mobile Phone</th>
                                <th className="p-4 border-b text-right">Balance</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {merchants.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{m.name}</td>
                                    <td className="p-4 text-slate-600 font-mono text-sm">{m.mobile}</td>
                                    <td className="p-4 text-right font-mono text-slate-700">₹ {m.opening_balance}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(m)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-icons-round text-lg">edit</span></button>
                                        <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><span className="material-icons-round text-lg">delete</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Merchant' : 'Add Merchant'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name / Firm Name <span className="text-red-500">*</span></label>
                                <input required type="text" placeholder="e.g. Ramesh Trading" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg">+91</span>
                                    <input type="tel" pattern="[0-9]{10}" placeholder="9876543210" title="Must be a 10-digit number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Opening Balance (₹)</label>
                                <input type="number" step="0.01" value={formData.opening_balance} onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono" />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

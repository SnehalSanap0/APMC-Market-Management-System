import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', unit: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').order('name');
        if (error) console.error(error);
        else setProducts(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            await supabase.from('products').update(formData).eq('id', editingId);
        } else {
            await supabase.from('products').insert([formData]);
        }
        setShowModal(false);
        setFormData({ name: '', unit: '' });
        setEditingId(null);
        fetchProducts();
    };

    const handleEdit = (p) => {
        setFormData({ name: p.name, unit: p.unit });
        setEditingId(p.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete product?')) {
            await supabase.from('products').delete().eq('id', id);
            fetchProducts();
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Products Directory</h2>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', unit: '' }); }}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <span className="material-icons-round text-sm">add</span> Add Product
                </button>
            </div>

            {loading ? <div className="text-center py-12">Loading...</div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <th className="p-4 border-b">Product Name</th>
                                <th className="p-4 border-b">Unit (e.g. Kg, Quintal)</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4 text-slate-600">{p.unit}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-icons-round text-lg">edit</span></button>
                                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><span className="material-icons-round text-lg">delete</span></button>
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
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Product' : 'Add Product'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                                <input placeholder="e.g., Quintal, Crate, Kg" type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full border-slate-300 rounded-lg" />
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

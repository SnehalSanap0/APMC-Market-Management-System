import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return data ?? [];
};

export default function Products() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', unit: '' });
    const [editingId, setEditingId] = useState(null);

    // ── READ ──────────────────────────────────────────────────────────────────
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    // ── WRITE helpers ─────────────────────────────────────────────────────────
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

    const addMutation = useMutation({
        mutationFn: (payload) => supabase.from('products').insert([payload]).throwOnError(),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) =>
            supabase.from('products').update(payload).eq('id', id).throwOnError(),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => supabase.from('products').delete().eq('id', id).throwOnError(),
        onSuccess: invalidate,
    });

    // ── HANDLERS ──────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, payload: formData });
        } else {
            addMutation.mutate(formData);
        }
        setShowModal(false);
        setFormData({ name: '', unit: '' });
        setEditingId(null);
    };

    const handleEdit = (p) => {
        setFormData({ name: p.name, unit: p.unit });
        setEditingId(p.id);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('Delete product?')) deleteMutation.mutate(id);
    };

    const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // ── RENDER ────────────────────────────────────────────────────────────────
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

            {isLoading ? <div className="text-center py-12">Loading...</div> : (
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
                            {products.length === 0 ? (
                                <tr><td colSpan="3" className="p-8 text-center text-slate-400">No products found. Add one to get started.</td></tr>
                            ) : products.map((p) => (
                                <tr key={p.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">{p.name}</td>
                                    <td className="p-4 text-slate-600">{p.unit}</td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={() => handleEdit(p)} disabled={isMutating} className="text-blue-600 hover:bg-blue-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">edit</span></button>
                                        <button onClick={() => handleDelete(p.id)} disabled={isMutating} className="text-red-600 hover:bg-red-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">delete</span></button>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Product Name <span className="text-red-500">*</span></label>
                                <input required placeholder="e.g. Onion, Tomato" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Unit / Category <span className="text-red-500">*</span></label>
                                <input required placeholder="e.g. Quintal, Crate, Kg, Dozen" type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
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

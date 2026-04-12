import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../../lib/toast.jsx';
import { useAuth } from '../../../lib/AuthContext';

const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) throw error;
    return data ?? [];
};

export default function Products() {
    const queryClient = useQueryClient();
    const toast = useToast();
    const { isAdmin, canWrite, session } = useAuth();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', unit: '', remark: '' });
    const [editingId, setEditingId] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // ── READ ──────────────────────────────────────────────────────────────────
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: fetchProducts,
    });

    // ── WRITE helpers ─────────────────────────────────────────────────────────
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] });

    const addMutation = useMutation({
        mutationFn: (payload) => supabase.from('products').insert([payload]).throwOnError(),
        onSuccess: () => { invalidate(); toast.success('Product added successfully!'); },
        onError: (err) => toast.error('Failed to add product: ' + err.message),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, payload, remark }) => {
            const { data, error } = await supabase.from('products').update(payload).eq('id', id).select().single();
            if (error) throw error;
            if (remark) {
                await supabase.from('edit_remarks').insert([{ 
                    table_name: 'products', 
                    record_id: String(id), 
                    remark, 
                    user_id: session?.user?.id 
                }]);
            }
            return data;
        },
        onSuccess: () => { invalidate(); toast.success('Product updated successfully!'); },
        onError: (err) => toast.error('Failed to update product: ' + err.message),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => supabase.from('products').delete().eq('id', id).throwOnError(),
        onSuccess: () => { invalidate(); toast.success('Product deleted.'); },
        onError: (err) => toast.error('Failed to delete: ' + err.message),
    });

    // ── HANDLERS ──────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        const { remark, ...payload } = formData;
        if (editingId) {
            if (!remark?.trim()) {
                toast.error('Remark is required for edits');
                return;
            }
            updateMutation.mutate({ id: editingId, payload, remark });
        } else {
            addMutation.mutate(payload);
        }
        setShowModal(false);
        setFormData({ name: '', unit: '', remark: '' });
        setEditingId(null);
    };

    const handleEdit = (p) => {
        setFormData({ name: p.name, unit: p.unit, remark: '' });
        setEditingId(p.id);
        setShowModal(true);
    };

    const handleDelete = (id) => setConfirmDeleteId(id);
    const confirmDelete = () => {
        deleteMutation.mutate(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Products Directory</h2>
                {canWrite && (
                    <button
                        onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', unit: '', remark: '' }); }}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <span className="material-icons-round text-sm">add</span> Add Product
                    </button>
                )}
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
                                        {isAdmin && (
                                            <>
                                                <button onClick={() => handleEdit(p)} disabled={isMutating} className="text-blue-600 hover:bg-blue-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">edit</span></button>
                                                <button onClick={() => handleDelete(p.id)} disabled={isMutating} className="text-red-600 hover:bg-red-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">delete</span></button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add / Edit Modal */}
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
                            {editingId && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Edit Remark <span className="text-red-500">*</span></label>
                                    <input required type="text" placeholder="Why are you editing this?" value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                                </div>
                            )}
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
                        <span className="material-icons-round text-5xl text-red-400 mb-3 block">delete_forever</span>
                        <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Product?</h3>
                        <p className="text-slate-500 text-sm mb-6">This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDeleteId(null)} className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">Yes, Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

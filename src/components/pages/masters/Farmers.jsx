import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';

const fetchFarmers = async () => {
    const { data, error } = await supabase.from('farmers').select('*').order('name');
    if (error) throw error;
    return data ?? [];
};

export default function Farmers() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobile: '', village: '' });
    const [editingId, setEditingId] = useState(null);

    // ── READ ──────────────────────────────────────────────────────────────────
    const { data: farmers = [], isLoading } = useQuery({
        queryKey: ['farmers'],
        queryFn: fetchFarmers,
    });

    // ── WRITE helpers ─────────────────────────────────────────────────────────
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['farmers'] });

    const addMutation = useMutation({
        mutationFn: (payload) => supabase.from('farmers').insert([payload]).throwOnError(),
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) =>
            supabase.from('farmers').update(payload).eq('id', id).throwOnError(),
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => supabase.from('farmers').delete().eq('id', id).throwOnError(),
        onSuccess: invalidate,
    });

    // ── HANDLERS ──────────────────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        const { name, mobile, village } = formData;
        if (editingId) {
            updateMutation.mutate({ id: editingId, payload: { name, mobile, village } });
        } else {
            addMutation.mutate({ name, mobile, village });
        }
        setShowModal(false);
        setFormData({ name: '', mobile: '', village: '' });
        setEditingId(null);
    };

    const handleEdit = (farmer) => {
        setFormData({ name: farmer.name, mobile: farmer.mobile, village: farmer.village });
        setEditingId(farmer.id);
        setShowModal(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this farmer?')) deleteMutation.mutate(id);
    };

    const isMutating = addMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // ── RENDER ────────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Farmers Directory</h2>
                <button
                    onClick={() => { setShowModal(true); setEditingId(null); setFormData({ name: '', mobile: '', village: '' }); }}
                    className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <span className="material-icons-round text-sm">add</span>
                    Add Farmer
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-12 text-slate-500">Loading farmers...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm uppercase">
                                <th className="p-4 border-b">Name</th>
                                <th className="p-4 border-b">Mobile</th>
                                <th className="p-4 border-b">Village</th>
                                <th className="p-4 border-b text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {farmers.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">No farmers found. Add one to get started.</td></tr>
                            ) : (
                                farmers.map((farmer) => (
                                    <tr key={farmer.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-medium">{farmer.name}</td>
                                        <td className="p-4 text-slate-600">{farmer.mobile}</td>
                                        <td className="p-4 text-slate-600">{farmer.village}</td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={() => handleEdit(farmer)} disabled={isMutating} className="text-blue-600 hover:bg-blue-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">edit</span></button>
                                            <button onClick={() => handleDelete(farmer.id)} disabled={isMutating} className="text-red-600 hover:bg-red-50 p-1 rounded disabled:opacity-50"><span className="material-icons-round text-lg">delete</span></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold mb-4">{editingId ? 'Edit Farmer' : 'Add New Farmer'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Farmer Name <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Tukaram Patil"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-slate-500 bg-slate-50 border border-r-0 border-slate-300 rounded-l-lg">+91</span>
                                    <input
                                        type="tel"
                                        pattern="[0-9]{10}"
                                        placeholder="9876543210"
                                        title="Must be a 10-digit number"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-r-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Village / Town</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Nashik"
                                    value={formData.village}
                                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                                >
                                    {editingId ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';

export default function Farmers() {
    const [farmers, setFarmers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', mobile: '', village: '' });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchFarmers();
    }, []);

    const fetchFarmers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('farmers')
            .select('*')
            .order('name');

        if (error) console.error('Error fetching farmers:', error);
        else setFarmers(data || []);
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, mobile, village } = formData;

        if (editingId) {
            const { error } = await supabase
                .from('farmers')
                .update({ name, mobile, village })
                .eq('id', editingId);
            if (error) alert('Error updating farmer');
        } else {
            const { error } = await supabase
                .from('farmers')
                .insert([{ name, mobile, village }]);
            if (error) alert('Error adding farmer');
        }

        setShowModal(false);
        setFormData({ name: '', mobile: '', village: '' });
        setEditingId(null);
        fetchFarmers();
    };

    const handleEdit = (farmer) => {
        setFormData({ name: farmer.name, mobile: farmer.mobile, village: farmer.village });
        setEditingId(farmer.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this farmer?')) return;
        const { error } = await supabase.from('farmers').delete().eq('id', id);
        if (error) alert('Error deleting farmer');
        else fetchFarmers();
    };

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

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading farmers...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm uppercas">
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
                                            <button onClick={() => handleEdit(farmer)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><span className="material-icons-round text-lg">edit</span></button>
                                            <button onClick={() => handleDelete(farmer.id)} className="text-red-600 hover:bg-red-50 p-1 rounded"><span className="material-icons-round text-lg">delete</span></button>
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                                <input
                                    type="text"
                                    value={formData.mobile}
                                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Village</label>
                                <input
                                    type="text"
                                    value={formData.village}
                                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                                    className="w-full border-slate-300 rounded-lg focus:ring-primary focus:border-primary"
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

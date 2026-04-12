import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../lib/language';
import { useToast } from '../../lib/toast';
import { useAuth } from '../../lib/AuthContext';
import { Users, CheckCircle, XCircle, Shield, Key } from 'lucide-react';

export default function UserManagement() {
    const { t } = useLanguage();
    const toast = useToast();
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            toast.error(t('वापरकर्ते लोड करताना त्रुटी', 'Error loading users'));
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const updateUserStatus = async (id, status) => {
        const { error } = await supabase
            .from('user_profiles')
            .update({ status })
            .eq('id', id);

        if (error) {
            toast.error(t('स्थिती बदलताना त्रुटी', 'Error updating status'));
            return;
        }
        toast.success(t('स्थिती अद्ययावत केली', 'Status updated'));
        fetchUsers();
    };

    const updateUserRole = async (id, role) => {
        if (!isAdmin) {
            toast.error('Only admin can change roles');
            return;
        }
        const { error } = await supabase
            .from('user_profiles')
            .update({ role })
            .eq('id', id);

        if (error) {
            toast.error(t('भूमिका बदलताना त्रुटी', 'Error updating role'));
            return;
        }
        toast.success(t('भूमिका अद्ययावत केली', 'Role updated'));
        fetchUsers();
    };

    const togglePermission = async (user, permKey) => {
        if (!isAdmin) return;
        const currentPerms = user.permissions || {};
        const newPerms = { ...currentPerms, [permKey]: !currentPerms[permKey] };

        const { error } = await supabase
            .from('user_profiles')
            .update({ permissions: newPerms })
            .eq('id', user.id);

        if (error) {
            toast.error(t('परवानग्या बदलताना त्रुटी', 'Error updating permissions'));
            return;
        }
        toast.success(t('परवानग्या अद्ययावत केल्या', 'Permissions updated'));
        fetchUsers();
    };

    if (!isAdmin) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="text-primary" />
                    {t('वापरकर्ता व्यवस्थापन', 'User Management')}
                </h2>
                <button
                    onClick={fetchUsers}
                    disabled={loading}
                    className="text-sm bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-md transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold">User Details</th>
                            <th className="p-4 font-semibold">Role</th>
                            <th className="p-4 font-semibold">Status</th>
                            <th className="p-4 font-semibold">Permissions</th>
                            <th className="p-4 font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <p className="text-sm font-medium text-slate-800">{u.email}</p>
                                </td>
                                <td className="p-4">
                                    {u.role === 'admin' ? (
                                        <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded">Admin</span>
                                    ) : (
                                        <select
                                            value={u.role}
                                            onChange={(e) => updateUserRole(u.id, e.target.value)}
                                            className="text-sm border border-slate-200 rounded p-1 bg-white cursor-pointer"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.status === 'approved' ? 'bg-green-100 text-green-700' :
                                            u.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {u.status.toUpperCase()}
                                    </span>
                                    {u.email === 'master@apmc.com' && (
                                        <span className="ml-2 text-[10px] font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded-full uppercase">Master</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {u.role === 'admin' ? (
                                        <span className="text-xs text-slate-400 italic">Pre-authorized</span>
                                    ) : (
                                        <div className="flex gap-2">
                                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={u.permissions?.read || false}
                                                    onChange={() => togglePermission(u, 'read')}
                                                /> Read
                                            </label>
                                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={u.permissions?.write || false}
                                                    onChange={() => togglePermission(u, 'write')}
                                                /> Write
                                            </label>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {u.role !== 'admin' && (
                                        <div className="flex gap-2">
                                            {u.status !== 'approved' && (
                                                <button
                                                    onClick={() => updateUserStatus(u.id, 'approved')}
                                                    className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors"
                                                    title="Approve User"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {u.status !== 'rejected' && (
                                                <button
                                                    onClick={() => updateUserStatus(u.id, 'rejected')}
                                                    className="text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                                    title="Reject User"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && !loading && (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-slate-500">No users found.</td>
                            </tr>
                        )}
                        {loading && users.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-4 text-center text-slate-500">Loading...</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

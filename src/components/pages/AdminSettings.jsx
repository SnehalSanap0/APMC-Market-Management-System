import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useLanguage } from '../../lib/language';
import { useToast } from '../../lib/toast';
import { LogOut, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import UserManagement from './UserManagement';

export default function AdminSettings({ onLogout }) {
    const { t } = useLanguage();
    const toast = useToast();
    const { isAdmin, canWrite, session, userProfile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    // Config State
    const [settingsId, setSettingsId] = useState(null);
    const [companyName, setCompanyName] = useState('');
    const [companyAddress, setCompanyAddress] = useState('');
    const [companyPhone, setCompanyPhone] = useState('');

    // Password States
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (session?.user) {
            setUserEmail(session.user.email);
            setDisplayName(userProfile?.display_name || session.user.user_metadata?.display_name || '');
        }
    }, [session, userProfile]);



    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('company_settings').select('*').single();
        if (data) {
            setSettingsId(data.id);
            setCompanyName(data.company_name || '');
            setCompanyAddress(data.address || '');
            setCompanyPhone(data.mobile_number || '');
        } else if (error && error.code !== 'PGRST116') { // not found error
            console.error('Error fetching settings:', error);
        }
        setLoading(false);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        let error = null;

        const payload = {
            company_name: companyName,
            address: companyAddress,
            mobile_number: companyPhone
        };

        if (settingsId) {
            const { error: updErr } = await supabase.from('company_settings').update(payload).eq('id', settingsId);
            error = updErr;
        } else {
            const { data, error: insErr } = await supabase.from('company_settings').insert([payload]).select().single();
            if (data) setSettingsId(data.id);
            error = insErr;
        }

        if (error) {
            toast.error(t('प्रोफाइल जतन करताना त्रुटी', 'Error saving profile'));
            console.error(error);
        } else {
            toast.success(t('प्रोफाइल जतन केले', 'Profile saved successfully'));
        }
        setLoading(false);
    };

    const handlePasswordChange = async () => {
        if (!currentPassword) {
            toast.error(t('चालू पासवर्ड आवश्यक आहे', 'Current password is required'));
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            toast.error(t('पासवर्ड किमान 6 वर्णांचा असावा', 'New password must be at least 6 characters'));
            return;
        }

        setLoading(true);
        // Verify current password first by signing in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: currentPassword
        });

        if (signInError) {
            toast.error(t('चुकीचा चालू पासवर्ड', 'Incorrect current password'));
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            toast.error(t('पासवर्ड बदलताना त्रुटी', 'Error changing password'));
            console.error(error);
        } else {
            setNewPassword('');
            setCurrentPassword('');
            setIsChangingPassword(false);
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            toast.success(t('पासवर्ड यशस्वीरित्या बदलला', 'Password changed successfully'));
        }
        setLoading(false);
    };

    const handleUpdateName = async () => {
        if (!session?.user?.id) return;
        setLoading(true);
        
        // 1. Update Auth Metadata
        const { error: authErr } = await supabase.auth.updateUser({
            data: { display_name: displayName }
        });

        // 2. Update user_profiles table
        const { error: profileErr } = await supabase
            .from('user_profiles')
            .update({ display_name: displayName })
            .eq('id', session.user.id);

        if (authErr || profileErr) {
            toast.error(t('नाव बदलताना त्रुटी', 'Error changing name'));
            console.error({ authErr, profileErr });
        } else {
            if (refreshProfile) refreshProfile();
            toast.success(t('नाव यशस्वीरित्या जतन केले', 'Name changed successfully!'));
        }
        setLoading(false);
    };

    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t('ॲडमिन सेटिंग्ज', 'Admin Settings')}</h1>
                    <p className="text-slate-500 text-sm">{t('तुमची प्रोफाइल आणि प्रिंटिंग सेटिंग्ज व्यवस्थापित करा', 'Manage your profile and printing settings')}</p>
                </div>

                {/* Profile Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="material-icons-round text-primary">business</span>
                            {t('व्यवसाय माहिती', 'Business Information')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('व्यवसायाचे नाव', 'Company Name')}</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('मोबाइल क्रमांक', 'Mobile Number')}</label>
                                <input
                                    type="text"
                                    value={companyPhone}
                                    onChange={e => setCompanyPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('पत्ता', 'Address')}</label>
                            <textarea
                                value={companyAddress}
                                onChange={e => setCompanyAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveProfile}
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 shadow shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? 'Saving...' : t('माहिती जतन करा', 'Save Information')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account / Security Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="material-icons-round text-slate-500">lock</span>
                            {t('खाते सुरक्षा', 'Account Security')}
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('ईमेल पत्ता', 'Email Address')}</label>
                            <input
                                type="email"
                                value={userEmail}
                                disabled
                                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                            />
                            <p className="text-xs text-slate-400 mt-1">{t('ईमेल बदलणे समर्थित नाही', 'Email changing is not supported')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('तुमचे नाव (दर्शवलेले नाव)', 'Your Name (Display Name)')}</label>
                            <div className="flex gap-4">
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder={t('तुमचे नाव टाका', 'Enter your name')}
                                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    onClick={handleUpdateName}
                                    disabled={loading || !displayName}
                                    className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap transition-colors"
                                >
                                    {t('नाव जतन करा', 'Save Name')}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{t('हे नाव साइडबारमध्ये दिसेल.', 'This will appear in the sidebar navigation.')}</p>
                        </div>

                        {!isChangingPassword ? (
                            <div>
                                <button
                                    onClick={() => setIsChangingPassword(true)}
                                    className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors"
                                >
                                    {t('पासवर्ड बदला', 'Change Password')}
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('सध्याचा पासवर्ड', 'Current Password')}</label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={e => setCurrentPassword(e.target.value)}
                                            placeholder="••••••"
                                            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('नवीन पासवर्ड', 'New Password')} <span className="text-xs text-slate-400 font-normal ml-1">(min 6 chars)</span></label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={e => setNewPassword(e.target.value)}
                                            placeholder="••••••"
                                            className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => {
                                            setIsChangingPassword(false);
                                            setCurrentPassword('');
                                            setNewPassword('');
                                        }}
                                        className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePasswordChange}
                                        disabled={loading || !newPassword || !currentPassword}
                                        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {loading ? 'Changing...' : t('पुष्टी करा', 'Confirm Update')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* User Management Section */}
                <UserManagement />

                {/* Logout Action */}
                <div className="flex justify-end pt-4 pb-8">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-6 py-3 text-red-600 font-bold bg-white border border-red-200 rounded-lg hover:bg-red-50 shadow-sm transition-colors"
                    >
                        <LogOut size={18} />
                        {t('अकाउंट मधून बाहेर पडा (Log Out)', 'Log Out')}
                    </button>
                </div>

            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/logo.png';

export default function PrintHeader({ docTitle, leftInfo = [], rightInfo = [] }) {
    const [settings, setSettings] = useState({ company_name: 'श्री जय सप्तश्रृंगी व्हेजिटेबल कं.', address: 'Market Yard', phone: '' });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('company_settings').select('*').single();
            if (data) setSettings(data);
        };
        fetchSettings();
    }, []);

    return (
        <div className="border-b-[1.5pt] border-slate-900 mb-4 pb-2">
            {/* Main Branding Section */}
            <div className="flex items-start justify-between gap-4 py-2">
                <div className="flex items-center gap-4">
                    <img
                        src={logo}
                        alt="Logo"
                        className="w-16 h-16 object-contain"
                    />
                    <div className="text-left">
                        <h1 className="text-2xl font-black text-slate-900 devanagari leading-none tracking-tight">
                            {settings.company_name}
                        </h1>
                        <p className="text-[10pt] font-semibold text-slate-600 mt-1">
                            {settings.address} {settings.phone && `• Ph: ${settings.phone}`}
                        </p>
                    </div>
                </div>
                <div className="text-right flex flex-col justify-between h-16">
                    <div className="bg-slate-900 text-white px-3 py-1 text-[11pt] font-black uppercase tracking-[0.1em]">
                        {docTitle.split('·')[0].trim()}
                    </div>
                    <div className="text-slate-500 text-[8pt] font-bold uppercase tracking-widest">
                        {docTitle.split('·')[1]?.trim() || ''}
                    </div>
                </div>
            </div>

            {/* High-Density Meta Data Grid */}
            {(leftInfo.length > 0 || rightInfo.length > 0) && (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-4 px-1 py-2 border-t border-slate-200">
                    <div className="space-y-1">
                        {leftInfo.map(({ label, value }) => (
                            <div key={label} className="flex items-baseline gap-2">
                                <span className="text-[8pt] font-extrabold uppercase text-slate-400 whitespace-nowrap min-w-[100px]">{label}:</span>
                                <span className="text-[9.5pt] font-bold text-slate-800">{value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-1">
                        {rightInfo.map(({ label, value }) => (
                            <div key={label} className="flex items-baseline justify-end gap-2">
                                <span className="text-[8pt] font-extrabold uppercase text-slate-400 whitespace-nowrap">{label}:</span>
                                <span className="text-[9.5pt] font-bold text-slate-900 font-mono">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


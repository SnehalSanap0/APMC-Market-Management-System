import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import logo from '../../assets/logo.png';

export default function PrintHeader({ docTitle, leftInfo = [], rightInfo = [] }) {
    const [settings, setSettings] = useState({ company_name: 'श्री जय सप्तश्रृंगी व्हेजिटेबल कं.', address: 'Market Yard' });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('company_settings').select('*').single();
            if (data) setSettings(data);
        };
        fetchSettings();
    }, []);
    return (
        <div className="border-b-2 border-slate-800 mb-0">
            {/* Company band */}
            <div className="flex items-center justify-center gap-4 p-4 bg-slate-100 print:bg-white border-b-2 border-slate-800">
                <img
                    src={logo}
                    alt="Company Logo"
                    className="w-14 h-14 object-contain"
                />
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 devanagari leading-tight">
                        {settings.company_name}
                    </h1>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mt-0.5">
                        {settings.address}
                    </p>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-700 mt-1 border-t border-slate-300 pt-1">
                        {docTitle}
                    </p>
                </div>
            </div>

            {/* Meta row: left info + right info */}
            {(leftInfo.length > 0 || rightInfo.length > 0) && (
                <div className="flex justify-between items-start px-4 py-3 bg-white">
                    <div className="space-y-0.5">
                        {leftInfo.map(({ label, value }) => (
                            <p key={label} className="text-sm text-slate-700">
                                <span className="font-bold uppercase text-slate-500 text-xs">{label}: </span>
                                <span className="font-semibold">{value}</span>
                            </p>
                        ))}
                    </div>
                    <div className="text-right space-y-0.5">
                        {rightInfo.map(({ label, value }) => (
                            <p key={label} className="text-sm text-slate-700">
                                <span className="font-bold uppercase text-slate-500 text-xs">{label}: </span>
                                <span className="font-semibold font-mono">{value}</span>
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

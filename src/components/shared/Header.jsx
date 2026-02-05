export default function Header({
    title = "जय सप्तश्रृंगी व्हिजीटेबल कंपनी",
    subtitle = "Vegetable Merchant & Commission Agent",
    showUser = true
}) {
    return (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <span className="material-icons-round">agriculture</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold devanagari text-primary leading-tight">{title}</h1>
                        <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            {subtitle}
                        </p>
                    </div>
                </div>

                {showUser && (
                    <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-medium text-slate-700">एडमिन</p>
                            <p className="text-[10px] text-slate-500">लॉग इन केलेले</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="material-icons-round text-slate-500 text-sm">person</span>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

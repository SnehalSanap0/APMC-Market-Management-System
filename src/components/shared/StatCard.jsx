export default function StatCard({
    icon,
    iconBgClass = "bg-emerald-50",
    iconTextClass = "text-emerald-600",
    badge,
    badgeClass = "text-emerald-600 bg-emerald-100",
    label,
    value,
    subtext,
    className = ""
}) {
    return (
        <div className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02] ${className}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 ${iconBgClass} ${iconTextClass} rounded-xl`}>
                    <span className="material-icons-round">{icon}</span>
                </div>
                {badge && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${badgeClass}`}>
                        {badge}
                    </span>
                )}
            </div>
            <p className="text-slate-500 text-sm font-medium devanagari">{label}</p>
            <h3 className="text-3xl font-bold mt-1 text-slate-900">{value}</h3>
            {subtext && (
                <p className="text-xs text-slate-400 mt-4 devanagari">{subtext}</p>
            )}
        </div>
    );
}

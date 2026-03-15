const dashboardItems = [
    {
        title: "बिल बुक (Bill Book)",
        description: "दैनंदिन विक्री आणि खरेदीचे नवीन बिल तयार करण्यासाठी आणि पाहण्यासाठी.",
        icon: "receipt_long",
        iconBgClass: "bg-blue-50",
        iconTextClass: "text-blue-600",
        badgeClass: "bg-blue-100 text-blue-700",
        badge: "-"
    },
    {
        title: "पट्टीनोंद (Pattinond)",
        description: "शेतकऱ्यांच्या मालाच्या पट्ट्या आणि हिशोबाची नोंद करण्यासाठी.",
        icon: "list_alt",
        iconBgClass: "bg-emerald-50",
        iconTextClass: "text-emerald-600",
        badgeClass: "bg-emerald-100 text-emerald-700",
        badge: "-"
    },
    {
        title: "धडा बुक (Dhada Book)",
        description: "वजन काट्याची आणि मालाच्या नगांची प्राथमिक नोंदणी.",
        icon: "scale",
        iconBgClass: "bg-amber-50",
        iconTextClass: "text-amber-600",
        badgeClass: "bg-amber-100 text-amber-700",
        badge: "-"
    },
    {
        title: "उधारी नोंद (Udhari Nond)",
        description: "बाकी येणे आणि उधारीच्या व्यवहारांचा सविस्तर हिशोब.",
        icon: "history_edu",
        iconBgClass: "bg-rose-50",
        iconTextClass: "text-rose-600",
        badgeClass: "bg-rose-100 text-rose-700",
        badge: "-"
    },
    {
        title: "जमा पावती (Jama Pauti)",
        description: "मिळालेल्या रोख रक्कमेची पावती तयार करण्यासाठी.",
        icon: "payments",
        iconBgClass: "bg-indigo-50",
        iconTextClass: "text-indigo-600",
        badgeClass: "bg-indigo-100 text-indigo-700",
        badge: "-"
    },
    {
        title: "व्यापारी खतावणी (Khatavni)",
        description: "सर्व व्यापाऱ्यांची वैयक्तिक खाती आणि लेजर बुक पाहण्यासाठी.",
        icon: "menu_book",
        iconBgClass: "bg-purple-50",
        iconTextClass: "text-purple-600",
        badgeClass: "bg-purple-100 text-purple-700",
        badge: "-"
    }
];

export default function Dashboard({ onNavigate }) {
    return (
        <div className="p-4 md:p-6 lg:p-8 text-slate-900 w-full">

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="text-center mb-12">
                    <p className="text-slate-500">
                        आजची तारीख: <span className="font-medium text-slate-900">{new Date().toLocaleDateString('en-GB')}</span>
                    </p>
                </div>

                {/* Feature Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardItems.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => onNavigate?.(item.title)}
                            className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-left"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl ${item.iconBgClass} flex items-center justify-center ${item.iconTextClass} group-hover:scale-110 transition-transform`}>
                                    <span className="material-icons-round">{item.icon}</span>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.badgeClass}`}>
                                    {item.badge}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold devanagari mb-2 text-slate-900">{item.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 leading-relaxed devanagari">
                                {item.description}
                            </p>
                            <div className="flex items-center text-primary font-semibold text-sm">
                                प्रवेश करा
                                <span className="material-icons-round text-sm ml-1 group-hover:translate-x-1 transition-transform">
                                    arrow_forward
                                </span>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Stats Bar */}
                <div className="mt-12 p-6 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row gap-8 items-center justify-around shadow-2xl">
                    <div className="flex flex-col items-center">
                        <span className="text-slate-400 text-sm mb-1 devanagari">आजची एकूण जमा</span>
                        <span className="text-2xl font-bold">₹ ०.००</span>
                    </div>
                    <div className="w-px h-10 bg-slate-700 hidden md:block"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-slate-400 text-sm mb-1 devanagari">आजची एकूण विक्री</span>
                        <span className="text-2xl font-bold">₹ ०.००</span>
                    </div>
                    <div className="w-px h-10 bg-slate-700 hidden md:block"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-slate-400 text-sm mb-1 devanagari">प्रलंबित येणे</span>
                        <span className="text-2xl font-bold text-rose-400">₹ ०.००</span>
                    </div>
                </div>

                {/* Motto */}
                <div className="mt-12 text-center">
                    <p className="text-primary italic text-lg devanagari">"दुनियांमे सबसे बडी दौलत है इमानदारी!"</p>
                    <p className="text-slate-400 text-xs mt-4">©2026 Shri Jay Saptashrungi Vegetable Co. | All Rights Reserved</p>
                </div>
            </main>

            {/* FAB Button */}
            <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center group">
                <span className="material-icons-round">add</span>
                <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none devanagari">
                    नवीन नोंद
                </span>
            </button>
        </div>
    );
}

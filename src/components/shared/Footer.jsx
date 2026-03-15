export default function Footer({
    companyName = "जय सप्तश्रृंगी व्हिजीटेबल कंपनी",
    motto = "दुनियामे सबसे बडी दौलत है इमानदारी।",
    year = new Date().getFullYear()
}) {
    return (
        <footer className="mt-12 py-8 bg-slate-100 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-slate-500 text-sm devanagari text-center md:text-left">
                    <p>पावतीशिवाय पैसे दिल्याची तक्रार चालणार नाही.</p>
                    <p>© {year} {companyName}. सर्व हक्क सुरक्षित.</p>
                </div>
                <div className="flex gap-6">
                    <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                        <span className="devanagari">मदत</span>
                    </a>
                    <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                        <span className="devanagari">अटी आणि शर्ती</span>
                    </a>
                    <a href="#" className="text-slate-400 hover:text-primary transition-colors">
                        <span className="devanagari">संपर्क</span>
                    </a>
                </div>
            </div>

            {motto && (
                <div className="max-w-7xl mx-auto px-4 mt-4 text-center">
                    <p className="italic text-slate-400 devanagari">"{motto}"</p>
                </div>
            )}
        </footer>
    );
}

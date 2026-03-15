import { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';
import {
  Dashboard,
  HishobPatti,
  MarketOperations,
  JamaPavti,
  VyapariKhatavni,
  MerchantBill,
  DhadaBook,
  PattiNond,
  Auth
} from './components/pages';
import MasterLayout from './components/pages/masters/MasterLayout';
import {
  LayoutDashboard,
  Database,
  ScrollText,
  FileText,
  Store,
  FileCheck,
  BookOpen,
  BookMarked,
  Menu,
  Bell,
  Search,
  User,
  LogOut
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const pages = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'masters', name: 'Masters', icon: Database, component: MasterLayout },
  { id: 'hishob-patti', name: 'Hishob Patti', icon: ScrollText, component: HishobPatti },
  { id: 'merchant-bill', name: 'Merchant Bill', icon: FileText, component: MerchantBill },
  { id: 'market-ops', name: 'Market Operations', icon: Store, component: MarketOperations },
  { id: 'jama-pavti', name: 'Jama Pavti', icon: FileCheck, component: JamaPavti },
  { id: 'khatavni', name: 'Vyapari Khatavni', icon: BookOpen, component: VyapariKhatavni },
  { id: 'dhada-book', name: 'Dhada Book', icon: BookMarked, component: DhadaBook },
  { id: 'patti-nond', name: 'Patti Nond', icon: FileText, component: PattiNond },
];

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard;
  const currentPageParams = pages.find(p => p.id === currentPage);

  if (authLoading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">

      {/* Sidebar Navigation */}
      <aside
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
          transition-all duration-300 ease-in-out bg-white border-r border-slate-200 
          flex flex-col z-20 flex-shrink-0 no-print`}
      >
        {/* App Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 shrink-0">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden h-full">
              <img src={logo} alt="Logo" className="w-10 h-10 shrink-0 object-contain drop-shadow-sm" />
              <span className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis text-sm leading-tight">Shri Jay Saptashrungi <br /> Vegetable Co.</span>
            </div>
          ) : (
            <div className="w-full flex justify-center items-center h-full">
              <img src={logo} alt="Logo" className="w-10 h-10 shrink-0 object-contain drop-shadow-sm" />
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {pages.map((page) => {
            const Icon = page.icon;
            const isActive = currentPage === page.id;
            return (
              <button
                key={page.id}
                onClick={() => setCurrentPage(page.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative cursor-pointer
                  ${isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                title={!isSidebarOpen ? page.name : undefined}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {isSidebarOpen && (
                  <span className="truncate text-sm">{page.name}</span>
                )}

                {/* Active Indicator Pillar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                )}
              </button>
            )
          })}
        </nav>

        {/* User Profile Summary (Sidebar Bottom) */}
        <div className="p-4 border-t border-slate-200 shrink-0 bg-slate-50/50">
          {isSidebarOpen ? (
            <div className="flex items-center gap-3 justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <User size={36} className="text-slate-400 bg-white border border-slate-200 p-1.5 rounded-full shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-800 truncate">{session.user.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <User size={28} className="text-slate-400 bg-white border border-slate-200 p-1 rounded-full cursor-pointer hover:bg-slate-50" />
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Log out"
              >
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative">

        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] no-print">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 hidden md:block"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 tracking-tight hidden sm:block">
              {currentPageParams?.name}
            </h1>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 custom-scrollbar relative">
          <div className="h-full">
            <CurrentPageComponent onNavigate={() => { }} />
          </div>
        </main>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-5 border border-red-100 shadow-sm">
              <LogOut size={28} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Ready to leave?</h3>
            <p className="text-slate-500 mb-8 text-sm">
              Are you sure you want to log out of your account? You will need to sign back in to access the market dashboard.
            </p>
            <div className="flex w-full gap-3 sm:gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  supabase.auth.signOut();
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

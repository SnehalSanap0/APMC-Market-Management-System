import { useState, useEffect, useRef } from 'react';
import './App.css';
import logo from './assets/logo.png';
import {
  Dashboard,
  HishobPatti,
  JamaPavti,
  VyapariKhatavni,
  MerchantBill,
  DhadaBook,
  PattiNond,
  Auth,
  Udharinond,
  AdminSettings,
  Vatap
} from './components/pages';
import { useLanguage } from './lib/language';
import HomePage from './components/home/HomePage';
import MasterLayout from './components/pages/masters/MasterLayout';
import {
  LayoutDashboard,
  Database,
  ScrollText,
  FileText,
  FileCheck,
  BookOpen,
  BookMarked,
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ListTodo,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { useAuth } from './lib/AuthContext';

const pages = [
  { id: 'dashboard',     nameMr: 'डॅशबोर्ड', nameEn: 'Dashboard', icon: LayoutDashboard, component: Dashboard },
  { id: 'masters',       nameMr: 'मास्टर्स', nameEn: 'Masters', icon: Database,        component: MasterLayout },
  { id: 'hishob-patti',  nameMr: 'हिशोब पट्टी', nameEn: 'Hishob Patti', icon: ScrollText,        component: HishobPatti },
  { id: 'vatap',         nameMr: 'वाटप',         nameEn: 'Vatap',        icon: ArrowLeftRight,    component: Vatap },
  { id: 'patti-nond',    nameMr: 'पट्टी नोंद',   nameEn: 'Patti Nond',  icon: FileText,          component: PattiNond },
  { id: 'merchant-bill', nameMr: 'व्यापारी बिल', nameEn: 'Merchant Bill', icon: FileText,        component: MerchantBill },
  { id: 'dhada-book',    nameMr: 'धडा बुक', nameEn: 'Dhada Book', icon: BookMarked,      component: DhadaBook },
  { id: 'jama-pavti',    nameMr: 'जमा पावती', nameEn: 'Jama Pavti', icon: FileCheck,       component: JamaPavti },
  { id: 'khatavni',      nameMr: 'व्यापारी खतावणी', nameEn: 'Vyapari Khatavni', icon: BookOpen,        component: VyapariKhatavni },
  { id: 'udharinond',    nameMr: 'उधारीनोंद', nameEn: 'Udharinond', icon: ListTodo,        component: Udharinond },
  { id: 'settings',      nameMr: 'सेटिंग्ज', nameEn: 'Settings',   icon: Settings,        component: AdminSettings, hideFromSidebar: true },
];

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { session, loading: authLoading, isApproved, userProfile } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const mainRef = useRef(null);
  const { lang, setLang, t } = useLanguage();

  // Scroll to top of content area on every page change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentPage]);

  // Session management is now handled by AuthProvider

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard;
  const currentPageParams = pages.find(p => p.id === currentPage);

  const [showAuth, setShowAuth] = useState(false);

  // If AuthContext is fundamentally loading, or if we have a session but haven't loaded the userProfile yet
  if (authLoading || (session && userProfile === null)) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-4">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Profile...</p>
          </div>
      );
  }

  if (!session) {
    if (showAuth) {
      return (
        <div className="relative">
           <button 
             onClick={() => setShowAuth(false)}
             className="fixed top-4 left-4 z-[60] text-slate-500 hover:text-primary p-2 bg-white/50 backdrop-blur-md rounded-full shadow-lg border border-slate-200 cursor-pointer transition-all hover:scale-105"
             title="Back to home"
           >
             <div className="flex items-center gap-2 px-2">
               <ArrowRight size={20} className="rotate-180" />
               <span className="text-sm font-bold uppercase tracking-widest leading-none">Back</span>
             </div>
           </button>
           <Auth />
        </div>
      );
    }
    return <HomePage onLoginClick={() => setShowAuth(true)} />;
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
         <div className="mb-8">
           <img src={logo} alt="Company Logo" className="w-24 h-24 object-contain mx-auto drop-shadow-md rounded-2xl mb-4" />
           <h1 className="text-xl font-bold text-slate-800 devanagari">
             श्री जय सप्तश्रृंगी व्हेजिटेबल कं.
           </h1>
         </div>
         <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md border border-slate-200">
           <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <Database size={32} />
           </div>
           <h2 className="text-xl font-bold text-slate-900 mb-2">Pending Approval</h2>
           <p className="text-sm text-slate-500 mb-6">
             Your account has been created but is waiting for an administrator to approve it and assign your access rights.
           </p>
           <button
             onClick={() => supabase.auth.signOut()}
             className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all"
           >
             Sign Out
           </button>
         </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden print:overflow-visible print:h-auto font-sans text-slate-900">

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
              <span className="font-bold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis text-sm leading-tight">
                {t('श्री जय सप्तश्रृंगी व्हेजिटेबल कं.', 'Shri Jay Saptashrungi Veg.')}
              </span>
            </div>
          ) : (
            <div className="w-full flex justify-center items-center h-full">
              <img src={logo} alt="Logo" className="w-10 h-10 shrink-0 object-contain drop-shadow-sm" />
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          {pages.filter(p => !p.hideFromSidebar).map((page) => {
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
                title={!isSidebarOpen ? t(page.nameMr, page.nameEn) : undefined}
              >
                <Icon size={20} className={`shrink-0 ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`} />
                {isSidebarOpen && (
                  <span className="truncate text-sm font-500">{t(page.nameMr, page.nameEn)}</span>
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
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {userProfile?.display_name || session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'User'}
                    {userProfile?.role === 'admin' && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-md uppercase">Admin</span>}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`p-1.5 rounded-lg transition-colors shrink-0 ${currentPage === 'settings' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title={t('सेटिंग्ज', 'Settings')}
              >
                <Settings size={18} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <User size={28} className="text-slate-400 bg-white border border-slate-200 p-1 rounded-full cursor-pointer hover:bg-slate-50" />
              <button
                onClick={() => setCurrentPage('settings')}
                className={`p-1.5 rounded-lg transition-colors ${currentPage === 'settings' ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                title={t('सेटिंग्ज', 'Settings')}
              >
                <Settings size={18} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden print:overflow-visible print:h-auto relative">

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
              {t(currentPageParams?.nameMr, currentPageParams?.nameEn)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setLang('mr')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'mr' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${lang === 'en' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                ENG
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Scrollable Area */}
        <main ref={mainRef} className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 print:overflow-visible custom-scrollbar relative">
          <div className="h-full">
            <CurrentPageComponent onNavigate={(pageId) => setCurrentPage(pageId)} onLogout={() => setIsLogoutModalOpen(true)} />
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
            <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">{t('बाहेर पडायचे आहे का?', 'Ready to leave?')}</h3>
            <p className="text-slate-500 mb-8 text-sm">
              {t('तुम्हाला खरोखर तुमच्या खात्यातून बाहेर पडायचे आहे का?', 'Are you sure you want to log out of your account?')}
            </p>
            <div className="flex w-full gap-3 sm:gap-4">
              <button
                onClick={() => setIsLogoutModalOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-semibold transition-all"
              >
                {t('रद्द करा', 'Cancel')}
              </button>
              <button
                onClick={() => {
                  setIsLogoutModalOpen(false);
                  supabase.auth.signOut();
                }}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white border border-red-600 rounded-xl font-semibold transition-all shadow-lg shadow-red-600/20"
              >
                {t('बाहेर पडा', 'Log out')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

import { useState } from 'react';
import './App.css';
import {
  Dashboard,
  HishobPatti,
  MarketOperations,
  JamaPavti,
  VyapariKhatavni,
  MerchantBill,
  DhadaBook
} from './components/pages';
import MasterLayout from './components/pages/masters/MasterLayout';

const pages = [
  { id: 'dashboard', name: 'Dashboard', component: Dashboard },
  { id: 'masters', name: 'Masters', component: MasterLayout },
  { id: 'hishob-patti', name: 'Hishob Patti', component: HishobPatti },
  { id: 'merchant-bill', name: 'Merchant Bill', component: MerchantBill },
  { id: 'market-ops', name: 'Market Operations', component: MarketOperations },
  { id: 'jama-pavti', name: 'Jama Pavti', component: JamaPavti },
  { id: 'khatavni', name: 'Vyapari Khatavni', component: VyapariKhatavni },
  { id: 'dhada-book', name: 'Dhada Book', component: DhadaBook },
];

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-4 py-2 no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2 justify-center">
          {pages.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPage(page.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Page Content */}
      <CurrentPageComponent onNavigate={() => { }} />
    </div>
  );
}

export default App;

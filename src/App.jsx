import { useState } from 'react';
import './App.css';
import {
  Dashboard,
  SaudaPatti,
  HishobPatti,
  MarketOperations,
  JamaPavti,
  VyapariKhatavni
} from './components/pages';

const pages = [
  { id: 'dashboard', name: 'Dashboard', component: Dashboard },
  { id: 'sauda-patti', name: 'Sauda Patti', component: SaudaPatti },
  { id: 'hishob-patti', name: 'Hishob Patti', component: HishobPatti },
  { id: 'market-ops', name: 'Market Operations', component: MarketOperations },
  { id: 'jama-pavti', name: 'Jama Pavti', component: JamaPavti },
  { id: 'khatavni', name: 'Vyapari Khatavni', component: VyapariKhatavni },
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

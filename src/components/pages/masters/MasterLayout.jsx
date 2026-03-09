import { useState } from 'react';
import { Header, Footer } from '../../shared';
import Merchants from './Merchants';
import Products from './Products';

export default function MasterLayout() {
    const [activeTab, setActiveTab] = useState('merchants');

    return (
        <div className="bg-slate-50 min-h-screen text-slate-900">
            <Header title="Master Data Management" subtitle="Manage Merchants & Products" />

            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="mb-8 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {['merchants', 'products'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitaliz
                                    ${activeTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                                `}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] p-6">
                    {activeTab === 'merchants' && <Merchants />}
                    {activeTab === 'products' && <Products />}
                </div>
            </main>

            <Footer />
        </div>
    );
}

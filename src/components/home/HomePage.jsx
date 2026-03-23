import React from 'react';
import Header from './Header';
import Hero from './Hero';
import Features from './Features';
import Footer from './Footer';

/**
 * HomePage Component
 * 
 * Assembles the landing page sections for the APMC Vegetable Market Accounting System.
 * Includes Header, Hero (Welcome), Features, and Footer sections.
 * Optimized for responsiveness and modern aesthetics.
 * 
 * @param {Object} props
 * @param {Function} props.onLoginClick - Handler to navigate to login/authentication
 */
export default function HomePage({ onLoginClick }) {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50 relative selection:bg-primary/20 selection:text-primary">
      
      {/* Background Decorative Gradient */}
      <div className="fixed top-0 left-0 right-0 -z-10 h-screen w-screen overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-green-500/5 blur-[120px] rounded-full -translate-x-1/4 translate-y-1/4"></div>
      </div>

      <Header onLoginClick={onLoginClick} />
      <main className="flex-1">
        <Hero onLoginClick={onLoginClick} />
        <Features onLoginClick={onLoginClick} />
      </main>
      <Footer />
    </div>
  );
}

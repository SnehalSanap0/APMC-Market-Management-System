import React from 'react';
import { ArrowRight, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Hero({ onLoginClick }) {
  return (
    <section className="relative p-34 sm:pt-32 pb-16 lg:pb-32 overflow-hidden bg-slate-50 min-h-screen flex items-center">
      {/* Decorative Blob */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">

          {/* Content Column */}
          <div className="flex-1 text-center lg:text-left animate-in fade-in slide-in-from-left duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-slate-200 text-slate-600 text-sm font-semibold mb-6 shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
              Modern Digital Accounting
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
              Welcome to <span className="text-primary">Shri Jay Saptashrungi</span> Vegetable Co.
            </h1>

            <p className="text-lg sm:text-xl text-slate-600/80 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Revolutionizing vegetable market management with our state-of-the-art accounting platform.
              Track sauda patti, manage bills, and handle udhar registrations effortlessly.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onLoginClick}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl shadow-primary/30 hover:shadow-primary/40 cursor-pointer"
              >
                Log In Now
                <ArrowRight size={20} />
              </button>
              <a
                href="#features"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-8 py-4 rounded-xl font-bold text-lg border-2 border-slate-200 transition-all cursor-pointer"
              >
                Explore Features
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

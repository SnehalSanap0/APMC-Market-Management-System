import React from 'react';
import { Mail, ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 py-12 text-white">
      <div className="container mx-auto px-4 flex flex-col items-center text-center">

        {/* Brand/Logo */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <img src={logo} alt="APMC Logo" className="w-12 h-12 object-contain" />
          <h1 className="text-xl font-bold tracking-tight">
            Shri Jay Saptashrungi Vegetable Co.
          </h1>
          <p className="text-slate-400 text-sm italic font-medium">Efficient · Transparent · Digital</p>
        </div>

        {/* Short Copyright */}
        <div className="text-slate-500 text-sm font-medium mb-8">
          <p>© {currentYear} All rights reserved.</p>
        </div>

        {/* Developer Info - Short & Crisp */}
        <div className="pt-8 border-t border-slate-800 w-full max-w-lg flex flex-col items-center gap-4">

          {/* Academic Note */}
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium bg-slate-800/40 py-2.5 px-6 rounded-full border border-white/5 leading-relaxed mb-3">
            <span className="text-primary font-bold">Note:</span> This website is hosted for demonstration purposes; the final client deliverable is a standalone <span className="text-white">Desktop Application (.exe)</span>.
          </div>


          <div className="flex flex-col items-center gap-2">
            <div className="text-xs font-bold text-slate-600 tracking-widest uppercase mb-1">
              Developed by Snehal Sanap
            </div>
            <div className="text-slate-400 text-sm font-medium flex items-center gap-3">
              <a href="mailto:snehalsanap307@gmail.com" className="hover:text-primary transition-colors">
                snehalsanap307@gmail.com
              </a>
              <span className="text-slate-600">·</span>
              <a href="https://snehalsanap.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                snehalsanap.vercel.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>

  );
}

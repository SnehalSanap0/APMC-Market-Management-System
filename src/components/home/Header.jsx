import React from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Header({ onLoginClick }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Name */}
          <div className="flex items-center gap-3">
            <img src={logo} alt="APMC Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Shri Jay Saptashrungi<br />
              <span className="text-primary text-sm sm:text-base">Vegetable Co.</span>
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-primary font-medium transition-colors">Features</a>
            <a href="#about" className="text-slate-600 hover:text-primary font-medium transition-colors">About</a>
            <button
              onClick={onLoginClick}
              className="flex items-center gap-2 bg-primary hover:bg-primary-light text-white px-5 py-2.5 rounded-full font-semibold transition-all shadow-lg shadow-primary/20 cursor-pointer"
            >
              Get Started
              <ArrowRight size={18} />
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-slate-600 hover:text-primary"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-4 animate-in slide-in-from-top duration-300">
          <a href="#features" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-medium py-2">Features</a>
          <a href="#about" onClick={() => setIsMenuOpen(false)} className="block text-slate-600 font-medium py-2">About</a>
          <button
            onClick={() => {
              onLoginClick();
              setIsMenuOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold cursor-pointer"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </header>
  );
}

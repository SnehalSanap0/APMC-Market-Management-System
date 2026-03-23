import React from 'react';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, ShieldCheck } from 'lucide-react';
import logo from '../../assets/logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="about" className="bg-slate-900 pt-24 pb-12 text-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <img src={logo} alt="APMC Logo" className="w-12 h-12 object-contain brightness-0 invert" />
              <h1 className="text-xl font-bold leading-tight">
                APMC Vegetable Market<br/>
                <span className="text-primary text-sm">Accounting System</span>
              </h1>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium italic">
              Empowering merchants with modern tools for efficient and transparent market operations.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 cursor-pointer transition-colors shadow-lg shadow-slate-900/50">
                <Instagram size={20} className="text-pink-400" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 cursor-pointer transition-colors shadow-lg shadow-slate-900/50">
                <Facebook size={20} className="text-blue-400" />
              </div>
              <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-slate-700 cursor-pointer transition-colors shadow-lg shadow-slate-900/50">
                <Twitter size={20} className="text-sky-400" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-6">
             <h4 className="text-lg font-bold text-white relative flex items-center gap-2">
                Quick Links
                <span className="h-0.5 w-12 bg-primary block rounded-full"></span>
             </h4>
             <ul className="flex flex-col gap-4 text-slate-400">
                <li><a href="#" className="hover:text-primary transition-colors cursor-pointer">Home</a></li>
                <li><a href="#features" className="hover:text-primary transition-colors cursor-pointer">Features</a></li>
                <li><a href="#about" className="hover:text-primary transition-colors cursor-pointer">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors cursor-pointer">Support Center</a></li>
             </ul>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-6 text-slate-400">
             <h4 className="text-lg font-bold text-white relative flex items-center gap-2">
                Contact Us
                <span className="h-0.5 w-12 bg-primary block rounded-full"></span>
             </h4>
             <ul className="flex flex-col gap-4">
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-primary" />
                  <span>+91 98765 43210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={20} className="text-primary" />
                  <span>contact@apmcmarket.com</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin size={24} className="text-primary" />
                  <span>Shri Jay Saptashrungi Veg. Co., Nashik APMC Market, Nashik, Maharashtra</span>
                </li>
             </ul>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-slate-800/50 rounded-3xl border border-slate-700/50 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-12 h-12 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <ShieldCheck size={40} className="text-green-500 mx-auto mb-4 animate-bounce" />
              <h5 className="font-bold text-white text-lg mb-2">Secure & Reliable</h5>
              <p className="text-slate-400 text-sm italic">
                Your data is safe with our advanced encryption and daily backups.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-medium">
          <p>© {currentYear} Shri Jay Saptashrungi Vegetable Co. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

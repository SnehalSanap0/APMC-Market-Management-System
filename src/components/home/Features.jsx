import React from 'react';
import { ScrollText, Receipt, UserMinus, Box, ArrowRight } from 'lucide-react';

const features = [
  {
    title: "Sauda Patti Management",
    description: "Effortlessly manage your daily vegetable market transactions and sauda patti records with high precision.",
    icon: ScrollText,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20"
  },
  {
    title: "Billing System",
    description: "Generate professional bills and invoices in seconds with automated calculations and customized layouts.",
    icon: Receipt,
    color: "bg-emerald-500",
    shadow: "shadow-emerald-500/20"
  },
  {
    title: "Udhar Tracking",
    description: "Keep a meticulous record of all credit transactions and pending payments from merchants and customers.",
    icon: UserMinus,
    color: "bg-orange-500",
    shadow: "shadow-orange-500/20"
  },
  {
    title: "Stock Management",
    description: "Monitor your inventory levels, arrivals, and sales in real-time to optimize your market operations.",
    icon: Box,
    color: "bg-purple-500",
    shadow: "shadow-purple-500/20"
  }
];

export default function Features({ onLoginClick }) {
  return (
    <section id="features" className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="grid grid-cols-6 h-full">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border-r border-slate-900 h-full"></div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-24">
          <h2 className="text-sm font-bold text-primary uppercase tracking-[0.2em] mb-4">Powerful Features</h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">Everything you need to manage your vegetable business</h3>
          <p className="text-lg text-slate-600 mt-6 leading-relaxed">Our comprehensive digital ecosystem simplifies complex market operations, ensuring you stay ahead of the competition.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`group flex flex-col p-8 bg-white rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 relative overflow-hidden`}
            >
              {/* Feature Icon */}
              <div className={`w-14 h-14 ${feature.color} text-white rounded-2xl flex items-center justify-center mb-8 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={28} />
              </div>

              {/* Feature Content */}
              <h4 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed mb-8 flex-1">{feature.description}</p>
              
              <button 
                onClick={onLoginClick}
                className="flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all cursor-pointer"
              >
                Learn More
                <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

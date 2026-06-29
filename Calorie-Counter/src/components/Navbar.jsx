import React from 'react';
import { useBoundStore } from '../store/useBoundStore';

export default function Navbar() {
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12 transition-transform hover:rotate-45 duration-300" />
        <span className="text-2xl font-black text-[#2C3768] tracking-tight">NaijaCounts</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[#2C3768]/80">
        <a href="#scan" className="hover:text-[#E92A43] transition-colors">Scan</a>
        <a href="#foods" className="hover:text-[#E92A43] transition-colors">Foods</a>
        <a href="#challenge" className="hover:text-[#E92A43] transition-colors">Challenge</a>
      </div>

      <button 
        onClick={toggleWaitlist}
        className="bg-[#2C3768] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(44,55,104,0.25)] hover:scale-105 transition-all duration-200"
      >
        Join waitlist
      </button>
    </nav>
  );
}
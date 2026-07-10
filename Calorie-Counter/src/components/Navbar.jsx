import React from 'react';
import { useBoundStore } from '../store/useBoundStore';

export default function Navbar() {
  const setView = useBoundStore((state) => state.setView);
  const currentView = useBoundStore((state) => state.currentView);
  const toggleWaitlist = useBoundStore((state) => state.toggleWaitlist);
  const geminiToken = useBoundStore((state) => state.geminiToken);
  const setgeminiToken = useBoundStore((state) => state.setgeminiToken);

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
        <div className="w-8 h-8 rounded-xl bg-[#00F090] transform rotate-12 transition-transform hover:rotate-45 duration-300" />
        <span className="text-2xl font-black text-[#2C3768] tracking-tight">NaijaCounts</span>
      </div>
      
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 shadow-inner">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">gemini Access:</span>
          <input 
            type="password" 
            placeholder="gemini_your_access_token"
            value={geminiToken}
            onChange={(e) => setgeminiToken(e.target.value)}
            className="bg-transparent border-none text-xs font-bold text-[#2C3768] focus:outline-none w-36 font-mono"
          />
        </div>

        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-[#2C3768]/80">
          <button 
            onClick={() => setView('landing')} 
            className={`hover:text-[#E92A43] transition-colors ${currentView === 'landing' ? 'text-[#E92A43] font-bold' : ''}`}
          >
            Scan Overview
          </button>
        </div>

        <button 
          onClick={() => {
            const { isRegistered, isAuthenticated } = useBoundStore.getState().checkAuth();
            if (!isRegistered) setView('signup');
            else if (!isAuthenticated) setView('signin');
            else setView('dashboard');
          }}
          className="bg-[#2C3768] text-white text-sm font-semibold px-6 py-2.5 rounded-full shadow-[0_4px_14px_rgba(44,55,104,0.25)] hover:scale-105 transition-all duration-200"
        >
          My Portal
        </button>

        <button 
          onClick={toggleWaitlist}
          className="bg-[#00F090]/20 border border-[#00F090] text-[#2C3768] text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#00F090] transition-colors duration-200"
        >
          Join Waitlist
        </button>
      </div>
    </nav>
  );
}
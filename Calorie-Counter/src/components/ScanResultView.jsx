import React, { useState } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function ScanResultView() {
  const setView = useBoundStore((state) => state.setView);
  const [portion, setPortion] = useState(1.0);

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-[85vh] flex flex-col p-6 text-[#2C3768]">
      {/* Dynamic Native View Header */}
      <div className="flex justify-between items-center pb-6 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#00F090]" />
          <span className="text-xl font-black tracking-tight">NaijaCounts</span>
        </div>
        <button 
          onClick={() => setView('dashboard')}
          className="bg-[#2C3768] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md"
        >
          Reports
        </button>
      </div>

      {/* Hero Estimation Widget Container */}
      <div className="bg-[#E7F7AD]/40 rounded-[2.5rem] p-6 mt-6 relative border border-[#E7F7AD]">
        <div className="absolute top-4 right-4 w-24 h-20 rounded-2xl overflow-hidden border-4 border-[#FF7A30] transform rotate-3 shadow-md bg-white">
          <img src={REAL_FOOD_IMAGES.heroRight} alt="Analyzed plate" className="w-full h-full object-cover" />
        </div>
        
        <span className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Estimated</span>
        <div className="flex items-baseline gap-1 mb-8">
          <span className="text-6xl font-black tracking-tighter">420</span>
          <span className="text-lg font-black tracking-tight">Kcal</span>
        </div>

        {/* Dynamic Multi-State Serving Adjustment Stepper */}
        <div className="bg-white rounded-2xl p-3 flex items-center justify-between shadow-sm">
          <span className="text-xs font-bold text-[#2C3768]/90 pl-1">Serving, Bowl (350g)</span>
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setPortion(Math.max(0.5, portion - 0.5))}
              className="w-8 h-8 rounded-full bg-[#FFF4CA] font-black text-sm flex items-center justify-center shadow-xs"
            >
              -
            </button>
            <span className="font-mono text-sm font-bold min-w-[20px] text-center">{portion.toFixed(1)}</span>
            <button 
              onClick={() => setPortion(portion + 0.5)}
              className="w-8 h-8 rounded-full bg-[#2C3768] text-white font-black text-sm flex items-center justify-center shadow-xs"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Structured Nutritional Framework Grid Layout */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-[#00F090]/10 rounded-2xl p-5 border border-[#00F090]/20">
          <span className="text-xl font-black block leading-none">32 Gram</span>
          <span className="text-xs font-bold text-gray-500 mt-1 block">Protein</span>
        </div>
        <div className="bg-[#00F090]/10 rounded-2xl p-5 border border-[#00F090]/20">
          <span className="text-xl font-black block leading-none">6.5 Gram</span>
          <span className="text-xs font-bold text-gray-500 mt-1 block">Fiber</span>
        </div>
        <div className="bg-[#00F090]/10 rounded-2xl p-5 border border-[#00F090]/20">
          <span className="text-xl font-black block leading-none">18 Gram</span>
          <span className="text-xs font-bold text-gray-500 mt-1 block">Carbs</span>
        </div>
        <div className="bg-[#00F090]/10 rounded-2xl p-5 border border-[#00F090]/20">
          <span className="text-xl font-black block leading-none">450 Mg</span>
          <span className="text-xs font-bold text-gray-500 mt-1 block">Sodium</span>
        </div>
      </div>

      <button 
        onClick={() => setView('dashboard')}
        className="w-full bg-[#2C3768] text-white font-black py-4 rounded-2xl shadow-md mt-auto hover:opacity-95 transition-opacity"
      >
        Log to Food Diary
      </button>
    </div>
  );
}
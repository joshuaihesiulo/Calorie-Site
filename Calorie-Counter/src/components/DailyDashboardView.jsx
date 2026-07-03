import React from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function DailyDashboardView() {
  const setView = useBoundStore((state) => state.setView);

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-[90vh] flex flex-col p-6 text-[#2C3768]">
      {/* Header Profile Ribbon */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#00F090] overflow-hidden bg-gray-100">
            <img src={REAL_FOOD_IMAGES.userProfile} alt="User" className="w-full h-full object-cover" />
          </div>
          <span className="font-black text-sm tracking-tight">Hello, Jason Ground</span>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-[#FFF4CA] flex items-center justify-center text-xs font-bold">⌕</button>
          <button onClick={() => setView('landing')} className="w-8 h-8 rounded-full bg-[#FFF4CA] flex items-center justify-center text-xs font-bold">↻</button>
        </div>
      </div>

      {/* Scrollable Horizontal Inline Date Control Row */}
      <div className="flex justify-between items-center px-1 mb-8">
        {['Sun 13', 'Mon 14'].map((day, idx) => (
          <span key={idx} className="text-xs font-black text-gray-400">{day}</span>
        ))}
        <div className="border-2 border-[#00F090] px-4 py-2 rounded-2xl font-black text-xs text-center shadow-sm">
          Tue 15
        </div>
        {['Wed 16', 'Thu 17'].map((day, idx) => (
          <span key={idx} className="text-xs font-black text-gray-400">{day}</span>
        ))}
      </div>

      {/* Main Focus Focal Progress Tracker Container */}
      <div className="border border-gray-100 rounded-[2.5rem] p-6 shadow-xs mb-6 relative">
        <span className="text-xs font-black text-gray-400 block mb-1">Today's Calories</span>
        <div className="flex items-baseline gap-1 mb-4">
          <span className="text-6xl font-black tracking-tighter">2,910</span>
          <span className="text-xl font-black tracking-tight">Kcal</span>
        </div>
        {/* Dynamic Navy Filled Metric Gauge */}
        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
          <div className="bg-[#2C3768] h-full rounded-full" style={{ width: '78%' }} />
        </div>
      </div>

      {/* Triple Context Row Summaries */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-3 text-center">
          <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Goal</span>
          <span className="text-xs font-black">3,210 cal</span>
        </div>
        <div className="bg-[#00F090] rounded-2xl p-3 text-center shadow-xs">
          <span className="text-[10px] font-black text-[#2C3768]/70 block mb-0.5">Food</span>
          <span className="text-xs font-black">1,940 cal</span>
        </div>
        <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-3 text-center">
          <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Exercise</span>
          <span className="text-xs font-black">55 min</span>
        </div>
      </div>

      {/* Next Habits Grid Subview */}
      <div className="mt-2">
        <h3 className="text-2xl font-black tracking-tight mb-4">Next Habit</h3>
        <div className="space-y-3">
          <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#00F090]" />
            <span className="text-xs font-bold leading-tight">Exercise — Connect to Track Your Steps</span>
          </div>
          <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[#3CE8E3]" />
            <span className="text-xs font-bold leading-tight">Hydration — Log water before lunch</span>
          </div>
        </div>
      </div>

      <button 
        onClick={() => setView('result')}
        className="w-full bg-[#E92A43] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#E92A43]/10 mt-8 hover:opacity-95 transition-all text-center"
      >
        📸 Scan New Meal Platter
      </button>
    </div>
  );
}
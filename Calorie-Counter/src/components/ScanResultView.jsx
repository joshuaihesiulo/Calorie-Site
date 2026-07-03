import React, { useState } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

const NUTRITION_DATA = [
  { label: 'Protein', value: '32 Gram', bg: 'bg-[#00F090]/10', border: 'border-[#00F090]/20' },
  { label: 'Fiber', value: '6.5 Gram', bg: 'bg-[#00F090]/10', border: 'border-[#00F090]/20' },
  { label: 'Carbs', value: '18 Gram', bg: 'bg-[#00F090]/10', border: 'border-[#00F090]/20' },
  { label: 'Sodium', value: '450 Mg', bg: 'bg-[#00F090]/10', border: 'border-[#00F090]/20' },
  { label: 'Fat', value: '14 Gram', bg: 'bg-[#FFF4CA]/40', border: 'border-[#FFF4CA]' },
  { label: 'Sugar', value: '5.2 Gram', bg: 'bg-[#FFF4CA]/40', border: 'border-[#FFF4CA]' },
];

export default function ScanResultView() {
  const setView = useBoundStore((state) => state.setView);
  const [portion, setPortion] = useState(1.0);

  const adjustedCalories = Math.round(420 * portion);
  const adjustedNutrients = NUTRITION_DATA.slice(0, 4).map((n) => {
    const num = parseFloat(n.value);
    const unit = n.value.replace(/[\d.]+\s*/, '');
    return { ...n, value: `${(num * portion).toFixed(1).replace(/\.0$/, '')} ${unit}` };
  });

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#00F090] transform rotate-12" />
          <span className="text-xl font-black tracking-tight">NaijaCounts</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('scan')}
            className="hidden lg:inline-flex bg-[#FFF4CA] text-[#2C3768] text-xs font-bold px-4 py-2 rounded-full hover:opacity-80 transition-opacity"
          >
            Scan Again
          </button>
          <button
            onClick={() => setView('dashboard')}
            className="bg-[#2C3768] text-white text-xs font-bold px-4 py-2 rounded-full shadow-md hover:opacity-90 transition-opacity"
          >
            Dashboard
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left: Estimation + Image */}
        <div className="flex-1 p-5 lg:p-8 flex flex-col">
          <div className="bg-[#E7F7AD]/40 rounded-[2.5rem] p-6 lg:p-8 border border-[#E7F7AD] relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-black text-gray-500 uppercase tracking-wider block mb-1">Estimated</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-6xl lg:text-7xl font-black tracking-tighter">{adjustedCalories}</span>
                  <span className="text-lg lg:text-xl font-black tracking-tight">Kcal</span>
                </div>
              </div>
              <div className="w-28 h-24 lg:w-32 lg:h-28 rounded-2xl overflow-hidden border-4 border-[#FF7A30] transform rotate-3 shadow-md bg-white flex-shrink-0">
                <img src={REAL_FOOD_IMAGES.heroRight} alt="Analyzed plate" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3 lg:p-4 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-xs font-bold text-[#2C3768]/90 block">Serving, Bowl (350g)</span>
                <span className="text-[10px] font-bold text-gray-400">Jollof Rice & Chicken</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPortion(Math.max(0.5, portion - 0.5))}
                  className="w-8 h-8 rounded-full bg-[#FFF4CA] font-black text-sm flex items-center justify-center shadow-xs hover:bg-[#FFF4CA]/80 transition-colors"
                >
                  -
                </button>
                <span className="font-mono text-base font-bold min-w-[24px] text-center">{portion.toFixed(1)}</span>
                <button
                  onClick={() => setPortion(portion + 0.5)}
                  className="w-8 h-8 rounded-full bg-[#2C3768] text-white font-black text-sm flex items-center justify-center shadow-xs hover:bg-[#2C3768]/90 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Desktop-only extra details */}
          <div className="hidden lg:flex items-center gap-4 mt-5 text-center">
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 block">Meal Type</span>
              <span className="text-xs font-black">Lunch</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 block">Logged At</span>
              <span className="text-xs font-black">12:30 PM</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 block">Confidence</span>
              <span className="text-xs font-black text-[#00F090]">High</span>
            </div>
          </div>

          {/* Mobile scan again */}
          <button
            onClick={() => setView('scan')}
            className="lg:hidden w-full bg-[#FFF4CA] text-[#2C3768] font-black py-3.5 rounded-2xl mt-4 hover:opacity-90 transition-opacity text-sm"
          >
            Scan New Meal
          </button>
        </div>

        {/* Right: Nutritional Grid + Actions */}
        <div className="lg:w-80 xl:w-96 p-5 lg:p-8 lg:border-l border-gray-100 flex flex-col">
          <h3 className="text-sm font-black tracking-tight mb-4">Nutrition Breakdown</h3>
          <div className="grid grid-cols-2 lg:grid-cols-2 gap-3">
            {(portion === 1.0 ? NUTRITION_DATA : [...adjustedNutrients, ...NUTRITION_DATA.slice(4)]).map((item, i) => (
              <div key={i} className={`${item.bg} rounded-2xl p-4 lg:p-5 border ${item.border}`}>
                <span className="text-lg lg:text-xl font-black block leading-none">{item.value}</span>
                <span className="text-[11px] font-bold text-gray-500 mt-1 block">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Desktop: extra stats */}
          <div className="hidden lg:block mt-5 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Daily Value</span>
              <span className="text-[10px] font-bold text-[#00F090]">24% of goal</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div className="bg-[#00F090] h-full rounded-full" style={{ width: '24%' }} />
            </div>
          </div>

          <div className="mt-auto pt-6 space-y-3">
            <button
              onClick={() => setView('dashboard')}
              className="w-full bg-[#2C3768] text-white font-black py-4 rounded-2xl shadow-md hover:opacity-95 transition-opacity"
            >
              Log to Food Diary
            </button>
            <button
              onClick={() => setView('scan')}
              className="hidden lg:block w-full bg-[#FFF4CA] text-[#2C3768] font-black py-4 rounded-2xl hover:opacity-90 transition-opacity border border-[#FFF4CA]"
            >
              Scan Another Meal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
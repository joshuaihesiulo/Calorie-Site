import React from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { REAL_FOOD_IMAGES } from '../constants/images';

const MEAL_ENTRIES = [
  { id: 1, name: 'Jollof Rice & Chicken', cal: 720, time: '12:30 PM', image: REAL_FOOD_IMAGES.heroRight },
  { id: 2, name: 'Amala & Ewedu', cal: 580, time: '8:15 AM', image: REAL_FOOD_IMAGES.heroLeft },
  { id: 3, name: 'Suya Skewers', cal: 340, time: '4:20 PM', image: REAL_FOOD_IMAGES.suyaSmoke },
  { id: 4, name: 'Fried Rice & Plantain', cal: 490, time: '7:00 PM', image: REAL_FOOD_IMAGES.riceBowl },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const today = new Date();
const startOfWeek = today.getDate() - today.getDay();
const WEEK_DATES = WEEKDAYS.map((day, i) => {
  const date = new Date(today.getFullYear(), today.getMonth(), startOfWeek + i);
  return { label: `${day} ${date.getDate()}`, active: i === today.getDay() };
});

export default function DailyDashboardView() {
  const setView = useBoundStore((state) => state.setView);
  const user = useBoundStore((state) => state.user);
  const displayName = user?.name || 'Jason Ground';

  return (
    <div className="w-full min-h-[85vh] lg:min-h-[75vh] flex flex-col p-5 sm:p-6 lg:p-8 text-[#2C3768]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-[#00F090] overflow-hidden bg-gray-100 flex-shrink-0">
            <img src={REAL_FOOD_IMAGES.userProfile} alt="User" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-black text-sm lg:text-base tracking-tight">Hello, {displayName}</span>
            <span className="text-[11px] font-bold text-gray-400 block">{today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-[#FFF4CA] flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity">⌕</button>
          <button onClick={() => setView('landing')} className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-[#FFF4CA] flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity">↻</button>
        </div>
      </div>

      {/* Desktop: Two column top section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Date Row + Calories Card */}
        <div className="flex-1">
          {/* Date Row */}
          <div className="flex items-center gap-1 sm:gap-2 mb-5 overflow-x-auto pb-1">
            {WEEK_DATES.map((day, idx) =>
              day.active ? (
                <div key={idx} className="border-2 border-[#00F090] px-3 sm:px-4 py-2 rounded-2xl font-black text-xs text-center shadow-sm bg-white flex-shrink-0">
                  {day.label}
                </div>
              ) : (
                <span key={idx} className="text-xs font-black text-gray-400 flex-shrink-0 px-2">{day.label}</span>
              )
            )}
          </div>

          {/* Calories Card */}
          <div className="border border-gray-100 rounded-[2.5rem] p-5 sm:p-6 shadow-xs">
            <span className="text-xs font-black text-gray-400 block mb-1">Today's Calories</span>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter">2,910</span>
              <span className="text-xl font-black tracking-tight">Kcal</span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#2C3768] h-full rounded-full" style={{ width: '78%' }} />
            </div>
          </div>
        </div>

        {/* Summary Cards - inline on desktop */}
        <div className="grid grid-cols-3 lg:grid-cols-1 gap-3 lg:w-56 xl:w-64">
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Goal</span>
            <span className="text-sm lg:text-base font-black">3,210 cal</span>
          </div>
          <div className="bg-[#00F090] rounded-2xl p-4 text-center shadow-xs">
            <span className="text-[10px] font-black text-[#2C3768]/70 block mb-0.5">Food</span>
            <span className="text-sm lg:text-base font-black">1,940 cal</span>
          </div>
          <div className="bg-[#E7F7AD]/50 border border-[#E7F7AD] rounded-2xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Exercise</span>
            <span className="text-sm lg:text-base font-black">55 min</span>
          </div>
          {/* Desktop-only extra stat */}
          <div className="hidden lg:flex bg-[#FFF4CA]/50 border border-[#FFF4CA] rounded-2xl p-4 text-center">
            <div className="w-full">
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">Water</span>
              <span className="text-sm font-black">4 cups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: Bottom section - Habits + Meals */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1">
        {/* Habits */}
        <div className="lg:w-72 xl:w-80">
          <h3 className="text-xl lg:text-2xl font-black tracking-tight mb-4">Next Habit</h3>
          <div className="space-y-3">
            <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#00F090] flex-shrink-0" />
              <span className="text-xs font-bold leading-tight">Exercise — Connect to Track Your Steps</span>
            </div>
            <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#3CE8E3] flex-shrink-0" />
              <span className="text-xs font-bold leading-tight">Hydration — Log water before lunch</span>
            </div>
            <div className="bg-[#00F090]/10 border border-[#00F090]/10 rounded-2xl p-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FF7A30] flex-shrink-0" />
              <span className="text-xs font-bold leading-tight">Sleep — 8 hours target for tonight</span>
            </div>
          </div>
        </div>

        {/* Meals Log Column - Desktop filler */}
        <div className="hidden lg:flex flex-1 flex-col">
          <h3 className="text-sm font-black tracking-tight mb-3">Today's Meals</h3>
          <div className="space-y-2.5 flex-1">
            {MEAL_ENTRIES.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50/50 border border-gray-100">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                  <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black block truncate">{meal.name}</span>
                  <span className="text-[10px] font-bold text-gray-400">{meal.time}</span>
                </div>
                <span className="text-xs font-black">{meal.cal}</span>
              </div>
            ))}
          </div>
          <button className="text-[11px] font-bold text-[#E92A43] mt-3 hover:underline text-left">View all meals →</button>
        </div>
      </div>

      {/* Scan Button */}
      <button 
        onClick={() => setView('scan')}
        className="w-full bg-[#E92A43] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#E92A43]/10 mt-6 lg:mt-8 hover:opacity-95 transition-all text-center"
      >
        📸 Scan New Meal Platter
      </button>
    </div>
  );
}
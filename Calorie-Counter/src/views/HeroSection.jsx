import React from 'react';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] bg-white px-6 py-12 flex flex-col items-center justify-center overflow-hidden">
      {/* Skewed Badge */}
      <div className="inline-block bg-[#00F090] text-[#2C3768] text-sm font-bold px-4 py-1.5 rounded-full transform -rotate-2 mb-6 tracking-tight">
        AI for Nigerian meals
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Hand Card Visual */}
        <div className="lg:col-span-3 flex justify-center lg:justify-end">
          <div className="w-72 h-80 rounded-[2.5rem] p-4 relative bg-white shadow-2xl shadow-[#E92A43]/10 transform -rotate-6 overflow-hidden">
            <div className="p-3 w-full h-full rounded-[2rem] bg-gray-100 overflow-hidden relative border-6 border-red-800">
              <img src={REAL_FOOD_IMAGES.heroLeft} alt="Amala plate" className="w-full h-full object-cover rounded-[1.5rem]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#E92A43]/30 to-transparent" />
            </div>
          </div>
        </div>

        {/* Center Text Block Layout */}
        <div className="lg:col-span-6 text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-black text-[#2C3768] tracking-tighter leading-[0.95] mb-6">
            Track Smarter.<br />Eat Naija.<br />Live Better.
          </h1>
          <p className="text-gray-600 text-base md:text-lg max-w-md mb-8 font-normal leading-relaxed">
            Snap amala, jollof, suya, egusi, moi moi, or plantain and get instant calories, macros, and portion guidance built for African plates.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <button className="bg-[#E92A43] text-white font-bold px-8 py-4 rounded-2xl shadow-[0_8px_20px_rgba(233,42,67,0.3)] hover:translate-y-[-2px] transition-all">
              Scan your plate
            </button>
            <button className="bg-[#FFF4CA] border border-[#2C3768]/20 text-[#2C3768] font-bold px-8 py-4 rounded-2xl hover:bg-opacity-80 transition-all">
              See food library
            </button>
          </div>
        </div>

        {/* Right Hand Card Visual & Pill Data layout */}
        <div className="lg:col-span-3 flex flex-col items-center lg:items-start gap-4">
          <div className="p-3 w-72 h-48 rounded-[2rem] p-3 bg-white shadow-xl transform rotate-6 overflow-hidden border-6 border-orange-600">
            <img src={REAL_FOOD_IMAGES.heroRight} alt="Jollof rice" className="w-full h-full object-cover rounded-[1.5rem]" />
          </div>
          <div className="flex gap-3 mt-2">
            <div className="w-20 h-20 rounded-full bg-[#3CE8E3]/20 flex flex-col items-center justify-center border border-[#3CE8E3]">
              <span className="text-lg font-black text-[#2C3768]">520</span>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">kcal</span>
            </div>
            <div className="w-20 h-20 rounded-full bg-[#00F090]/20 flex flex-col items-center justify-center border border-[#00F090]">
              <span className="text-lg font-black text-[#2C3768]">31</span>
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">protein</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Base Decorative Capsule */}
      <div className="w-40 h-16 bg-[#00F090] rounded-full transform rotate-[35deg] absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-90 blur-[1px]" />
    </section>
  );
}
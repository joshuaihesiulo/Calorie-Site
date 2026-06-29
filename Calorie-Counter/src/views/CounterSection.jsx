import React from 'react';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function CounterSection() {
  return (
    <section className="bg-[#F9F8F4] relative py-24 px-6 overflow-hidden">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <span className="bg-[#00F090] text-[#2C3768] text-xs font-bold px-4 py-1 rounded-full">
          AI Calorie
        </span>
      </div>

      {/* Massive Typography Backdrop */}
      <div className="w-full text-center select-none pointer-events-none absolute left-0 right-0 top-12">
        <h2 className="text-[12rem] md:text-[22rem] font-black text-[#E92A43] tracking-tighter leading-none opacity-90 font-sans">
          Counter
        </h2>
      </div>

      {/* Interactive Overlapping Content Box */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-32 relative z-20">
        <div className="md:col-span-7 bg-white rounded-[2rem] p-4 shadow-2xl border border-dashed border-[#FF7A30]/60">
          <div className="rounded-[1.5rem] overflow-hidden bg-gray-100 aspect-[4/3] relative">
            <img src={REAL_FOOD_IMAGES.soupDetail} alt="Soup analysis view" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 mt-4 justify-center">
            <span className="bg-pink-100 text-[#E92A43] font-bold text-xs px-3 py-1.5 rounded-full">65 G-Carb</span>
            <span className="bg-yellow-100 text-[#FF7A30] font-bold text-xs px-3 py-1.5 rounded-full">22 G-Pro</span>
            <span className="bg-[#00F090] text-[#2C3768] font-bold text-xs px-3 py-1.5 rounded-full">410 kcal</span>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-col justify-center">
          <p className="text-[#2C3768] font-semibold text-base leading-relaxed mb-6">
            Know what's on your plate instantly. NaijaCounts estimates calories and macros from photos, local dish names, and portion sizes.
          </p>
          {/* Slider Pagination Controls */}
          <div className="flex gap-1.5">
            <div className="w-6 h-2 rounded-full bg-[#2C3768]" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
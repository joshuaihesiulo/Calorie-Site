import React from 'react';
import { REAL_FOOD_IMAGES } from '../constants/images';

export default function PaletteSection() {
  const colors = [
    { name: 'Pepper', hex: '#E92A43', bg: 'bg-[#E92A43]' },
    { name: 'Fresh', hex: '#00F090', bg: 'bg-[#00F090]' },
    { name: 'Suya', hex: '#FF7A30', bg: 'bg-[#FF7A30]' },
    { name: 'Garri', hex: '#FFF4CA', bg: 'bg-[#FFF4CA]' },
    { name: 'Water', hex: '#3CE8E3', bg: 'bg-[#3CE8E3]' },
    { name: 'Night', hex: '#2C3768', bg: 'bg-[#2C3768]', text: 'text-white' }
  ];

  return (
    <section className="bg-white py-24 px-6 border-b border-gray-100">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-20">
        <div className="border border-[#2C3768] rounded-3xl p-6 inline-block max-w-sm">
          <h2 className="text-4xl font-black text-[#2C3768] tracking-tighter leading-none">
            Colors, meals, and macros made local.
          </h2>
        </div>
        <p className="text-gray-500 font-medium leading-relaxed md:pt-4">
          From smoky suya to party jollof, NaijaCounts keeps the product bright, useful, and culturally aware — with calorie estimates that understand what's actually on your plate.
        </p>
      </div>

      {/* Brand Color Bubbles Presentation (Image 6) */}
      <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 mb-24">
        {colors.map((color, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className={`w-16 h-16 rounded-full ${color.bg} border-2 border-[#2C3768]/10 shadow-md transform hover:scale-110 transition-transform`} />
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md bg-gray-50 border text-[#2C3768] shadow-sm`}>
              {color.name} <span className="opacity-40 font-mono ml-0.5">{color.hex}</span>
            </span>
          </div>
        ))}
      </div>

      {/* In The Wild Grid Layout Presentation (Image 7) */}
      <div className="max-w-6xl mx-auto text-center mt-16">
        <span className="bg-[#00F090] text-[#2C3768] text-xs font-bold px-4 py-1 rounded-full">
          NaijaCounts in the wild
        </span>
        <h3 className="text-4xl font-black text-[#2C3768] tracking-tighter mt-4 mb-12">
          See what's on the plate.
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#E92A43] text-white p-6 rounded-[2rem] text-left aspect-[4/5] flex flex-col justify-between shadow-md">
            <h4 className="font-black text-lg uppercase tracking-tight leading-none">You track and fit it in</h4>
            <div className="bg-black/10 rounded-2xl h-44 overflow-hidden"><img src={REAL_FOOD_IMAGES.wild1} className="w-full h-full object-cover"/></div>
            <span className="text-[10px] font-bold opacity-70">@naijacounts</span>
          </div>
          <div className="bg-[#FFF4CA] text-[#2C3768] p-6 rounded-[2rem] text-left aspect-[4/5] flex flex-col justify-between shadow-md">
            <h4 className="font-black text-lg tracking-tight leading-none">Swap This, Eat That!</h4>
            <div className="bg-black/5 rounded-2xl h-44 overflow-hidden"><img src={REAL_FOOD_IMAGES.wild2} className="w-full h-full object-cover"/></div>
            <span className="text-[10px] font-bold opacity-60">Popcorn bowl → plantain chips</span>
          </div>
          <div className="border border-gray-200 bg-white text-[#2C3768] p-6 rounded-[2rem] text-left aspect-[4/5] flex flex-col justify-between shadow-md">
            <h4 className="font-black text-lg tracking-tight leading-none">Rice doesn't ruin your diet.</h4>
            <div className="bg-gray-50 rounded-2xl h-44 overflow-hidden"><img src={REAL_FOOD_IMAGES.wild3} className="w-full h-full object-cover"/></div>
            <span className="text-[10px] font-bold opacity-60">Macros make the difference.</span>
          </div>
          <div className="bg-[#00F090] text-[#2C3768] p-6 rounded-[2rem] text-left aspect-[4/5] flex flex-col justify-between shadow-md">
            <h4 className="font-black text-lg tracking-tight leading-none">7-Day Detox Challenge</h4>
            <div className="bg-black/10 rounded-2xl h-44 overflow-hidden"><img src={REAL_FOOD_IMAGES.wild4} className="w-full h-full object-cover"/></div>
            <span className="text-[10px] font-bold opacity-60">Classic Nigerian meals.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
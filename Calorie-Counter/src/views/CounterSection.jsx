import { REAL_FOOD_IMAGES } from '../constants/images';
import Reveal from '../components/Reveal';

export default function CounterSection() {
  return (
    <section className="bg-[#F9F8F4] relative py-24 px-6 overflow-hidden">
      {/* Massive Typography Backdrop */}
      <div className="w-full text-center select-none pointer-events-none absolute left-0 right-0 top-12">
        <h2 className="text-[9rem] md:text-[14rem] font-black font-display text-[#E92A43] tracking-tighter leading-none opacity-90">
          Counter
        </h2>
      </div>

      {/* Interactive Overlapping Content Box */}
      <Reveal delay={100} className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center pt-24 relative z-20">
        <div className="md:col-span-7 bg-white rounded-[2rem] p-4 shadow-2xl border border-dashed border-[#FF7A30]/60 transition-transform duration-300 hover:-translate-y-1">
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
            Know what's on your plate instantly. Kaloriq estimates calories and macros from photos, local dish names, and portion sizes.
          </p>
          {/* Slider Pagination Controls */}
          <div className="flex gap-1.5">
            <div className="w-6 h-2 rounded-full bg-[#2C3768]" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
            <div className="w-2 h-2 rounded-full bg-[#2C3768]/20" />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
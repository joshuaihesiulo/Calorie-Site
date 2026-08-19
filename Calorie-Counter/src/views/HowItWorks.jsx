import { REAL_FOOD_IMAGES } from '../constants/images';
import Reveal from '../components/Reveal';

export default function HowItWorks() {
  const steps = [
    { num: '01', label: 'Snap Your Plate', bg: 'bg-[#00F090] text-[#2C3768]' },
    { num: '02', label: 'AI Identifies Dish', bg: 'bg-[#2C3768] text-white' },
    { num: '03', label: 'Get Macros Instantly', bg: 'bg-[#E92A43] text-white' },
    { num: '04', label: 'See Swap Suggestions', bg: 'bg-[#FF7A30] text-white' },
    { num: '05', label: 'Track Your Streak', bg: 'bg-[#3CE8E3] text-[#2C3768]' },
  ];

  return (
    <section className="bg-[#FFF4CA]/30 py-24 px-6 relative overflow-hidden">
      <Reveal>
      <div className="max-w-3xl mx-auto text-center mb-16 relative z-10">
        <h2 className="text-3xl md:text-4xl font-black font-display text-[#2C3768] tracking-tighter mb-4">
          How NaijaCounts Works
        </h2>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-wider">
          From first snap to smarter eating — here's your 5-step journey.
        </p>
      </div>
      </Reveal>

      {/* Central Phone Mockup Grid Connection Mapping Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Elements Stack */}
        <Reveal delay={80}>
        <div className="lg:col-span-4 flex flex-col gap-6 items-center lg:items-end order-2 lg:order-1">
          <div className={`${steps[0].bg} font-black text-xs px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300`}>
            <span>{steps[0].num} —</span> <span>{steps[0].label}</span>
          </div>
          <div className={`${steps[2].bg} font-black text-xs px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300`}>
            <span>{steps[2].num} —</span> <span>{steps[2].label}</span>
          </div>
        </div>
        </Reveal>

        {/* Central Display Image Box */}
        <Reveal delay={160}>
        <div className="lg:col-span-4 flex justify-center order-1 lg:order-2">
          <div className="w-72 aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl bg-white border border-gray-100 p-4 transition-transform duration-500 hover:scale-[1.03]">
            <div className="w-full h-full rounded-[2.2rem] bg-gray-50 overflow-hidden">
             <img src={REAL_FOOD_IMAGES.scanHand} alt="Scanning dish process" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        </Reveal>

        {/* Right Elements Stack */}
        <Reveal delay={240}>
        <div className="lg:col-span-4 flex flex-col gap-6 items-center lg:items-start order-3">
          <div className={`${steps[1].bg} font-black text-xs px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300`}>
            <span>{steps[1].num} —</span> <span>{steps[1].label}</span>
          </div>
          <div className={`${steps[3].bg} font-black text-xs px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300`}>
            <span>{steps[3].num} —</span> <span>{steps[3].label}</span>
          </div>
          <div className={`${steps[4].bg} font-black text-xs px-5 py-3 rounded-full shadow-lg flex items-center gap-2 transform hover:scale-105 hover:-translate-y-0.5 transition-all duration-300`}>
            <span>{steps[4].num} —</span> <span>{steps[4].label}</span>
          </div>
        </div>
        </Reveal>

      </div>
    </section>
  );
}
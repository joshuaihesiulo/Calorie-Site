

import Reveal from '../components/Reveal';

export default function ProblemSection() {
  return (
    <section className="bg-white px-6 py-20 border-t border-gray-50">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Description Pillar */}
        <Reveal>
        <div>
          <h2 className="text-3xl md:text-4xl font-black font-display text-[#2C3768] tracking-tighter mb-6 leading-none">
            Eating, Simplified<br />Together.
          </h2>
          <p className="text-gray-500 max-w-md font-medium">
            Craving a crunchy snack but want to stay on track with your goals? NaijaCounts gives local meals the nutrition context they deserve.
          </p>

          {/* Graphical Target Container */}
          <div className="mt-8 max-w-md aspect-square rounded-[2rem] bg-gray-50 border border-gray-100 flex items-center justify-center p-8 relative">
            <div className="w-64 h-64 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center animate-[spin_40s_linear_infinite]">
              <div className="w-32 h-32 rounded-full border-2 border-[#E92A43] bg-white flex items-center justify-center shadow-lg transform -rotate-[spin_40s_linear_infinite]">
                <span className="text-[#E92A43] font-black text-sm tracking-tighter">NaijaCounts</span>
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        {/* Right Solutions Pillar Cards */}
        <Reveal delay={150} className="flex flex-col gap-6 lg:mt-16">
          <div className="bg-[#00F090]/10 border border-[#00F090]/30 p-8 rounded-[2rem] hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-[#2C3768] font-black text-xl mb-3 tracking-tight">Solutions 01</h3>
            <p className="text-[#2C3768]/80 font-medium text-sm leading-relaxed">
              Log meals, calories, and macros in one intelligent, personalized space designed to make nutrition tracking simple and stress-free.
            </p>
          </div>

          <div className="bg-[#FFF4CA]/40 border border-[#FFF4CA]/80 p-8 rounded-[2rem] hover:scale-[1.01] hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-[#2C3768] font-black text-xl mb-3 tracking-tight">Solutions 02</h3>
            <p className="text-[#2C3768]/80 font-medium text-sm leading-relaxed">
              Learn from your patterns, stay motivated, and get smart insights that adapt to your eating habits and health goals.
            </p>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
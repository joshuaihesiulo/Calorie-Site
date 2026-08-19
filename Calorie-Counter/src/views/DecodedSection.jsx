import { REAL_FOOD_IMAGES } from '../constants/images';
import { StarIcon, CheckIcon } from '../components/icons';
import Reveal from '../components/Reveal';

export default function DecodedSection() {
  return (
    <section className="bg-white px-6 py-20 max-w-6xl mx-auto">
      <Reveal>
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-4">
        <h2 className="text-3xl md:text-4xl font-black font-display text-[#2C3768] tracking-tighter">
          Your Food, Decoded
        </h2>
        <p className="text-gray-400 text-xs md:text-sm max-w-xs text-right md:self-end leading-tight font-medium">
          NaijaCounts helps you understand calories, portions, and nutrition patterns so you can eat smarter every single day.
        </p>
      </div>
      </Reveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side Group Stack */}
        <Reveal delay={80}>
        <div className="flex flex-col gap-6">
          <div className="rounded-[2.5rem] overflow-hidden bg-gray-100 aspect-video relative group shadow-lg">
            <img src={REAL_FOOD_IMAGES.userProfile} alt="User portrait" className="w-full h-full object-cover" />
            <div className="absolute bottom-4 left-4 right-4 bg-[#2C3768]/80 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between text-white">
              <span className="font-bold text-sm">Adaeze Okonkwo</span>
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[#E92A43]">
                <StarIcon className="w-3.5 h-3.5 text-[#E92A43]" />
              </div>
            </div>
          </div>

          {/* Progress Tracking Widget */}
          <div className="border border-gray-100 rounded-[2rem] p-6 shadow-sm">
            <h4 className="text-[#2C3768] font-black text-sm mb-4 tracking-tight">Food Personality</h4>
            <div className="space-y-3">
              <div className="w-full bg-pink-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#E92A43] h-full rounded-full" style={{ width: '85%' }} />
              </div>
              <div className="w-full bg-pink-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#E92A43] h-full rounded-full" style={{ width: '45%' }} />
              </div>
              <div className="w-full bg-pink-50 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#E92A43] h-full rounded-full" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        </div>
        </Reveal>

        {/* Right Side Group Stack */}
        <Reveal delay={160}>
        <div className="flex flex-col gap-6">
          <div className="bg-[#FFF4CA]/40 border border-[#FFF4CA]/80 rounded-[2rem] p-8 flex flex-col justify-between h-full min-h-[240px]">
            <div>
              <h3 className="text-[#2C3768] font-black text-xl mb-4 tracking-tight">User Goals</h3>
              <ul className="space-y-2 text-[#2C3768] font-bold text-sm">
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#00A86B] flex-shrink-0" /> Track daily calories and macros</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#00A86B] flex-shrink-0" /> Understand portion sizes visually</li>
                <li className="flex items-center gap-2"><CheckIcon className="w-4 h-4 text-[#00A86B] flex-shrink-0" /> Build healthier eating habits</li>
              </ul>
            </div>
            <p className="text-[#2C3768]/70 font-medium text-xs mt-4 leading-relaxed">
              Track meals effortlessly, understand what you're eating, and make smarter food choices aligned with your health goals.
            </p>
          </div>

          <div className="bg-[#3CE8E3]/20 border border-[#3CE8E3]/40 rounded-[2rem] p-8 relative overflow-hidden">
            <span className="text-[#E92A43] text-5xl font-black absolute top-4 left-4 opacity-40">“</span>
            <p className="text-[#2C3768] font-bold italic text-base mt-6 text-center tracking-tight">
              good food choices begin with better food awareness.
            </p>
          </div>
        </div>
        </Reveal>

      </div>
    </section>
  );
}
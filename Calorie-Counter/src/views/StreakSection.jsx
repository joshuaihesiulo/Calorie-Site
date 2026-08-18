import { REAL_FOOD_IMAGES } from '../constants/images';

export default function StreakSection() {
  return (
    <section className="bg-[#00F090]/5 py-20 px-6 border-y border-[#00F090]/10">
      <div className="max-w-4xl mx-auto text-center mb-12">
        <span className="text-[#E92A43] text-xs font-black uppercase tracking-wider">
          Built for how Nigerians actually eat
        </span>
        <h2 className="text-4xl md:text-5xl font-black font-display text-[#2C3768] tracking-tighter mt-3">
          Scan meals, swap<br />smarter, keep your streak.
        </h2>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Card */}
        <div className="md:col-span-3 bg-[#E92A43] text-white rounded-[2rem] p-6 text-center shadow-lg transform md:-rotate-3">
          <h3 className="font-black text-lg mb-4 tracking-tight leading-none">Doubt vs. Reality</h3>
          <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-white/10 mb-4">
           <img src={REAL_FOOD_IMAGES.suyaSmoke} alt="Suya smoke screen" className="w-full h-full object-cover" />
          </div>
          <p className="text-xs font-bold opacity-90">You track and fit it in.</p>
        </div>

        {/* Central Layout Device Mockup */}
        <div className="md:col-span-6 flex justify-center z-10">
          <div className="w-72 bg-[#2C3768] rounded-[3rem] p-3 shadow-2xl border-4 border-[#2C3768]/30">
            <div className="bg-white rounded-[2.5rem] overflow-hidden aspect-[9/16] relative flex flex-col justify-between p-4">
              <div className="h-full w-full rounded-2xl overflow-hidden absolute inset-0">
                <img src={REAL_FOOD_IMAGES.phoneBg} alt="App running screen" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 mt-auto w-full text-center space-y-2">
                <button className="bg-white text-[#2C3768] text-xs font-black px-4 py-2 rounded-full shadow-md">
                  Swap This, Eat That!
                </button>
                <div className="flex gap-1.5 justify-center">
                  <span className="bg-[#3CE8E3] text-[#2C3768] font-bold text-[9px] px-2 py-0.5 rounded-full">410 kcal</span>
                  <span className="bg-[#00F090] text-[#2C3768] font-bold text-[9px] px-2 py-0.5 rounded-full">22g protein</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack Cards */}
        <div className="md:col-span-3 flex flex-col gap-4 transform md:rotate-3">
          <div className="bg-[#FFF4CA]/60 p-4 rounded-[2rem] border border-[#FFF4CA] shadow-sm">
            <h4 className="text-[#E92A43] font-black text-sm mb-2 leading-none">White rice again? Think again.</h4>
            <div className="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden mb-2">
              <img src={REAL_FOOD_IMAGES.riceBowl} alt="Rice dish" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-[#2C3768] font-bold">45g carbs • 4g protein</span>
          </div>

          <div className="bg-[#3CE8E3]/30 p-4 rounded-[2rem] border border-[#3CE8E3] shadow-sm">
            <h4 className="text-[#2C3768] font-black text-sm mb-1 leading-none">7-Day Naija Plate Challenge</h4>
            <div className="w-full aspect-video rounded-xl bg-gray-100 overflow-hidden mb-2 mt-2">
             <img src={REAL_FOOD_IMAGES.challengeDish} alt="Challenge layout" className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-[#2C3768]/70 font-bold">Record. Recharge. Rebalance.</span>
          </div>
        </div>

      </div>
    </section>
  );
}
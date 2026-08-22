import { useMemo } from 'react';
import { REAL_FOOD_IMAGES } from '../constants/images';
import { findSwaps } from '../utils/mealSwap';
import Reveal from '../components/Reveal';

function MacroBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const FEATURED = {
  name: 'Jollof Rice',
  calories: 1623,
  protein: 25.7,
  carbs: 256.4,
  fat: 51.1,
  grams: 650,
  image: REAL_FOOD_IMAGES.heroLeft,
};

const SWAP_IMAGES = {
  original: REAL_FOOD_IMAGES.heroLeft,
  protein: REAL_FOOD_IMAGES.heroRight,
  carbs: REAL_FOOD_IMAGES.soupDetail,
  balanced: REAL_FOOD_IMAGES.riceBowl,
};

const TAG_STYLES = {
  protein: 'bg-[#00F090]/20 text-[#2C3768] border border-[#00F090]',
  carbs: 'bg-[#FFF4CA] text-[#2C3768] border border-[#FF7A30]/40',
  balanced: 'bg-[#3CE8E3]/20 text-[#2C3768] border border-[#3CE8E3]',
};

const LABELS = {
  protein: 'Higher Protein',
  carbs: 'Higher Carb',
  balanced: 'Balanced',
};

export default function MealSwapSection() {
  const swaps = useMemo(() => {
    const orig = { protein: FEATURED.protein, carbs: FEATURED.carbs, fat: FEATURED.fat, name: FEATURED.name };
    const proteinResult = findSwaps(FEATURED.calories, orig, 'protein', FEATURED.grams, 1);
    const carbResult = findSwaps(FEATURED.calories, orig, 'carbs', FEATURED.grams, 1);
    return [
      { ...proteinResult[0], preference: 'protein' },
      { ...FEATURED, preference: 'original', tags: [{ label: 'Scanned meal', color: '#3CE8E3', bg: 'bg-[#3CE8E3]/20', text: 'text-[#2C3768]', border: 'border-[#3CE8E3]' }] },
      { ...carbResult[0], preference: 'carbs' },
    ].filter(Boolean);
  }, []);

  return (
    <section className="bg-white px-6 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <Reveal className="text-center mb-16">
          <span className="inline-block bg-[#3CE8E3]/20 text-[#2C3768] text-sm font-bold px-5 py-2 rounded-full border border-[#3CE8E3] mb-6">
            Smart Swaps
          </span>
          <h2 className="text-3xl md:text-5xl font-black font-display text-[#2C3768] tracking-tighter leading-[0.95] mb-4">
            Swap Smarter,<br />Not Harder.
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-lg mx-auto font-medium">
            Scan any meal and instantly discover alternatives that match your calorie target but fit your macro goals better.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Original Meal */}
          <Reveal delay={80} className="lg:col-span-4">
            <div className="bg-[#F9F8F4] rounded-[2rem] p-6 border border-gray-100">
              <span className="inline-block bg-[#E92A43]/10 text-[#E92A43] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                Scanned Meal · 95% confidence
              </span>
              <div className="rounded-[1.5rem] overflow-hidden aspect-[4/3] mb-5">
                <img src={FEATURED.image} alt="Jollof Rice" className="w-full h-full object-cover" />
              </div>
              <h3 className="text-xl font-black text-[#2C3768] tracking-tight mb-1">{FEATURED.name}</h3>
              <p className="text-gray-400 text-sm font-medium mb-5">{FEATURED.calories} kcal</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Protein</span>
                    <span className="text-gray-400">{FEATURED.protein}g</span>
                  </div>
                  <MacroBar value={FEATURED.protein} max={50} color="bg-[#00F090]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Carbs</span>
                    <span className="text-gray-400">{FEATURED.carbs}g</span>
                  </div>
                  <MacroBar value={FEATURED.carbs} max={80} color="bg-[#FF7A30]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Fat</span>
                    <span className="text-gray-400">{FEATURED.fat}g</span>
                  </div>
                  <MacroBar value={FEATURED.fat} max={40} color="bg-[#3CE8E3]" />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Swap Options */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {swaps.map((swap, i) => {
              const isOriginal = swap.preference === 'original';
              const pref = swap.preference;
              const imageKey = isOriginal ? 'original' : pref;
              return (
                <Reveal key={`${pref}-${i}`} delay={160 + i * 80}>
                  <div className={`bg-white rounded-[2rem] p-5 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isOriginal ? 'border-[#3CE8E3] shadow-lg' : 'border-gray-100 shadow-md'
                  }`}>
                    <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${TAG_STYLES[pref] || TAG_STYLES.balanced}`}>
                      {isOriginal ? 'Scanned meal' : (swap.tags?.[0]?.label || LABELS[pref])}
                    </span>
                    <div className="rounded-[1.25rem] overflow-hidden aspect-[4/3] mb-4">
                      <img src={SWAP_IMAGES[imageKey] || SWAP_IMAGES.balanced} alt={isOriginal ? 'Jollof Rice' : swap.name} className="w-full h-full object-cover" />
                    </div>
                    <h4 className="text-base font-black text-[#2C3768] tracking-tight mb-1">{swap.name}</h4>
                    <p className="text-gray-400 text-xs font-bold mb-4">{swap.estimatedCalories || swap.calories} kcal</p>
                    <div className="space-y-2.5">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-0.5">
                          <span className="text-[#2C3768]">Protein</span>
                          <span className="text-gray-400">{swap.estimatedProtein || swap.protein}g</span>
                        </div>
                        <MacroBar value={swap.estimatedProtein || swap.protein} max={50} color="bg-[#00F090]" />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-0.5">
                          <span className="text-[#2C3768]">Carbs</span>
                          <span className="text-gray-400">{swap.estimatedCarbs || swap.carbs}g</span>
                        </div>
                        <MacroBar value={swap.estimatedCarbs || swap.carbs} max={80} color="bg-[#FF7A30]" />
                      </div>
                      <div>
                        <div className="flex justify-between text-[11px] font-bold mb-0.5">
                          <span className="text-[#2C3768]">Fat</span>
                          <span className="text-gray-400">{swap.estimatedFat || swap.fat}g</span>
                        </div>
                        <MacroBar value={swap.estimatedFat || swap.fat} max={40} color="bg-[#3CE8E3]" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

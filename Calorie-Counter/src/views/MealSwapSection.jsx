import { REAL_FOOD_IMAGES } from '../constants/images';
import Reveal from '../components/Reveal';

const SWAP_OPTIONS = [
  {
    label: 'Higher Protein',
    tag: '38g protein',
    tagColor: 'bg-[#00F090]/20 text-[#2C3768] border border-[#00F090]',
    dish: 'Grilled Fish & Salad',
    calories: 520,
    protein: 38,
    carbs: 32,
    fat: 24,
    image: REAL_FOOD_IMAGES.heroRight,
  },
  {
    label: 'Original',
    tag: 'Scanned meal',
    tagColor: 'bg-[#3CE8E3]/20 text-[#2C3768] border border-[#3CE8E3]',
    dish: 'Jollof Rice & Chicken',
    calories: 520,
    protein: 26,
    carbs: 58,
    fat: 18,
    image: REAL_FOOD_IMAGES.heroLeft,
  },
  {
    label: 'Higher Carb',
    tag: '72g carbs',
    tagColor: 'bg-[#FFF4CA] text-[#2C3768] border border-[#FF7A30]/40',
    dish: 'Pounded Yam & Egusi',
    calories: 520,
    protein: 18,
    carbs: 72,
    fat: 20,
    image: REAL_FOOD_IMAGES.soupDetail,
  },
];

function MacroBar({ value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function MealSwapSection() {
  return (
    <section className="bg-white px-6 py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto">

        {/* Section Header */}
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

        {/* Scanned Meal + Swap Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left: Scanned Meal Preview */}
          <Reveal delay={80} className="lg:col-span-4">
            <div className="bg-[#F9F8F4] rounded-[2rem] p-6 border border-gray-100">
              <span className="inline-block bg-[#E92A43]/10 text-[#E92A43] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                Scanned Meal
              </span>
              <div className="rounded-[1.5rem] overflow-hidden aspect-[4/3] mb-5">
                <img
                  src={REAL_FOOD_IMAGES.heroLeft}
                  alt="Scanned Jollof Rice"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-black text-[#2C3768] tracking-tight mb-1">
                Jollof Rice & Chicken
              </h3>
              <p className="text-gray-400 text-sm font-medium mb-5">520 kcal</p>

              {/* Macro Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Protein</span>
                    <span className="text-gray-400">26g</span>
                  </div>
                  <MacroBar value={26} max={50} color="bg-[#00F090]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Carbs</span>
                    <span className="text-gray-400">58g</span>
                  </div>
                  <MacroBar value={58} max={80} color="bg-[#FF7A30]" />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-[#2C3768]">Fat</span>
                    <span className="text-gray-400">18g</span>
                  </div>
                  <MacroBar value={18} max={40} color="bg-[#3CE8E3]" />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Right: Swap Options */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {SWAP_OPTIONS.map((swap, i) => (
              <Reveal key={swap.label} delay={160 + i * 80}>
                <div className={`bg-white rounded-[2rem] p-5 border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  swap.label === 'Original'
                    ? 'border-[#3CE8E3] shadow-lg'
                    : 'border-gray-100 shadow-md'
                }`}>
                  {/* Tag */}
                  <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full mb-4 ${swap.tagColor}`}>
                    {swap.tag}
                  </span>

                  {/* Food Image */}
                  <div className="rounded-[1.25rem] overflow-hidden aspect-[4/3] mb-4">
                    <img
                      src={swap.image}
                      alt={swap.dish}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Dish Info */}
                  <h4 className="text-base font-black text-[#2C3768] tracking-tight mb-1">
                    {swap.dish}
                  </h4>
                  <p className="text-gray-400 text-xs font-bold mb-4">{swap.calories} kcal</p>

                  {/* Mini Macro Bars */}
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-0.5">
                        <span className="text-[#2C3768]">Protein</span>
                        <span className="text-gray-400">{swap.protein}g</span>
                      </div>
                      <MacroBar value={swap.protein} max={50} color="bg-[#00F090]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-0.5">
                        <span className="text-[#2C3768]">Carbs</span>
                        <span className="text-gray-400">{swap.carbs}g</span>
                      </div>
                      <MacroBar value={swap.carbs} max={80} color="bg-[#FF7A30]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] font-bold mb-0.5">
                        <span className="text-[#2C3768]">Fat</span>
                        <span className="text-gray-400">{swap.fat}g</span>
                      </div>
                      <MacroBar value={swap.fat} max={40} color="bg-[#3CE8E3]" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

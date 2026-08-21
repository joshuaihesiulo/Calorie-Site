import { useMemo } from 'react';
import { useBoundStore } from '../store/useBoundStore';
import { findSwaps } from '../utils/mealSwap';
import { ArrowLeftIcon } from './icons';

function MacroBar({ value, max, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function DeltaText({ value, unit = 'g' }) {
  if (value === 0) return null;
  const isPositive = value > 0;
  return (
    <span className={`text-[10px] font-bold ${isPositive ? 'text-[#00F090]' : 'text-amber-400'}`}>
      {isPositive ? '+' : ''}{value}{unit}
    </span>
  );
}

function SwapCard({ swap, onSwap }) {
  const delta = swap.macroDelta;
  return (
    <div className="bg-[#12121A] rounded-[1.5rem] p-5 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-0.5">
      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {swap.tags.map((tag) => (
          <span
            key={tag.label}
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${tag.bg} ${tag.text} ${tag.border}`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }} />
            {tag.label}
          </span>
        ))}
      </div>

      {/* Food Emoji */}
      <div className={`w-full aspect-[3/2] rounded-2xl mb-3 flex items-center justify-center bg-gradient-to-br ${swap.gradient || 'from-[#6B5E96]/20 to-[#3CE8E3]/20'}`}>
        <span className="text-6xl">{swap.emoji || '🍽️'}</span>
      </div>

      {/* Dish Name */}
      <h4 className="text-sm font-black text-white tracking-tight mb-0.5 truncate">{swap.name}</h4>
      <p className="text-[#8A8A9E] text-xs font-bold mb-3">{swap.estimatedCalories} kcal</p>

      {/* Macro Bars */}
      <div className="space-y-2 mb-4">
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold text-[#8A8A9E]">Protein</span>
            <div className="flex items-center gap-1.5">
              <DeltaText value={delta.protein} />
              <span className="text-[10px] font-bold text-white">{swap.estimatedProtein}g</span>
            </div>
          </div>
          <MacroBar value={swap.estimatedProtein} max={50} color="bg-[#00F090]" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold text-[#8A8A9E]">Carbs</span>
            <div className="flex items-center gap-1.5">
              <DeltaText value={delta.carbs} />
              <span className="text-[10px] font-bold text-white">{swap.estimatedCarbs}g</span>
            </div>
          </div>
          <MacroBar value={swap.estimatedCarbs} max={80} color="bg-[#FF7A30]" />
        </div>
        <div>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-[10px] font-bold text-[#8A8A9E]">Fat</span>
            <div className="flex items-center gap-1.5">
              <DeltaText value={delta.fat} />
              <span className="text-[10px] font-bold text-white">{swap.estimatedFat}g</span>
            </div>
          </div>
          <MacroBar value={swap.estimatedFat} max={40} color="bg-[#3CE8E3]" />
        </div>
      </div>

      {/* Swap Button */}
      <button
        onClick={() => onSwap(swap)}
        className="w-full bg-[#6B5E96] text-white text-xs font-black py-2.5 rounded-xl hover:bg-[#6B5E96]/90 transition-all"
      >
        Swap & Log
      </button>
    </div>
  );
}

export default function MealSwapView() {
  const setView = useBoundStore((state) => state.setView);
  const swapMealData = useBoundStore((state) => state.swapMealData);
  const addManualMeal = useBoundStore((state) => state.addManualMeal);

  const original = swapMealData || { name: 'Scanned Meal', calories: 500, proteinG: 25, carbsG: 50, fatG: 15, grams: 300 };

  const swapInput = useMemo(() => ({
    protein: Number(original.proteinG) || 0,
    carbs: Number(original.carbsG) || 0,
    fat: Number(original.fatG) || 0,
    name: original.name,
  }), [original.proteinG, original.carbsG, original.fatG, original.name]);

  const servingGrams = original.grams || 300;

  const proteinSwaps = useMemo(
    () => findSwaps(original.calories, swapInput, 'protein', servingGrams, 1, original.sourceType),
    [original.calories, swapInput, servingGrams, original.sourceType]
  );

  const carbSwaps = useMemo(
    () => findSwaps(original.calories, swapInput, 'carbs', servingGrams, 1, original.sourceType),
    [original.calories, swapInput, servingGrams, original.sourceType]
  );

  const balancedSwaps = useMemo(
    () => findSwaps(original.calories, swapInput, 'balanced', servingGrams, 1, original.sourceType),
    [original.calories, swapInput, servingGrams, original.sourceType]
  );

  const allSwaps = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const list of [proteinSwaps, carbSwaps, balancedSwaps]) {
      for (const swap of list) {
        if (!seen.has(swap.name)) {
          seen.add(swap.name);
          result.push(swap);
        }
      }
    }
    return result;
  }, [proteinSwaps, carbSwaps, balancedSwaps]);

  const handleSwap = (swap) => {
    addManualMeal(swap.name, swap.estimatedCalories, Math.round((swap.calories_per_100g > 0 ? (swap.estimatedCalories / swap.calories_per_100g) * 100 : 300)));
    setView('dashboard');
  };

  const originalMacros = {
    protein: Number(original.proteinG) || 0,
    carbs: Number(original.carbsG) || 0,
    fat: Number(original.fatG) || 0,
  };

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh] bg-[#05050A] text-[#E2E2E9] relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/5 backdrop-blur-md bg-black/40 z-10">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setView('result')} className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all text-white" aria-label="Back to results">
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <span className="text-lg font-black tracking-tight">Meal Swaps</span>
        </div>
        <button onClick={() => setView('dashboard')} className="bg-[#6B5E96] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#6B5E96]/90">Dashboard</button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 z-10 overflow-y-auto">
        {/* Left: Original Meal */}
        <div className="flex-1 p-5 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/5">
          <div className="bg-[#12121A] rounded-[2rem] p-6 border border-white/5">
            <span className="inline-block bg-[#E92A43]/15 text-[#E92A43] text-[10px] font-bold px-3 py-1.5 rounded-full mb-4 border border-[#E92A43]/30">
              Original Meal
            </span>
            <div className="w-full aspect-[3/2] rounded-2xl mb-4 flex items-center justify-center bg-gradient-to-br from-[#6B5E96]/15 to-[#E92A43]/15">
              <span className="text-6xl">{original.sourceType === 'snack' ? '🍪' : '🍽️'}</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white mb-1">{original.name}</h2>
            <p className="text-[#8A8A9E] text-sm font-bold mb-5">{original.calories} kcal</p>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#8A8A9E]">Protein</span>
                  <span className="text-white">{originalMacros.protein}g</span>
                </div>
                <MacroBar value={originalMacros.protein} max={50} color="bg-[#00F090]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#8A8A9E]">Carbs</span>
                  <span className="text-white">{originalMacros.carbs}g</span>
                </div>
                <MacroBar value={originalMacros.carbs} max={80} color="bg-[#FF7A30]" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#8A8A9E]">Fat</span>
                  <span className="text-white">{originalMacros.fat}g</span>
                </div>
                <MacroBar value={originalMacros.fat} max={40} color="bg-[#3CE8E3]" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Swap Options */}
        <div className="flex-[1.5] p-5 lg:p-8">
          <p className="text-xs font-black uppercase text-[#8A8A9E] tracking-wider mb-4">
            {allSwaps.length} Alternatives Within ±10% Calories
          </p>

          {allSwaps.length === 0 ? (
            <div className="bg-[#12121A] rounded-[2rem] p-8 border border-white/5 text-center">
              <p className="text-[#8A8A9E] text-sm font-bold">No matching alternatives found within ±10% of {original.calories} kcal.</p>
              <button onClick={() => setView('result')} className="mt-4 bg-white/5 border border-white/10 text-[#8A8A9E] font-black text-xs px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all">
                Go Back
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {allSwaps.map((swap) => (
                <SwapCard key={swap.name} swap={swap} onSwap={handleSwap} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

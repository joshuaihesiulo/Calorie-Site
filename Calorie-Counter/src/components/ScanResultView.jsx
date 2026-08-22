import { useState } from 'react';
import { useBoundStore, plateTotals, primaryDishName } from '../store/useBoundStore';
import { AlertIcon, XIcon, LockIcon } from './icons';

const RESOLUTION_LABELS = {
  direct: 'Direct',
  fuzzy: 'Fuzzy',
  ai_reclassify: 'AI',
  verified_label: 'Verified',
  off: 'OFF',
};

function confidenceBadge(confidence) {
  const pct = Math.round((confidence || 0) * 100);
  if (pct >= 80) return { color: 'text-[#00F090]', bg: 'bg-[#00F090]/10', label: `${pct}%` };
  if (pct >= 60) return { color: 'text-amber-400', bg: 'bg-amber-400/10', label: `${pct}%` };
  return { color: 'text-red-400', bg: 'bg-red-400/10', label: `${pct}%` };
}

function humanize(key) {
  return String(key).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ScanResultView() {
  const scannedFoodData = useBoundStore((state) => state.scannedFoodData);
  const capturedImageSrc = useBoundStore((state) => state.capturedImageSrc);
  const updateResultModifiers = useBoundStore((state) => state.updateResultModifiers);
  const commitScannedMeal = useBoundStore((state) => state.commitScannedMeal);
  const setView = useBoundStore((state) => state.setView);
  const isAuthenticated = useBoundStore((state) => state.isAuthenticated);
  const setAuthRedirectView = useBoundStore((state) => state.setAuthRedirectView);
  const setSwapMealData = useBoundStore((state) => state.setSwapMealData);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const handleCommit = () => {
    if (!isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }
    commitScannedMeal();
  };

  const handleFindSwaps = () => {
    setSwapMealData({
      name,
      calories: computed.calories,
      proteinG: Number(totals.proteinG) || 0,
      carbsG: Number(totals.carbsG) || 0,
      fatG: Number(totals.fatG) || 0,
      grams: computed.grams,
    });
    setView('swap');
  };

  const goToAuth = (view) => {
    setAuthRedirectView('result');
    setView(view);
  };

  if (!scannedFoodData) {
    return (
      <div className="p-8 text-center bg-[#05050A] text-white flex flex-col items-center justify-center min-h-[50vh]">
        <p className="font-bold">No active plate scans detected. Please start scanner.</p>
        <button onClick={() => setView('scan')} className="mt-4 bg-[#6B5E96] text-white px-6 py-2 rounded-full">Go Back</button>
      </div>
    );
  }

  const dishes = scannedFoodData.dishes || [];
  const totals = scannedFoodData.totals || {};
  const unresolvedDishes = scannedFoodData.unresolvedDishes || [];
  const stepsData = scannedFoodData.steps || [];
  const selectedQuantity = Number(scannedFoodData.selectedQuantity) || 1;

  const name = primaryDishName(scannedFoodData);
  const computed = plateTotals(scannedFoodData);

  const adjustedProtein = ((totals.proteinG || 0) * selectedQuantity).toFixed(1);
  const adjustedCarbs = ((totals.carbsG || 0) * selectedQuantity).toFixed(1);
  const adjustedFat = ((totals.fatG || 0) * selectedQuantity).toFixed(1);

  const scaledDishes = dishes.map((dish) => {
    const grams = (Number(dish.estimatedGrams) || 0) * selectedQuantity;
    const per100 = Number(dish.faoResult?.calories_per_100g) || 0;
    return {
      ...dish,
      grams,
      calories: Math.round((grams / 100) * per100),
    };
  });

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh] bg-[#05050A] text-[#E2E2E9] relative overflow-hidden">

      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/5 backdrop-blur-md bg-black/40 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#00F090] transform rotate-12 animate-pulse" />
          <span className="text-xl font-black tracking-tight text-white">Kaloriq VLM</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('scan')} className="bg-white/5 border border-white/10 text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-white/10">Re-Scan</button>
          <button onClick={() => setView('dashboard')} className="bg-[#6B5E96] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-[#6B5E96]/90">Dashboard</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 z-10">
        <div className="flex-1 p-5 lg:p-8 flex flex-col justify-between border-r border-white/5 overflow-y-auto">
          <div className="bg-[#12121A] rounded-[2.5rem] p-6 lg:p-8 border border-white/5 relative">
            <div className="flex items-start justify-between mb-6">
              <div className="min-w-0">
                <span className="text-xs font-black text-[#8A8A9E] uppercase block mb-1">Dynamically Sourced (WAFCT · Open Food Facts)</span>
                {stepsData.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {stepsData.map((s, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-[#8A8A9E] text-[9px] font-bold px-2 py-0.5 rounded-full">
                        {s.step === 'identifying' ? 'Gemini' : 'Nutrition'} · {(s.duration_ms / 1000).toFixed(1)}s
                      </span>
                    ))}
                    <span className="bg-[#00F090]/10 border border-[#00F090]/20 text-[#00F090] text-[9px] font-bold px-2 py-0.5 rounded-full">
                      Total · {((stepsData.reduce((a, s) => a + s.duration_ms, 0)) / 1000).toFixed(1)}s
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-black tracking-tight text-[#00F090] mb-2 truncate">{name}</h2>

                {scaledDishes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {scaledDishes.map((d, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-[#8A8A9E] text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {d.displayName || d.dishKey} · {Math.round(d.grams)}g
                      </span>
                    ))}
                    {scaledDishes.map((d, i) => (
                      d.confidence > 0 && (
                        <span key={`conf-${i}`} className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                          {(() => {
                            const badge = confidenceBadge(d.confidence);
                            return (
                              <span className={`inline-flex items-center gap-1 ${badge.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.bg.replace('/10', '')}`} />
                                {badge.label} confidence
                              </span>
                            );
                          })()}
                        </span>
                      )
                    ))}
                  </div>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tighter text-white">{computed.calories}</span>
                  <span className="text-lg font-black text-[#8A8A9E]">Kcal</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Calculated Weight: <strong className="text-white">{computed.grams}g</strong></p>

                {unresolvedDishes.length > 0 && (
                  <p className="text-[10px] text-amber-400 font-bold mt-2 flex items-start gap-1.5">
                    <AlertIcon className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                    Not counted (no FAO data yet): {unresolvedDishes.map(humanize).join(', ')}
                  </p>
                )}
              </div>

              {capturedImageSrc && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 shadow-md flex-shrink-0">
                  <img src={capturedImageSrc} alt="Sourced plate visual" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="bg-[#1A1A26] rounded-2xl p-4 border border-white/5 shadow-sm">
                <span className="text-xs font-bold text-[#8A8A9E] block mb-2">Plate Quantity:</span>
                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 min-w-[120px]">
                  <button
                    onClick={() => updateResultModifiers({ selectedQuantity: Math.max(0.5, selectedQuantity - 0.5) })}
                    className="w-11 h-11 rounded-full bg-white/5 font-black text-base flex items-center justify-center hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs font-bold text-white">
                    {selectedQuantity}x
                  </span>
                  <button
                    onClick={() => updateResultModifiers({ selectedQuantity: selectedQuantity + 0.5 })}
                    className="w-11 h-11 rounded-full bg-white/5 font-black text-base flex items-center justify-center hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {scaledDishes.length > 1 && (
            <div className="mt-5 bg-[#12121A] rounded-[2.5rem] p-6 lg:p-8 border border-white/5 space-y-4">
              <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Dish Breakdown</p>

              <div className="space-y-3">
                {scaledDishes.map((d, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 bg-black/20 border border-white/5 rounded-2xl px-4 py-3">
                    <div className="min-w-0">
                      <span className="text-sm font-black text-white block truncate">{d.displayName || d.dishKey}</span>
                      <span className="text-[10px] font-bold text-[#8A8A9E]">
                        {Math.round(d.grams)}g estimated · {RESOLUTION_LABELS[d.resolutionMethod] || d.resolutionMethod} match
                        {d.confidence > 0 && (() => {
                          const badge = confidenceBadge(d.confidence);
                          return (
                            <span className={`ml-1 inline-flex items-center gap-0.5 ${badge.color}`}>
                              <span className={`inline-block w-1.5 h-1.5 rounded-full ${badge.bg.replace('/10', '')}`} />
                              {badge.label}
                            </span>
                          );
                        })()}
                        {d.faoResult?.source === 'open_food_facts' && (
                          <span className="text-[#00F090]"> · Open Food Facts</span>
                        )}
                        {d.faoResult?.source === 'package_label' && (
                          <span className="text-[#00F090]"> · Package Label</span>
                        )}
                        {d.faoResult?.source === 'manufacturer_label' && (
                          <span className="text-[#00F090]"> · Manufacturer Label · Verified</span>
                        )}
                        {d.faoResult?.source === 'crowdsourced' && (
                          <span className="text-amber-400"> · Crowdsourced (unverified)</span>
                        )}
                      </span>
                    </div>
                    <span className="text-sm font-black text-[#00F090] flex-shrink-0">{d.calories} Kcal</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:w-80 xl:w-96 p-5 lg:p-8 flex flex-col justify-between bg-[#12121A]/40">
          <div>
            <h3 className="text-sm font-black tracking-tight mb-4 uppercase text-[#8A8A9E]">Plate Macro Breakdown</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center shadow-xs">
                <span className="text-lg lg:text-xl font-black block leading-none text-white">{adjustedProtein}g</span>
                <span className="text-[11px] font-bold text-gray-500 mt-1 block">Protein</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center shadow-xs">
                <span className="text-lg lg:text-xl font-black block leading-none text-white">{adjustedCarbs}g</span>
                <span className="text-[11px] font-bold text-gray-500 mt-1 block">Carbs</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-center shadow-xs">
                <span className="text-lg lg:text-xl font-black block leading-none text-white">{adjustedFat}g</span>
                <span className="text-[11px] font-bold text-gray-500 mt-1 block">Fat</span>
              </div>
              <div className="bg-[#1A1A26] rounded-2xl p-4 border border-white/5 text-center shadow-xs">
                <span className="text-lg lg:text-xl font-black block leading-none text-[#00F090]">{computed.grams}g</span>
                <span className="text-[11px] font-bold text-gray-400 mt-1 block">Total Weight</span>
              </div>
            </div>

            <div className="mt-6 bg-[#12121A] rounded-2xl p-4 border border-white/5 text-xs text-[#8A8A9E] leading-relaxed">
              <span className="font-bold text-white block mb-1">Direct FAO Database Sourcing</span>
              Nutritional data for this plate is sourced from the official WAFCT table, combined across every dish detected on the plate.
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={handleCommit}
              className="w-full bg-[#6B5E96] text-white font-black py-4 rounded-2xl hover:bg-[#6B5E96]/95 transition-all text-sm shadow-md"
            >
              Commit to Food Diary
            </button>
            <button
              onClick={handleFindSwaps}
              className="w-full bg-white/5 border border-white/10 text-[#8A8A9E] font-black py-3 rounded-2xl hover:bg-white/10 transition-all text-xs"
            >
              Find Healthier Swaps
            </button>
            <button
              onClick={() => setView('scan')}
              className="w-full bg-white/5 border border-white/10 text-[#8A8A9E] font-black py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#12121A] border border-white/10 rounded-[2rem] p-8 max-w-md w-full relative shadow-2xl text-center">
            <button
              onClick={() => setShowSignInPrompt(false)}
              className="absolute top-4 right-4 text-[#8A8A9E] hover:text-white p-2"
              aria-label="Close"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-[#6B5E96]/20 flex items-center justify-center mx-auto mb-4">
              <LockIcon className="w-6 h-6 text-[#6B5E96]" />
            </div>
            <h3 className="text-xl font-black tracking-tight text-white mb-2">Sign in to save this meal</h3>
            <p className="text-xs font-medium text-[#8A8A9E] leading-relaxed mb-6">
              Your scan is kept safe — sign in and we'll bring you right back so you can add it to your food diary.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => goToAuth('signin')}
                className="w-full bg-[#6B5E96] text-white font-black py-4 rounded-2xl hover:bg-[#6B5E96]/95 transition-all text-sm"
              >
                Sign In
              </button>
              <button
                onClick={() => goToAuth('signup')}
                className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl hover:bg-white/10 transition-all text-sm"
              >
                Create Free Account
              </button>
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="w-full text-[#8A8A9E] font-bold py-2 text-xs hover:text-white transition-colors"
              >
                Not now — keep scanning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React from 'react';
import { useBoundStore } from '../store/useBoundStore';

export default function ScanResultView() {
  const scannedFoodData = useBoundStore((state) => state.scannedFoodData);
  const capturedImageSrc = useBoundStore((state) => state.capturedImageSrc);
  const updateResultModifiers = useBoundStore((state) => state.updateResultModifiers);
  const commitScannedMeal = useBoundStore((state) => state.commitScannedMeal);
  const setView = useBoundStore((state) => state.setView);

  if (!scannedFoodData) {
    return (
      <div className="p-8 text-center bg-[#05050A] text-white flex flex-col items-center justify-center min-h-[50vh]">
        <p className="font-bold">No active plate scans detected. Please start scanner.</p>
        <button onClick={() => setView('scan')} className="mt-4 bg-[#6B5E96] text-white px-6 py-2 rounded-full">Go Back</button>
      </div>
    );
  }

  const {
    name,
    computedCalories,
    computedGrams,
    selectedUnitKey,
    selectedQuantity,
    units,
    isRawState,
    supportsRawState,
    customPrompts,
    promptResponses,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,
    detectedDishes,
    unresolvedDishNames
  } = scannedFoodData;

  const adjustedProtein = ((computedGrams / 100) * (proteinPer100g || 0)).toFixed(1);
  const adjustedCarbs = ((computedGrams / 100) * (carbsPer100g || 0)).toFixed(1);
  const adjustedFat = ((computedGrams / 100) * (fatPer100g || 0)).toFixed(1);

  const handlePromptChange = (promptId, value) => {
    updateResultModifiers({
      promptResponses: {
        ...promptResponses,
        [promptId]: value
      }
    });
  };

  return (
    <div className="flex flex-col min-h-[85vh] lg:min-h-[75vh] bg-[#05050A] text-[#E2E2E9] relative overflow-hidden">

      <div className="flex items-center justify-between p-5 lg:p-7 border-b border-white/5 backdrop-blur-md bg-black/40 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#00F090] transform rotate-12 animate-pulse" />
          <span className="text-xl font-black tracking-tight text-white">NaijaCounts VLM</span>
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
              <div>
                <span className="text-xs font-black text-[#8A8A9E] uppercase block mb-1">Dynamically Sourced (FAO WAFCT)</span>
                <h2 className="text-2xl font-black tracking-tight text-[#00F090] mb-2">{name}</h2>

                {detectedDishes && detectedDishes.length > 1 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {detectedDishes.map((d, i) => (
                      <span key={i} className="bg-white/5 border border-white/10 text-[#8A8A9E] text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {d.name} · {d.grams}g
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tighter text-white">{computedCalories}</span>
                  <span className="text-lg font-black text-[#8A8A9E]">Kcal</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Calculated Weight: <strong className="text-white">{computedGrams}g</strong></p>

                {unresolvedDishNames && unresolvedDishNames.length > 0 && (
                  <p className="text-[10px] text-amber-400 font-bold mt-2">
                    ⚠️ Not counted (no FAO data yet): {unresolvedDishNames.join(', ')}
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
                <span className="text-xs font-bold text-[#8A8A9E] block mb-2">Measure Unit on Plate:</span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedUnitKey}
                    onChange={(e) => updateResultModifiers({ selectedUnitKey: e.target.value })}
                    className="flex-1 bg-black/40 text-white text-xs font-bold border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    {units.map((unit) => (
                      <option key={unit.key} value={unit.key} className="bg-[#12121A]">{unit.label} ({unit.grams}g)</option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 min-w-[120px]">
                    <button
                      onClick={() => updateResultModifiers({ selectedQuantity: Math.max(0.5, selectedQuantity - 0.5) })}
                      className="w-8 h-8 rounded-full bg-white/5 font-black text-sm flex items-center justify-center hover:bg-white/10"
                    >
                      -
                    </button>
                    <span className="font-mono text-xs font-bold text-white">{selectedQuantity}</span>
                    <button
                      onClick={() => updateResultModifiers({ selectedQuantity: selectedQuantity + 0.5 })}
                      className="w-8 h-8 rounded-full bg-white/5 font-black text-sm flex items-center justify-center hover:bg-white/10"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {supportsRawState && (
                <div className="flex items-center justify-between bg-[#1A1A26] rounded-2xl p-4 border border-white/5 shadow-sm">
                  <div>
                    <span className="text-xs font-bold block text-white">Measured raw before boiling?</span>
                    <span className="text-[10px] text-[#8A8A9E] block font-semibold">Auto-applies conversion kinetics</span>
                  </div>
                  <button
                    onClick={() => updateResultModifiers({ isRawState: !isRawState })}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${isRawState ? 'bg-[#6B5E96] text-white' : 'bg-white/5 text-gray-500'}`}
                  >
                    {isRawState ? 'RAW' : 'COOKED'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {customPrompts.length > 0 && (
            <div className="mt-5 bg-[#12121A] rounded-[2.5rem] p-6 lg:p-8 border border-white/5 space-y-4">
              <p className="text-xs font-black uppercase text-gray-500 tracking-wider">Plate Customizations &amp; Hidden Extras</p>

              <div className="space-y-4">
                {customPrompts.map((p) => (
                  <div key={p.id} className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#8A8A9E] capitalize">
                      {p.label}: {p.type === 'range' && `(${promptResponses[p.id] || 0})`}
                    </label>

                    {p.type === 'range' && (
                      <input
                        type="range"
                        min={p.min}
                        max={p.max}
                        step={p.step}
                        value={promptResponses[p.id] || 0}
                        onChange={(e) => handlePromptChange(p.id, Number(e.target.value))}
                        className="w-full mt-1 accent-[#6B5E96]"
                      />
                    )}
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
                <span className="text-lg lg:text-xl font-black block leading-none text-[#00F090]">{computedGrams}g</span>
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
              onClick={commitScannedMeal}
              className="w-full bg-[#6B5E96] text-white font-black py-4 rounded-2xl hover:bg-[#6B5E96]/95 transition-all text-sm shadow-md"
            >
              Commit to Food Diary
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
    </div>
  );
}
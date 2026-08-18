import { useEffect, useMemo, useRef, useState } from 'react';
import { caloriesForGrams, getPer100, searchFoods } from '../utils/foodCatalog';
import { useBoundStore } from '../store/useBoundStore';
import { XIcon } from './icons';

function fmt(grams) {
  return `${grams} g`;
}

export default function MealModal({ open, meal, onClose }) {
  const addManualMeal = useBoundStore((state) => state.addManualMeal);
  const updateMeal = useBoundStore((state) => state.updateMeal);

  const editing = Boolean(meal?.id);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => (meal?.grams && getPer100(meal.name)) || null);
  const [name, setName] = useState(meal?.name || '');
  const [grams, setGrams] = useState(meal?.grams ? String(meal.grams) : '150');
  const [results, setResults] = useState([]);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!open) {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setResults(searchFoods(query));
    }, 250);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, open]);

  const effectiveName = selected ? selected.name : name;
  const gramsValue = Number(grams) || 0;
  const calories = selected ? caloriesForGrams(selected, gramsValue) : null;

  const macros = useMemo(() => {
    if (!selected) return null;
    return [
      ['Protein', selected.protein_per_100g],
      ['Carbs', selected.carbs_per_100g],
      ['Fat', selected.fat_per_100g],
      ['Fiber', selected.fiber_per_100g],
    ];
  }, [selected]);

  if (!open) return null;

  const handleSave = () => {
    if (!effectiveName || !calories) return;
    if (editing) {
      updateMeal(meal.id, { name: effectiveName, calories, grams: gramsValue });
    } else {
      addManualMeal(effectiveName, calories, gramsValue);
    }
    onClose();
  };

  const switchToManual = () => {
    setSelected(null);
    setName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3768]/60 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div
        className="bg-white rounded-[2.5rem] border-2 border-[#2C3768] p-6 sm:p-8 max-w-md w-full relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-[#2C3768] hover:opacity-70" aria-label="Close dialog">
          <XIcon className="w-5 h-5" />
        </button>
        <h3 className="text-2xl font-black tracking-tight mb-1">{editing ? 'Edit Meal' : 'Add Meal'}</h3>
        <p className="text-gray-500 text-sm font-medium mb-5">Pick a dish from our catalog or enter the details manually.</p>

        <div className="relative mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search e.g. jollof rice, egusi..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2C3768]"
          />
          {results.length > 0 && query && (
            <ul className="absolute z-10 mt-2 w-full bg-white rounded-2xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
              {results.slice(0, 8).map((item) => (
                <li key={item.name + item.source}>
                  <button
                    onClick={() => {
                      setSelected(item);
                      setQuery('');
                      setName(item.name);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#00F090]/10 text-xs font-bold flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{item.name}</span>
                    <span className="text-gray-400 whitespace-nowrap">{Number(item.calories_per_100g) || 0} kcal/100g{item.source === 'dish' ? '· Dish' : ''}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selected ? (
          <div className="mb-4 rounded-2xl border border-[#00F090] bg-[#00F090]/10 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-sm font-black">{selected.name}</span>
              <button onClick={switchToManual} className="text-[10px] font-bold text-gray-400 hover:text-[#2C3768] underline">Manual instead</button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {macros.map(([label, value]) => (
                <div key={label} className="bg-white rounded-xl py-1.5">
                  <span className="text-[9px] font-bold text-gray-400 block">{label}</span>
                  <span className="text-[11px] font-black">{Number(value) || 0}g</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-bold text-gray-400 mt-2">Per 100 g</p>
          </div>
        ) : (
          <label className="block mb-4">
            <span className="text-[11px] font-black text-gray-500 block mb-1.5">Meal Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Egg + Plantain Breakfast"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2C3768]"
            />
          </label>
        )}

        <label className="block mb-6">
          <span className="text-[11px] font-black text-gray-500 block mb-1.5">Portion Size (grams)</span>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2C3768]"
            />
            <span className="text-sm font-black text-gray-400">g</span>
          </div>
          {calories !== null && (
            <span className="text-[11px] font-bold text-gray-400 block mt-1.5">
              ≈ <span className="text-[#2C3768] font-black">{calories}</span> kcal{selected ? ` · ${fmt(gramsValue)}` : ''}
            </span>
          )}
        </label>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-[#2C3768] font-bold py-3 rounded-xl text-sm transition-all">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!effectiveName || !calories}
            className="flex-1 bg-[#2C3768] text-white font-black py-3 rounded-xl text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40"
          >
            {editing ? 'Save Changes' : 'Add to Log'}
          </button>
        </div>
      </div>
    </div>
  );
}
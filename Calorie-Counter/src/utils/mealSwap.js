/* Meal Swap Algorithm
 *
 * Finds calorie-matched alternatives from the food catalog,
 * sorted by macro preference (protein, carbs, balanced).
 * Filters by category: snacks swap with snacks, foods swap with foods.
 * Entirely frontend — no backend calls.
 */

import faoWafct from '../data/fao_wafct.json';
import dishIngredients from '../data/dish_ingredients.json';
import snacks from '../data/snacks.json';

const DISH_NAMES = {
  jollof_rice: 'Jollof Rice',
  fried_rice: 'Fried Rice',
  egusi_soup: 'Egusi Soup',
  oha_soup: 'Oha Soup',
  efo_riro: 'Efo Riro',
  pounded_yam: 'Pounded Yam',
  amala: 'Amala',
  eba: 'Eba',
  fried_plantain: 'Fried Plantain',
  boli: 'Boli (Roasted Plantain)',
  moin_moin: 'Moin Moin',
  akara: 'Akara',
  suya: 'Suya',
  goat_meat_pepper_soup: 'Goat Meat Pepper Soup',
  masa: 'Masa',
  chin_chin: 'Chin Chin',
  puff_puff: 'Puff Puff',
  meat_pie: 'Meat Pie',
  egg_roll: 'Egg Roll',
  scotch_egg: 'Scotch Egg',
  potato_chips: 'Potato Chips',
  plantain_chips: 'Plantain Chips',
};

const FOOD_EMOJI = {
  jollof_rice: '🍚', fried_rice: '🍚', egusi_soup: '🍲', oha_soup: '🍲',
  efo_riro: '🍲', pounded_yam: '🫓', amala: '🫓', eba: '🫓',
  fried_plantain: '🍌', boli: '🍌', moin_moin: '🫘', akara: '🫘',
  suya: '🥩', goat_meat_pepper_soup: '🥘', masa: '🥞',
  chin_chin: '🍪', puff_puff: '🍩', meat_pie: '🥧',
  egg_roll: '🥚', scotch_egg: '🥚', potato_chips: '🍟',
  plantain_chips: '🍌',
};

const SNACK_EMOJI = {
  gala_chicken_roll: '🌯', indomie_chicken_noodles: '🍜',
  peak_instant_milk_powder: '🥛', maltina_malt_drink: '🍺',
  beloxxi_cream_crackers: '🍪', beloxxi_cream_crackers_26g: '🍪',
  beloxxi_cream_crackers_52g: '🍪', parle_7to7: '🍪',
  parle_all_butter_cake: '🍰', mcvities_digestive_fibre: '🍪',
  parle_fab: '🍪', yatee_grab_and_go: '🌯', parle_milk_power: '🥛',
  yale_spicy_fish_biscuit: '🍪', parle_top_biscuit: '🍪',
  amstel_malta_ultra: '🍺', cadbury_bournvita: '☕',
  milo_tin_powder: '☕', minimie_chin_chin: '🍪',
  pure_bliss_milk_cookies: '🍪', pure_bliss_milk_cream_wafer: '🧇',
  superbite_sausage_roll: '🌯', yale_cabin_biscuits: '🍪',
  oxford_coaster_biscuits: '🍪', hollandia_yoghurt: '🥛',
  chivita_orange_juice: '🧃', lacasera_apple_drink: '🧃',
  viju_milk_drink: '🥛', festo_espresso: '☕',
  milk_bread_milk_coffee: '☕', seven_up_500ml: '🥤',
  american_cola_600ml: '🥤', beta_malt_330ml: '🍺',
  bigi_cola_50cl: '🥤', bigi_spirite_500ml: '🥤',
  bigi_apple_500ml: '🥤', coca_cola_50cl: '🥤',
  fanta_500ml: '🥤', nutri_milk_500ml: '🥛',
  nutri_yo_500ml: '🥛', pepsi_500ml: '🥤',
  razzl_orange_330ml: '🥤', smoov_chapman_500ml: '🍹',
  five_alive_pineapple_330ml: '🧃',
};

const FOOD_GRADIENTS = [
  'from-[#E92A43]/20 to-[#FF7A30]/20',
  'from-[#00F090]/20 to-[#3CE8E3]/20',
  'from-[#FF7A30]/20 to-[#FFF4CA]/20',
  'from-[#3CE8E3]/20 to-[#6B5E96]/20',
];

const SNACK_GRADIENTS = [
  'from-[#6B5E96]/20 to-[#3CE8E3]/20',
  'from-[#FF7A30]/20 to-[#E92A43]/20',
  'from-[#00F090]/20 to-[#FFF4CA]/20',
  'from-[#3CE8E3]/20 to-[#6B5E96]/20',
];

const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

function normalize(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findFood(name) {
  const wanted = normalize(name);
  if (!wanted) return null;
  const exact = faoWafct.find((f) => normalize(f.name) === wanted);
  if (exact) return exact;
  return faoWafct.find((f) => normalize(f.name).includes(wanted)) || null;
}

function aggregateDishProfile(dishKey) {
  const ingredients = dishIngredients[dishKey];
  if (!Array.isArray(ingredients)) return null;

  let totalGrams = 0;
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

  for (const item of ingredients) {
    const food = findFood(item.ingredient);
    if (!food) continue;
    const factor = Number(item.grams) / 100;
    for (const nutrient of NUTRIENTS) {
      totals[nutrient] += Number(food[`${nutrient}_per_100g`] || 0) * factor;
    }
    totalGrams += Number(item.grams);
  }

  if (totalGrams <= 0) return null;

  const factor = 100 / totalGrams;
  const profile = {
    name: DISH_NAMES[dishKey] || dishKey.replace(/_/g, ' '),
    key: dishKey,
    source: 'dish',
    serving_grams: totalGrams,
  };
  for (const nutrient of NUTRIENTS) {
    profile[`${nutrient}_per_100g`] = Math.round(totals[nutrient] * factor * 100) / 100;
  }
  return profile;
}

const DISH_PROFILES = Object.keys(dishIngredients)
  .map(aggregateDishProfile)
  .filter(Boolean);

const SNACK_PROFILES = Object.entries(snacks).map(([key, snack]) => ({
  name: snack.name,
  key,
  source: 'snack',
  serving_grams: snack.serving_grams || 100,
  calories_per_100g: snack.calories_per_100g,
  protein_per_100g: snack.protein_per_100g,
  carbs_per_100g: snack.carbs_per_100g,
  fat_per_100g: snack.fat_per_100g,
  fiber_per_100g: snack.fiber_per_100g,
}));

const WAFCT_PROFILES = faoWafct.map((food) => ({
  name: food.name,
  source: 'wafct',
  serving_grams: 300,
  calories_per_100g: food.calories_per_100g,
  protein_per_100g: food.protein_per_100g,
  carbs_per_100g: food.carbs_per_100g,
  fat_per_100g: food.fat_per_100g,
  fiber_per_100g: food.fiber_per_100g,
}));

const CATALOG = [...DISH_PROFILES, ...SNACK_PROFILES, ...WAFCT_PROFILES];

const DEFAULT_SERVING_GRAMS = 300;

function estimatedCalories(profile) {
  const grams = profile.serving_grams || DEFAULT_SERVING_GRAMS;
  return Math.round((grams / 100) * (Number(profile.calories_per_100g) || 0));
}

function estimatedMacro(profile, nutrient) {
  const grams = profile.serving_grams || DEFAULT_SERVING_GRAMS;
  return Math.round((grams / 100) * (Number(profile[`${nutrient}_per_100g`]) || 0));
}

function computeTags(item, orig) {
  const tags = [];
  const protein = Number(item.protein_per_100g) || 0;
  const carbs = Number(item.carbs_per_100g) || 0;
  const fat = Number(item.fat_per_100g) || 0;
  const fiber = Number(item.fiber_per_100g) || 0;

  const origProtein = Number(orig.protein_per_100g) || 0;
  const origCarbs = Number(orig.carbs_per_100g) || 0;
  const origFat = Number(orig.fat_per_100g) || 0;
  const origFiber = Number(orig.fiber_per_100g) || 0;

  if (origProtein > 0 && protein > origProtein * 1.3) {
    tags.push({ label: 'High Protein', color: '#00F090', bg: 'bg-[#00F090]/15', text: 'text-[#00F090]', border: 'border-[#00F090]/30' });
  }
  if (origCarbs > 0 && carbs > origCarbs * 1.3) {
    tags.push({ label: 'High Carb', color: '#FF7A30', bg: 'bg-[#FF7A30]/15', text: 'text-[#FF7A30]', border: 'border-[#FF7A30]/30' });
  }
  if (origFat > 0 && fat < origFat * 0.7) {
    tags.push({ label: 'Low Fat', color: '#3CE8E3', bg: 'bg-[#3CE8E3]/15', text: 'text-[#3CE8E3]', border: 'border-[#3CE8E3]/30' });
  }
  if (origFiber > 0 && fiber > origFiber * 1.5) {
    tags.push({ label: 'High Fiber', color: '#FFF4CA', bg: 'bg-[#FFF4CA]/15', text: 'text-[#8A8A9E]', border: 'border-[#FFF4CA]/30' });
  }

  if (tags.length === 0) {
    const pRatio = origProtein > 0 ? protein / origProtein : 1;
    const cRatio = origCarbs > 0 ? carbs / origCarbs : 1;
    const fRatio = origFat > 0 ? fat / origFat : 1;
    if (pRatio > 0.8 && pRatio < 1.2 && cRatio > 0.8 && cRatio < 1.2 && fRatio > 0.8 && fRatio < 1.2) {
      tags.push({ label: 'Balanced', color: '#3CE8E3', bg: 'bg-[#3CE8E3]/15', text: 'text-[#3CE8E3]', border: 'border-[#3CE8E3]/30' });
    }
  }

  return tags;
}

function computeMacroDelta(item, orig) {
  const grams = item.serving_grams || DEFAULT_SERVING_GRAMS;
  const origGrams = orig.serving_grams || DEFAULT_SERVING_GRAMS;

  return {
    protein: Math.round((grams / 100) * (Number(item.protein_per_100g) || 0) - (origGrams / 100) * (Number(orig.protein_per_100g) || 0)),
    carbs: Math.round((grams / 100) * (Number(item.carbs_per_100g) || 0) - (origGrams / 100) * (Number(orig.carbs_per_100g) || 0)),
    fat: Math.round((grams / 100) * (Number(item.fat_per_100g) || 0) - (origGrams / 100) * (Number(orig.fat_per_100g) || 0)),
  };
}

function balancedScore(item, orig) {
  const pDiff = Math.abs((Number(item.protein_per_100g) || 0) - (Number(orig.protein_per_100g) || 0));
  const cDiff = Math.abs((Number(item.carbs_per_100g) || 0) - (Number(orig.carbs_per_100g) || 0));
  const fDiff = Math.abs((Number(item.fat_per_100g) || 0) - (Number(orig.fat_per_100g) || 0));
  return -(pDiff + cDiff + fDiff);
}

/**
 * Find calorie-matched meal alternatives sorted by macro preference.
 *
 * @param {number} originalCalories - Total kcal of the scanned meal
 * @param {object} originalMacros - { protein, carbs, fat, name } in grams per serving
 * @param {string} preference - 'protein' | 'carbs' | 'balanced'
 * @param {number} servingGrams - Serving size in grams (default 300)
 * @param {number} limit - Max results (default 3)
 * @param {string} sourceType - 'dish' | 'snack' | null (null = same as original)
 * @returns {Array} Swap candidates with tags, deltas, emoji, and gradients
 */
export function findSwaps(originalCalories, originalMacros, preference = 'balanced', servingGrams = DEFAULT_SERVING_GRAMS, limit = 3, sourceType = null) {
  if (!originalCalories || originalCalories <= 0) return [];

  const targetPer100 = originalCalories / (servingGrams / 100);
  const low = targetPer100 * 0.9;
  const high = targetPer100 * 1.1;

  const origPer100 = {
    protein_per_100g: (Number(originalMacros.protein) || 0) / (servingGrams / 100),
    carbs_per_100g: (Number(originalMacros.carbs) || 0) / (servingGrams / 100),
    fat_per_100g: (Number(originalMacros.fat) || 0) / (servingGrams / 100),
    fiber_per_100g: 0,
  };

  const matchSource = sourceType || originalMacros.source || null;

  let candidates = CATALOG.filter((item) => {
    const cal100 = Number(item.calories_per_100g) || 0;
    if (cal100 < low || cal100 > high) return false;
    const itemName = normalize(item.name);
    const origName = normalize(originalMacros.name || '');
    if (itemName === origName) return false;
    if (matchSource && item.source !== matchSource) return false;
    return true;
  });

  if (preference === 'protein') {
    candidates.sort((a, b) => (Number(b.protein_per_100g) || 0) - (Number(a.protein_per_100g) || 0));
  } else if (preference === 'carbs') {
    candidates.sort((a, b) => (Number(b.carbs_per_100g) || 0) - (Number(a.carbs_per_100g) || 0));
  } else {
    candidates.sort((a, b) => balancedScore(b, origPer100) - balancedScore(a, origPer100));
  }

  const gradients = matchSource === 'snack' ? SNACK_GRADIENTS : FOOD_GRADIENTS;
  const emojiMap = matchSource === 'snack' ? SNACK_EMOJI : FOOD_EMOJI;

  return candidates.slice(0, limit).map((item, i) => {
    const key = item.key || item.name;
    const emoji = emojiMap[key] || emojiMap[normalize(item.name)] || (matchSource === 'snack' ? '🍪' : '🍽️');
    return {
      name: item.name,
      key,
      source: item.source,
      emoji,
      gradient: gradients[i % gradients.length],
      calories_per_100g: Number(item.calories_per_100g) || 0,
      protein_per_100g: Number(item.protein_per_100g) || 0,
      carbs_per_100g: Number(item.carbs_per_100g) || 0,
      fat_per_100g: Number(item.fat_per_100g) || 0,
      estimatedCalories: estimatedCalories(item),
      estimatedProtein: estimatedMacro(item, 'protein'),
      estimatedCarbs: estimatedMacro(item, 'carbs'),
      estimatedFat: estimatedMacro(item, 'fat'),
      tags: computeTags(item, origPer100),
      macroDelta: computeMacroDelta(item, origPer100),
    };
  });
}

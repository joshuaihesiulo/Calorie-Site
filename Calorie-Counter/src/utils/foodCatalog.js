/* Searchable food catalog built from the bundled nutrition datasets.
 *
 * Mirrors the backend's two-tier lookup:
 *   1. dish keys (dish_ingredients.json) -> per-100g profile aggregated from
 *      their ingredient lists against the WAFCT table.
 *   2. WAFCT foods (fao_wafct.json) -> their stored per-100g profile.
 *
 * Used by the manual "add meal" picker on the dashboard.
 */

import faoWafct from '../data/fao_wafct.json';
import dishIngredients from '../data/dish_ingredients.json';

const DISH_NAMES = {
  jollof_rice: 'Jollof Rice',
  egusi_soup: 'Egusi Soup',
  pounded_yam: 'Pounded Yam',
  amala: 'Amala',
  fried_plantain: 'Fried Plantain',
  moin_moin: 'Moin Moin',
};

const NUTRIENTS = ['calories', 'protein', 'carbs', 'fat', 'fiber'];

function normalize(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function findFood(ingredientName) {
  const wanted = normalize(ingredientName);
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
  const profile = { name: DISH_NAMES[dishKey] || dishKey, source: 'dish', key: dishKey };
  for (const nutrient of NUTRIENTS) {
    profile[`${nutrient}_per_100g`] = Math.round(totals[nutrient] * factor * 100) / 100;
  }
  return profile;
}

const DISH_PROFILES = Object.keys(dishIngredients)
  .map(aggregateDishProfile)
  .filter(Boolean);

const WAFCT_PROFILES = faoWafct.map((food) => ({
  name: food.name,
  source: 'wafct',
  calories_per_100g: food.calories_per_100g,
  protein_per_100g: food.protein_per_100g,
  carbs_per_100g: food.carbs_per_100g,
  fat_per_100g: food.fat_per_100g,
  fiber_per_100g: food.fiber_per_100g,
}));

const CATALOG = [...DISH_PROFILES, ...WAFCT_PROFILES];

function matchScore(name, q) {
  if (name === q) return 100;
  if (name.startsWith(q)) return 50;
  if (name.includes(q)) return 30;
  const hits = q.split(' ').filter((token) => token && name.includes(token)).length;
  return hits * 10;
}

export function searchFoods(query, limit = 8) {
  const q = normalize(query);
  if (!q) return DISH_PROFILES.slice(0, limit);

  const scored = [];
  for (const item of CATALOG) {
    const score = matchScore(normalize(item.name), q);
    if (score > 0) scored.push({ item, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.item);
}

export function getPer100(nameOrKey) {
  const q = normalize(nameOrKey);
  if (!q) return null;
  const exact = CATALOG.find((item) => normalize(item.name) === q || item.key === nameOrKey);
  if (exact) return exact;
  return CATALOG.find((item) => normalize(item.name).includes(q)) || null;
}

export function caloriesForGrams(profile, grams) {
  const per100 = Number(profile?.calories_per_100g) || 0;
  return Math.round((Number(grams) / 100) * per100);
}
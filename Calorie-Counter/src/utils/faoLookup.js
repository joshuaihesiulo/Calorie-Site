// src/utils/faoLookup.js
import foods from '../data/fao_wafct.json';
import dishMap from '../data/dish_ingredients.json';

function findIngredient(searchTerm) {
  const lower = searchTerm.toLowerCase();
  let match = foods.find(f => f.name.toLowerCase() === lower);
  if (!match) match = foods.find(f => f.name.toLowerCase().includes(lower));
  return match || null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function sumNutrients(ingredientList) {
  let totalGrams = 0;
  let totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const missing = [];

  for (const item of ingredientList) {
    const match = findIngredient(item.ingredient);
    if (!match) {
      missing.push(item.ingredient);
      continue;
    }
    const factor = item.grams / 100;
    totals.calories += (match.calories_per_100g || 0) * factor;
    totals.protein += (match.protein_per_100g || 0) * factor;
    totals.carbs += (match.carbs_per_100g || 0) * factor;
    totals.fat += (match.fat_per_100g || 0) * factor;
    totals.fiber += (match.fiber_per_100g || 0) * factor;
    totalGrams += item.grams;
  }

  return { totals, totalGrams, missing };
}

// Mirrors the exact response shape your backend used to return,
// so the rest of your app (useBoundStore.js) doesn't need to change.
export function faoLookup(foodQuery) {
  const key = foodQuery.toLowerCase().trim().replace(/\s+/g, '_');

  if (dishMap[key]) {
    const { totals, totalGrams, missing } = sumNutrients(dishMap[key]);
    const per100gFactor = 100 / totalGrams;

    return {
      source: 'dish_mapping',
      dish_name: foodQuery,
      base_serving_grams: totalGrams,
      calories_per_100g: round2(totals.calories * per100gFactor),
      protein_per_100g: round2(totals.protein * per100gFactor),
      carbs_per_100g: round2(totals.carbs * per100gFactor),
      fat_per_100g: round2(totals.fat * per100gFactor),
      fiber_per_100g: round2(totals.fiber * per100gFactor),
      missing_ingredients: missing
    };
  }

  const directMatches = foods
    .filter(f => f.name.toLowerCase().includes(foodQuery.toLowerCase()))
    .slice(0, 5);

  if (directMatches.length === 0) {
    return null; // caller checks for null instead of response.ok
  }

  return { source: 'direct_wafct_match', matches: directMatches };
}
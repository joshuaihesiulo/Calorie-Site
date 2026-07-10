import { create } from 'zustand';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { faoLookup } from '../utils/faoLookup';

// Add this helper function near the top of useBoundStore.js, above the store definition:

async function generateWithRetry(model, promptParts, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(promptParts);
    } catch (err) {
      lastError = err;
      const is503 = err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('high demand');
      if (!is503 || attempt === maxRetries) {
        throw err; // not a 503, or we've used up retries — fail for real
      }
      // Exponential backoff: wait 1s, then 2s, then 4s before retrying
      const waitMs = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}



export const useBoundStore = create((set, get) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  currentView: 'landing',

  // Credentials and Security state parameters (stored locally)
  geminiToken: localStorage.getItem('NaijaCounts_gemini_Token') || '',
  isAuthenticated: false,
  user: null,

  // Live Machine Learning Prediction State parameters
  scanLoading: false,
  scanError: null,
  capturedImageSrc: null,
  scannedFoodData: null,

  // Real Food Diary Log — starts empty, no seed/mock entries
  loggedMeals: [],

  toggleWaitlist: () => set((state) => ({ waitlistOpen: !state.waitlistOpen })),
  setView: (view) => set({ currentView: view }),
  setgeminiToken: (token) => {
    localStorage.setItem('NaijaCounts_gemini_Token', token);
    set({ geminiToken: token });
  },

  signup: (name, email) => {
    const user = { name, email };
    localStorage.setItem('naija_user', JSON.stringify(user));
    localStorage.setItem('naija_token', 'session_active');
    set({ isAuthenticated: true, user, currentView: 'dashboard' });
  },

  signin: (email) => {
    const storedUser = JSON.parse(localStorage.getItem('naija_user') || 'null');
    if (!storedUser) return;
    localStorage.setItem('naija_token', 'session_active');
    set({ isAuthenticated: true, user: storedUser, currentView: 'dashboard' });
  },

  signout: () => {
    localStorage.removeItem('naija_token');
    set({ isAuthenticated: false, user: null, currentView: 'landing' });
  },

  checkAuth: () => {
    const userRaw = localStorage.getItem('naija_user');
    const token = localStorage.getItem('naija_token');
    const isRegistered = !!userRaw;
    const isAuthenticated = !!token;
    if (isAuthenticated && userRaw) {
      set({ isAuthenticated: true, user: JSON.parse(userRaw) });
    }
    return { isRegistered, isAuthenticated };
  },

  analyzeFoodImage: async (base64Image) => {
    set({ scanLoading: true, scanError: null, capturedImageSrc: base64Image });

    const geminiToken = get().geminiToken;
    if (!geminiToken) {
      set({ scanLoading: false, scanError: "Gemini API key required! Add it in the top header." });
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiToken);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

      const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : "image/jpeg";
      const rawBase64 = matches ? matches[2] : base64Image;

      // STEP A — Gemini identifies EVERY distinct dish visible, not just one.
      const identifyPrompt = `Look at this plate of Nigerian/West African food carefully.
      List EVERY visually distinct dish on the plate separately — do not merge them into one.
      For example, if you see a swallow (amala, eba, pounded yam, etc.) served with a soup (egusi, ewedu, ogbono, etc.), list them as TWO separate dishes, not one.

      For each dish, use one of these exact keys if it matches: jollof_rice, egusi_soup, pounded_yam, amala, fried_plantain, moin_moin.
      If a dish doesn't match any of those, give your best plain lowercase dish name with underscores instead (e.g. "ewedu_soup").

      Return ONLY raw JSON, no markdown, no backticks, in this exact shape:
      {
        "dishes": [
          { "dishKey": "amala", "displayName": "Amala", "estimatedGrams": 200 },
          { "dishKey": "egusi_soup", "displayName": "Egusi Soup", "estimatedGrams": 300 }
        ]
      }`;

     const result = await generateWithRetry(model, [identifyPrompt, { inlineData: { mimeType, data: rawBase64 } }]);

      const cleanJson = result.response.text().replace(/```json|```/gi, "").trim();
      const identified = JSON.parse(cleanJson);

      const detectedDishes = identified.dishes && identified.dishes.length > 0
        ? identified.dishes
        : [];

      if (detectedDishes.length === 0) {
        throw new Error("No dishes could be identified in this image. Try a clearer photo.");
      }

      // STEP B — Look up real FAO/WAFCT data for EACH detected dish locally.
      const resolvedDishes = [];
      const unresolvedDishNames = [];

      for (const dish of detectedDishes) {
        const faoData = faoLookup(dish.dishKey);
        if (!faoData) {
          unresolvedDishNames.push(dish.displayName);
          continue;
        }
        const nutrients = faoData.source === 'dish_mapping' ? faoData : faoData.matches[0];
        resolvedDishes.push({
          displayName: dish.displayName,
          grams: dish.estimatedGrams || 200,
          nutrients
        });
      }

      if (resolvedDishes.length === 0) {
        throw new Error(`No FAO data found for: ${unresolvedDishNames.join(', ')}. These dishes may not be mapped yet.`);
      }

      // STEP C — Combine all resolved dishes into one plate total.
      let totalGrams = 0;
      let totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      for (const d of resolvedDishes) {
        const factor = d.grams / 100;
        totals.calories += (d.nutrients.calories_per_100g || 0) * factor;
        totals.protein += (d.nutrients.protein_per_100g || 0) * factor;
        totals.carbs += (d.nutrients.carbs_per_100g || 0) * factor;
        totals.fat += (d.nutrients.fat_per_100g || 0) * factor;
        totalGrams += d.grams;
      }

      const combinedName = resolvedDishes.map(d => d.displayName).join(' & ');
      const per100gFactor = 100 / totalGrams;

      const combinedBaseCaloriesPer100g = totals.calories * per100gFactor;
      const combinedProteinPer100g = totals.protein * per100gFactor;
      const combinedCarbsPer100g = totals.carbs * per100gFactor;
      const combinedFatPer100g = totals.fat * per100gFactor;

      set({
        scanLoading: false,
        currentView: 'result',
        scannedFoodData: {
          name: combinedName,
          detectedDishes: resolvedDishes.map(d => ({ name: d.displayName, grams: d.grams })),
          unresolvedDishNames,
          baseCaloriesPer100g: combinedBaseCaloriesPer100g,
          proteinPer100g: combinedProteinPer100g,
          carbsPer100g: combinedCarbsPer100g,
          fatPer100g: combinedFatPer100g,
          units: [
            { key: "standard_plate", label: "Standard plate portion", grams: totalGrams },
            { key: "small_portion", label: "Small portion", grams: Math.round(totalGrams * 0.6) },
            { key: "large_portion", label: "Large portion", grams: Math.round(totalGrams * 1.4) }
          ],
          supportsRawState: false,
          customPrompts: [],
          selectedUnitKey: "standard_plate",
          selectedQuantity: 1,
          computedGrams: totalGrams,
          computedCalories: Math.round(totals.calories),
          isRawState: false,
          promptResponses: {}
        },
        scannedCount: get().scannedCount + 1
      });

    } catch (err) {
      console.error("Pipeline Error:", err);
      set({ scanLoading: false, scanError: err.message || "An issue occurred during analysis." });
    }
  },

  updateResultModifiers: (updates) => {
    set((state) => {
      if (!state.scannedFoodData) return state;
      const updatedData = { ...state.scannedFoodData, ...updates };

      const matchedUnit = updatedData.units.find(u => u.key === updatedData.selectedUnitKey) || { grams: 100 };
      let calculatedBaseGrams = matchedUnit.grams * updatedData.selectedQuantity;

      if (updatedData.isRawState && updatedData.supportsRawState) {
        calculatedBaseGrams *= 3.0;
      }

      let totalCalories = (calculatedBaseGrams / 100) * updatedData.baseCaloriesPer100g;

      if (updatedData.customPrompts) {
        updatedData.customPrompts.forEach((prompt) => {
          const userVal = updatedData.promptResponses[prompt.id] || 0;
          if (prompt.type === 'range' && prompt.caloriesPerUnit) {
            totalCalories += (userVal * prompt.caloriesPerUnit);
          }
        });
      }

      return {
        scannedFoodData: {
          ...updatedData,
          computedGrams: Math.round(calculatedBaseGrams),
          computedCalories: Math.round(totalCalories)
        }
      };
    });
  },

  commitScannedMeal: () => {
    const meal = get().scannedFoodData;
    if (!meal) return;
    const newLoggedItem = {
      id: Date.now(),
      name: meal.name,
      calories: meal.computedCalories,
      grams: meal.computedGrams,
      date: `Today, ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
    };
    set((state) => ({
      loggedMeals: [newLoggedItem, ...state.loggedMeals],
      currentView: 'dashboard',
      scannedFoodData: null
    }));
  }
}));
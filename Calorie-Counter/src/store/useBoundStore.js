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

  // useBoundStore.js — replace analyzeFoodImage entirely, delete the GoogleGenerativeAI import and faoLookup import
analyzeFoodImage: async (base64Image) => {
  set({ scanLoading: true, scanError: null, capturedImageSrc: base64Image });
  try {
    const res = await fetch('http://localhost:8000/api/analyze-plate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Analysis failed');
    }
    const data = await res.json();
    set({
      scanLoading: false,
      currentView: 'result',
      scannedFoodData: { ...data, isRawState: false, promptResponses: {} },
      scannedCount: get().scannedCount + 1,
    });
  } catch (err) {
    set({ scanLoading: false, scanError: err.message || 'An issue occurred during analysis.' });
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
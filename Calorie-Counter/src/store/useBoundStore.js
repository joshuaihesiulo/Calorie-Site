import { create } from 'zustand';

export function plateTotals(data) {
  const quantity = Number(data?.selectedQuantity) || 1;
  const rawGrams = (data?.dishes || []).reduce(
    (acc, dish) => acc + (Number(dish.estimatedGrams) || 0),
    0
  );
  const rawCalories = Number(data?.totals?.calories) || 0;
  return {
    quantity,
    calories: Math.round(rawCalories * quantity),
    grams: Math.round(rawGrams * quantity),
  };
}

export function primaryDishName(data) {
  const dishes = data?.dishes || [];
  if (!dishes.length) return 'Plate scan';
  const primary = [...dishes].sort((a, b) => (Number(b.estimatedGrams) || 0) - (Number(a.estimatedGrams) || 0))[0];
  return primary.displayName || primary.dishKey || 'Plate scan';
}

export const useBoundStore = create((set, get) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  currentView: 'landing',

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

  signup: (name, email) => {
    const user = { name, email };
    localStorage.setItem('naija_user', JSON.stringify(user));
    localStorage.setItem('naija_token', 'session_active');
    set({ isAuthenticated: true, user, currentView: 'dashboard' });
  },

  signin: () => {
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
    try {
      const res = await fetch('http://localhost:8000/api/analyze-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      });
      if (!res.ok) {
        let message = 'Analysis failed';
        try {
          message = (await res.json()).detail || message;
        } catch {
          // non-JSON error body — keep the default message
        }
        throw new Error(message);
      }
      const data = (await res.json()) || {};
      set({
        scanLoading: false,
        currentView: 'result',
        scannedFoodData: { ...data, selectedQuantity: 1 },
        scannedCount: get().scannedCount + 1,
      });
    } catch (err) {
      const isNetworkError =
        !(err instanceof Error) || err.name === 'TypeError' || /failed to fetch|network/i.test(err.message || '');
      set({
        scanLoading: false,
        scanError: isNetworkError
          ? 'Cannot reach the analysis server at http://localhost:8000. Start it with: cd backend && start-server.cmd'
          : err.message || 'An issue occurred during analysis.',
      });
    }
  },

  updateResultModifiers: (updates) => {
    set((state) => {
      if (!state.scannedFoodData) return state;
      const updatedData = { ...state.scannedFoodData, ...updates };
      return {
        scannedFoodData: {
          ...updatedData,
          ...plateTotals(updatedData),
        },
      };
    });
  },

  commitScannedMeal: () => {
    const meal = get().scannedFoodData;
    if (!meal) return;
    const computed = plateTotals(meal);
    const newLoggedItem = {
      id: Date.now(),
      name: primaryDishName(meal),
      calories: computed.calories,
      grams: computed.grams,
      date: `Today, ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
    };
    set((state) => ({
      loggedMeals: [newLoggedItem, ...state.loggedMeals],
      currentView: 'dashboard',
      scannedFoodData: null
    }));
  }
}));
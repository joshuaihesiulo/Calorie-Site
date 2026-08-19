import { create } from 'zustand';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  getAuthErrorMessage,
} from '../firebase/auth';
import { loadMealsFromFirestore, saveMealsToFirestore } from '../firebase/firestore';

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

/* ---------------------------------------------------------------------------
 * Meal helpers
 * ------------------------------------------------------------------------- */

const MEALS_STORAGE_KEY = (uid) => `naija_meals_${uid || 'guest'}`;

function toDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function timeLabel(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function uniqueId() {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function buildMeal({ name, calories, grams, createdAt }) {
  const created = createdAt ? new Date(createdAt) : new Date();
  return {
    id: uniqueId(),
    name: String(name || 'Meal'),
    calories: Math.round(Number(calories) || 0),
    grams: Math.round(Number(grams) || 0),
    dateKey: toDateKey(created),
    createdAt: created.toISOString(),
    date: `Today, ${timeLabel(created)}`,
  };
}

function normalizeMeals(list) {
  if (!Array.isArray(list)) return [];
  return list.map((meal) => {
    if (meal && meal.id && meal.dateKey) return meal;
    const created = meal?.createdAt ? new Date(meal.createdAt) : new Date();
    return {
      id: meal?.id || uniqueId(),
      name: meal?.name || 'Meal',
      calories: Math.round(Number(meal?.calories) || 0),
      grams: Math.round(Number(meal?.grams) || 0),
      dateKey: meal?.dateKey || toDateKey(created),
      createdAt: meal?.createdAt || created.toISOString(),
      date: meal?.date || `Today, ${timeLabel(created)}`,
    };
  });
}

function loadMealsForUser(uid) {
  try {
    return normalizeMeals(JSON.parse(localStorage.getItem(MEALS_STORAGE_KEY(uid))));
  } catch {
    return [];
  }
}

function saveMealsForUser(uid, meals) {
  try {
    localStorage.setItem(MEALS_STORAGE_KEY(uid), JSON.stringify(meals));
  } catch {
    // storage unavailable — keep meals in memory only
  }
}

/* Consecutive-day logging streak. Alive while today OR yesterday is logged. */
export function computeStreak(meals) {
  const days = new Set((meals || []).map((meal) => meal.dateKey).filter(Boolean));
  const cursor = new Date();
  if (!days.has(toDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ---------------------------------------------------------------------------
 * Store
 * ------------------------------------------------------------------------- */

export const useBoundStore = create((set, get) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  currentView: 'landing',

  isAuthenticated: false,
  authLoading: true,
  authError: null,
  user: null,
  authRedirectView: null,

  // Live Machine Learning Prediction State parameters
  scanLoading: false,
  scanError: null,
  capturedImageSrc: null,
  scannedFoodData: null,

  // Real Food Diary Log — starts empty, no seed/mock entries
  loggedMeals: [],
  // Last meal committed from a scan — drives the "add another serving" shortcut
  lastCommittedMeal: null,

  toggleWaitlist: () => set((state) => ({ waitlistOpen: !state.waitlistOpen })),
  setView: (view) => set({ currentView: view }),

  setAuthUser: (user) => {
    const state = get();
    if (user && !state.isAuthenticated) {
      const redirect = state.authRedirectView;
      const isOnAuthPage = state.currentView === 'signup' || state.currentView === 'signin';
      set({
        user,
        isAuthenticated: true,
        authLoading: false,
        authError: null,
        loggedMeals: loadMealsForUser(user.uid),
        currentView: redirect || (isOnAuthPage ? 'dashboard' : state.currentView),
        authRedirectView: null,
      });
    } else {
      set({
        user,
        isAuthenticated: !!user,
        authLoading: false,
        authError: null,
        loggedMeals: user ? get().loggedMeals : [],
      });
    }
    if (user) hydrateFromFirestore(user.uid);
  },

  hydrateMeals: (meals) => set({ loggedMeals: normalizeMeals(meals) }),

  setAuthRedirectView: (view) => set({ authRedirectView: view }),
  clearAuthError: () => set({ authError: null }),

  signup: async (name, email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const user = await signUpWithEmail(name, email, password);
      const redirect = get().authRedirectView;
      set({
        user,
        isAuthenticated: true,
        authLoading: false,
        authRedirectView: null,
        loggedMeals: loadMealsForUser(user.uid),
        currentView: redirect || 'dashboard',
      });
      hydrateFromFirestore(user.uid);
    } catch (err) {
      set({ authLoading: false, authError: getAuthErrorMessage(err) });
    }
  },

  signin: async (email, password) => {
    set({ authLoading: true, authError: null });
    try {
      const user = await signInWithEmail(email, password);
      const redirect = get().authRedirectView;
      set({
        user,
        isAuthenticated: true,
        authLoading: false,
        authRedirectView: null,
        loggedMeals: loadMealsForUser(user.uid),
        currentView: redirect || 'dashboard',
      });
      hydrateFromFirestore(user.uid);
    } catch (err) {
      set({ authLoading: false, authError: getAuthErrorMessage(err) });
    }
  },

  signinWithGoogle: async () => {
    set({ authLoading: true, authError: null });
    try {
      const user = await signInWithGoogle();
      const redirect = get().authRedirectView;
      set({
        user,
        isAuthenticated: true,
        authLoading: false,
        authRedirectView: null,
        loggedMeals: loadMealsForUser(user.uid),
        currentView: redirect || 'dashboard',
      });
      hydrateFromFirestore(user.uid);
    } catch (err) {
      set({ authLoading: false, authError: getAuthErrorMessage(err) });
    }
  },

  signout: async () => {
    try {
      await firebaseSignOut();
    } finally {
      set({
        isAuthenticated: false,
        user: null,
        authError: null,
        currentView: 'landing',
        loggedMeals: [],
        lastCommittedMeal: null,
      });
    }
  },

  analyzeFoodImage: async (base64Image) => {
    set({ scanLoading: true, scanError: null, capturedImageSrc: base64Image });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90000);
    try {
      const res = await fetch('/api/analyze-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
        signal: controller.signal,
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
      const aborted = err?.name === 'AbortError';
      const isNetworkError =
        aborted ||
        !(err instanceof Error) ||
        err.name === 'TypeError' ||
        /failed to fetch|network/i.test(err.message || '');
      set({
        scanLoading: false,
        scanError: isNetworkError
          ? aborted
            ? 'The analysis server took too long (serverless functions can take up to ~60s for AI vision analysis). Try again — retries are faster after the first warm-up call.'
            : 'Cannot reach the analysis server. In local dev, start it with backend\\start-server.cmd (or run npm run dev:all). Press Retry scan to try again.'
          : err.message || 'An issue occurred during analysis.',
      });
    } finally {
      clearTimeout(timer);
    }
  },

  retryScan: async () => {
    const image = get().capturedImageSrc;
    if (image) await get().analyzeFoodImage(image);
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

  /* ---- Food diary mutations (all write through to storage) ---- */

  commitScannedMeal: () => {
    const scan = get().scannedFoodData;
    if (!scan) return;
    const computed = plateTotals(scan);
    const meal = buildMeal({
      name: primaryDishName(scan),
      calories: computed.calories,
      grams: computed.grams,
    });
    const meals = [meal, ...get().loggedMeals];
    persistMeals(meals);
    set({
      loggedMeals: meals,
      lastCommittedMeal: meal,
      currentView: 'dashboard',
      scannedFoodData: null,
    });
  },

  addManualMeal: (name, calories, grams) => {
    if (!name || !calories) return;
    const meal = buildMeal({ name, calories, grams });
    const meals = [meal, ...get().loggedMeals];
    persistMeals(meals);
    set({ loggedMeals: meals, lastCommittedMeal: meal });
  },

  updateMeal: (id, updates) => {
    const meals = get().loggedMeals.map((meal) =>
      meal.id === id ? { ...meal, name: updates.name ?? meal.name, calories: Math.round(Number(updates.calories) || 0), grams: Math.round(Number(updates.grams) || 0) } : meal
    );
    persistMeals(meals);
    set({ loggedMeals: meals });
  },

  deleteMeal: (id) => {
    const meals = get().loggedMeals.filter((meal) => meal.id !== id);
    persistMeals(meals);
    set({ loggedMeals: meals });
  },

  addAnotherServing: () => {
    const last = get().lastCommittedMeal;
    if (!last) return;
    const meal = buildMeal({
      name: last.name,
      calories: last.calories,
      grams: last.grams,
    });
    const meals = [meal, ...get().loggedMeals];
    persistMeals(meals);
    set({ loggedMeals: meals, lastCommittedMeal: meal });
  },

  dismissLastCommitted: () => set({ lastCommittedMeal: null }),
}));

/* ---------------------------------------------------------------------------
 * Persistence helpers (localStorage always, Firestore when signed in)
 * ------------------------------------------------------------------------- */

function persistMeals(meals) {
  const { user } = useBoundStore.getState();
  saveMealsForUser(user?.uid, meals);
  if (user?.uid) {
    saveMealsToFirestore(user.uid, meals).catch(() => {
      // Firestore unavailable (not created / offline) — localStorage already saved
    });
  }
}

function hydrateFromFirestore(uid) {
  loadMealsFromFirestore(uid)
    .then((remote) => {
      if (!Array.isArray(remote)) return;
      useBoundStore.getState().hydrateMeals(remote);
      saveMealsForUser(uid, remote);
    })
    .catch(() => {
      // Firestore unavailable — local storage copy stays authoritative
    });
}
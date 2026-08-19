import { create } from 'zustand';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  getAuthErrorMessage,
} from '../firebase/auth';
import { loadUserDoc, saveUserDoc } from '../firebase/firestore';

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
const GOAL_STORAGE_KEY = (uid) => `naija_goal_${uid || 'guest'}`;
const TEMPLATES_STORAGE_KEY = (uid) => `naija_templates_${uid || 'guest'}`;

export const DEFAULT_CALORIE_GOAL = 2400;

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

function loadGoalForUser(uid) {
  try {
    const value = Number(localStorage.getItem(GOAL_STORAGE_KEY(uid)));
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_CALORIE_GOAL;
  } catch {
    return DEFAULT_CALORIE_GOAL;
  }
}

function saveGoalForUser(uid, goal) {
  try {
    localStorage.setItem(GOAL_STORAGE_KEY(uid), String(goal));
  } catch {
    // storage unavailable — keep goal in memory only
  }
}

function normalizeTemplateList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((template) => ({
      id: template?.id || uniqueId(),
      name: String(template?.name || 'Combo'),
      meals: Array.isArray(template?.meals) ? template.meals : [],
      createdAt: template?.createdAt || new Date().toISOString(),
    }))
    .filter((template) => template.meals.length > 0);
}

function loadTemplatesForUser(uid) {
  try {
    return normalizeTemplateList(JSON.parse(localStorage.getItem(TEMPLATES_STORAGE_KEY(uid))));
  } catch {
    return [];
  }
}

function saveTemplatesForUser(uid, templates) {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY(uid), JSON.stringify(templates));
  } catch {
    // storage unavailable — keep templates in memory only
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

  // User settings (persisted per-user)
  calorieGoal: DEFAULT_CALORIE_GOAL,
  templates: [],

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
        calorieGoal: loadGoalForUser(user.uid),
        templates: loadTemplatesForUser(user.uid),
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
        calorieGoal: loadGoalForUser(user.uid),
        templates: loadTemplatesForUser(user.uid),
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
        calorieGoal: loadGoalForUser(user.uid),
        templates: loadTemplatesForUser(user.uid),
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
        calorieGoal: loadGoalForUser(user.uid),
        templates: loadTemplatesForUser(user.uid),
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

  setGoal: (goal) => {
    const clamped = Math.min(6000, Math.max(500, Math.round(Number(goal) || DEFAULT_CALORIE_GOAL)));
    const { user } = get();
    saveGoalForUser(user?.uid, clamped);
    if (user?.uid) {
      saveUserDoc(user.uid, { goal: clamped }).catch(() => {
        // Firestore unavailable — localStorage already saved
      });
    }
    set({ calorieGoal: clamped });
  },

  repeatMeal: (meal) => {
    if (!meal) return;
    const entry = buildMeal({ name: meal.name, calories: meal.calories, grams: meal.grams });
    const meals = [entry, ...get().loggedMeals];
    persistMeals(meals);
    set({ loggedMeals: meals, lastCommittedMeal: entry });
  },

  addTemplate: (name, dayMeals) => {
    const cleanName = String(name || '').trim();
    const entries = (dayMeals || [])
      .filter((m) => m && m.name && Number(m.calories) > 0)
      .map((m) => ({
        name: m.name,
        calories: Math.round(Number(m.calories) || 0),
        grams: Math.round(Number(m.grams) || 0),
      }));
    if (!cleanName || !entries.length) return;
    const template = {
      id: uniqueId(),
      name: cleanName,
      meals: entries,
      createdAt: new Date().toISOString(),
    };
    const templates = [template, ...get().templates];
    persistTemplates(templates);
    set({ templates });
  },

  deleteTemplate: (id) => {
    const templates = get().templates.filter((t) => t.id !== id);
    persistTemplates(templates);
    set({ templates });
  },

  logTemplate: (template) => {
    if (!template?.meals?.length) return;
    const created = new Date();
    const entries = template.meals.map((m) =>
      buildMeal({ name: m.name, calories: m.calories, grams: m.grams, createdAt: created })
    );
    const meals = [...entries, ...get().loggedMeals];
    persistMeals(meals);
    set({ loggedMeals: meals, lastCommittedMeal: entries[0] });
  },
}));

/* ---------------------------------------------------------------------------
 * Persistence helpers (localStorage always, Firestore when signed in)
 * ------------------------------------------------------------------------- */

function persistMeals(meals) {
  const { user } = useBoundStore.getState();
  saveMealsForUser(user?.uid, meals);
  if (user?.uid) {
    saveUserDoc(user.uid, { meals }).catch(() => {
      // Firestore unavailable (not created / offline) — localStorage already saved
    });
  }
}

function persistTemplates(templates) {
  const { user } = useBoundStore.getState();
  saveTemplatesForUser(user?.uid, templates);
  if (user?.uid) {
    saveUserDoc(user.uid, { templates }).catch(() => {
      // Firestore unavailable — localStorage already saved
    });
  }
}

function hydrateFromFirestore(uid) {
  loadUserDoc(uid)
    .then((remote) => {
      if (!remote) return;
      if (Array.isArray(remote.meals)) {
        useBoundStore.getState().hydrateMeals(remote.meals);
        saveMealsForUser(uid, remote.meals);
      }
      if (Number.isFinite(Number(remote.goal)) && Number(remote.goal) >= 500) {
        useBoundStore.getState().setGoal(remote.goal);
      }
      if (Array.isArray(remote.templates)) {
        const templates = normalizeTemplateList(remote.templates);
        useBoundStore.setState({ templates });
        saveTemplatesForUser(uid, templates);
      }
    })
    .catch(() => {
      // Firestore unavailable — local storage copy stays authoritative
    });
}
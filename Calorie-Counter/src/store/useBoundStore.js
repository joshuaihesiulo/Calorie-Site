import { create } from 'zustand';

export const useBoundStore = create((set) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  // View routing state: 'landing', 'signup', 'signin', 'scan', 'result', 'dashboard'
  currentView: 'landing',
  // Auth state
  isAuthenticated: false,
  user: null,

  toggleWaitlist: () => set((state) => ({ waitlistOpen: !state.waitlistOpen })),
  incrementScan: () => set((state) => ({ scannedCount: state.scannedCount + 1 })),
  setActiveFoodTab: (index) => set({ activeFoodTab: index }),
  setScanning: (status) => set({ isScanning: status }),
  setView: (view) => set({ currentView: view }),

  signup: (name, email) => {
    const token = crypto.randomUUID();
    const user = { name, email };
    localStorage.setItem('naija_user', JSON.stringify(user));
    localStorage.setItem('naija_token', token);
    set({ isAuthenticated: true, user, currentView: 'dashboard' });
  },

  signin: (email) => {
    const token = crypto.randomUUID();
    const storedUser = JSON.parse(localStorage.getItem('naija_user') || '{}');
    localStorage.setItem('naija_token', token);
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
    if (isAuthenticated) {
      set({ isAuthenticated: true, user: JSON.parse(userRaw) });
    }
    return { isRegistered, isAuthenticated };
  },
}));
import { create } from 'zustand';

export const useBoundStore = create((set) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  // View routing state: 'landing', 'signup', 'signin', 'result', 'dashboard'
  currentView: 'landing', 
  
  toggleWaitlist: () => set((state) => ({ waitlistOpen: !state.waitlistOpen })),
  incrementScan: () => set((state) => ({ scannedCount: state.scannedCount + 1 })),
  setActiveFoodTab: (index) => set({ activeFoodTab: index }),
  setScanning: (status) => set({ isScanning: status }),
  setView: (view) => set({ currentView: view }),
}));
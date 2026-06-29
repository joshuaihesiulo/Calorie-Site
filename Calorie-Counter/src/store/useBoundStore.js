import { create } from 'zustand';

export const useBoundStore = create((set) => ({
  waitlistOpen: false,
  scannedCount: 0,
  activeFoodTab: 0,
  isScanning: false,
  
  toggleWaitlist: () => set((state) => ({ waitlistOpen: !state.waitlistOpen })),
  incrementScan: () => set((state) => ({ scannedCount: state.scannedCount + 1 })),
  setActiveFoodTab: (index) => set({ activeFoodTab: index }),
  setScanning: (status) => set({ isScanning: status }),
}));
// src/lib/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeMode } from './types';

interface ThemeState {
  mode: ThemeMode;
  toggleColorMode: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light', // Default to light mode
      toggleColorMode: () => 
        set((state) => ({ mode: state.mode === 'light' ? 'dark' : 'light' })),
      setMode: (mode: ThemeMode) => set({ mode }),
    }),
    {
      name: 'theme-storage', // Local storage key
    }
  )
);
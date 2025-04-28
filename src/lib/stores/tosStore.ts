// src/lib/stores/tosStore.ts
import { create } from 'zustand';
import { TosDialogMode } from './types';

interface TosDialogState {
  isOpen: boolean;
  mode: TosDialogMode;
  tosId: string | null;
  
  open: (mode: 'view' | 'create' | 'edit', tosId?: string) => void;
  close: () => void;
}

export const useTosStore = create<TosDialogState>((set) => ({
  isOpen: false,
  mode: null,
  tosId: null,
  
  open: (mode, tosId: string | null = null) => set({ isOpen: true, mode, tosId }),
  close: () => set({ isOpen: false, mode: null, tosId: null }),
}));
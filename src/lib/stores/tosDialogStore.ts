// src/lib/stores/tosDialogStore.ts
import { create } from 'zustand';

type TosDialogMode = 'view' | 'create' | 'edit' | null;

interface TosDialogState {
  isOpen: boolean;
  mode: TosDialogMode;
  tosId: string | null;
  open: (mode: 'view' | 'create' | 'edit', tosId?: string) => void;
  close: () => void;
}

export const useTosDialogStore = create<TosDialogState>((set) => ({
  isOpen: false,
  mode: null,
  tosId: null,
  open: (mode, tosId = undefined) => set({ isOpen: true, mode, tosId }),
  close: () => set({ isOpen: false, mode: null, tosId: null }),
}));
// src/lib/stores/userStore.ts
import { create } from 'zustand';
import { DialogType } from './types';

interface UserDialogState {
  dialog: DialogType;
  open: (dialog: Exclude<DialogType, 'login' | 'register' | null>) => void;
  close: () => void;
}

export const useUserStore = create<UserDialogState>((set) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
}));
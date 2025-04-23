// src/lib/stores/userDialogStore.ts
import { create } from 'zustand';

type UserDialogType = 'editProfile' | 'createCommission' | 'uploadArtwork' | null;

interface UserDialogState {
  openDialog: UserDialogType;
  open: (dialog: UserDialogType) => void;
  close: () => void;
}

export const useUserDialogStore = create<UserDialogState>((set) => ({
  openDialog: null,
  open: (dialog) => set({ openDialog: dialog }),
  close: () => set({ openDialog: null }),
}));

// src/lib/stores/userDialogStore.ts
import { create } from 'zustand';

// Update the type to include all required dialog types
type UserDialogType = 'editProfile' | 'createCommission' | 'uploadArtwork' | 'accountSettings' | null;

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
// src/lib/stores/authDialogStore.ts
import { create } from "zustand";

type AuthDialogType = "login" | "register" | null;

interface AuthDialogState {
  openDialog: AuthDialogType;
  open: (dialog: AuthDialogType) => void;
  close: () => void;
  toggle: () => void;
}

export const useAuthDialogStore = create<AuthDialogState>((set, get) => ({
  openDialog: null,
  open: (dialog) => set({ openDialog: dialog }),
  close: () => set({ openDialog: null }),
  toggle: () => {
    const current = get().openDialog;
    set({
      openDialog: current === "login" ? "register" : "login",
    });
  },
}));

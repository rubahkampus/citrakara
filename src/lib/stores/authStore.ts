// src/lib/stores/authStore.ts
import { create } from "zustand";
import { DialogType } from "./types";

interface AuthDialogState {
  dialog: DialogType;
  open: (dialog: 'login' | 'register') => void;
  close: () => void;
  toggle: () => void;
}

export const useAuthStore = create<AuthDialogState>((set, get) => ({
  dialog: null,
  open: (dialog) => set({ dialog }),
  close: () => set({ dialog: null }),
  toggle: () => {
    const current = get().dialog;
    set({
      dialog: current === "login" ? "register" : "login",
    });
  },
}));
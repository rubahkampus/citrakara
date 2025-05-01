// src/lib/stores/dialogStore.ts - Unified dialog store
import { create } from 'zustand';
import { DialogState, DialogType } from './types';

interface DialogStoreState {
  // Current dialog state
  dialog: DialogState | null;
  
  // Actions
  open: (type: DialogType, entityId?: string, data?: any, isOwner?: boolean) => void;
  close: () => void;
  toggle: (type: DialogType, entityId?: string) => void;
  update: (data: Partial<DialogState>) => void;
}

export const useDialogStore = create<DialogStoreState>((set, get) => ({
  dialog: null,
  
  open: (type, entityId, data, isOwner) => set({ 
    dialog: { type, entityId, data, isOwner } 
  }),
  
  close: () => set({ dialog: null }),
  
  toggle: (type, entityId) => {
    const current = get().dialog;
    if (current?.type === type && current?.entityId === entityId) {
      set({ dialog: null });
    } else {
      set({ dialog: { type, entityId } });
    }
  },
  
  update: (data) => set((state) => ({
    dialog: state.dialog ? { ...state.dialog, ...data } : null
  }))
}));

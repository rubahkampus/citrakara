// src/lib/stores/profileStore.ts
import { create } from 'zustand';
import { ProfileView } from './types';

interface ProfilePageState {
  // View state
  activeView: ProfileView;
  activeGalleryId: string | null;
  
  // Dialog states
  galleryDialogOpen: boolean;
  commissionDialogOpen: boolean;
  activePostId: string | null;
  activeCommissionId: string | null;
  
  // Actions
  setView: (view: ProfileView) => void;
  setGalleryId: (galleryId: string | null) => void;
  openGalleryDialog: (postId: string) => void;
  closeGalleryDialog: () => void;
  openCommissionDialog: (commissionId: string) => void;
  closeCommissionDialog: () => void;
}

export const useProfileStore = create<ProfilePageState>((set) => ({
  // View state
  activeView: 'overview',
  activeGalleryId: null,
  
  // Dialog states
  galleryDialogOpen: false,
  commissionDialogOpen: false,
  activePostId: null,
  activeCommissionId: null,
  
  // Actions
  setView: (view) => set({ activeView: view }),
  setGalleryId: (galleryId) => set({ 
    activeGalleryId: galleryId,
    activeView: galleryId ? 'specificGallery' : 'overview'
  }),
  openGalleryDialog: (postId) => set({ 
    galleryDialogOpen: true, 
    activePostId: postId 
  }),
  closeGalleryDialog: () => set({ 
    galleryDialogOpen: false, 
    activePostId: null 
  }),
  openCommissionDialog: (commissionId) => set({ 
    commissionDialogOpen: true, 
    activeCommissionId: commissionId 
  }),
  closeCommissionDialog: () => set({ 
    commissionDialogOpen: false, 
    activeCommissionId: null 
  }),
}));
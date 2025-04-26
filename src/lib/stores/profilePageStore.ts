// src/lib/stores/profilePageStore.ts
import { create } from 'zustand';

// Define gallery and commission interfaces
export interface GalleryData {
  id: string;
  name: string;
  thumbnails: string[];
  postCount: number;
}

export interface GalleryPostData {
  id: string;
  galleryId: string;
  images: string[];
  description?: string;
  createdAt: string;
}

export interface CommissionData {
  id: string;
  title: string;
  description: string;
  price: {
    min: number;
    max: number;
  };
  currency: string;
  thumbnail: string;
  isActive: boolean;
  slots: number;
  slotsUsed: number;
}

type ActiveView = 'overview' | 'gallery' | 'specificGallery' | 'commission';

interface ProfilePageState {
  // Current view state
  activeView: ActiveView;
  activeGalleryId: string | null;
  
  // Set active view/gallery
  setActiveView: (view: ActiveView) => void;
  setActiveGalleryId: (galleryId: string | null) => void;
  
  // Dialog states
  isGalleryPostDialogOpen: boolean;
  isCommissionDialogOpen: boolean;
  activePostId: string | null;
  activeCommissionId: string | null;
  
  // Dialog actions
  openGalleryPostDialog: (postId: string) => void;
  closeGalleryPostDialog: () => void;
  openCommissionDialog: (commissionId: string) => void;
  closeCommissionDialog: () => void;
}

export const useProfilePageStore = create<ProfilePageState>((set) => ({
  // Initial state
  activeView: 'overview',
  activeGalleryId: null,
  
  // View actions
  setActiveView: (view) => set({ activeView: view }),
  setActiveGalleryId: (galleryId) => set({ 
    activeGalleryId: galleryId,
    activeView: galleryId ? 'specificGallery' : 'overview'
  }),
  
  // Dialog states
  isGalleryPostDialogOpen: false,
  isCommissionDialogOpen: false,
  activePostId: null,
  activeCommissionId: null,
  
  // Dialog actions
  openGalleryPostDialog: (postId) => set({ 
    isGalleryPostDialogOpen: true, 
    activePostId: postId 
  }),
  closeGalleryPostDialog: () => set({ 
    isGalleryPostDialogOpen: false, 
    activePostId: null 
  }),
  openCommissionDialog: (commissionId) => set({ 
    isCommissionDialogOpen: true, 
    activeCommissionId: commissionId 
  }),
  closeCommissionDialog: () => set({ 
    isCommissionDialogOpen: false, 
    activeCommissionId: null 
  }),
}));
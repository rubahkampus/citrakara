// src/lib/stores/galleryPostStore.ts
import { create } from 'zustand';

export interface GalleryPost {
  _id: string;
  galleryId: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface GalleryPostState {
  // Dialog state
  isDialogOpen: boolean;
  activePostId: string | null;
  currentPost: GalleryPost | null;
  loading: boolean;
  
  // Actions
  openDialog: (postId: string) => void;
  closeDialog: () => void;
  setCurrentPost: (post: GalleryPost | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useGalleryPostStore = create<GalleryPostState>((set) => ({
  // Initial state
  isDialogOpen: false,
  activePostId: null,
  currentPost: null,
  loading: false,
  
  // Actions
  openDialog: (postId) => set({ 
    isDialogOpen: true, 
    activePostId: postId,
    loading: true 
  }),
  closeDialog: () => set({ 
    isDialogOpen: false, 
    activePostId: null,
    currentPost: null
  }),
  setCurrentPost: (post) => set({ 
    currentPost: post,
    loading: false
  }),
  setLoading: (loading) => set({ loading })
}));
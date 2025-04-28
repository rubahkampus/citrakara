// src/lib/stores/galleryStore.ts
import { create } from 'zustand';
import { GalleryPost } from './types';

interface GalleryPostState {
  isOpen: boolean;
  activePostId: string | null;
  post: GalleryPost | null;
  loading: boolean;
  
  open: (postId: string) => void;
  close: () => void;
  setPost: (post: GalleryPost | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useGalleryStore = create<GalleryPostState>((set) => ({
  isOpen: false,
  activePostId: null,
  post: null,
  loading: false,
  
  open: (postId) => set({ 
    isOpen: true, 
    activePostId: postId,
    loading: true 
  }),
  close: () => set({ 
    isOpen: false, 
    activePostId: null,
    post: null
  }),
  setPost: (post) => set({ 
    post,
    loading: false
  }),
  setLoading: (loading) => set({ loading })
}));

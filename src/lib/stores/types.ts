// src/lib/stores/types.ts
/**
 * Common interface types used across multiple stores
 */

// Dialog-related types
export type DialogType = 'login' | 'register' | 'editProfile' | 'createCommission' | 'uploadArtwork' | 'accountSettings' | 'tos' | null;

// Gallery and commission data types
export interface GalleryData {
  id: string;
  name: string;
  thumbnails: string[];
  postCount: number;
}

export interface GalleryPost {
  _id: string;
  galleryId: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
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

// Theme mode
export type ThemeMode = 'light' | 'dark';

// Dashboard sidebar state
export type SidebarState = 'expanded' | 'collapsed';

// TOS dialog mode
export type TosDialogMode = 'view' | 'create' | 'edit' | null;

// Profile page view types
export type ProfileView = 'overview' | 'gallery' | 'specificGallery' | 'commission';
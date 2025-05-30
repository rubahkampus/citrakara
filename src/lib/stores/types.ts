// src/lib/stores/types.ts - Consolidated types for all stores
export type DialogType = 
  // Auth dialogs
  | 'login' 
  | 'register' 
  // Profile & content dialogs
  | 'editProfile'
  | 'uploadArtwork'
  // Commission dialogs  
  | 'viewCommission'
  // Gallery dialogs
  | 'viewGalleryPost'
  | 'editGalleryPost'
  // Settings dialogs
  | 'accountSettings'
  // TOS dialogs
  | 'viewTos'
  | 'editTos'
  | 'createTos'
  | null;

// Common entity types
export interface GalleryData {
  _id: string;
  name: string;
  thumbnails: string[];
  postCount: number;
}

export interface GalleryPostData {
  _id: string;
  galleryId: string;
  userId: string;
  images: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface TosData {
  _id: string;
  title: string;
  content: Array<{ subtitle: string; text: string }>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dialog state interfaces
export interface DialogState {
  type: DialogType;
  entityId?: string; // ID of the entity being viewed/edited (commission, post, etc.)
  data?: any; // Optional data to pass to the dialog
  isOwner?: boolean; // Whether the current user owns the entity
}

// Theme and UI types
export type ThemeMode = 'light' | 'dark';
export type SidebarState = 'expanded' | 'collapsed';
export type ProfileView = 'overview' | 'gallery' | 'specificGallery' | 'commission';

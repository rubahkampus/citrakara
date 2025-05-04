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

// export interface CommissionData {
//   _id: string;
//   title: string;
//   description: string;
//   price: {
//     min: number;
//     max: number;
//   };
//   currency: string;
//   samples: string[];
//   thumbnailIdx: string;
//   isActive: boolean;
//   slots: number;
//   slotsUsed: number;
//   tags: string[];
//   type: 'template' | 'custom';
//   flow: 'standard' | 'milestone';
//   deadline: {
//     mode: 'standard' | 'withDeadline' | 'withRush';
//     min: number;
//     max: number;
//     rushFee?: { kind: 'flat' | 'perDay'; amount: number };
//   };
//   basePrice: number;
//   cancelationFee: { kind: 'flat' | 'percentage'; amount: number };
//   latePenaltyPercent?: number;
//   graceDays?: number;
//   allowContractChange?: boolean;
//   changeable?: string[];
//   revisions?: {
//     type: 'none' | 'standard' | 'milestone';
//     policy?: {
//       limit: boolean;
//       free: number;
//       extraAllowed: boolean;
//       fee: number;
//     };
//   };
//   milestones?: Array<{
//     title: string;
//     percent: number;
//     policy?: {
//       limit: boolean;
//       free: number;
//       extraAllowed: boolean;
//       fee: number;
//     };
//   }>;
//   generalOptions?: {
//     optionGroups?: Array<{
//       title: string;
//       selections: { label: string; price: number }[];
//     }>;
//     addons?: { label: string; price: number }[];
//     questions?: string[];
//   };
//   subjectOptions?: Array<{
//     title: string;
//     limit: number;
//     discount?: number;
//     optionGroups?: Array<{
//       title: string;
//       selections: { label: string; price: number }[];
//     }>;
//     addons?: { label: string; price: number }[];
//     questions?: string[];
//   }>;
//   tos: string;
//   createdAt: string;
//   updatedAt: string;
// }

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

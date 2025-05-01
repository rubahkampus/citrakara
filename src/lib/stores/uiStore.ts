// src/lib/stores/uiStore.ts - UI state store (theme, sidebar, etc.)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SidebarState, ThemeMode, ProfileView } from './types';

interface UIStoreState {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  
  // Sidebar
  sidebar: SidebarState;
  toggleSidebar: () => void;
  setSidebar: (state: SidebarState) => void;
  activeSidebarItem: string | null;
  setActiveSidebarItem: (item: string | null) => void;
  
  // Profile view
  profileView: ProfileView;
  setProfileView: (view: ProfileView) => void;
  activeGalleryId: string | null;
  setActiveGalleryId: (id: string | null) => void;
}

export const useUIStore = create<UIStoreState>()(
  persist(
    (set) => ({
      // Theme
      theme: 'light',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setTheme: (mode) => set({ theme: mode }),
      
      // Sidebar
      sidebar: 'expanded',
      toggleSidebar: () => set((state) => ({ 
        sidebar: state.sidebar === 'expanded' ? 'collapsed' : 'expanded' 
      })),
      setSidebar: (state) => set({ sidebar: state }),
      activeSidebarItem: null,
      setActiveSidebarItem: (item) => set({ activeSidebarItem: item }),
      
      // Profile view
      profileView: 'overview',
      setProfileView: (view) => set({ profileView: view }),
      activeGalleryId: null,
      setActiveGalleryId: (id) => set({ 
        activeGalleryId: id,
        profileView: id ? 'specificGallery' : 'overview'
      })
    }),
    {
      name: 'komis-ui-store',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebar: state.sidebar
      })
    }
  )
);
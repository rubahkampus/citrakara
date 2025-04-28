// src/lib/stores/dashboardStore.ts
import { create } from 'zustand';
import { SidebarState } from './types';

interface DashboardState {
  sidebarState: SidebarState;
  toggleSidebar: () => void;
  setSidebarState: (state: SidebarState) => void;
  activeSidebar: string | null;
  setActiveSidebar: (key: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  sidebarState: 'expanded',
  toggleSidebar: () => set((state) => ({
    sidebarState: state.sidebarState === 'expanded' ? 'collapsed' : 'expanded'
  })),
  setSidebarState: (state) => set({ sidebarState: state }),
  activeSidebar: null,
  setActiveSidebar: (key) => set({ activeSidebar: key })
}));


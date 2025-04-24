// src/lib/stores/dashboardStore.ts
import { create } from 'zustand';

type DashboardSidebarState = 'expanded' | 'collapsed';

interface DashboardState {
  sidebarState: DashboardSidebarState;
  toggleSidebar: () => void;
  setSidebarState: (state: DashboardSidebarState) => void;
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
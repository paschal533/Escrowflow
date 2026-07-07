import { create } from 'zustand';

type ViewRole = 'CLIENT' | 'PROVIDER';

interface ViewState {
  viewRole: ViewRole;
  setViewRole: (r: ViewRole) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewRole: (localStorage.getItem('escrowflow_viewrole') as ViewRole) ?? 'CLIENT',
  setViewRole: (r) => {
    localStorage.setItem('escrowflow_viewrole', r);
    set({ viewRole: r });
  },
}));

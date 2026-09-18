import { create } from 'zustand';
import type { ModalType } from '../types/game';

interface UIStore {
  openModal: ModalType;
  selectedSquareId: number | null;
  showLog: boolean;
  mobileTab: 'map' | 'properti' | 'log';

  setModal: (modal: ModalType, squareId?: number) => void;
  closeModal: () => void;
  toggleLog: () => void;
  setMobileTab: (tab: 'map' | 'properti' | 'log') => void;
}

export const useUIStore = create<UIStore>((set) => ({
  openModal: null,
  selectedSquareId: null,
  showLog: true,
  mobileTab: 'map',

  setModal: (modal, squareId) => set({ openModal: modal, selectedSquareId: squareId ?? null }),
  closeModal: () => set({ openModal: null, selectedSquareId: null }),
  toggleLog: () => set(s => ({ showLog: !s.showLog })),
  setMobileTab: (tab) => set({ mobileTab: tab }),
}));

import { create } from 'zustand';
import type { ModalType } from '../types/game';

interface UIStore {
  openModal: ModalType;
  selectedSquareId: number | null;
  showLog: boolean;

  setModal: (modal: ModalType, squareId?: number) => void;
  closeModal: () => void;
  toggleLog: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  openModal: null,
  selectedSquareId: null,
  showLog: true,

  setModal: (modal, squareId) => set({ openModal: modal, selectedSquareId: squareId ?? null }),
  closeModal: () => set({ openModal: null, selectedSquareId: null }),
  toggleLog: () => set(s => ({ showLog: !s.showLog })),
}));

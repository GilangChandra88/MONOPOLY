// ─── Tipe Utama Permainan ────────────────────────────────────────────────────

import type { Card } from './card';

export type TokenColor = 'merah' | 'biru' | 'hijau' | 'kuning' | 'ungu' | 'oranye';
export const TOKEN_COLORS: TokenColor[] = ['merah', 'biru', 'hijau', 'kuning', 'ungu', 'oranye'];

export const TOKEN_EMOJIS: Record<TokenColor, string> = {
  merah: '🚗',
  biru: '🚢',
  hijau: '🎩',
  kuning: '⭐',
  ungu: '💎',
  oranye: '🐕',
};

export const TOKEN_BG: Record<TokenColor, string> = {
  merah: 'bg-red-500',
  biru: 'bg-blue-500',
  hijau: 'bg-green-600',
  kuning: 'bg-yellow-400',
  ungu: 'bg-purple-600',
  oranye: 'bg-orange-500',
};

export interface Player {
  id: string;
  name: string;
  color: TokenColor;
  position: number;       // 0–39
  money: number;
  properties: number[];   // array squareId yang dimiliki
  inJail: boolean;
  jailTurns: number;
  jailCard: boolean;      // punya kartu bebas penjara
  isBankrupt: boolean;
  userId?: string;        // uid dari Firebase Auth
  inviteCode?: string;    // Kode unik untuk join sebagai player ini
}

export type GamePhase =
  | 'idle'         // menunggu lempar dadu
  | 'rolling'      // animasi dadu
  | 'dice-result-1'// fokus dadu 1
  | 'dice-result-2'// fokus dadu 2
  | 'pre-moving'   // kamera pindah ke karakter, jeda sebelum gerak
  | 'moving'       // animasi pion bergerak
  | 'post-moving'  // jeda 1 detik setelah sampai sebelum kamera reset
  | 'landed'       // sudah mendarat, menunggu aksi
  | 'action'       // modal terbuka
  | 'end-turn';    // menunggu klik next turn

export interface TransactionAnim {
  id: string;
  amount: number;
  fromId: string | 'bank';
  toId: string | 'bank';
}

export interface GameState {
  players: Player[];
  lastTransaction?: TransactionAnim | null;
  currentPlayerIndex: number;
  phase: GamePhase;
  isOnline?: boolean;
  activeInviteCodes?: string[];
  turnVersion: number;       // dinaikkan tiap endTurn — kunci anti race condition
  dice: [number, number];
  cameraStates?: Record<string, { pos: [number, number, number], target: [number, number, number] }>;
  history?: any[];          // Riwayat untuk undo
  doublesCount: number;     // berapa kali kembar berturut-turut
  localDicePositions?: { 
    d1: { pos: [number, number, number], quat: [number, number, number, number] }, 
    d2: { pos: [number, number, number], quat: [number, number, number, number] } 
  } | null;
  ownedProperties: Record<number, string>; // squareId → playerId
  houses: Record<number, number>;          // squareId → jumlah rumah (0–4)
  hotels: Record<number, boolean>;         // squareId → punya hotel?
  freeParkingMoney: number;
  log: string[];
  winner: string | null;
  chanceDeck: Card[];
  communityDeck: Card[];
  activeCard: Card | null;
  activeCardType: 'chance' | 'community-chest' | null;
  pendingRent: number | null; // jumlah sewa yang harus dibayar
  pendingRentOwner: string | null; // pemilik properti
  specialRentRule?: 'railroad-double' | 'utility-10x' | null;
  isGoingToJail?: boolean;
  movementSteps: number;
  movementDirection: 1 | -1;
}

// ─── Tipe UI State ────────────────────────────────────────────────────────────

export type ModalType =
  | 'property'
  | 'card'
  | 'bankrupt'
  | 'trade'
  | null;

export interface UIState {
  openModal: ModalType;
  selectedSquareId: number | null;
  showLog: boolean;
  mobileTab: 'map' | 'properti' | 'log';
}

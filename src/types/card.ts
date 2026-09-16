// ─── Tipe Kartu ──────────────────────────────────────────────────────────────

export type CardEffect =
  | { type: 'move-to'; position: number; collectGo?: boolean }
  | { type: 'move-steps'; steps: number }
  | { type: 'move-nearest'; squareType: 'railroad' | 'utility' }
  | { type: 'money'; amount: number } // positif = dapat, negatif = bayar
  | { type: 'money-per-player'; amount: number } // negatif = bayar tiap pemain
  | { type: 'money-per-house-hotel'; house: number; hotel: number }
  | { type: 'jail' } // masuk penjara
  | { type: 'free-jail' }; // kartu bebas penjara

export interface Card {
  id: string;
  text: string;
  effect: CardEffect;
}

export type CardType = 'chance' | 'community-chest';

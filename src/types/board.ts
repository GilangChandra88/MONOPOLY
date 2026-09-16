// ─── Tipe Petak Papan ────────────────────────────────────────────────────────

export type SquareType =
  | 'property'
  | 'railroad'
  | 'utility'
  | 'go'
  | 'jail'
  | 'go-to-jail'
  | 'free-parking'
  | 'chance'
  | 'community-chest'
  | 'income-tax'
  | 'luxury-tax';

export type PropertyColor =
  | 'coklat'
  | 'biru-muda'
  | 'merah-muda'
  | 'oranye'
  | 'merah'
  | 'kuning'
  | 'hijau'
  | 'biru-tua';

// Petak properti berwarna
export interface PropertySquare {
  type: 'property';
  id: number;
  name: string;
  color: PropertyColor;
  price: number;
  rent: [number, number, number, number, number, number]; // [tanah kosong, 1 rumah, 2, 3, 4, hotel]
  houseCost: number;
  hotelCost: number;
  mortgage: number;
  colorGroupSize: number; // jumlah properti dalam grup warna yang sama
  image?: string;
}

// Petak stasiun kereta
export interface RailroadSquare {
  type: 'railroad';
  id: number;
  name: string;
  price: number;
  mortgage: number;
  image?: string;
  // Sewa: 1 stasiun=25k, 2=50k, 3=100k, 4=200k
}

// Petak utilitas (PLN, PAM)
export interface UtilitySquare {
  type: 'utility';
  id: number;
  name: string;
  price: number;
  mortgage: number;
  image?: string;
  // Sewa: 1 utilitas = 4x dadu, 2 utilitas = 10x dadu
}

// Petak khusus non-properti
export interface SpecialSquare {
  type: 'go' | 'jail' | 'go-to-jail' | 'free-parking' | 'chance' | 'community-chest' | 'income-tax' | 'luxury-tax';
  id: number;
  name: string;
  image?: string;
}

export type BoardSquare = PropertySquare | RailroadSquare | UtilitySquare | SpecialSquare;

// Helper type guards
export function isProperty(sq: BoardSquare): sq is PropertySquare {
  return sq.type === 'property';
}
export function isRailroad(sq: BoardSquare): sq is RailroadSquare {
  return sq.type === 'railroad';
}
export function isUtility(sq: BoardSquare): sq is UtilitySquare {
  return sq.type === 'utility';
}
export function isPurchasable(sq: BoardSquare): sq is PropertySquare | RailroadSquare | UtilitySquare {
  return sq.type === 'property' || sq.type === 'railroad' || sq.type === 'utility';
}

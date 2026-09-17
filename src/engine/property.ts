// ─── Game Engine: Properti ────────────────────────────────────────────────────

import { getSquare, RAILROAD_RENT } from '../data/board';
import type { GameState } from '../types/game';
import { isProperty, isRailroad, isUtility, isPurchasable } from '../types/board';

/**
 * Hitung sewa yang harus dibayar di petak tertentu.
 * Mengembalikan 0 jika properti dimiliki sendiri, tidak dimiliki, atau dijaminkan.
 */
export function calculateRent(
  squareId: number,
  state: GameState,
  diceTotal: number
): number {
  const owner = state.ownedProperties[squareId];
  if (!owner) return 0;

  const square = getSquare(squareId);

  if (isProperty(square)) {
    const housesOnSquare = state.houses[squareId] ?? 0;
    const hasHotel = state.hotels[squareId] ?? false;

    // Cek apakah pemilik memiliki seluruh grup warna
    const ownsColorGroup = ownsFullColorGroup(owner, square.color, state);

    if (hasHotel) {
      return square.rent[5]; // indeks 5 = hotel
    } else if (housesOnSquare > 0) {
      return square.rent[housesOnSquare]; // indeks 1-4
    } else if (ownsColorGroup) {
      return square.rent[0] * 2; // tanah kosong, monopoli = 2x sewa dasar
    } else {
      return square.rent[0]; // sewa dasar
    }
  }

  if (isRailroad(square)) {
    const ownerPlayer = state.players.find(p => p.id === owner);
    if (!ownerPlayer) return 0;
    const ownedRailroads = ownerPlayer.properties.filter(
      id => getSquare(id).type === 'railroad'
    ).length;
    return RAILROAD_RENT[ownedRailroads] ?? 0;
  }

  if (isUtility(square)) {
    const ownerPlayer = state.players.find(p => p.id === owner);
    if (!ownerPlayer) return 0;
    const ownedUtilities = ownerPlayer.properties.filter(
      id => getSquare(id).type === 'utility'
    ).length;
    const multiplier = ownedUtilities >= 2 ? 10 : 4;
    return diceTotal * multiplier * 100_000; // skala dengan nilai permainan Indonesia
  }

  return 0;
}

/**
 * Cek apakah pemain memiliki seluruh grup warna tertentu.
 */
export function ownsFullColorGroup(
  playerId: string,
  color: string,
  state: GameState
): boolean {
  const allInGroup = Object.entries(state.ownedProperties)
    .filter(([sqId]) => {
      const sq = getSquare(Number(sqId));
      return isProperty(sq) && sq.color === color;
    })
    .map(([, ownerId]) => ownerId);

  // Cek ukuran grup dari square mana saja dalam grup ini
  const sampleSqId = Object.keys(state.ownedProperties).find(sqId => {
    const sq = getSquare(Number(sqId));
    return isProperty(sq) && sq.color === color;
  });

  if (!sampleSqId) return false;
  const sampleSq = getSquare(Number(sampleSqId));
  if (!isProperty(sampleSq)) return false;

  return (
    allInGroup.length === sampleSq.colorGroupSize &&
    allInGroup.every(ownerId => ownerId === playerId)
  );
}

/**
 * Hitung harga beli properti.
 */
export function getPurchasePrice(squareId: number): number {
  const square = getSquare(squareId);
  if (!isPurchasable(square)) return 0;
  return square.price;
}


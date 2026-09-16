// ─── Game Engine: Pergerakan ──────────────────────────────────────────────────

import { GO_MONEY, BOARD_SQUARES } from '../data/board';
import type { Player } from '../types/game';

export const BOARD_SIZE = 40;

/**
 * Hitung posisi baru setelah bergerak sejumlah langkah.
 * Mengembalikan posisi baru dan apakah melewati GO.
 */
export function calculateNewPosition(
  currentPosition: number,
  steps: number
): { newPosition: number; passedGo: boolean } {
  let newPosition = (currentPosition + steps) % BOARD_SIZE;
  if (newPosition < 0) newPosition += BOARD_SIZE;

  const passedGo =
    steps > 0 &&
    newPosition <= currentPosition &&
    currentPosition !== 0;

  return { newPosition, passedGo };
}

/**
 * Bergerak langsung ke posisi tertentu (misalnya dari kartu).
 * Mengembalikan apakah melewati GO.
 */
export function moveToPosition(
  currentPosition: number,
  targetPosition: number
): { passedGo: boolean } {
  const passedGo = targetPosition < currentPosition && currentPosition !== targetPosition;
  return { passedGo };
}

/**
 * Temukan stasiun kereta terdekat dari posisi saat ini.
 */
export function findNearestRailroad(position: number): number {
  const railroads = BOARD_SQUARES
    .filter(sq => sq.type === 'railroad')
    .map(sq => sq.id);

  for (let i = 1; i <= BOARD_SIZE; i++) {
    const pos = (position + i) % BOARD_SIZE;
    if (railroads.includes(pos)) return pos;
  }
  return railroads[0];
}

/**
 * Temukan utilitas terdekat dari posisi saat ini.
 */
export function findNearestUtility(position: number): number {
  const utilities = BOARD_SQUARES
    .filter(sq => sq.type === 'utility')
    .map(sq => sq.id);

  for (let i = 1; i <= BOARD_SIZE; i++) {
    const pos = (position + i) % BOARD_SIZE;
    if (utilities.includes(pos)) return pos;
  }
  return utilities[0];
}

/**
 * Terapkan bonus melewati GO pada pemain.
 */
export function applyGoBonus(player: Player): Player {
  return { ...player, money: player.money + GO_MONEY };
}

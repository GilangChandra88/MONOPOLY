// ─── Game Engine: Penjara ─────────────────────────────────────────────────────

import type { Player } from '../types/game';

export const JAIL_POSITION = 10;
export const JAIL_FINE = 500_000; // Rp 500.000 untuk keluar penjara
export const MAX_JAIL_TURNS = 3;

/**
 * Kirim pemain ke penjara.
 */
export function sendToJail(player: Player): Player {
  return {
    ...player,
    position: JAIL_POSITION,
    inJail: true,
    jailTurns: 0,
  };
}

/**
 * Cek apakah pemain bisa keluar penjara (punya kartu atau bayar).
 */
export function canPayJailFine(player: Player): boolean {
  return player.money >= JAIL_FINE;
}

/**
 * Bayar denda untuk keluar penjara.
 */
export function payJailFine(player: Player): Player {
  return {
    ...player,
    money: player.money - JAIL_FINE,
    inJail: false,
    jailTurns: 0,
  };
}

/**
 * Keluar penjara menggunakan kartu bebas.
 */
export function useJailCard(player: Player): Player {
  return {
    ...player,
    inJail: false,
    jailTurns: 0,
    jailCard: false,
  };
}

/**
 * Gagal keluar penjara (tidak dapet kembar) — tambah hitungan giliran.
 * Jika sudah 3 giliran, wajib bayar denda.
 */
export function failJailAttempt(player: Player): { player: Player; forcedPay: boolean } {
  const newTurns = player.jailTurns + 1;
  if (newTurns >= MAX_JAIL_TURNS) {
    // Giliran ke-3: wajib keluar dengan bayar
    return {
      player: { ...player, jailTurns: newTurns },
      forcedPay: true,
    };
  }
  return {
    player: { ...player, jailTurns: newTurns },
    forcedPay: false,
  };
}

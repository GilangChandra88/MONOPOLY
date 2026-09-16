// ─── Game Engine: Kebangkrutan ────────────────────────────────────────────────

import type { GameState, Player } from '../types/game';
import { getSquare } from '../data/board';
import { isProperty } from '../types/board';

/**
 * Proses kebangkrutan: transfer semua aset ke kreditur atau bank.
 */
export function processBankruptcy(
  bankruptPlayerId: string,
  creditorId: string | null,
  state: GameState
): GameState {
  const players = [...state.players];
  const bankruptIdx = players.findIndex(p => p.id === bankruptPlayerId);
  if (bankruptIdx === -1) return state;

  const bankruptPlayer = { ...players[bankruptIdx] };
  let ownedProperties = { ...state.ownedProperties };
  const creditorIdx = creditorId ? players.findIndex(p => p.id === creditorId) : -1;

  // Transfer properti
  if (creditorId && creditorIdx !== -1) {
    // Transfer ke pemain kreditur
    const creditor = { ...players[creditorIdx] };
    for (const sqId of bankruptPlayer.properties) {
      ownedProperties[sqId] = creditorId;
      creditor.properties = [...creditor.properties, sqId];
    }
    // Transfer sisa uang
    creditor.money += Math.max(0, bankruptPlayer.money);
    players[creditorIdx] = creditor;
  } else {
    // Kembalikan ke bank
    for (const sqId of bankruptPlayer.properties) {
      delete ownedProperties[sqId];
    }
  }

  // Hapus rumah/hotel dari properti yang bangkrut
  const houses = { ...state.houses };
  const hotels = { ...state.hotels };
  for (const sqId of bankruptPlayer.properties) {
    delete houses[sqId];
    delete hotels[sqId];
  }

  // Tandai bangkrut
  players[bankruptIdx] = {
    ...bankruptPlayer,
    isBankrupt: true,
    money: 0,
    properties: [],
  };

  // Cek pemenang
  const activePlayers = players.filter(p => !p.isBankrupt);
  const winner = activePlayers.length === 1 ? activePlayers[0].id : null;

  return {
    ...state,
    players,
    ownedProperties,
    houses,
    hotels,
    winner,
    log: [
      ...state.log,
      `💸 ${bankruptPlayer.name} BANGKRUT! ${creditorId
        ? `Semua aset diserahkan ke ${players.find(p => p.id === creditorId)?.name}`
        : 'Semua aset kembali ke bank'
      }.`,
    ],
  };
}

/**
 * Temukan pemenang jika sudah ada.
 */
export function checkWinner(state: GameState): string | null {
  const activePlayers = state.players.filter(p => !p.isBankrupt);
  return activePlayers.length === 1 ? activePlayers[0].id : null;
}

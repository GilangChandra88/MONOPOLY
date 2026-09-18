// --- Sync Utilities ---------------------------------------------------------
// Upload turn state ke Firebase Realtime Database (RTDB).
// RTDB pakai WebSocket persistent -- jauh lebih cepat dari Firestore.

import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import type { GameState } from '../types/game';

/**
 * Hapus semua nilai undefined dari object secara rekursif.
 * RTDB menolak undefined -- harus diganti null atau dihapus.
 */
function stripUndefined(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj !== null && typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out;
  }
  return obj;
}

/**
 * Bangun payload yang akan dikirim ke RTDB.
 * Field ephemeral (history, localDicePositions, movementSteps) TIDAK disertakan.
 */
function buildTurnPayload(state: GameState, uid: string) {
  return {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    dice: state.dice,
    doublesCount: state.doublesCount,
    ownedProperties: state.ownedProperties ?? {},
    houses: state.houses ?? {},
    hotels: state.hotels ?? {},
    freeParkingMoney: state.freeParkingMoney,
    log: state.log.slice(-50),
    winner: state.winner ?? null,
    pendingRent: state.pendingRent ?? null,
    pendingRentOwner: state.pendingRentOwner ?? null,
    activeCard: state.activeCard ?? null,
    activeCardType: state.activeCardType ?? null,
    chanceDeck: state.chanceDeck ?? [],
    communityDeck: state.communityDeck ?? [],
    isOnline: state.isOnline ?? false,
    activeInviteCodes: state.activeInviteCodes ?? [],
    turnVersion: state.turnVersion ?? 0,
    physicsRollTrigger: (state as any).physicsRollTrigger ?? 0,
    sessionName: (state as any).sessionName ?? null,

    // Metadata untuk echo prevention
    lastWriter: uid,
    updatedAt: Date.now(),
  };
}

/**
 * Upload state permainan saat ini ke RTDB.
 * Harus dipanggil SETELAH set() di store agar data yang diupload adalah yang terbaru.
 */
export async function uploadTurnState(
  state: GameState,
  sessionId: string | null,
  uid: string | null | undefined
): Promise<void> {
  if (!sessionId || !uid || !state.isOnline) return;

  // stripUndefined wajib -- RTDB akan error jika ada nilai undefined
  const payload = stripUndefined(buildTurnPayload(state, uid));
  try {
    await set(ref(rtdb, `games/${sessionId}`), payload);
  } catch (err) {
    console.error('[syncUtils] Gagal upload turn state ke RTDB:', err);
  }
}

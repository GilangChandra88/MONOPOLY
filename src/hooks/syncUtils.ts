// --- Sync Utilities ---------------------------------------------------------
// Upload turn state ke Firebase Realtime Database (RTDB).
// RTDB pakai WebSocket persistent -- jauh lebih cepat dari Firestore.
// Dipanggil EKSPLISIT dari action-action kunci (bukan reaktif useEffect).

import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
import type { GameState } from '../types/game';

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
 *
 * @param state     - snapshot GameState terbaru (panggil get() sebelum memanggil ini)
 * @param sessionId - ID sesi game
 * @param uid       - Firebase Auth UID pemain yang sedang aktif
 */
export async function uploadTurnState(
  state: GameState,
  sessionId: string | null,
  uid: string | null | undefined
): Promise<void> {
  if (!sessionId || !uid || !state.isOnline) return;

  const payload = buildTurnPayload(state, uid);
  try {
    // RTDB set() -- menggantikan setDoc Firestore, WebSocket langsung broadcast ke semua listener
    await set(ref(rtdb, `games/${sessionId}`), payload);
  } catch (err) {
    console.error('[syncUtils] Gagal upload turn state ke RTDB:', err);
  }
}

// ─── Sync Utilities ────────────────────────────────────────────────────────────
// Fungsi mandiri untuk upload turn state ke Firestore.
// Dipanggil EKSPLISIT dari action-action kunci (bukan reaktif useEffect).

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { GameState } from '../types/game';

/**
 * Field yang DISINKRONISASI ke database (state permanen permainan).
 * Field ephemeral seperti localDicePositions, history, movementSteps TIDAK disertakan.
 */
function buildTurnPayload(state: GameState, uid: string) {
  return {
    players: state.players,
    currentPlayerIndex: state.currentPlayerIndex,
    phase: state.phase,
    dice: state.dice,
    doublesCount: state.doublesCount,
    ownedProperties: state.ownedProperties,
    houses: state.houses,
    hotels: state.hotels,
    freeParkingMoney: state.freeParkingMoney,
    log: state.log.slice(-50),
    winner: state.winner,
    pendingRent: state.pendingRent,
    pendingRentOwner: state.pendingRentOwner,
    activeCard: state.activeCard,
    activeCardType: state.activeCardType,
    chanceDeck: state.chanceDeck || [],
    communityDeck: state.communityDeck || [],
    isOnline: state.isOnline,
    activeInviteCodes: state.activeInviteCodes,
    physicsRollTrigger: (state as any).physicsRollTrigger,
    turnVersion: state.turnVersion,

    // Metadata sesi
    lastWriter: uid,
    updatedAt: serverTimestamp(),
  };
}

/**
 * Upload state permainan saat ini ke Firestore.
 * Harus dipanggil SETELAH set() di store agar data yang diupload adalah yang terbaru.
 *
 * @param state     - snapshot GameState terbaru (panggil get() sebelum memanggil ini)
 * @param sessionId - ID sesi Firestore
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
    await setDoc(doc(db, 'games', sessionId), payload, { merge: true });
  } catch (err) {
    console.error('[syncUtils] Gagal upload turn state:', err);
  }
}

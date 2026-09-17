// ─── useSyncGameState ─────────────────────────────────────────────────────────
// Hook untuk sinkronisasi state game dengan Firestore.
//
// ARSITEKTUR BARU:
//  - Upload hanya dilakukan EKSPLISIT via uploadTurnState() dari action-action kunci.
//  - Tidak ada lagi reactive useEffect yang memantau 14 dependencies.
//  - onSnapshot hanya merge field PERMANEN (turn state), bukan seluruh state lokal.
//  - turnVersion digunakan untuk mencegah echo dari diri sendiri & race condition.

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import type { User } from 'firebase/auth';

// Field TURN STATE yang disinkronisasi antar pemain.
// Field ephemeral (localDicePositions, history, movementSteps, cameraStates) TIDAK disini.
const TURN_STATE_FIELDS = [
  'players', 'currentPlayerIndex', 'phase', 'dice', 'doublesCount',
  'ownedProperties', 'houses', 'hotels', 'freeParkingMoney', 'log',
  'winner', 'pendingRent', 'pendingRentOwner', 'activeCard', 'activeCardType',
  'chanceDeck', 'communityDeck', 'isOnline', 'activeInviteCodes',
  'physicsRollTrigger', 'turnVersion', 'sessionName',
] as const;

export function useSyncGameState(user: User | null, sessionId: string | null) {
  const [isLoaded, setIsLoaded] = useState(false);
  const isHydrating = useRef(true);

  // Muat data awal & pantau perubahan dari pemain lain via onSnapshot
  useEffect(() => {
    if (!user || !sessionId) {
      setIsLoaded(false);
      isHydrating.current = true;
      return;
    }

    isHydrating.current = true;
    setIsLoaded(false);

    const gameDocRef = doc(db, 'games', sessionId);

    const unsubscribe = onSnapshot(gameDocRef, (docSnap) => {
      if (!docSnap.exists()) {
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      const data = docSnap.data();
      if (!data || !data.players || data.players.length === 0) {
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      // ── Hydration awal: restore semua state dari DB ──────────────────────
      if (isHydrating.current) {
        const { creatorId, updatedAt, createdAt, historyStr, history, lastWriter, ...restState } = data;

        let parsedHistory: any[] = [];
        if (historyStr) {
          try { parsedHistory = JSON.parse(historyStr); } catch (_) {}
        } else if (history) {
          parsedHistory = history;
        }

        useGameStore.setState({ ...restState, history: parsedHistory } as any);
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      // ── Update real-time dari pemain LAIN ────────────────────────────────
      // Abaikan echo dari diri sendiri
      if (data.lastWriter && data.lastWriter === user.uid) return;

      // Ambil hanya TURN STATE — jangan override state lokal (history, dice position, dll)
      const patch: Record<string, any> = {};
      for (const field of TURN_STATE_FIELDS) {
        if (data[field] !== undefined) {
          patch[field] = data[field];
        }
      }

      // Juga restore history jika ada
      if (data.historyStr) {
        try { patch.history = JSON.parse(data.historyStr); } catch (_) {}
      }

      if (Object.keys(patch).length > 0) {
        useGameStore.setState(patch as any);
      }

    }, (error) => {
      console.error('[useSyncGameState] Gagal memuat data sesi:', error);
      setIsLoaded(true);
      isHydrating.current = false;
    });

    return () => unsubscribe();
  }, [user, sessionId]);

  return { isLoaded };
}

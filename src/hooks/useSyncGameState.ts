// --- useSyncGameState -------------------------------------------------------
// Hook sinkronisasi state game dengan Firebase Realtime Database (RTDB).
//
// ARSITEKTUR RTDB:
//  - onValue() pakai WebSocket persistent -- fire langsung saat data berubah.
//  - Upload dilakukan EKSPLISIT via uploadTurnState() dari action-action kunci.
//  - Hydration awal: restore full state dari RTDB saat join game.
//  - Update real-time: merge hanya TURN_STATE_FIELDS, skip echo dari diri sendiri.

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { rtdb } from '../firebase';
import { ref, onValue, off } from 'firebase/database';
import type { User } from 'firebase/auth';

// Field TURN STATE yang disinkronisasi antar pemain.
// Field ephemeral (localDicePositions, history, movementSteps, cameraStates) TIDAK di sini.
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

  useEffect(() => {
    if (!user || !sessionId) {
      setIsLoaded(false);
      isHydrating.current = true;
      return;
    }

    isHydrating.current = true;
    setIsLoaded(false);

    const gameRef = ref(rtdb, `games/${sessionId}`);

    // onValue() - WebSocket persistent, langsung push saat data berubah
    const handleSnapshot = (snapshot: any) => {
      if (!snapshot.exists()) {
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      const data = snapshot.val();
      if (!data || !data.players || data.players.length === 0) {
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      // -- Hydration awal: restore semua state dari RTDB ------------------
      if (isHydrating.current) {
        const { creatorId, updatedAt, lastWriter, ...restState } = data;
        useGameStore.setState({ ...restState } as any);
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      // -- Update real-time dari pemain LAIN --------------------------------
      // Abaikan echo dari diri sendiri
      if (data.lastWriter && data.lastWriter === user.uid) return;

      // Ambil hanya TURN STATE -- jangan override state lokal
      const patch: Record<string, any> = {};
      for (const field of TURN_STATE_FIELDS) {
        if (data[field] !== undefined) {
          patch[field] = data[field];
        }
      }

      if (Object.keys(patch).length > 0) {
        useGameStore.setState(patch as any);
      }
    };

    const handleError = (error: Error) => {
      console.error('[useSyncGameState] Gagal memuat data sesi dari RTDB:', error);
      setIsLoaded(true);
      isHydrating.current = false;
    };

    onValue(gameRef, handleSnapshot, handleError);

    return () => {
      off(gameRef, 'value', handleSnapshot);
    };
  }, [user, sessionId]);

  return { isLoaded };
}

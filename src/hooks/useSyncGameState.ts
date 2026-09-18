// --- useSyncGameState -------------------------------------------------------
// Hook sinkronisasi state game dengan Firebase Realtime Database (RTDB).
//
// PENTING: RTDB menyimpan array sebagai object dengan numeric keys.
// Misal: players: [{...}, {...}] disimpan sebagai {"0": {...}, "1": {...}}
// Fungsi normalizeRtdbData() mengkonversi balik ke array yang dibutuhkan store.

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { rtdb } from '../firebase';
import { ref, onValue, off } from 'firebase/database';
import type { User } from 'firebase/auth';

// Field TURN STATE yang disinkronisasi antar pemain.
const TURN_STATE_FIELDS = [
  'players', 'currentPlayerIndex', 'phase', 'dice', 'doublesCount',
  'ownedProperties', 'houses', 'hotels', 'freeParkingMoney', 'log',
  'winner', 'pendingRent', 'pendingRentOwner', 'activeCard', 'activeCardType',
  'chanceDeck', 'communityDeck', 'isOnline', 'activeInviteCodes',
  'physicsRollTrigger', 'turnVersion', 'sessionName',
  'movementSteps', 'movementDirection', 'localDicePositions'
] as const;

// Field yang harus berupa ARRAY (RTDB mengembalikan object dengan numeric keys)
const ARRAY_FIELDS = ['players', 'log', 'chanceDeck', 'communityDeck', 'activeInviteCodes', 'dice'];

/**
 * RTDB menyimpan array sebagai {"0": val, "1": val, ...}.
 * Fungsi ini konversi balik ke array JS yang benar.
 * Field ownedProperties, houses, hotels DIBIARKAN sebagai object (memang object).
 */
function toArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  // RTDB object dengan numeric keys -> array
  return Object.keys(val)
    .sort((a, b) => Number(a) - Number(b))
    .map(k => val[k]);
}

/**
 * Normalisasi data yang datang dari RTDB:
 * - Array fields dikonversi dari object ke array
 * - ownedProperties keys dikonversi ke number (RTDB menyimpan keys sebagai string)
 */
function normalizeRtdbData(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...data };

  // Konversi array fields
  for (const field of ARRAY_FIELDS) {
    if (out[field] !== undefined) {
      out[field] = toArray(out[field]);
    }
  }

  // Konversi setiap player di dalam players array
  if (Array.isArray(out.players)) {
    out.players = out.players.map((p: any) => {
      if (!p) return p;
      // properties dalam player juga bisa jadi object -> array
      return {
        ...p,
        properties: toArray(p.properties),
      };
    });
  }

  // ownedProperties: keys dari RTDB adalah string, store butuh number
  if (out.ownedProperties && typeof out.ownedProperties === 'object' && !Array.isArray(out.ownedProperties)) {
    const normalized: Record<number, string> = {};
    for (const [k, v] of Object.entries(out.ownedProperties)) {
      normalized[Number(k)] = v as string;
    }
    out.ownedProperties = normalized;
  }

  // houses: keys dari RTDB adalah string, store butuh number
  if (out.houses && typeof out.houses === 'object' && !Array.isArray(out.houses)) {
    const normalized: Record<number, number> = {};
    for (const [k, v] of Object.entries(out.houses)) {
      normalized[Number(k)] = v as number;
    }
    out.houses = normalized;
  }

  // hotels: keys dari RTDB adalah string, store butuh number
  if (out.hotels && typeof out.hotels === 'object' && !Array.isArray(out.hotels)) {
    const normalized: Record<number, boolean> = {};
    for (const [k, v] of Object.entries(out.hotels)) {
      normalized[Number(k)] = v as boolean;
    }
    out.hotels = normalized;
  }

  return out;
}

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

    const handleSnapshot = (snapshot: any) => {
      if (!snapshot.exists()) {
        setIsLoaded(true);
        isHydrating.current = false;
        return;
      }

      // Normalisasi dulu sebelum dipakai -- konversi RTDB object ke array
      const raw = snapshot.val();
      const data = normalizeRtdbData(raw);

      // Validasi: harus ada players dan minimal 1 pemain
      if (!data.players || !Array.isArray(data.players) || data.players.length === 0) {
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
      if (raw.lastWriter && raw.lastWriter === user.uid) return;

      // Ambil hanya TURN STATE -- jangan override state lokal
      const patch: Record<string, any> = {};
      for (const field of TURN_STATE_FIELDS) {
        if (data[field] !== undefined) {
          patch[field] = data[field];
        } else {
          // Jika field tidak ada di RTDB (karena di-delete akibat bernilai null/empty),
          // kita harus menghapusnya juga di lokal agar tidak terjadi stale state.
          if (ARRAY_FIELDS.includes(field as any)) {
            patch[field] = [];
          } else if (field === 'ownedProperties' || field === 'houses' || field === 'hotels') {
            patch[field] = {};
          } else if (field === 'movementSteps' || field === 'doublesCount') {
            patch[field] = 0;
          } else if (field === 'movementDirection') {
            patch[field] = 1;
          } else {
            patch[field] = null;
          }
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

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';

export function useSyncGameState(user: User | null, sessionId: string | null) {
  const gameState = useGameStore();
  const [isLoaded, setIsLoaded] = useState(false);
  const isHydrating = useRef(true);
  const prevActiveId = useRef<string | null>(null);

  // 1. Muat data awal saat sessionId diberikan
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
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.players && data.players.length > 0) {
          const { creatorId, sessionName, updatedAt, createdAt, historyStr, history, ...restState } = data;
          
          let parsedHistory = [];
          if (historyStr) {
            try { parsedHistory = JSON.parse(historyStr); } catch (e) {}
          } else if (history) {
            parsedHistory = history; // fallback jika sebelumnya ada array
          }

          if (isHydrating.current) {
            // Restore data saat awal load
            useGameStore.setState({ ...restState, history: parsedHistory } as any);
          } else {
            // Terapkan perubahan dari pemain lain secara real-time!
            if (data.lastWriter && data.lastWriter !== user.uid) {
              useGameStore.setState({ ...restState, history: parsedHistory } as any);
            }
          }
        }
      }
      setIsLoaded(true);
      isHydrating.current = false;
    }, (error) => {
      console.error("Gagal memuat data sesi:", error);
      setIsLoaded(true);
      isHydrating.current = false;
    });

    return () => unsubscribe();
  }, [user, sessionId]);

  // Ref untuk menyimpan state terbaru agar bisa disave instan saat unmount/keluar
  const latestStateRef = useRef<any>(null);

  // 2. Simpan setiap ada perubahan state (Debounced)
  useEffect(() => {
    if (!user || !sessionId || !isLoaded || isHydrating.current) return;

    // HANYA simpan ke Firebase jika giliran kita, ATAU jika kita baru saja mengakhiri giliran
    const currentActiveId = gameState.players[gameState.currentPlayerIndex]?.userId;
    const isMe = !gameState.isOnline || currentActiveId === user.uid || prevActiveId.current === user.uid;
    
    prevActiveId.current = currentActiveId || null;

    if (!isMe) return;

    const stateToSave = {
      players: gameState.players,
      currentPlayerIndex: gameState.currentPlayerIndex,
      phase: gameState.phase,
      dice: gameState.dice,
      diceResultPositions: gameState.diceResultPositions || null,
      diceResultRotations: gameState.diceResultRotations || null,
      cameraStates: gameState.cameraStates || {},
      doublesCount: gameState.doublesCount,
      ownedProperties: gameState.ownedProperties,
      houses: gameState.houses,
      hotels: gameState.hotels,
      freeParkingMoney: gameState.freeParkingMoney,
      log: gameState.log.slice(-50), // simpan 50 log terakhir
      winner: gameState.winner,
      pendingRent: gameState.pendingRent,
      pendingRentOwner: gameState.pendingRentOwner,
      activeCard: gameState.activeCard,
      activeCardType: gameState.activeCardType,
      chanceDeck: gameState.chanceDeck || [],
      communityDeck: gameState.communityDeck || [],
      historyStr: JSON.stringify(gameState.history || []),
      isOnline: gameState.isOnline,
      activeInviteCodes: gameState.activeInviteCodes,
      physicsRollTrigger: gameState.physicsRollTrigger,
      
      // Metadata Sesi
      creatorId: user.uid,
      lastWriter: user.uid,
      participantIds: gameState.players.map(p => p.userId).filter(Boolean),
      sessionName: gameState.sessionName || `Sesi Game`,
      updatedAt: serverTimestamp(),
    };

    latestStateRef.current = stateToSave;

    const timeoutId = setTimeout(() => {
      setDoc(doc(db, 'games', sessionId), stateToSave, { merge: true }).catch(console.error);
      latestStateRef.current = null; // sudah disave
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      // Jika komponen unmount atau dependencies berubah sebelum 500ms (misal user klik "Ke Lobby"),
      // kita harus segera simpan (flush) agar progress terakhir tidak hilang!
      if (latestStateRef.current) {
        setDoc(doc(db, 'games', sessionId), latestStateRef.current, { merge: true }).catch(console.error);
        latestStateRef.current = null;
      }
    };
  }, [
    user, sessionId, isLoaded, 
    gameState.players, gameState.currentPlayerIndex, gameState.phase, 
    gameState.dice, gameState.diceResultPositions, gameState.diceResultRotations, gameState.cameraStates, gameState.ownedProperties, gameState.houses, gameState.hotels,
    gameState.freeParkingMoney, gameState.winner, gameState.pendingRent,
    gameState.activeCard, gameState.sessionName, gameState.history, gameState.chanceDeck, gameState.communityDeck
  ]);

  return { isLoaded };
}

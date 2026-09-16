import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from './store/useGameStore';
import GameScene from './components/board3d/GameScene';
import StartScreen from './components/screens/StartScreen';
import SessionListScreen from './components/screens/SessionListScreen';
import EndScreen from './components/screens/EndScreen';
import LoginScreen from './components/screens/LoginScreen';
import PropertyModal from './components/modals/PropertyModal';
import CardRevealModal from './components/modals/CardRevealModal';
import DiceController from './components/board/DiceController';
import PlayerEdgePanel from './components/panels/PlayerEdgePanel';
import MoneyAnimationOverlay from './components/board/MoneyAnimationOverlay';
import OnlineRightSidebar from './components/panels/OnlineRightSidebar';
import OnlineBottomBar from './components/panels/OnlineBottomBar';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { useSyncGameState } from './hooks/useSyncGameState';

function PropertyModalManager() {
  const [propertyModalId, setPropertyModalId] = useState<number | null>(null);

  useEffect(() => {
    const handleSquareClick = (e: CustomEvent<number>) => {
      setPropertyModalId(e.detail);
    };
    window.addEventListener('square-click', handleSquareClick as EventListener);
    return () => window.removeEventListener('square-click', handleSquareClick as EventListener);
  }, []);

  if (propertyModalId === null) return null;

  return (
    <PropertyModal
      squareId={propertyModalId}
      onClose={() => setPropertyModalId(null)}
    />
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const { players, currentPlayerIndex, winner, sessionId, setSessionInfo, leaveGame, phase, recoverStuckSession, history, undo, isOnline } = useGameStore();

  // Watchdog: Jika fase animasi (rolling, moving, landed) tersangkut lebih dari 15 detik, paksa pulihkan
  useEffect(() => {
    if (phase === 'rolling' || phase === 'moving' || phase === 'landed') {
      const timer = setTimeout(() => {
        console.warn("Watchdog terpicu! Mengembalikan sesi dari macet.");
        recoverStuckSession();
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [phase, recoverStuckSession]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const { isLoaded } = useSyncGameState(user, sessionId);

  if (authLoading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Memuat...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  if (!sessionId) {
    if (isCreatingNew) {
      return (
        <div className="relative min-h-screen bg-slate-900">
           <StartScreen onCancel={() => setIsCreatingNew(false)} />
        </div>
      );
    }
    return (
      <SessionListScreen 
        user={user} 
        onSelectSession={setSessionInfo} 
        onCreateNew={() => setIsCreatingNew(true)} 
        onLogout={() => signOut(auth)} 
      />
    );
  }

  if (!isLoaded || players.length === 0) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-4">
        <div className="animate-spin text-4xl">🎲</div>
        <div>Memuat Sesi Permainan...</div>
        <button onClick={leaveGame} className="text-red-400 text-sm mt-4 hover:underline">Batal</button>
      </div>
    );
  }

  if (winner) {
    return (
      <div className="relative min-h-screen">
        <button 
          onClick={leaveGame} 
          className="absolute top-4 right-4 z-50 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
        >
          Kembali ke Lobby
        </button>
        <EndScreen />
      </div>
    );
  }

  // Rotasi layar ("Lazy Susan") untuk Tabletop Experience
  const rotationAngle = players.length > 0 ? (currentPlayerIndex * (360 / players.length)) : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden text-sm">
      
      {/* Header Kecil: Status Login (Fixed screen space, tidak berputar) */}
      <div className="absolute top-0 left-0 right-0 z-[60] bg-black/60 backdrop-blur-md p-2 flex justify-between items-center px-4 shadow-lg pointer-events-auto">
        <div className="text-white/80 text-xs font-semibold flex items-center gap-2">
          <span>🎮 Sesi: {useGameStore.getState().sessionName || 'Permainan'}</span>
          <span className="opacity-50">|</span>
          <span>{user.isAnonymous ? 'Tamu' : user.displayName || user.email}</span>
        </div>
        <div className="flex items-center gap-2">
          {history && history.length > 0 && (
            <button 
              onClick={() => undo()}
              className="text-blue-400 hover:text-blue-300 text-[10px] font-bold px-2 py-1 rounded bg-black/40 hover:bg-black/60 transition-colors border border-blue-500/30"
              title="Batalkan (Undo) langkah terakhir"
            >
              ↩ Undo
            </button>
          )}
          <button 
            onClick={recoverStuckSession}
            className="text-yellow-400 hover:text-yellow-300 text-[10px] font-bold px-2 py-1 rounded bg-black/40 hover:bg-black/60 transition-colors border border-yellow-500/30"
            title="Klik jika permainan macet atau tombol hilang"
          >
            🔧 Perbaiki Macet
          </button>
          <button 
            onClick={leaveGame}
            className="text-white hover:text-red-300 text-xs font-bold px-3 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <span>⬅</span> Ke Lobby
          </button>
        </div>
      </div>

      {/* TABLETOP CONTAINER */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        {/* Overlay Animasi Uang Terbang */}
        <MoneyAnimationOverlay />

        {/* 3D WebGL Canvas Layer (Paling bawah) */}
        <div id="board-center" className="absolute inset-0 pointer-events-auto">
          <GameScene />
        </div>

        {/* UI Overlay Berdasarkan Mode Game */}
        {isOnline ? (
          <>
            <OnlineRightSidebar />
            <OnlineBottomBar />
          </>
        ) : (
          /* Panel Pemain Hotseat/Lokal di setiap sisi layar */
          players.map((p, i) => {
            let style: React.CSSProperties = {};
            const total = players.length;
            
            // Posisi panel mengelilingi layar
            if (total === 1) style = { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
            else if (total === 2) {
              if (i === 0) style = { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
              if (i === 1) style = { top: 48, left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
            }
            else if (total === 3) {
              if (i === 0) style = { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
              if (i === 1) style = { top: 48, left: '25%', transform: 'translateX(-50%) rotate(180deg)' };
              if (i === 2) style = { top: 48, left: '75%', transform: 'translateX(-50%) rotate(180deg)' };
            }
            else if (total === 4) {
              if (i === 0) style = { bottom: 24, left: '50%', transform: 'translateX(-50%)' };
              if (i === 1) style = { left: 24, top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
              if (i === 2) style = { top: 48, left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
              if (i === 3) style = { right: 24, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
            }
            else if (total === 5) {
              if (i === 0) style = { bottom: 24, left: '30%', transform: 'translateX(-50%)' };
              if (i === 1) style = { bottom: 24, left: '70%', transform: 'translateX(-50%)' };
              if (i === 2) style = { left: 24, top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
              if (i === 3) style = { top: 48, left: '50%', transform: 'translateX(-50%) rotate(180deg)' };
              if (i === 4) style = { right: 24, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
            }
            else if (total === 6) {
              if (i === 0) style = { bottom: 24, left: '30%', transform: 'translateX(-50%)' };
              if (i === 1) style = { bottom: 24, left: '70%', transform: 'translateX(-50%)' };
              if (i === 2) style = { left: 24, top: '50%', transform: 'translateY(-50%) rotate(90deg)' };
              if (i === 3) style = { top: 48, left: '30%', transform: 'translateX(-50%) rotate(180deg)' };
              if (i === 4) style = { top: 48, left: '70%', transform: 'translateX(-50%) rotate(180deg)' };
              if (i === 5) style = { right: 24, top: '50%', transform: 'translateY(-50%) rotate(-90deg)' };
            }

            return (
              <PlayerEdgePanel 
                key={p.id} 
                player={p} 
                isActive={i === currentPlayerIndex} 
                style={style} 
              />
            );
          })
        )}
      </div>

      <CardRevealModal />
      <PropertyModalManager />
    </div>
  );
}

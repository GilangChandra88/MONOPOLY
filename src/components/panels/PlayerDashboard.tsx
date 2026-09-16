import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { getSquare, COLOR_MAP } from '../../data/board';
import { isProperty } from '../../types/board';

function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function PlayerDashboard() {
  const {
    players, currentPlayerIndex, phase, dice,
    ownedProperties, pendingRent, pendingRentOwner,
    activeCard, activeCardType,
    rollDiceAction, endTurn, buyProperty, passProperty,
    payRent, payJailFineAction, useJailCardAction, dismissCard,
  } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  const currentSquare = getSquare(currentPlayer.position);
  const squareOwner = ownedProperties[currentPlayer.position];

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 backdrop-blur-xl border-t-4 border-slate-700 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] text-white p-4 sm:p-6 rounded-t-3xl pointer-events-auto flex flex-col md:flex-row gap-6">
      
      {/* KIRI: Profil & Uang */}
      <div className="flex-shrink-0 flex flex-col items-center md:items-start md:w-64">
        <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">GILIRAN SAAT INI</div>
        <div className="text-3xl font-black mb-2 flex items-center gap-3">
          <span className={`w-6 h-6 rounded-full inline-block ${currentPlayer.color === 'merah' ? 'bg-red-500' : currentPlayer.color === 'biru' ? 'bg-blue-500' : currentPlayer.color === 'hijau' ? 'bg-green-500' : currentPlayer.color === 'kuning' ? 'bg-yellow-400' : currentPlayer.color === 'ungu' ? 'bg-purple-500' : 'bg-orange-500'}`}></span>
          {currentPlayer.name}
        </div>
        <div className="text-4xl font-black text-green-400 mb-2">{fmt(currentPlayer.money)}</div>
        <div className="text-slate-300 text-sm font-semibold">📍 {currentSquare.name}</div>
        
        {currentPlayer.inJail && (
          <div className="mt-3 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">
            🔒 DI PENJARA (Giliran {currentPlayer.jailTurns + 1}/3)
          </div>
        )}
      </div>

      {/* TENGAH: Inventori Aset */}
      <div className="flex-1 flex flex-col min-w-0 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
        <div className="text-slate-400 text-xs font-black uppercase tracking-widest mb-3">Aset Dimiliki ({currentPlayer.properties.length})</div>
        {currentPlayer.properties.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm italic bg-slate-800/30 rounded-xl border border-dashed border-slate-700">
            Belum ada properti
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-600">
            {currentPlayer.properties.map(sqId => {
              const sq = getSquare(sqId);
              if (!isProperty(sq)) return null; // Fallback jika stasiun/utilitas (nantinya bisa disesuaikan)
              return (
                <div key={sqId} className="flex-shrink-0 w-24 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex flex-col">
                  <div className={`h-2 w-full ${COLOR_MAP[sq.color]?.bg}`} />
                  <div className="p-2 flex-1 flex flex-col justify-center text-center">
                    <div className="text-[10px] font-bold leading-tight mb-1">{sq.name}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* KANAN: Tombol Aksi */}
      <div className="flex-shrink-0 flex flex-col justify-center gap-3 md:w-64 border-t md:border-t-0 md:border-l border-slate-700/50 pt-4 md:pt-0 md:pl-6">
        
        {/* Aksi Penjara */}
        {currentPlayer.inJail && phase === 'idle' && (
          <div className="flex flex-col gap-2">
            {currentPlayer.jailCard && (
              <button onClick={useJailCardAction} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-yellow-500 text-black shadow-lg">🃏 Bebas Penjara</button>
            )}
            {currentPlayer.money >= 500_000 && (
              <button onClick={payJailFineAction} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-red-500 text-white shadow-lg">💸 Bayar {fmt(500_000)}</button>
            )}
            <button onClick={rollDiceAction} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-slate-700 hover:bg-slate-600 text-white shadow-lg">🎲 Coba Kembar</button>
          </div>
        )}

        {/* Beli Properti */}
        {phase === 'action' && !squareOwner && !pendingRent && !activeCard && currentSquare.type !== 'go' && currentSquare.type !== 'chance' && currentSquare.type !== 'community-chest' && currentSquare.type !== 'income-tax' && currentSquare.type !== 'luxury-tax' && currentSquare.type !== 'jail' && currentSquare.type !== 'go-to-jail' && currentSquare.type !== 'free-parking' && (
          <div className="flex flex-col gap-2">
            {currentPlayer.money >= (currentSquare as any).price ? (
              <button onClick={buyProperty} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-green-500 hover:bg-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                ✅ Beli ({fmt((currentSquare as any).price)})
              </button>
            ) : (
              <div className="text-red-400 text-xs text-center font-bold">Uang tidak cukup!</div>
            )}
            <button onClick={passProperty} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-slate-700 hover:bg-slate-600 text-white shadow-lg">❌ Lewati</button>
          </div>
        )}

        {/* Bayar Sewa */}
        {phase === 'action' && pendingRent !== null && pendingRentOwner && !activeCard && (
          <button onClick={payRent} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-red-600 hover:bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.5)]">
            💰 Bayar Sewa {fmt(pendingRent)}
          </button>
        )}

        {/* Kartu aktif */}
        {activeCard && phase === 'action' && (
          <button onClick={dismissCard} className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 bg-blue-500 hover:bg-blue-400 text-white shadow-lg">
            OK, Mengerti ✓
          </button>
        )}

        {/* Akhir Giliran */}
        {phase === 'end-turn' && (
          <button onClick={endTurn} className="w-full py-4 rounded-xl font-black text-base transition-all hover:scale-105 active:scale-95 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            ➡️ Akhiri Giliran
          </button>
        )}

      </div>
    </div>
  );
}

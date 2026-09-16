import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { auth } from '../../firebase';
import { BOARD_SQUARES } from '../../data/board';
import { isProperty, isPurchasable } from '../../types/board';

export default function OnlineBottomBar() {
  const { 
    players, currentPlayerIndex, phase, pendingRent, pendingRentOwner, activeCard,
    rollDiceAction, endTurn, buyProperty, passProperty, buyHouse, houses, hotels,
    payRent, declareBankruptcy, payJailFineAction, useJailCardAction, dice, isOnline, triggerPhysicalRoll, ownedProperties
  } = useGameStore();



  const fmt = (num: number) => num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : `${num / 1_000}K`;

  const bgClass: Record<string, string> = {
    merah: 'bg-red-500', biru: 'bg-blue-500', hijau: 'bg-green-500',
    kuning: 'bg-yellow-400', ungu: 'bg-purple-500', oranye: 'bg-orange-500',
  };

  const borderClass: Record<string, string> = {
    merah: 'border-red-500', biru: 'border-blue-500', hijau: 'border-green-500',
    kuning: 'border-yellow-400', ungu: 'border-purple-500', oranye: 'border-orange-500',
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 z-50 flex items-end justify-between pointer-events-none">
      {/* Kiri: Daftar Semua Status Pemain */}
      <div className="flex gap-2 pointer-events-auto">
        {players.map((p, i) => (
          <div 
            key={p.id}
            className={`w-32 rounded-xl border-2 backdrop-blur-md p-2 flex flex-col transition-all duration-300 ${
              i === currentPlayerIndex 
                ? `bg-slate-800/90 ${borderClass[p.color] || 'border-white'} shadow-[0_0_15px_rgba(255,255,255,0.2)] -translate-y-2` 
                : p.isBankrupt 
                  ? 'bg-red-950/40 border-red-900/50 grayscale opacity-50' 
                  : 'bg-slate-900/60 border-white/10 opacity-70'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className={`w-3 h-3 rounded-full ${bgClass[p.color] || 'bg-gray-500'}`} />
              <div className="text-white font-bold text-xs truncate leading-tight">{p.name}</div>
            </div>
            <div className="text-emerald-400 font-black text-sm">{fmt(p.money)}</div>
            {p.inJail && <div className="text-[9px] text-orange-400 font-bold mt-0.5">DIPENJARA</div>}
            {p.isBankrupt && <div className="text-[9px] text-red-500 font-bold mt-0.5">BANGKRUT</div>}
            
            {/* Opsi khusus HOST untuk melihat KODE UNDANGAN */}
            {(players[0]?.userId === auth.currentUser?.uid) && !p.userId && p.inviteCode && (
              <div className="mt-1 flex items-center justify-between bg-yellow-500/20 border border-yellow-500/30 rounded px-1.5 py-0.5">
                <span className="text-[8px] text-yellow-500/70 uppercase font-black tracking-widest">KODE:</span>
                <span className="text-[10px] text-yellow-300 font-mono font-bold select-all">{p.inviteCode}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

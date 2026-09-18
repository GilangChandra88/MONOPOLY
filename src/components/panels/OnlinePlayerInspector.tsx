import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { BOARD_SQUARES, COLOR_MAP } from '../../data/board';
import { isProperty } from '../../types/board';
import { auth } from '../../firebase';

export default function OnlinePlayerInspector() {
  const { players, ownedProperties } = useGameStore();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');

  if (players.length === 0) return null;

  const activePlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const getSortWeight = (sq: any) => {
    if (sq.type === 'railroad') return 90;
    if (sq.type === 'utility') return 100;
    if (isProperty(sq)) {
      const colorOrder: Record<string, number> = {
        'coklat': 1, 'biruMuda': 2, 'ungu': 3, 'oranye': 4,
        'merah': 5, 'kuning': 6, 'hijau': 7, 'biru': 8
      };
      return colorOrder[sq.color] || 50;
    }
    return 999;
  };

  const playerProps = Object.entries(ownedProperties)
    .filter(([_, ownerId]) => ownerId === activePlayer.id)
    .map(([sqId]) => BOARD_SQUARES[Number(sqId)])
    .sort((a, b) => getSortWeight(a) - getSortWeight(b));

  const bgClass: Record<string, string> = {
    merah: 'bg-red-500', biru: 'bg-blue-500', hijau: 'bg-green-500',
    kuning: 'bg-yellow-400', ungu: 'bg-purple-500', oranye: 'bg-orange-500',
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-3 pointer-events-auto flex-shrink-0">
      <div className="text-white/70 font-black text-[10px] mb-2 tracking-widest uppercase">
        🏠 PROPERTI
      </div>
      
      {/* Tab/Dropdown Pemain */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {players.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedPlayerId(p.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              selectedPlayerId === p.id ? 'bg-white text-black shadow-lg scale-105' : 'bg-black/30 text-white/70 hover:bg-black/50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${bgClass[p.color] || 'bg-gray-500'}`} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Info Pemain Terpilih (Mobile Only) */}
      <div className="md:hidden flex flex-col gap-2 mt-2 px-1">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-black/30 rounded-xl p-2 border border-white/10 flex flex-col justify-center shadow-inner">
             <span className="text-[10px] text-white/50 uppercase tracking-widest mb-1 font-bold">Saldo</span>
             <span className="text-emerald-400 font-black text-sm">
               {activePlayer.money >= 1_000_000 ? `Rp ${(activePlayer.money / 1_000_000).toFixed(1)}M` : `Rp ${activePlayer.money / 1_000}K`}
             </span>
          </div>
          
          <div className="flex-1 bg-black/30 rounded-xl p-2 border border-white/10 flex flex-col justify-center shadow-inner">
             <span className="text-[10px] text-white/50 uppercase tracking-widest mb-1 font-bold">Status</span>
             <span className={`text-xs font-black ${activePlayer.isBankrupt ? 'text-red-500' : activePlayer.inJail ? 'text-orange-400' : 'text-blue-400'}`}>
               {activePlayer.isBankrupt ? 'BANGKRUT' : activePlayer.inJail ? 'DIPENJARA' : 'AKTIF'}
             </span>
          </div>
        </div>

        {/* Opsi khusus HOST untuk melihat KODE UNDANGAN di Mobile */}
        {(players[0]?.userId === auth.currentUser?.uid) && !activePlayer.userId && activePlayer.inviteCode && (
          <div className="flex items-center justify-between bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-3 py-2">
            <span className="text-[10px] text-yellow-500/70 uppercase font-black tracking-widest">KODE UNDANGAN:</span>
            <span className="text-sm text-yellow-300 font-mono font-bold select-all tracking-wider">{activePlayer.inviteCode}</span>
          </div>
        )}
      </div>

      {/* Daftar Aset */}
      <div className="mt-2 bg-black/20 rounded-xl p-3 border border-white/5 flex-1 flex flex-col min-h-0">
        <div className="text-[10px] text-white/50 font-bold mb-2 uppercase tracking-widest flex justify-between items-center">
          <span>Aset ({playerProps.length})</span>
          {playerProps.length > 0 && <span className="text-[8px] italic opacity-50">Geser untuk melihat</span>}
        </div>
        
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 items-end min-h-[5rem]">
          {playerProps.length === 0 && <span className="text-xs text-white/30 italic">Belum ada properti</span>}
          {playerProps.map(sq => {
            const sellPrice = (sq as any).price ? (sq as any).price / 2 : 0;
            const fmtSell = sellPrice >= 1_000_000 ? `${(sellPrice / 1_000_000).toFixed(1)}M` : `${sellPrice / 1_000}K`;

            return (
              <div 
                key={sq.id} 
                onClick={() => window.dispatchEvent(new CustomEvent('square-click', { detail: sq.id }))}
                className="relative w-14 h-20 flex-shrink-0 bg-[#f4f4f4] rounded shadow-lg border-2 border-white/80 flex flex-col cursor-pointer transform transition-all duration-200 hover:-translate-y-2 hover:shadow-2xl group"
                title={`${sq.name} (Klik untuk kelola)`}
              >
                {isProperty(sq) ? (
                  <>
                    <div className={`h-4 w-full rounded-t-sm border-b border-black/20 ${COLOR_MAP[sq.color]?.bg}`}></div>
                    <div className="flex-1 flex flex-col items-center justify-center p-0.5">
                      <span className="text-[7px] font-extrabold text-black text-center leading-[1.1] uppercase break-words w-full flex-1 flex items-center justify-center">
                        {sq.name.replace('Jl. ', '')}
                      </span>
                      <div className="w-full border-t border-gray-300 mt-auto pt-0.5 text-center">
                        <span className="text-[6px] font-bold text-red-600">{fmtSell}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-0.5 bg-gray-200 rounded-sm">
                    <span className="text-xs mb-0.5">{sq.type === 'utility' ? '💡' : '🚂'}</span>
                    <span className="text-[6px] font-extrabold text-black text-center leading-[1.1] uppercase break-words w-full flex-1 flex items-center justify-center">
                      {sq.name}
                    </span>
                    <div className="w-full border-t border-gray-300 mt-auto pt-0.5 text-center">
                      <span className="text-[6px] font-bold text-red-600">{fmtSell}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

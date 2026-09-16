import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { BOARD_SQUARES } from '../../data/board';
import { isProperty, isPurchasable } from '../../types/board';

export default function OnlineLeaderboardUI() {
  const { players, ownedProperties, houses, hotels } = useGameStore();

  if (players.length === 0) return null;

  const fmt = (num: number) => num >= 1_000_000 ? `${(num / 1_000_000).toFixed(1)}M` : `${num / 1_000}K`;

  const leaderboardData = players.map(player => {
    let assetValue = 0;
    
    for (const sqIdStr of Object.keys(ownedProperties)) {
      const sqId = Number(sqIdStr);
      if (ownedProperties[sqId] === player.id) {
        const sq = BOARD_SQUARES[sqId];
        if (isPurchasable(sq)) {
          assetValue += (sq as any).price;
          
          if (isProperty(sq)) {
            const hCount = houses[sqId] || 0;
            const hHotel = hotels[sqId] || false;
            
            if (hHotel) {
              assetValue += sq.hotelCost;
            } else {
              assetValue += hCount * sq.houseCost;
            }
          }
        }
      }
    }

    return {
      id: player.id,
      name: player.name,
      cash: player.money,
      asset: assetValue,
      total: player.money + assetValue,
      isBankrupt: player.isBankrupt,
      color: player.color
    };
  });

  leaderboardData.sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return b.total - a.total;
  });

  const bgClass: Record<string, string> = {
    merah: 'bg-red-500',
    biru: 'bg-blue-500',
    hijau: 'bg-green-500',
    kuning: 'bg-yellow-400',
    ungu: 'bg-purple-500',
    oranye: 'bg-orange-500',
  };

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl p-3 pointer-events-auto flex-shrink-0">
      <div className="text-white font-black text-sm mb-3 flex items-center justify-between border-b border-white/10 pb-2">
        <span>🏆 Papan Peringkat</span>
      </div>
      <div className="flex flex-col gap-2">
        {leaderboardData.map((p, idx) => (
          <div key={p.id} className={`flex items-center gap-2 p-2 rounded-lg ${p.isBankrupt ? 'opacity-50 grayscale' : 'bg-black/30'}`}>
            <div className="text-white/50 text-xs font-bold w-4">{idx + 1}.</div>
            <div className={`w-3 h-3 rounded-full ${bgClass[p.color] || 'bg-gray-500'}`} />
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-bold truncate leading-tight">
                {p.name}
              </div>
              <div className="text-white/50 text-[9px] flex gap-2 leading-tight">
                <span>💸 {fmt(p.cash)}</span>
                <span>🏡 {fmt(p.asset)}</span>
              </div>
            </div>
            <div className="text-emerald-400 font-black text-xs">
              {fmt(p.total)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

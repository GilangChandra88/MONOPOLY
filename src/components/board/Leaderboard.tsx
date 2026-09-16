import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { BOARD_SQUARES } from '../../data/board';
import { isProperty, isPurchasable } from '../../types/board';

export default function Leaderboard() {
  const { players, ownedProperties, houses, hotels } = useGameStore();

  if (players.length === 0) return null;

  const fmt = (num: number) => num.toLocaleString('id-ID');

  const leaderboardData = players.map(player => {
    let assetValue = 0;
    
    // Hitung aset properti yang dimiliki
    for (const sqIdStr of Object.keys(ownedProperties)) {
      const sqId = Number(sqIdStr);
      if (ownedProperties[sqId] === player.id) {
        const sq = BOARD_SQUARES[sqId];
        if (isPurchasable(sq)) {
          assetValue += sq.price; // Nilai dasar properti
          
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

    const total = player.money + assetValue;

    return {
      id: player.id,
      name: player.name,
      cash: player.money,
      asset: assetValue,
      total: total,
      isBankrupt: player.isBankrupt,
      color: player.color
    };
  });

  // Sort descending by total (bangkrut ditaruh di bawah)
  leaderboardData.sort((a, b) => {
    if (a.isBankrupt && !b.isBankrupt) return 1;
    if (!a.isBankrupt && b.isBankrupt) return -1;
    return b.total - a.total;
  });

  const colorClass: Record<string, string> = {
    merah: 'text-red-400',
    biru: 'text-blue-400',
    hijau: 'text-green-400',
    kuning: 'text-yellow-400',
    ungu: 'text-purple-400',
    oranye: 'text-orange-400',
  };

  return (
    <div className="bg-black/80 backdrop-blur-md rounded-[40px] p-10 text-white text-4xl border-4 border-white/20 shadow-2xl w-[900px]">
      <div className="font-bold text-white mb-8 uppercase tracking-wider text-5xl text-center">🏆 Papan Peringkat</div>
      <table className="w-full text-right border-collapse">
        <thead>
          <tr className="text-white/50 border-b-4 border-white/20">
            <th className="text-left font-normal pb-6">Nama</th>
            <th className="font-normal pb-6">Cash</th>
            <th className="font-normal pb-6">Aset</th>
            <th className="font-normal pb-6">Total</th>
          </tr>
        </thead>
        <tbody>
          {leaderboardData.map((row) => (
            <tr key={row.id} className={`border-b-2 border-white/10 last:border-0 ${row.isBankrupt ? 'opacity-30 line-through' : ''}`}>
              <td className={`text-left py-6 font-semibold ${colorClass[row.color] || 'text-white'}`}>
                {row.name}
              </td>
              <td className="py-6 font-mono">{fmt(row.cash)}</td>
              <td className="py-6 font-mono text-blue-200">{fmt(row.asset)}</td>
              <td className="py-6 font-mono font-bold text-green-300">{fmt(row.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

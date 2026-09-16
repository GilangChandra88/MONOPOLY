import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { TOKEN_EMOJIS, TOKEN_BG } from '../../types/game';
import { getSquare } from '../../data/board';
import { isPurchasable, isProperty } from '../../types/board';

function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function PlayerPanel() {
  const { players, currentPlayerIndex, ownedProperties, houses, hotels } = useGameStore();

  return (
    <div className="flex flex-col gap-2 w-full">
      {players.map((player, idx) => {
        const isActive = idx === currentPlayerIndex;
        const myProperties = player.properties
          .map(id => ({ id, sq: getSquare(id) }))
          .filter(({ sq }) => isPurchasable(sq));

        return (
          <div
            key={player.id}
            className={`
              rounded-xl p-3 border-2 transition-all
              ${isActive
                ? 'border-yellow-400 bg-white/10 shadow-lg shadow-yellow-400/20'
                : 'border-white/10 bg-white/5 opacity-70'}
              ${player.isBankrupt ? 'opacity-30 grayscale' : ''}
            `}
          >
            {/* Header pemain */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full ${TOKEN_BG[player.color]} flex items-center justify-center text-base shadow`}>
                {TOKEN_EMOJIS[player.color]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white text-sm">{player.name}</span>
                  {isActive && <span className="text-yellow-400 text-xs">◄ giliran</span>}
                  {player.isBankrupt && <span className="text-red-400 text-xs">BANGKRUT</span>}
                  {player.inJail && <span className="text-orange-400 text-xs">🔒 Penjara</span>}
                </div>
                <div className="text-green-400 font-semibold text-sm">{fmt(player.money)}</div>
              </div>
              {player.jailCard && (
                <span className="text-xs bg-yellow-500 text-black px-1 py-0.5 rounded font-bold">
                  🃏 Bebas
                </span>
              )}
            </div>

            {/* Properti dimiliki */}
            {myProperties.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {myProperties.map(({ id, sq }) => {
                  const houseCount = houses[id] ?? 0;
                  const hasHotel = hotels[id] ?? false;
                  const color = isProperty(sq) ? sq.color : null;

                  const colorBg: Record<string, string> = {
                    'coklat': 'bg-amber-800',
                    'biru-muda': 'bg-sky-300',
                    'merah-muda': 'bg-pink-500',
                    'oranye': 'bg-orange-500',
                    'merah': 'bg-red-600',
                    'kuning': 'bg-yellow-400',
                    'hijau': 'bg-green-600',
                    'biru-tua': 'bg-blue-800',
                  };

                  return (
                    <div
                      key={id}
                      className={`
                        text-white text-xs px-1 py-0.5 rounded font-medium flex items-center gap-0.5
                        ${color ? colorBg[color] : 'bg-gray-600'}
                      `}
                      title={sq.name}
                    >
                      <span className="truncate max-w-[60px]" style={{ fontSize: '0.55rem' }}>
                        {sq.name.replace('Jl. ', '')}
                      </span>
                      {hasHotel && <span style={{ fontSize: '0.6rem' }}>🏨</span>}
                      {!hasHotel && houseCount > 0 && (
                        <span style={{ fontSize: '0.6rem' }}>{'🏠'.repeat(houseCount)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

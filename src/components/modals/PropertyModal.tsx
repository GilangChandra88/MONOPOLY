import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { getSquare } from '../../data/board';
import { isProperty, isPurchasable, isRailroad, isUtility } from '../../types/board';
import { COLOR_MAP } from '../../data/board';
import { ownsFullColorGroup } from '../../engine/property';

function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

interface PropertyCardProps {
  squareId: number;
  onClose: () => void;
}

import { auth } from '../../firebase';

export default function PropertyModal({ squareId, onClose }: PropertyCardProps) {
  const state = useGameStore();
  const { players, currentPlayerIndex, ownedProperties, houses, hotels, buyHouse, sellHouse, sellProperty, isOnline } = state;
  const currentPlayer = players[currentPlayerIndex];
  const square = getSquare(squareId);

  if (!isPurchasable(square)) return null;

  const ownerId = ownedProperties[squareId];
  const owner = players.find(p => p.id === ownerId);
  
  // Dapatkan pemain lokal (diri sendiri)
  const myPlayer = isOnline 
    ? players.find(p => p.userId === auth.currentUser?.uid) || players[0]
    : currentPlayer; // Jika offline, "diri sendiri" adalah pemain yang sedang giliran
  
  // Aksi hanya bisa dilakukan jika kitalah pemilik sebenarnya dari properti ini
  const isMyProperty = ownerId === myPlayer.id;
  const houseCount = houses[squareId] ?? 0;
  const hasHotel = hotels[squareId] ?? false;

  const canBuildHouse = isMyProperty && isProperty(square) && !hasHotel &&
    ownsFullColorGroup(myPlayer.id, square.color, state) &&
    myPlayer.money >= square.houseCost && houseCount < 4;

  const canBuildHotel = isMyProperty && isProperty(square) && !hasHotel && houseCount === 4 &&
    ownsFullColorGroup(myPlayer.id, square.color, state) &&
    myPlayer.money >= square.hotelCost;

  const canSellHouse = isMyProperty && (houseCount > 0 || hasHotel);
  const canSellProperty = isMyProperty && houseCount === 0 && !hasHotel;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 ${isProperty(square) ? COLOR_MAP[square.color].border : 'border-gray-500'}`}>
        {/* Header warna */}
        <div className={`relative ${isProperty(square) ? COLOR_MAP[square.color].bg : 'bg-gray-800'} ${isProperty(square) ? COLOR_MAP[square.color].text : 'text-white'} p-6 text-center overflow-hidden`}>
          {square.image && (
            <div 
              className="absolute inset-0 opacity-40 mix-blend-overlay"
              style={{
                backgroundImage: `url('${square.image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
          <div className="relative z-10">
            <div className="font-black text-2xl mb-1">{square.name}</div>
            {isProperty(square) && (
              <div className="text-sm opacity-90 font-semibold uppercase tracking-wider">{square.color.replace('-', ' ')}</div>
            )}
            {isRailroad(square) && <div className="text-sm opacity-90 font-semibold uppercase tracking-wider">FASILITAS UMUM</div>}
            {isUtility(square) && <div className="text-sm opacity-90 font-semibold uppercase tracking-wider">PERUSAHAAN DAERAH</div>}
          </div>
        </div>

        <div className="bg-white p-4">
          {/* Status kepemilikan */}
          {owner ? (
            <div className={`text-center mb-3 py-2 rounded-lg ${isMyProperty ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <div className="font-bold text-sm">
                {isMyProperty ? '✅ Milikmu' : `❌ Milik ${owner.name}`}
              </div>
            </div>
          ) : (
            <div className="text-center mb-3 py-2 bg-blue-100 text-blue-700 rounded-lg">
              <div className="font-bold text-sm">🏪 Tersedia untuk dibeli</div>
            </div>
          )}

          {/* Info properti */}
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Harga Beli</span>
              <span className="font-bold">{fmt(square.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hipotek</span>
              <span className="font-bold">{fmt(square.mortgage)}</span>
            </div>

            {isProperty(square) && (
              <>
                <hr className="my-2" />
                <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Tabel Sewa</div>
                {(['Kosong', '1 Rumah', '2 Rumah', '3 Rumah', '4 Rumah', 'Hotel'] as const).map((label, i) => (
                  <div key={i} className={`flex justify-between ${(i === houseCount && !hasHotel) || (i === 5 && hasHotel) ? 'font-bold text-green-600 bg-green-50 px-1 rounded' : ''}`}>
                    <span className="text-gray-600">{label}{i === 0 && ownsFullColorGroup(ownerId || '', square.color, state) ? ' (Monopoli)' : ''}</span>
                    <span>{fmt(i === 0 && ownsFullColorGroup(ownerId || '', square.color, state) ? square.rent[0] * 2 : square.rent[i])}</span>
                  </div>
                ))}
                <hr className="my-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Harga Rumah</span>
                  <span>{fmt(square.houseCost)}</span>
                </div>

                {/* Status bangunan saat ini */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Bangunan</span>
                  <span className="font-bold">
                    {hasHotel ? '🏨 Hotel' : houseCount > 0 ? `${'🏠'.repeat(houseCount)} (${houseCount} rumah)` : '—'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Aksi bangunan (hanya untuk pemilik) */}
          {isMyProperty && (
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                {(canBuildHouse || canBuildHotel) && (
                  <button
                    onClick={() => buyHouse(squareId)}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    {houseCount < 4 ? `+ Rumah (${fmt((square as any).houseCost)})` : `+ Hotel (${fmt((square as any).hotelCost)})`}
                  </button>
                )}
                {canSellHouse && (
                  <button
                    onClick={() => sellHouse(squareId)}
                    className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold text-sm transition-colors"
                  >
                    {hasHotel ? `- Hotel` : `- Rumah`}
                  </button>
                )}
              </div>
              
              {canSellProperty && (
                <button
                  onClick={() => {
                    sellProperty(squareId);
                    onClose(); // Tutup modal setelah jual
                  }}
                  className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  Jual Properti ke Bank ({fmt((square as any).price / 2)})
                </button>
              )}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold text-sm transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

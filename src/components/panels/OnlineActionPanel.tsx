import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { auth } from '../../firebase';
import { BOARD_SQUARES } from '../../data/board';
import { isProperty, isPurchasable } from '../../types/board';

export default function OnlineActionPanel() {
  const { 
    players, currentPlayerIndex, phase, pendingRent, pendingRentOwner, activeCard,
    endTurn, buyProperty, passProperty, buyHouse, houses, hotels,
    payRent, declareBankruptcy, payJailFineAction, useJailCardAction, triggerPhysicalRoll, ownedProperties
  } = useGameStore();

  const [showBankruptcyConfirm, setShowBankruptcyConfirm] = useState(false);
  const [bankruptcyInput, setBankruptcyInput] = useState('');

  if (players.length === 0) return null;

  const myPlayer = players.find(p => p.userId === auth.currentUser?.uid) || players[0];
  const isMyTurn = players[currentPlayerIndex]?.id === myPlayer.id;
  const activePlayer = players[currentPlayerIndex];

  const renderActions = () => {
    if (!isMyTurn) return null;

    if (myPlayer.inJail && phase === 'idle') {
      return (
        <div className="flex gap-2">
          {myPlayer.jailCard && (
            <button onClick={useJailCardAction} className="px-4 py-2 rounded-xl font-bold text-xs bg-yellow-500 text-black w-full">🃏 Bebas Penjara</button>
          )}
          {myPlayer.money >= 500_000 && (
            <button onClick={payJailFineAction} className="px-4 py-2 rounded-xl font-bold text-xs bg-red-500 text-white w-full">💸 Bayar 500rb</button>
          )}
          <button onClick={() => triggerPhysicalRoll()} className="px-4 py-2 rounded-xl font-bold text-xs bg-blue-600 text-white w-full">🎲 Coba Kembar</button>
        </div>
      );
    }

    if (phase === 'idle' && !myPlayer.inJail) {
      return (
        <button 
          onClick={() => triggerPhysicalRoll()} 
          className="w-full py-3 rounded-xl font-black text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          🎲 Kocok Dadu
        </button>
      );
    }

    if (phase === 'action' && !pendingRent && !activeCard) {
      const sq = BOARD_SQUARES[myPlayer.position];
      const isProp = isPurchasable(sq);
      const sqOwner = (ownedProperties as Record<number, string>)[myPlayer.position];
      
      if (isProp) {
        if (!sqOwner) {
          return (
            <div className="flex flex-col gap-2 w-full">
              {myPlayer.money >= (sq as any).price ? (
                <button onClick={buyProperty} className="w-full py-2.5 rounded-xl font-bold text-sm bg-green-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
                  ✅ Beli ({(sq as any).price / 1_000_000}M)
                </button>
              ) : (
                <div className="text-red-400 text-xs font-bold text-center">Uang tidak cukup!</div>
              )}
              <button onClick={passProperty} className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-700 text-white hover:scale-105 active:scale-95 transition-all">❌ Lewati</button>
            </div>
          );
        } else if (sqOwner === myPlayer.id && isProperty(sq)) {
          const currentHouses = houses[sq.id] || 0;
          const hasHotel = hotels[sq.id];
          const cost = currentHouses >= 4 ? sq.hotelCost : sq.houseCost;
          const canBuild = !hasHotel && myPlayer.money >= cost;
          
          return (
            <div className="flex flex-col gap-2 w-full">
              <div className="text-xs text-emerald-300 font-bold text-center">Milik Anda sendiri</div>
              {!hasHotel ? (
                canBuild ? (
                  <button onClick={() => buyHouse(sq.id)} className="w-full py-2.5 rounded-xl font-bold text-xs bg-yellow-500 text-black shadow-lg hover:scale-105 active:scale-95 transition-all">
                    🏠 Bangun {currentHouses >= 4 ? 'Hotel' : 'Rumah'} ({(cost / 1_000_000).toFixed(1)}M)
                  </button>
                ) : (
                  <div className="text-red-400 text-xs font-bold text-center">Uang tidak cukup untuk membangun!</div>
                )
              ) : (
                <div className="text-emerald-400 text-xs font-bold text-center">Properti Maksimal 🏨</div>
              )}
            </div>
          );
        }
      }
    }

    if (pendingRent && pendingRentOwner) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <div className="text-xs text-red-300 font-bold bg-red-900/50 px-3 py-1.5 rounded-lg border border-red-500/30 text-center">
            Bayar Sewa: Rp {pendingRent.toLocaleString('id-ID')}
          </div>
          {myPlayer.money >= pendingRent ? (
            <button onClick={payRent} className="w-full py-2.5 rounded-xl font-black text-sm bg-red-600 hover:bg-red-500 text-white shadow-lg hover:scale-105 active:scale-95 transition-all">
              💸 Bayar
            </button>
          ) : (
            <div className="text-red-400 text-xs font-bold animate-pulse text-center">Uang tidak cukup! Jual aset!</div>
          )}
        </div>
      );
    }

    if (phase === 'end-turn') {
      if (myPlayer.money >= 0) {
        return (
          <button onClick={endTurn} className="w-full py-3 rounded-xl font-black text-sm bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95">
            ➡️ Akhiri Giliran
          </button>
        );
      } else {
        return (
          <div className="flex flex-col gap-2 w-full">
            <div className="text-red-400 text-xs font-bold text-center">Saldo Negatif!</div>
            {!showBankruptcyConfirm ? (
              <button onClick={() => setShowBankruptcyConfirm(true)} className="w-full py-2 bg-slate-700 text-white rounded-lg text-xs font-bold hover:bg-red-800">Nyatakan Bangkrut</button>
            ) : (
              <div className="flex flex-col gap-1 w-full bg-red-950 p-2 rounded-lg border border-red-500/50">
                <input type="text" value={bankruptcyInput} onChange={e => setBankruptcyInput(e.target.value)} placeholder="ketik 'menyerah'" className="w-full px-2 py-1.5 text-xs text-black outline-none rounded text-center" />
                <div className="flex gap-1 mt-1">
                  <button onClick={() => {setShowBankruptcyConfirm(false); setBankruptcyInput('');}} className="flex-1 py-1.5 text-xs text-white bg-slate-600 rounded">Batal</button>
                  <button disabled={bankruptcyInput.toLowerCase() !== 'menyerah'} onClick={() => {declareBankruptcy(); setShowBankruptcyConfirm(false);}} className="flex-1 py-1.5 text-xs text-white bg-red-600 disabled:opacity-50 rounded">OK</button>
                </div>
              </div>
            )}
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-3 flex flex-col pointer-events-auto flex-shrink-0">
      <div className="text-white/50 text-[10px] font-bold uppercase tracking-widest mb-3 border-b border-white/10 pb-1 text-center">
        {isMyTurn ? 'Aksi Anda' : 'Status'}
      </div>
      
      {isMyTurn ? (
        renderActions()
      ) : (
        <div className="py-2 text-center text-white/70 text-xs font-bold italic animate-pulse">
          Menunggu {activePlayer?.name}...
        </div>
      )}
    </div>
  );
}

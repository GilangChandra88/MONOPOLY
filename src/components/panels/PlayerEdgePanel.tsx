import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import type { Player } from '../../types/game';
import { BOARD_SQUARES, COLOR_MAP } from '../../data/board';
import { isProperty, isPurchasable } from '../../types/board';
import { auth } from '../../firebase';

interface PlayerEdgePanelProps {
  player: Player;
  isActive: boolean;
  style: React.CSSProperties;
}

export default function PlayerEdgePanel({ player, isActive, style }: PlayerEdgePanelProps) {
  const { 
    phase, 
    ownedProperties, 
    pendingRent, 
    pendingRentOwner,
    activeCard,
    isOnline,
    rollDiceAction, 
    endTurn, 
    buyProperty, 
    passProperty,
    buyHouse,
    houses,
    hotels,
    payRent,
    declareBankruptcy,
    payJailFineAction,
    useJailCardAction,
    dice
  } = useGameStore();

  const isMe = !isOnline || player.userId === auth.currentUser?.uid;

  const [showBankruptcyConfirm, setShowBankruptcyConfirm] = useState(false);
  const [bankruptcyInput, setBankruptcyInput] = useState('');

  const colorClass = {
    merah: 'bg-red-500',
    biru: 'bg-blue-500',
    hijau: 'bg-green-500',
    kuning: 'bg-yellow-400',
    ungu: 'bg-purple-500',
    oranye: 'bg-orange-500',
  }[player.color] || 'bg-gray-500';

  // Urutan grup warna monopoli standar
  const getSortWeight = (sq: any) => {
    if (sq.type === 'railroad') return 90;
    if (sq.type === 'utility') return 100;
    if (isProperty(sq)) {
      const colorOrder: Record<string, number> = {
        'coklat': 1,
        'biruMuda': 2,
        'ungu': 3,
        'oranye': 4,
        'merah': 5,
        'kuning': 6,
        'hijau': 7,
        'biru': 8
      };
      return colorOrder[sq.color] || 50;
    }
    return 999;
  };

  // Properti milik pemain ini, diurutkan berdasarkan komplek/warna
  const playerProps = Object.entries(ownedProperties)
    .filter(([_, ownerId]) => ownerId === player.id)
    .map(([sqId]) => BOARD_SQUARES[Number(sqId)])
    .sort((a, b) => getSortWeight(a) - getSortWeight(b));

  const renderBankruptcyAction = () => {
    if (showBankruptcyConfirm) {
      return (
        <div className="flex flex-col gap-2 p-2 bg-red-950/90 rounded-xl border-2 border-red-500/50 mt-1 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
          <div className="text-[10px] text-white text-center leading-tight">
            Ketik <strong className="text-red-400 text-xs">menyerah</strong> untuk konfirmasi kebangkrutan:
          </div>
          <input
            type="text"
            value={bankruptcyInput}
            onChange={(e) => setBankruptcyInput(e.target.value)}
            className="text-white bg-black/50 px-2 py-1.5 text-xs rounded-lg outline-none border-2 border-transparent focus:border-red-500 transition-all text-center font-bold"
            placeholder="menyerah"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowBankruptcyConfirm(false); setBankruptcyInput(''); }} className="flex-1 py-1.5 bg-gray-600 rounded-lg text-[10px] text-white hover:bg-gray-500 transition-all font-bold">Batal</button>
            <button
              disabled={bankruptcyInput.toLowerCase() !== 'menyerah'}
              onClick={() => { declareBankruptcy(); setShowBankruptcyConfirm(false); }}
              className="flex-1 py-1.5 bg-red-600 disabled:bg-red-900 disabled:text-white/50 rounded-lg text-[10px] text-white font-black hover:bg-red-500 transition-all"
            >
              Konfirmasi
            </button>
          </div>
        </div>
      );
    }
    return (
      <button onClick={() => setShowBankruptcyConfirm(true)} className="w-full py-2 rounded-xl font-bold text-xs bg-slate-700 text-white hover:bg-red-800 transition-all shadow-md border border-white/10">
        Nyatakan Bangkrut
      </button>
    );
  };

  return (
    <div 
      id={`player-panel-${player.id}`}
      className={`absolute w-72 rounded-2xl border-2 backdrop-blur-md shadow-2xl transition-all duration-300 flex flex-col pointer-events-auto
        ${isActive ? 'border-emerald-400 bg-slate-900/90 scale-105 z-50' : 'border-white/10 bg-slate-900/60 z-30 opacity-70'}
      `}
      style={{ ...style, transformOrigin: 'center center' }}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${colorClass} shadow-lg`} />
          <div className="font-bold text-white text-lg leading-tight">{player.name}</div>
        </div>
        <div className="text-emerald-400 font-black text-lg">
          {(player.money / 1_000_000).toFixed(1)}M
        </div>
      </div>

      {/* Aset / Properti Kecil (Kartu Bertumpuk) */}
      <div className="px-3 py-2 bg-black/20">
        <div className="text-[10px] text-white/50 font-bold mb-1 uppercase tracking-widest flex justify-between items-center">
          <span>Aset ({playerProps.length})</span>
          {playerProps.length > 0 && <span className="text-[8px] italic opacity-50">Geser & hover untuk melihat</span>}
        </div>
        
        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-6 pt-2 px-2 items-end min-h-[5rem]">
          {playerProps.length === 0 && <span className="text-xs text-white/30 italic">Belum ada</span>}
          {playerProps.map((sq, idx) => {
            const sellPrice = (sq as any).price ? (sq as any).price / 2 : 0;
            const fmtSell = sellPrice >= 1_000_000 ? `${(sellPrice / 1_000_000).toFixed(1)}M` : `${sellPrice / 1_000}K`;

            return (
              <div 
                key={sq.id} 
                onClick={() => window.dispatchEvent(new CustomEvent('square-click', { detail: sq.id }))}
                className="relative w-14 h-20 flex-shrink-0 bg-[#f4f4f4] rounded shadow-lg border-2 border-white/80 flex flex-col cursor-pointer transform transition-all duration-200 hover:-translate-y-4 hover:scale-125 hover:z-[100] hover:shadow-2xl group"
                title={`${sq.name} (Jual: Rp ${fmtSell}) - Klik untuk kelola`}
              >
                {isProperty(sq) ? (
                  <>
                    <div className={`h-4 w-full rounded-t-sm border-b border-black/20 ${COLOR_MAP[sq.color]?.bg}`}></div>
                    <div className="flex-1 flex flex-col items-center justify-center p-0.5">
                      <span className="text-[7px] font-extrabold text-black text-center leading-[1.1] uppercase break-words w-full flex-1 flex items-center justify-center">
                        {sq.name.replace('Jl. ', '')}
                      </span>
                      <div className="w-full border-t border-gray-300 mt-auto pt-0.5 text-center">
                        <span className="text-[6px] font-bold text-red-600">Jual: {fmtSell}</span>
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
                      <span className="text-[6px] font-bold text-red-600">Jual: {fmtSell}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Area Aksi Aktif */}
      {isOnline && !player.userId && player.inviteCode ? (
        <div className="p-3 bg-blue-900/40 rounded-b-2xl border-t border-blue-500/30 text-center pointer-events-auto">
          <div className="text-[10px] text-blue-300 font-bold tracking-widest uppercase mb-1">Menunggu Pemain...</div>
          <div className="text-2xl font-black text-white tracking-[0.2em]">{player.inviteCode}</div>
          <div className="text-[9px] text-blue-200/50 mt-1">Berikan kode ini untuk bergabung</div>
        </div>
      ) : isActive ? (
        isMe ? (
          <div className="p-2 bg-slate-800/80 rounded-b-2xl flex flex-col gap-2 pointer-events-auto">
            {/* Aksi Penjara */}
          {player.inJail && phase === 'idle' && (
            <div className="flex flex-col gap-2">
              {player.jailCard && (
                <button onClick={useJailCardAction} className="w-full py-2 rounded-xl font-bold text-xs bg-yellow-500 text-black">🃏 Bebas Penjara</button>
              )}
              {player.money >= 500_000 && (
                <button onClick={payJailFineAction} className="w-full py-2 rounded-xl font-bold text-xs bg-red-500 text-white">💸 Bayar 500rb</button>
              )}
              <button onClick={rollDiceAction} className="w-full py-2 rounded-xl font-bold text-xs bg-slate-700 text-white">🎲 Coba Kembar</button>
            </div>
          )}

          {/* Instruksi kocok dadu drag & drop di tengah papan */}
          {phase === 'idle' && !player.inJail && (
            <div className="w-full py-2 bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold text-center text-[10px] animate-pulse">
              🎲 Tarik & Lepas Dadu di Tengah Papan!
            </div>
          )}
          
          {phase === 'moving' && (
            <div className="text-center text-emerald-300 font-bold py-2 animate-pulse text-sm">
              <span className="text-lg">🎲</span> {dice[0]} + {dice[1]}
            </div>
          )}

          {/* Beli Properti */}
          {phase === 'action' && !pendingRent && !activeCard && (() => {
             const sq = BOARD_SQUARES[player.position];
             const isProp = isPurchasable(sq);
             const sqOwner = (ownedProperties as Record<number, string>)[player.position];
             if (isProp) {
               if (!sqOwner) {
                 return (
                   <div className="flex flex-col gap-2">
                     {player.money >= (sq as any).price ? (
                       <button onClick={buyProperty} className="w-full py-2 rounded-xl font-bold text-xs bg-green-500 text-white shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                         ✅ Beli ({(sq as any).price / 1_000_000}M)
                       </button>
                     ) : (
                       <div className="text-red-400 text-[10px] text-center font-bold">Uang tidak cukup!</div>
                     )}
                     <button onClick={passProperty} className="w-full py-2 rounded-xl font-bold text-xs bg-slate-700 text-white hover:scale-[1.02] active:scale-[0.98] transition-all">❌ Lewati</button>
                   </div>
                 );
               } else if (sqOwner === player.id && isProperty(sq)) {
                 const currentHouses = houses[sq.id] || 0;
                 const hasHotel = hotels[sq.id];
                 const cost = currentHouses >= 4 ? sq.hotelCost : sq.houseCost;
                 const canBuild = !hasHotel && player.money >= cost;
                 
                 return (
                   <div className="flex flex-col gap-2">
                     <div className="text-[10px] text-emerald-300 font-bold text-center mb-1">Anda mendarat di properti Anda sendiri.</div>
                     {!hasHotel ? (
                       canBuild ? (
                         <button onClick={() => buyHouse(sq.id)} className="w-full py-2 rounded-xl font-bold text-xs bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                           🏠 Bangun {currentHouses >= 4 ? 'Hotel' : 'Rumah'} ({(cost / 1_000_000).toFixed(1)}M)
                         </button>
                       ) : (
                         <div className="text-red-400 text-[10px] text-center font-bold">Uang tidak cukup untuk membangun!</div>
                       )
                     ) : (
                       <div className="text-emerald-400 text-[10px] text-center font-bold">Properti sudah memiliki Hotel maksimal!</div>
                     )}
                     <button onClick={passProperty} className="w-full py-2 rounded-xl font-bold text-xs bg-indigo-500 text-white hover:scale-[1.02] active:scale-[0.98] transition-all">Selesai</button>
                   </div>
                 );
               }
             }
             return null;
          })()}

          {/* Bayar Sewa / Pajak */}
          {phase === 'action' && pendingRent !== null && pendingRentOwner && !activeCard && (() => {
            const isBank = pendingRentOwner === 'bank';
            const canPay = player.money >= pendingRent;
            const amountText = (pendingRent / 1_000_000).toFixed(1) + 'M';
            const label = isBank ? `Bayar Pajak ${amountText}` : `Bayar Sewa ${amountText}`;
            
            return (
              <div className="flex flex-col gap-2">
                {canPay ? (
                  <button onClick={payRent} className="w-full py-2 rounded-xl font-bold text-xs bg-red-600 text-white animate-pulse">
                    💰 {label}
                  </button>
                ) : (
                  <>
                    <div className="text-red-400 text-[10px] text-center font-bold">Uang tidak cukup! Jual aset bangunan/properti Anda (klik ikon aset di atas) atau nyatakan bangkrut.</div>
                    {renderBankruptcyAction()}
                  </>
                )}
              </div>
            );
          })()}

          {/* Kartu aktif */}
          {activeCard && phase === 'action' && (
            <button onClick={useGameStore.getState().dismissCard} className="w-full py-2 rounded-xl font-bold text-xs bg-blue-500 text-white">
              OK, Mengerti ✓
            </button>
          )}

          {/* Akhir Giliran / Saldo Negatif */}
          {phase === 'end-turn' && (
            player.money >= 0 ? (
              <button onClick={endTurn} className="w-full py-3 rounded-xl font-black text-sm transition-all hover:scale-105 active:scale-95 bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                ➡️ Akhiri Giliran
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-red-400 text-[10px] text-center font-bold animate-pulse">Saldo Negatif! Jual aset bangunan/properti Anda (klik ikon aset di atas) atau nyatakan bangkrut.</div>
                {renderBankruptcyAction()}
              </div>
            )
          )}
          </div>
        ) : (
          <div className="p-3 bg-slate-800/80 rounded-b-2xl border-t border-slate-500/30 text-center text-white/50 text-xs italic pointer-events-auto">
            Menunggu {player.name} bermain...
          </div>
        )
      ) : null}

      {/* Overlay Status (Penjara, dll) */}
      {player.inJail && !isActive && (
        <div className="absolute inset-0 bg-orange-900/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center pointer-events-none border border-orange-500/50">
          <div className="text-orange-200 font-black tracking-widest text-lg rotate-12">DIPENJARA</div>
        </div>
      )}
      {player.isBankrupt && (
        <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center pointer-events-none border-2 border-red-500">
          <div className="text-red-200 font-black tracking-widest text-2xl -rotate-12 border-4 border-red-200 px-4 py-1">BANGKRUT</div>
        </div>
      )}
    </div>
  );
}

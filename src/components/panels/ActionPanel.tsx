import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { BOARD_SQUARES } from '../../data/board';
import { isPurchasable, isProperty } from '../../types/board';
import { getPurchasePrice } from '../../engine/property';
function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function ActionPanel() {
  const {
    players, currentPlayerIndex, phase, dice,
    ownedProperties, pendingRent, pendingRentOwner,
    activeCard, activeCardType,
    rollDiceAction, endTurn, buyProperty, passProperty,
    payRent, payJailFineAction, useJailCardAction, dismissCard,
  } = useGameStore();

  const [isRolling, setIsRolling] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  if (!currentPlayer) return null;

  const currentSquare = BOARD_SQUARES[currentPlayer.position];
  const squareOwner = ownedProperties[currentPlayer.position];

  return (
    <div className="flex flex-col gap-3">
      {/* Info Giliran */}
      <div className="bg-white/10 rounded-xl p-3 border border-white/20">
        <div className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-1">Giliran</div>
        <div className="text-white font-bold text-base">{currentPlayer.name}</div>
        <div className="text-white/70 text-xs">📍 {currentSquare.name}</div>
        <div className="text-green-400 font-semibold text-sm">{fmt(currentPlayer.money)}</div>

        {currentPlayer.inJail && (
          <div className="mt-1 text-orange-400 text-xs font-semibold">
            🔒 Di Penjara — Giliran ke-{currentPlayer.jailTurns + 1}/3
          </div>
        )}
      </div>

      {/* Aksi Penjara */}
      {currentPlayer.inJail && phase === 'idle' && (
        <div className="flex flex-col gap-2">
          <div className="text-white/70 text-xs text-center">Pilih cara keluar penjara:</div>
          {currentPlayer.jailCard && (
            <button
              onClick={useJailCardAction}
              className="w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition-colors"
            >
              🃏 Pakai Kartu Bebas Penjara
            </button>
          )}
          {currentPlayer.money >= 500_000 && (
            <button
              onClick={payJailFineAction}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
            >
              💸 Bayar Denda {fmt(500_000)}
            </button>
          )}
          <button
            onClick={() => rollDiceAction()}
            className="w-full py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-colors"
          >
            🎲 Lempar Dadu (coba kembar)
          </button>
        </div>
      )}

      {/* Beli Properti */}
      {phase === 'action' && !squareOwner && !pendingRent && !activeCard && isPurchasable(currentSquare) && (
        <div className="flex flex-col gap-2">
          <div className="text-white text-center font-semibold text-sm">
            🏠 {currentSquare.name}
          </div>
          <div className="text-yellow-300 text-center font-bold">
            Harga: {fmt(getPurchasePrice(currentPlayer.position))}
          </div>
          {currentPlayer.money >= getPurchasePrice(currentPlayer.position) ? (
            <button
              onClick={buyProperty}
              className="w-full py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
            >
              ✅ Beli Properti
            </button>
          ) : (
            <div className="text-red-400 text-center text-xs">Uangmu tidak cukup!</div>
          )}
          <button
            onClick={passProperty}
            className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
          >
            ❌ Lewati
          </button>
        </div>
      )}

      {/* Bayar Sewa */}
      {phase === 'action' && pendingRent !== null && pendingRentOwner && !activeCard && (
        <div className="flex flex-col gap-2">
          <div className="text-red-400 text-center font-semibold text-sm">
            💸 Kamu harus membayar sewa!
          </div>
          <div className="text-white text-center font-bold text-lg">
            {fmt(pendingRent)}
          </div>
          <div className="text-white/60 text-center text-xs">
            kepada {players.find(p => p.id === pendingRentOwner)?.name}
          </div>
          <button
            onClick={payRent}
            className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-colors"
          >
            💰 Bayar Sekarang
          </button>
        </div>
      )}

      {/* Akhir Giliran */}
      {phase === 'end-turn' && (
        <motion.button
          onClick={endTurn}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base shadow-lg transition-all"
        >
          ➡️ Akhiri Giliran
        </motion.button>
      )}
    </div>
  );
}

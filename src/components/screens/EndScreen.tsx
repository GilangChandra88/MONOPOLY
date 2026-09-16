import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { TOKEN_EMOJIS, TOKEN_BG } from '../../types/game';

function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export default function EndScreen() {
  const { players, winner, resetGame } = useGameStore();
  const winnerPlayer = players.find(p => p.id === winner);

  if (!winnerPlayer) return null;

  const sorted = [...players].sort((a, b) => b.money - a.money);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-900 via-orange-900 to-red-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl text-center"
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>

        <h1 className="text-3xl font-black text-white mb-1">Selamat!</h1>
        <div className={`w-20 h-20 rounded-full ${TOKEN_BG[winnerPlayer.color]} flex items-center justify-center text-4xl mx-auto my-4 shadow-xl`}>
          {TOKEN_EMOJIS[winnerPlayer.color]}
        </div>
        <h2 className="text-2xl font-black text-yellow-400 mb-1">{winnerPlayer.name}</h2>
        <p className="text-white/70 mb-2">memenangkan Monopoli! 🎉</p>
        <p className="text-green-400 font-bold text-lg mb-6">{fmt(winnerPlayer.money)}</p>

        {/* Ranking */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
          <div className="text-white/60 text-xs uppercase font-semibold mb-2">Ranking Akhir</div>
          {sorted.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-2 py-1 ${p.id === winner ? 'opacity-100' : 'opacity-60'}`}>
              <span className="text-white/50 text-sm w-4">{i + 1}.</span>
              <span className={`w-6 h-6 rounded-full ${TOKEN_BG[p.color]} flex items-center justify-center text-sm`}>
                {TOKEN_EMOJIS[p.color]}
              </span>
              <span className="text-white font-semibold text-sm flex-1">{p.name}</span>
              <span className={`font-bold text-sm ${p.isBankrupt ? 'text-red-400' : 'text-green-400'}`}>
                {p.isBankrupt ? '💸 Bangkrut' : fmt(p.money)}
              </span>
            </div>
          ))}
        </div>

        <motion.button
          onClick={resetGame}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-lg shadow-lg"
        >
          🔄 Main Lagi
        </motion.button>
      </motion.div>
    </div>
  );
}

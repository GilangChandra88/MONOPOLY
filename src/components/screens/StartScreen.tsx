import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { TOKEN_COLORS, TOKEN_EMOJIS, TOKEN_BG } from '../../types/game';
import type { TokenColor } from '../../types/game';
import { db, auth } from '../../firebase';
import { doc } from 'firebase/firestore';

interface PlayerConfig {
  name: string;
  color: TokenColor;
}

interface StartScreenProps {
  onCancel: () => void;
}

export default function StartScreen({ onCancel }: StartScreenProps) {
  const { setupGame, setSessionInfo } = useGameStore();
  const [playerCount, setPlayerCount] = useState(2);
  const [sessionName, setSessionName] = useState('');
  const [configs, setConfigs] = useState<PlayerConfig[]>([
    { name: 'Pemain 1', color: 'merah' },
    { name: 'Pemain 2', color: 'biru' },
    { name: 'Pemain 3', color: 'hijau' },
    { name: 'Pemain 4', color: 'kuning' },
    { name: 'Pemain 5', color: 'ungu' },
    { name: 'Pemain 6', color: 'oranye' },
  ]);

  const [isOnline, setIsOnline] = useState(false);

  const usedColors = configs.slice(0, playerCount).map(c => c.color);

  function updateName(index: number, name: string) {
    const updated = [...configs];
    updated[index] = { ...updated[index], name };
    setConfigs(updated);
  }

  function updateColor(index: number, color: TokenColor) {
    const updated = [...configs];
    updated[index] = { ...updated[index], color };
    setConfigs(updated);
  }

  function handleStart() {
    const validConfigs = configs.slice(0, playerCount).map(c => ({
      name: c.name.trim() || `Pemain ${configs.indexOf(c) + 1}`,
      color: c.color,
    }));
    
    // Generate new session ID using Firebase doc ref
    const newSessionRef = doc(db, 'games', 'placeholder').parent; // Get collection ref
    const newDoc = doc(newSessionRef);
    const generatedId = newDoc.id;
    
    const finalSessionName = sessionName.trim() || `Sesi Game ${new Date().toLocaleDateString('id-ID')}`;
    
    setupGame(validConfigs, isOnline, auth.currentUser?.uid);
    setSessionInfo(generatedId, finalSessionName);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-lg border border-white/20 shadow-2xl"
      >
        {/* Tombol Batal */}
        <button onClick={onCancel} className="absolute top-4 left-4 text-white/50 hover:text-white transition-colors">
          ⬅ Kembali
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-2">🎲</div>
          <h1 className="text-4xl font-black text-white tracking-tight">MONOPOLI</h1>
          <p className="text-emerald-300 font-semibold mb-6">🇮🇩 Edisi Indonesia</p>
          
          <input
            type="text"
            value={sessionName}
            onChange={e => setSessionName(e.target.value)}
            maxLength={30}
            className="w-full bg-black/20 text-center text-white placeholder-white/40 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-yellow-400 border border-white/20"
            placeholder="Nama Sesi (opsional)"
          />
        </div>

        {/* Pilih jumlah pemain */}
        <div className="mb-6">
          <label className="text-white/70 text-sm font-semibold uppercase tracking-wide block mb-2">
            Jumlah Pemain
          </label>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`
                  flex-1 py-2 rounded-lg font-bold text-base transition-all
                  ${playerCount === n
                    ? 'bg-yellow-500 text-black shadow-lg scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'}
                `}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Pilihan Mode Online */}
        <div className="mb-6 flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10 cursor-pointer" onClick={() => setIsOnline(!isOnline)}>
          <div>
            <div className="text-white font-bold text-lg flex items-center gap-2">
              🌐 Bermain Online (Multiplayer)
            </div>
            <div className="text-white/60 text-sm mt-1">
              {isOnline ? 'Game online. Tiap slot pemain akan diberi KODE UNDANGAN.' : 'Game lokal (satu perangkat bergantian).'}
            </div>
          </div>
          <div className={`w-14 h-8 rounded-full flex-shrink-0 transition-colors flex items-center px-1 ${isOnline ? 'bg-emerald-500' : 'bg-slate-700'}`}>
            <div className={`w-6 h-6 rounded-full bg-white transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Konfigurasi setiap pemain */}
        <div className="space-y-3 mb-8">
          {Array.from({ length: playerCount }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/10"
            >
              {/* Token preview */}
              <div className={`w-10 h-10 rounded-full ${TOKEN_BG[configs[i].color]} flex items-center justify-center text-xl flex-shrink-0 shadow`}>
                {TOKEN_EMOJIS[configs[i].color]}
              </div>

              {/* Nama */}
              <input
                type="text"
                value={configs[i].name}
                onChange={e => updateName(i, e.target.value)}
                maxLength={15}
                className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-lg px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-yellow-400 border border-white/10"
                placeholder={`Pemain ${i + 1}`}
              />

              {/* Pilih warna */}
              <div className="flex gap-1">
                {TOKEN_COLORS.map(color => {
                  const isUsed = usedColors.includes(color) && configs[i].color !== color;
                  return (
                    <button
                      key={color}
                      onClick={() => !isUsed && updateColor(i, color)}
                      disabled={isUsed}
                      className={`
                        w-6 h-6 rounded-full border-2 transition-all
                        ${TOKEN_BG[color]}
                        ${configs[i].color === color ? 'border-white scale-110' : 'border-transparent opacity-50 hover:opacity-80'}
                        ${isUsed ? 'cursor-not-allowed opacity-20' : 'cursor-pointer'}
                      `}
                      title={color}
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tombol Mulai */}
        <motion.button
          onClick={handleStart}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-black text-xl shadow-lg hover:from-yellow-400 hover:to-orange-400 transition-all"
        >
          🎮 Mulai Bermain!
        </motion.button>

        <p className="text-white/30 text-center text-xs mt-4">
          Modal awal: Rp 15.000.000 per pemain
        </p>
      </motion.div>
    </div>
  );
}

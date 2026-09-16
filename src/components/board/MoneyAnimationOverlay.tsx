import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import type { TransactionAnim } from '../../types/game';

interface ActiveAnim extends TransactionAnim {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export default function MoneyAnimationOverlay() {
  const { lastTransaction } = useGameStore();
  const [activeAnimations, setActiveAnimations] = useState<ActiveAnim[]>([]);

  useEffect(() => {
    if (!lastTransaction) return;

    // Tambahkan animasi baru ke antrean lokal
    const tx = lastTransaction;
    
    // Cari elemen sumber
    const fromEl = tx.fromId === 'bank' 
      ? document.getElementById('board-center') 
      : document.getElementById(`player-panel-${tx.fromId}`);
      
    // Cari elemen tujuan
    const toEl = tx.toId === 'bank' 
      ? document.getElementById('board-center') 
      : document.getElementById(`player-panel-${tx.toId}`);

    if (!fromEl || !toEl) return;

    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;

    const newAnim: ActiveAnim = { ...tx, startX, startY, endX, endY };
    
    setActiveAnimations(prev => [...prev, newAnim]);

    // Hapus animasi setelah selesai (2 detik)
    setTimeout(() => {
      setActiveAnimations(prev => prev.filter(a => a.id !== tx.id));
    }, 2000);

  }, [lastTransaction]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      <AnimatePresence>
        {activeAnimations.map(anim => {
          const isIncome = anim.toId !== 'bank'; // jika ke player, hijau
          const formatAmount = (anim.amount / 1_000_000).toFixed(1) + 'M';
          
          return (
            <motion.div
              key={anim.id}
              initial={{ x: anim.startX, y: anim.startY, opacity: 0, scale: 0.5 }}
              animate={{ 
                x: anim.endX, 
                y: anim.endY, 
                opacity: [0, 1, 1, 0],
                scale: [0.5, 1.2, 1, 0.8]
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute drop-shadow-2xl flex items-center gap-1 font-black"
              style={{
                translateX: '-50%',
                translateY: '-50%',
              }}
            >
              <div className="text-3xl animate-bounce">💵</div>
              <div className={`px-2 py-1 rounded-lg border-2 ${isIncome ? 'bg-green-500 border-green-300' : 'bg-red-500 border-red-300'} text-white shadow-lg text-lg`}>
                {isIncome ? '+' : '-'}{formatAmount}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

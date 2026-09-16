import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';

export default function CardRevealModal() {
  const { activeCard, activeCardType, dismissCard } = useGameStore();

  if (!activeCard) return null;

  const isChance = activeCardType === 'chance';
  
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <AnimatePresence>
        <motion.div
          key={activeCard.id}
          initial={{ scale: 0, rotateY: 180, opacity: 0 }}
          animate={{ scale: 1, rotateY: 0, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 100, duration: 0.8 }}
          className={`
            relative w-[320px] rounded-2xl shadow-2xl overflow-hidden
            flex flex-col border-4
            ${isChance 
              ? 'bg-gradient-to-b from-orange-100 to-orange-200 border-orange-500' 
              : 'bg-gradient-to-b from-blue-100 to-blue-200 border-blue-500'}
          `}
        >
          {/* Header */}
          <div className={`py-4 text-center ${isChance ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
            <h1 className="text-3xl font-black tracking-widest drop-shadow-md">
              {isChance ? 'KESEMPATAN' : 'DANA UMUM'}
            </h1>
            <div className="text-4xl mt-2 drop-shadow-lg">
              {isChance ? '❓' : '♣️'}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
            <p className={`text-xl font-bold leading-relaxed ${isChance ? 'text-orange-950' : 'text-blue-950'}`}>
              {activeCard.text}
            </p>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-white/50 border-t border-black/10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={dismissCard}
              className={`
                w-full py-4 rounded-xl text-lg font-bold text-white shadow-md transition-colors
                ${isChance ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'}
              `}
            >
              Terima Kasih ✓
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

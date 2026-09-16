import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types/game';
import { TOKEN_EMOJIS, TOKEN_BG } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

interface PlayerTokenProps {
  player: Player;
  gridCol: number;
  gridRow: number;
}

export default function PlayerToken({ player, gridCol, gridRow }: PlayerTokenProps) {
  const { players } = useGameStore();
  const currentPlayer = useGameStore(s => s.players[s.currentPlayerIndex]);

  // Hitung semua pemain di posisi yang sama untuk offset
  const playersAtSamePosition = players.filter(p => p.position === player.position && !p.isBankrupt);
  const myIndexAmongShared = playersAtSamePosition.findIndex(p => p.id === player.id);

  if (player.isBankrupt) return null;

  // Offset jika ada banyak pemain di satu petak
  const offsets = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 0, y: 8 },
    { x: 8, y: 8 },
    { x: 4, y: 4 },
    { x: -4, y: 4 },
  ];
  const offset = offsets[myIndexAmongShared] ?? { x: 0, y: 0 };

  const isActive = currentPlayer?.id === player.id;

  return (
    <AnimatePresence>
      <motion.div
        key={`token-wrap-${player.id}`}
        className="absolute z-20 pointer-events-auto"
        style={{
          // Posisi relatif terhadap grid 11x11
          left: `calc(${gridCol} * (100% / 11) + ${offset.x}px)`,
          top: `calc(${gridRow} * (100% / 11) + ${offset.y}px)`,
          width: 'calc(100% / 11)',
          height: 'calc(100% / 11)',
          transformStyle: 'preserve-3d',
        }}
        initial={false}
        animate={{ opacity: 1, left: `calc(${gridCol} * (100% / 11) + ${offset.x}px)`, top: `calc(${gridRow} * (100% / 11) + ${offset.y}px)` }}
        transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          key={`token-inner-${player.id}-${player.position}`}
          className={`
            relative flex items-center justify-center rounded-full
            ${TOKEN_BG[player.color]}
            ${isActive ? 'ring-2 ring-white scale-110' : 'opacity-95'}
            border border-black/20
          `}
          style={{
            width: '1.8rem',
            height: '1.8rem',
            fontSize: '1rem',
            margin: 'auto',
            transform: 'rotateZ(10deg) rotateX(-45deg)',
            transformOrigin: 'bottom center',
            boxShadow: '0 10px 10px rgba(0,0,0,0.6), inset 0 -3px 5px rgba(0,0,0,0.3)',
          }}
          initial={{ translateZ: 10, scale: 0.5 }}
          animate={{ 
            translateZ: [40, 10], 
            scale: isActive ? 1.15 : 1 
          }}
          transition={{
            translateZ: { type: 'spring', stiffness: 300, damping: 15, duration: 0.3 },
            scale: { type: 'spring', stiffness: 300, damping: 15 }
          }}
          title={player.name}
        >
          {/* Base pijakan */}
          <div className="absolute -bottom-1 w-full h-2 bg-black/40 rounded-full blur-[2px]" style={{ transform: 'translateZ(-5px)' }} />
          
          <span className="relative z-10 drop-shadow-md">{TOKEN_EMOJIS[player.color]}</span>

          {/* Indikator penjara */}
          {player.inJail && (
            <span className="absolute -top-3 -right-2 text-sm drop-shadow-lg z-20" style={{ transform: 'translateZ(10px)' }}>🔒</span>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

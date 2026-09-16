import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DiceFaceProps {
  value: number;
}

const DOT_POSITIONS: Record<number, { x: number; y: number }[]> = {
  1: [{ x: 50, y: 50 }],
  2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
  3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
  4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  6: [{ x: 25, y: 20 }, { x: 75, y: 20 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 80 }, { x: 75, y: 80 }],
};

function DiceFace({ value }: DiceFaceProps) {
  const dots = DOT_POSITIONS[value] ?? [];
  return (
    <div className="relative w-10 h-10 bg-white rounded-lg border-2 border-gray-300 shadow-md">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {dots.map((dot, i) => (
          <circle key={i} cx={dot.x} cy={dot.y} r={10} fill="#1e293b" />
        ))}
      </svg>
    </div>
  );
}

interface DiceDisplayProps {
  dice: [number, number];
  isRolling?: boolean;
}

export default function DiceDisplay({ dice, isRolling = false }: DiceDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      {dice.map((value, i) => (
        <motion.div
          key={i}
          animate={isRolling
            ? { rotate: [0, 180, 360, 540, 720], scale: [1, 1.2, 0.9, 1.1, 1] }
            : { rotate: 0, scale: 1 }
          }
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <DiceFace value={value} />
        </motion.div>
      ))}
      <div className="text-white font-bold text-lg">
        = {dice[0] + dice[1]}
      </div>
    </div>
  );
}

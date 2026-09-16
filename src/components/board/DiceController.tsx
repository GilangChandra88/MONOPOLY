import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { auth } from '../../firebase';

function SingleDice({ value, isRolling }: { value: number, isRolling: boolean }) {
  const controls = useAnimation();

  useEffect(() => {
    if (isRolling) {
      // Putaran liar saat kocok
      controls.start({
        rotateX: [0, 720, 1080 + getFinalRotateX(value)],
        rotateY: [0, 1080, 1440 + getFinalRotateY(value)],
        rotateZ: [0, 360, 0],
        transition: { duration: 1.2, ease: "easeOut" }
      });
    } else {
      // Langsung ke hasil akhir jika tidak rolling
      controls.start({
        rotateX: getFinalRotateX(value),
        rotateY: getFinalRotateY(value),
        rotateZ: 0,
        transition: { duration: 0.1 }
      });
    }
  }, [value, isRolling, controls]);

  // Map angka ke rotasi (Muka depan = 1)
  function getFinalRotateX(val: number) {
    switch (val) {
      case 1: return 0;
      case 2: return 0;
      case 3: return -90;
      case 4: return 90;
      case 5: return 0;
      case 6: return 180;
      default: return 0;
    }
  }

  function getFinalRotateY(val: number) {
    switch (val) {
      case 1: return 0;
      case 2: return -90;
      case 3: return 0;
      case 4: return 0;
      case 5: return 90;
      case 6: return 0;
      default: return 0;
    }
  }

  // Render titik dadu
  const Dot = () => <div className="w-[12px] h-[12px] bg-red-600 rounded-full" />;

  const faceStyle = "absolute w-full h-full flex p-2 border-2 border-gray-300 rounded-xl bg-white shadow-inner";

  return (
    <div className="relative w-16 h-16 pointer-events-none" style={{ perspective: '1000px' }}>
      <motion.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={controls}
      >
        {/* 1 (Front) */}
        <div className={`${faceStyle} items-center justify-center`} style={{ transform: 'translateZ(32px)' }}>
          <Dot />
        </div>
        {/* 6 (Back) */}
        <div className={`${faceStyle} flex-col justify-between items-center`} style={{ transform: 'rotateY(180deg) translateZ(32px)' }}>
          <div className="flex w-full justify-between px-1"><Dot /><Dot /></div>
          <div className="flex w-full justify-between px-1"><Dot /><Dot /></div>
          <div className="flex w-full justify-between px-1"><Dot /><Dot /></div>
        </div>
        {/* 2 (Right) */}
        <div className={`${faceStyle} justify-between items-center`} style={{ transform: 'rotateY(90deg) translateZ(32px)' }}>
          <Dot /><Dot />
        </div>
        {/* 5 (Left) */}
        <div className={`${faceStyle} flex-col justify-between`} style={{ transform: 'rotateY(-90deg) translateZ(32px)' }}>
          <div className="flex justify-between w-full"><Dot /><Dot /></div>
          <div className="flex justify-center w-full"><Dot /></div>
          <div className="flex justify-between w-full"><Dot /><Dot /></div>
        </div>
        {/* 3 (Top) */}
        <div className={`${faceStyle} justify-between`} style={{ transform: 'rotateX(90deg) translateZ(32px)' }}>
          <div className="self-start"><Dot /></div>
          <div className="self-center"><Dot /></div>
          <div className="self-end"><Dot /></div>
        </div>
        {/* 4 (Bottom) */}
        <div className={`${faceStyle} flex-col justify-between`} style={{ transform: 'rotateX(-90deg) translateZ(32px)' }}>
          <div className="flex justify-between w-full"><Dot /><Dot /></div>
          <div className="flex justify-between w-full"><Dot /><Dot /></div>
        </div>
      </motion.div>
    </div>
  );
}

export default function DiceController() {
  const { phase, dice, rollDiceAction, resolveRoll, players, currentPlayerIndex, isOnline } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  
  // Deteksi apakah klien ini adalah pemain aktif
  const isMe = !isOnline || currentPlayer?.userId === auth.currentUser?.uid;

  // Tampilkan dadu 3D saat giliran pemain (untuk ditarik), bergulir, atau landed
  const isDraggable = phase === 'idle' && isMe;
  const isVisible = phase === 'idle' || phase === 'rolling' || (phase === 'landed' && dice[0] !== 0);

  // Saat dice digulirkan (phase berubah jadi rolling), jadwalkan penyelesaiannya (resolve)
  // HANYA pemain aktif yang boleh memanggil resolveRoll untuk mencegah balapan (race condition)
  useEffect(() => {
    if (phase === 'rolling' && isMe) {
      const timer = setTimeout(() => {
        resolveRoll();
      }, 1500); // 1.5 detik animasi
      return () => clearTimeout(timer);
    }
  }, [phase, resolveRoll, isMe]);

  if (!isVisible) return null;

  const isRolling = phase === 'rolling';

  return (
    <div className={`absolute inset-0 z-40 flex items-center justify-center ${isDraggable ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      
      {/* Pembungkus yang bisa di-drag */}
      <motion.div
        className="flex gap-6 items-center justify-center relative cursor-grab active:cursor-grabbing"
        drag={isDraggable}
        dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
        dragElastic={0.3}
        onDragEnd={() => {
          if (isDraggable) rollDiceAction();
        }}
        initial={false}
        animate={{ x: 0, y: 0, scale: 1.5, opacity: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      >
        {isDraggable && (
          <div className="absolute -top-16 w-64 text-center left-1/2 -translate-x-1/2 text-white font-black drop-shadow-md text-sm animate-bounce pointer-events-none bg-black/60 px-4 py-1.5 rounded-full border-2 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            Tarik & Lepas Dadu 👆
          </div>
        )}

        {/* Dadu 1 */}
        <motion.div
          initial={isRolling ? { x: -100, y: -50, rotate: -90 } : false}
          animate={{ x: 0, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 50 }}
        >
          <SingleDice value={dice[0] || 6} isRolling={isRolling} />
        </motion.div>

        {/* Dadu 2 */}
        <motion.div
          initial={isRolling ? { x: 100, y: 50, rotate: 90 } : false}
          animate={{ x: 0, y: 0, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 60 }}
        >
          <SingleDice value={dice[1] || 6} isRolling={isRolling} />
        </motion.div>
      </motion.div>
    </div>
  );
}

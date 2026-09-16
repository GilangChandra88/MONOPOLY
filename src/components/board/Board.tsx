import React, { useEffect } from 'react';
import { BOARD_SQUARES, COLOR_MAP } from '../../data/board';
import { useGameStore } from '../../store/useGameStore';
import { isProperty, isRailroad, isUtility } from '../../types/board';
import { calculateRent } from '../../engine/property';
import PlayerToken from './PlayerToken';
import { motion } from 'framer-motion';
import { auth } from '../../firebase';
// ─── Mapping posisi petak ke grid 11x11 ──────────────────────────────────────
// Papan Monopoli adalah grid 11x11. Pojok = 11x11.
// Bottom row: posisi 0-10 (kolom 10→0, baris 10)
// Left col: posisi 11-20 (baris 9→0, kolom 0)
// Top row: posisi 21-30 (kolom 1→10, baris 0)
// Right col: posisi 31-39 (baris 1→9, kolom 10)

function getGridPosition(id: number): { col: number; row: number } {
  if (id >= 0 && id <= 10) {
    return { col: 10 - id, row: 10 }; // bottom
  } else if (id >= 11 && id <= 19) {
    return { col: 0, row: 10 - (id - 10) }; // left
  } else if (id === 20) {
    return { col: 0, row: 0 }; // top-left corner
  } else if (id >= 21 && id <= 29) {
    return { col: id - 20, row: 0 }; // top
  } else if (id === 30) {
    return { col: 10, row: 0 }; // top-right corner
  } else {
    return { col: 10, row: id - 30 }; // right
  }
}

// ─── Warna header properti ───────────────────────────────────────────────────
function getSquareBg(id: number): string {
  const sq = BOARD_SQUARES[id];
  if (isProperty(sq)) return COLOR_MAP[sq.color]?.bg ?? 'bg-gray-200';
  if (isRailroad(sq)) return 'bg-gray-700';
  if (isUtility(sq)) return 'bg-gray-400';
  switch (sq.type) {
    case 'go': return 'bg-green-500';
    case 'jail': return 'bg-orange-300';
    case 'go-to-jail': return 'bg-orange-500';
    case 'free-parking': return 'bg-yellow-400';
    case 'chance': return 'bg-orange-200';
    case 'community-chest': return 'bg-blue-200';
    case 'income-tax': return 'bg-purple-200';
    case 'luxury-tax': return 'bg-purple-400';
    default: return 'bg-white';
  }
}

function getSquareIcon(type: string): string {
  const icons: Record<string, string> = {
    'go': '→',
    'jail': '🚔',
    'go-to-jail': '🚔',
    'free-parking': '🅿️',
    'chance': '?',
    'community-chest': '♣',
    'income-tax': '💰',
    'luxury-tax': '💎',
    'railroad': '🚂',
    'utility': '⚡',
  };
  return icons[type] ?? '';
}

// ─── Komponen 3D Bangunan ──────────────────────────────────────────────────────
function Building3D({ isHotel }: { isHotel: boolean }) {
  const w = isHotel ? 16 : 10;
  const l = isHotel ? 16 : 10;
  const h = isHotel ? 20 : 12;
  const roofBg = isHotel ? 'bg-red-500' : 'bg-green-500';
  const wallBg1 = isHotel ? 'bg-red-600' : 'bg-green-600';
  const wallBg2 = isHotel ? 'bg-red-700' : 'bg-green-700';

  return (
    <div style={{ width: w, height: l, position: 'relative', transformStyle: 'preserve-3d' }}>
      {/* Roof */}
      <div className={`absolute border border-black/40 shadow-sm ${roofBg}`} style={{ width: w, height: l, transform: `translateZ(${h}px)` }} />
      
      {/* Front Wall */}
      <div className={`absolute border border-black/40 ${wallBg1}`} style={{ 
        width: w, height: h, 
        top: 0,
        transformOrigin: 'top',
        transform: `rotateX(-90deg)` 
      }} />
      
      {/* Back Wall */}
      <div className={`absolute border border-black/40 ${wallBg1}`} style={{ 
        width: w, height: h, 
        bottom: 0,
        transformOrigin: 'bottom',
        transform: `rotateX(90deg)` 
      }} />
      
      {/* Left Wall */}
      <div className={`absolute border border-black/40 ${wallBg2}`} style={{ 
        width: h, height: l, 
        left: 0,
        transformOrigin: 'left',
        transform: `rotateY(90deg)` 
      }} />
      
      {/* Right Wall */}
      <div className={`absolute border border-black/40 ${wallBg2}`} style={{ 
        width: h, height: l, 
        right: 0,
        transformOrigin: 'right',
        transform: `rotateY(-90deg)` 
      }} />
    </div>
  )
}

// ─── Komponen Petak ───────────────────────────────────────────────────────────
interface SquareCellProps {
  id: number;
}

function SquareCell({ id }: SquareCellProps) {
  const state = useGameStore();
  const sq = BOARD_SQUARES[id];
  const { houses, hotels, ownedProperties, players } = state;

  const houseCount = houses[id] ?? 0;
  const hasHotel = hotels[id] ?? false;
  const ownerId = ownedProperties[id];
  const owner = players.find(p => p.id === ownerId);

  const isCorner = [0, 10, 20, 30].includes(id);
  const isBottom = id >= 0 && id <= 10;
  const isLeft = id >= 11 && id <= 20;
  const isTop = id >= 21 && id <= 30;
  const isRight = id >= 31 && id <= 39;

  // Properti yang sudah dibeli tampilkan warna pemilik
  // Properti yang sudah dibeli tampilkan border warna pemilik
  const ownerBorderClass = owner
    ? {
        merah: 'border-[4px] border-red-500',
        biru: 'border-[4px] border-blue-500',
        hijau: 'border-[4px] border-green-500',
        kuning: 'border-[4px] border-yellow-400',
        ungu: 'border-[4px] border-purple-500',
        oranye: 'border-[4px] border-orange-500',
      }[owner.color] ?? 'border border-gray-700/50'
    : 'border border-gray-700/50';

  // Menentukan orientasi sel berdasarkan posisinya
  let rotation = '0deg';
  if (isLeft) rotation = '90deg';
  else if (isTop) rotation = '180deg';
  else if (isRight) rotation = '-90deg';
  else if (id === 10) rotation = '45deg'; // Penjara
  else if (id === 20) rotation = '135deg'; // Parkir Gratis
  else if (id === 30) rotation = '-135deg'; // Ke Penjara
  else if (id === 0) rotation = '-45deg'; // Mulai

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        bg-white
        w-full h-full
        ${isCorner ? 'col-span-1 row-span-1' : ''}
        ${ownerBorderClass}
        cursor-pointer hover:brightness-95 transition-all
        select-none
      `}
      style={{ 
        fontSize: '0.55rem', 
        minHeight: 0,
        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.05)',
        transform: `rotate(${rotation})`,
        transformStyle: 'preserve-3d'
      }}
      title={sq.name}
    >
      {/* Color strip untuk properti (selalu di atas/mengarah ke tengah setelah rotasi) */}
      {isProperty(sq) && (
        <div
          className={`absolute z-10 ${COLOR_MAP[sq.color]?.bg} shadow-sm`}
          style={{ 
            height: '25%', 
            width: '100%', 
            top: 0, 
            left: 0,
            transform: 'translateZ(1px)' // Sedikit angkat agar di atas bg
          }}
        />
      )}

      {/* Gambar Latar Belakang (jika ada) */}
      {sq.image && (
        <div className="absolute inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0px)' }}>
          <img src={sq.image} alt={sq.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        </div>
      )}

      {/* Ikon dan Teks (Harus disesuaikan agar putih/terbaca di atas gambar) */}
      <div className="text-center leading-tight z-10 px-0.5 flex flex-col items-center justify-end pb-1 h-full w-full" style={{ transform: 'translateZ(2px)' }}>
        {!isProperty(sq) && !sq.image && (
          <span className="text-sm drop-shadow-md">{getSquareIcon(sq.type)}</span>
        )}
        <span className={`font-bold text-center drop-shadow-md ${sq.image ? 'text-white' : 'text-gray-800'}`} style={{ fontSize: '0.45rem', lineHeight: 1.1, textShadow: sq.image ? '1px 1px 2px black' : 'none' }}>
          {sq.name}
        </span>
        {isProperty(sq) && (
          <span className={sq.image ? 'text-green-300 font-bold drop-shadow-md' : 'text-gray-500'} style={{ fontSize: '0.4rem', textShadow: sq.image ? '1px 1px 2px black' : 'none' }}>
            {(sq.price / 1_000_000).toFixed(1)}jt
          </span>
        )}
        {isRailroad(sq) && (
          <span className={sq.image ? 'text-green-300 font-bold drop-shadow-md' : 'text-gray-500'} style={{ fontSize: '0.4rem', textShadow: sq.image ? '1px 1px 2px black' : 'none' }}>2jt</span>
        )}
      </div>

      {/* Bangunan 3D */}
      {(houseCount > 0 || hasHotel) && (
        <div className="absolute bottom-[20%] left-0 w-full flex justify-center gap-1 z-20 pointer-events-none" style={{ transformStyle: 'preserve-3d', transform: 'translateZ(3px)' }}>
          {hasHotel ? (
            <Building3D isHotel={true} />
          ) : (
            Array.from({ length: houseCount }).map((_, i) => (
              <Building3D key={i} isHotel={false} />
            ))
          )}
        </div>
      )}

      {/* Harga Sewa (di area putih tengah papan) */}
      {ownerId && (isProperty(sq) || isRailroad(sq) || isUtility(sq)) && (
        <div 
          className="absolute pointer-events-none flex justify-center items-center z-50 w-full"
          style={{ 
            top: '-16px', // Geser ke luar kotak, tepat di area putih tengah papan
            transformStyle: 'preserve-3d', 
            transform: 'translateZ(2px)' // Menempel di papan, tidak melayang terlalu tinggi
          }}
        >
          <div className="bg-red-600 text-white font-black rounded text-center px-1 border border-red-800/50 shadow-sm whitespace-nowrap" style={{ fontSize: '0.45rem', textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>
            {isUtility(sq) ? 'Sewa: 4x/10x Dadu' : `Sewa: ${(calculateRent(id, state, 0) / 1_000_000).toFixed(1)}M`}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Board Utama ──────────────────────────────────────────────────────────────
export default function Board() {
  const { players, currentPlayerIndex, phase, movementSteps, isOnline } = useGameStore();

  const currentPlayer = players[currentPlayerIndex];
  const isMe = !isOnline || currentPlayer?.userId === auth.currentUser?.uid;

  // Board.tsx sudah tidak dipakai di versi 3D, jadi tidak perlu loop pergerakan
  useEffect(() => {
  }, [phase, movementSteps, isMe]);

  // Dapatkan posisi pemain saat ini untuk fokus kamera
  const activePosition = currentPlayer ? currentPlayer.position : 0;
  const { col: activeCol, row: activeRow } = getGridPosition(activePosition);

  // Hitung offset agar petak pemain selalu berada di tengah layar
  // Grid 11x11 memiliki titik tengah di col 5, row 5.
  const panX = -(activeCol - 5) * (100 / 11);
  const panY = -(activeRow - 5) * (100 / 11);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" style={{ perspective: '1200px' }}>
      <motion.div
        drag
        dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
        dragElastic={0.1}
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 3D Wrapper dengan Animasi Kamera */}
        <motion.div 
          className="relative w-full max-w-[85vmin] aspect-square"
          animate={{
            x: `${panX}%`,
            y: `${panY}%`,
            scale: 1.65, // Efek Zoom
            rotateX: 42,
            rotateZ: -12
          }}
          transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }} // Sinkron dengan pergerakan bidak
          style={{
            transformStyle: 'preserve-3d',
            boxShadow: '30px 40px 50px rgba(0,0,0,0.7), inset 0 0 0 12px #d4f0d4',
          borderRadius: '16px',
          backgroundColor: '#d4f0d4'
        }}
      >
        {/* Grid papan 11x11 */}
        <div
          className="absolute inset-[12px] grid border-2 border-gray-800 bg-emerald-50"
          style={{
            gridTemplateColumns: 'repeat(11, 1fr)',
            gridTemplateRows: 'repeat(11, 1fr)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Render semua 40 petak */}
          {BOARD_SQUARES.map(sq => {
            const { col, row } = getGridPosition(sq.id);
            return (
              <div
                key={sq.id}
                className="w-full h-full"
                style={{
                  gridColumn: col + 1,
                  gridRow: row + 1,
                  transformStyle: 'preserve-3d',
                }}
              >
                <SquareCell id={sq.id} />
              </div>
            );
          })}

          {/* Tengah papan */}
          <div
            className="flex flex-col items-center justify-center border border-emerald-200"
            style={{
              gridColumn: '2 / 11',
              gridRow: '2 / 11',
              background: 'radial-gradient(circle, #f0fdf4 0%, #dcfce7 100%)'
            }}
          >
            <div className="text-center transform -rotate-12 hover:scale-105 transition-transform duration-500 cursor-default">
              <div className="text-5xl font-black tracking-widest drop-shadow-xl text-green-700 mb-2">
                MONOPOLI
              </div>
              <div className="text-sm text-green-600 font-bold bg-white/50 px-4 py-1 rounded-full shadow-sm inline-block">
                🇮🇩 Edisi Indonesia
              </div>
            </div>
          </div>
        </div>

        {/* Token pemain overlay */}
        <div className="absolute inset-[12px] pointer-events-none" style={{ transformStyle: 'preserve-3d' }}>
          {players.map(player => {
            const { col, row } = getGridPosition(player.position);
            return (
              <PlayerToken
                key={player.id}
                player={player}
                gridCol={col}
                gridRow={row}
              />
            );
          })}
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
}

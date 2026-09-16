import React from 'react';
import Square3D from './Square3D';
import { BOARD_SQUARES } from '../../data/board';
import { Text, Html } from '@react-three/drei';
import Leaderboard from '../board/Leaderboard';
import { useGameStore } from '../../store/useGameStore';

export default function Board3D() {
  const { isOnline } = useGameStore();
  
  return (
    <group>
      {/* 40 Kotak Papan Monopoli */}
      {BOARD_SQUARES.map((_, i) => (
        <Square3D key={i} id={i} />
      ))}

      {/* Tengah Papan */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      
      {/* Teks Tengah */}
      <Text
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, Math.PI / 4]}
        fontSize={2.5}
        color="#166534"
        anchorX="center"
        anchorY="middle"
        fontStyle="italic"
        fontWeight="bold"
        frustumCulled={false}
      >
        MONOPOLI
      </Text>

      {/* Leaderboard Overlay di Pojok Kanan Bawah (Dekat START) - Hanya untuk lokal */}
      {!isOnline && (
        <group position={[6.5, 0.05, 6.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <Html transform center scale={0.08}>
            <Leaderboard />
          </Html>
        </group>
      )}
      
    </group>
  );
}

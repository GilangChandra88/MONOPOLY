import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Sky } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import Board3D from './Board3D';
import PhysicsDiceManager from './PhysicsDice';
import PlayerToken3D from './PlayerToken3D';
import CameraController from './CameraController';
import { useGameStore } from '../../store/useGameStore';
import { auth } from '../../firebase';

export default function GameScene() {
  const { players, phase, movementSteps, isOnline, currentPlayerIndex } = useGameStore();
  const currentPlayer = players[currentPlayerIndex];
  const isMe = !isOnline || currentPlayer?.userId === auth.currentUser?.uid;

  // Pergerakan pemain sekarang ditangani sepenuhnya melalui interpolasi visual di PlayerToken3D
  // tanpa membebani state/Firebase dengan update per-langkah.

  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900 z-0">
      <Canvas
        camera={{ position: [0, 15, 15], fov: 50 }}
        shadows
      >
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} />
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 20, 10]} 
            castShadow 
            intensity={1.5}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          <CameraController />

          <Physics gravity={[0, -40, 0]}>
            <Board3D />
            <PhysicsDiceManager />
          </Physics>

          {players.map((p, i) => (
            <PlayerToken3D key={p.id} playerId={p.id} index={i} totalPlayers={players.length} />
          ))}
        </Suspense>
      </Canvas>
    </div>
  );
}

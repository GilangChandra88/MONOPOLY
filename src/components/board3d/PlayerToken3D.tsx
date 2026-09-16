import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getGridCoordinate, getInterpolatedCoordinate } from './grid';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { Box, Cylinder, Sphere } from '@react-three/drei';

interface TokenProps {
  color: string;
}

// ─── Token Models ────────────────────────────────────────────────────────────

function CarToken({ color }: TokenProps) {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Body */}
      <Box args={[0.8, 0.2, 0.4]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </Box>
      {/* Cabin */}
      <Box args={[0.4, 0.2, 0.3]} position={[-0.1, 0.2, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.2} />
      </Box>
      {/* Wheels */}
      <Cylinder args={[0.15, 0.15, 0.1]} position={[0.25, -0.1, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 0.1]} position={[-0.25, -0.1, 0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 0.1]} position={[0.25, -0.1, -0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </Cylinder>
      <Cylinder args={[0.15, 0.15, 0.1]} position={[-0.25, -0.1, -0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshStandardMaterial color="#111" />
      </Cylinder>
    </group>
  );
}

function HatToken({ color }: TokenProps) {
  return (
    <group position={[0, 0.05, 0]}>
      {/* Brim */}
      <Cylinder args={[0.4, 0.4, 0.1, 32]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Cylinder>
      {/* Crown */}
      <Cylinder args={[0.25, 0.25, 0.5, 32]} position={[0, 0.3, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Cylinder>
    </group>
  );
}

function ShipToken({ color }: TokenProps) {
  return (
    <group position={[0, 0.2, 0]}>
      {/* Hull */}
      <Box args={[1.0, 0.2, 0.3]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Box>
      {/* Smokestacks */}
      <Cylinder args={[0.08, 0.08, 0.3]} position={[-0.2, 0.2, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.3]} position={[0.1, 0.2, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Cylinder>
    </group>
  );
}

function DefaultToken({ color }: TokenProps) {
  return (
    <group position={[0, 0.3, 0]}>
      <Sphere args={[0.3, 32, 32]} castShadow>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.1} />
      </Sphere>
    </group>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function PlayerToken3D({ playerId, index, totalPlayers }: { playerId: string, index: number, totalPlayers: number }) {
  const { players, phase, movementSteps, currentPlayerIndex } = useGameStore();
  const player = players.find(p => p.id === playerId);
  const meshRef = useRef<THREE.Group>(null);

  // References for continuous absolute positioning
  const prevTargetRef = useRef(player ? player.position : 0);
  const accumPosRef = useRef(player ? player.position : 0);
  const visualPosRef = useRef(player ? player.position : 0);

  if (!player) return null;

  const colorHex = {
    merah: '#ef4444',
    biru: '#3b82f6',
    hijau: '#22c55e',
    kuning: '#eab308',
    ungu: '#a855f7',
    oranye: '#f97316',
  }[player.color] || '#ffffff';

  // Offset so players don't overlap perfectly
  const offsetRadius = 0.4;
  const angle = (index / totalPlayers) * Math.PI * 2;

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // 1. Calculate absolute continuous position
    if (player.position !== prevTargetRef.current) {
      const diff = player.position - prevTargetRef.current;
      let actualMove = diff;
      if (diff < -20) actualMove += 40; // Wrapped forward (e.g. 39 -> 0)
      if (diff > 20) actualMove -= 40;  // Wrapped backward (e.g. 0 -> 39)
      
      accumPosRef.current += actualMove;
      prevTargetRef.current = player.position;
    }

    // 2. Move the visual position towards the absolute target at a constant speed
    const diffPos = accumPosRef.current - visualPosRef.current;
    if (Math.abs(diffPos) > 0.01) {
      // Kecepatan gerak: 4 kotak per detik (250ms per kotak)
      const moveSpeed = 4.0 * delta; 
      if (Math.abs(diffPos) < moveSpeed) {
        visualPosRef.current = accumPosRef.current;
      } else {
        visualPosRef.current += Math.sign(diffPos) * moveSpeed;
      }
    } else {
      visualPosRef.current = accumPosRef.current;
    }

    // 3. Map continuous position to 0-40 grid
    let safePos = visualPosRef.current % 40;
    if (safePos < 0) safePos += 40;

    const { x, z } = getInterpolatedCoordinate(safePos);
    
    const targetX = x + Math.cos(angle) * offsetRadius;
    const targetZ = z + Math.sin(angle) * offsetRadius;

    // 4. Parabolic jump animation using the fractional part of visualPos
    // When moving, fraction goes from 0.0 to 1.0 between tiles.
    // Math.sin(fraction * Math.PI) creates a perfect parabola per tile jump.
    let targetY = 0.55; // Base height (permukaan blok + sedikit offset)
    
    const isMoving = phase === 'moving' && movementSteps > 0 && players[currentPlayerIndex].id === playerId;
    if (isMoving) {
      // Get the fractional part of the movement
      const fraction = Math.abs(visualPosRef.current - Math.floor(visualPosRef.current));
      targetY = 0.55 + Math.sin(fraction * Math.PI) * 1.5;
    }

    const currentPos = meshRef.current.position;
    currentPos.x = targetX; // Directly apply because we already lerped visualPos smoothly
    currentPos.z = targetZ;
    // Lerp Y to smooth out the bounce slightly
    currentPos.y = THREE.MathUtils.lerp(currentPos.y, targetY, 0.3);
  });

  // Assign a model based on index
  const renderModel = () => {
    switch (index % 4) {
      case 0: return <CarToken color={colorHex} />;
      case 1: return <HatToken color={colorHex} />;
      case 2: return <ShipToken color={colorHex} />;
      case 3: return <DefaultToken color={colorHex} />;
      default: return <DefaultToken color={colorHex} />;
    }
  };

  return (
    <group ref={meshRef} position={[0, 5, 0]}> {/* Drop in from sky */}
      {renderModel()}
    </group>
  );
}

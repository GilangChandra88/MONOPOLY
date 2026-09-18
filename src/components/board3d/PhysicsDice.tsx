import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, RapierRigidBody } from '@react-three/rapier';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { Text, Box } from '@react-three/drei';
import { auth, rtdb } from '../../firebase';
import { ref, onValue, off, set } from 'firebase/database';

// Shared state untuk live dice syncing tanpa trigger re-render
let lastBroadcastTime = 0;
const remoteDiceState = {
  d1: { p: { x: -2, y: 0.5, z: 0 }, q: { x: 0, y: 0, z: 0, w: 1 } },
  d2: { p: { x: 2, y: 0.5, z: 0 }, q: { x: 0, y: 0, z: 0, w: 1 } },
  isActive: false
};

const getRotationForValue = (val: number): { x: number, y: number, z: number } => {
  switch (val) {
    case 1: return { x: -Math.PI / 2, y: 0, z: 0 };
    case 6: return { x: Math.PI / 2, y: 0, z: 0 };
    case 2: return { x: 0, y: 0, z: Math.PI / 2 };
    case 5: return { x: 0, y: 0, z: -Math.PI / 2 };
    case 3: return { x: 0, y: 0, z: 0 };
    case 4: return { x: Math.PI, y: 0, z: 0 };
    default: return { x: 0, y: 0, z: 0 };
  }
};

// Helper to determine which face is up
const getDiceValue = (quaternion: THREE.Quaternion) => {
  // Define the normals for the 6 faces based on default BoxGeometry orientation
  const faces = [
    { value: 1, normal: new THREE.Vector3(0, 0, 1) },  // Front
    { value: 6, normal: new THREE.Vector3(0, 0, -1) }, // Back
    { value: 2, normal: new THREE.Vector3(1, 0, 0) },  // Right
    { value: 5, normal: new THREE.Vector3(-1, 0, 0) }, // Left
    { value: 3, normal: new THREE.Vector3(0, 1, 0) },  // Top
    { value: 4, normal: new THREE.Vector3(0, -1, 0) }, // Bottom
  ];

  let maxDot = -Infinity;
  let bestValue = 1;
  const upVector = new THREE.Vector3(0, 1, 0);

  for (const face of faces) {
    const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
    const dotProduct = rotatedNormal.dot(upVector);
    if (dotProduct > maxDot) {
      maxDot = dotProduct;
      bestValue = face.value;
    }
  }

  return bestValue;
};

// Custom Face Component to render dots
const DiceFace = ({ value, position, rotation }: { value: number, position: [number, number, number], rotation: [number, number, number] }) => {
  const getDotPositions = (val: number) => {
    const o = 0.25; // offset
    switch (val) {
      case 1: return [[0, 0]];
      case 2: return [[-o, o], [o, -o]];
      case 3: return [[-o, o], [0, 0], [o, -o]];
      case 4: return [[-o, o], [o, o], [-o, -o], [o, -o]];
      case 5: return [[-o, o], [o, o], [0, 0], [-o, -o], [o, -o]];
      case 6: return [[-o, o], [-o, 0], [-o, -o], [o, o], [o, 0], [o, -o]];
      default: return [];
    }
  };

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Render dots */}
      {getDotPositions(value).map((pos, idx) => (
        <mesh key={idx} position={[pos[0], pos[1], 0.01]}>
          <circleGeometry args={[0.08, 32]} />
          <meshBasicMaterial color="#111" />
        </mesh>
      ))}
    </group>
  );
};

function SinglePhysicsDice({ 
  id,
  isDragging,
  dragPoint,
  onSleep,
  isRolling,
  logicalValue
}: { 
  id: number,
  isDragging: boolean,
  dragPoint: THREE.Vector3,
  onSleep: (val: number, pos: [number, number, number], quat: [number, number, number, number]) => void,
  isRolling: boolean,
  logicalValue: number
}) {
  const rigidBody = useRef<RapierRigidBody>(null);
  const prevDragging = useRef(false);
  
  // Track lemparan
  const lastDragPos = useRef(new THREE.Vector3());
  const throwVel = useRef(new THREE.Vector3());
  
  // Deteksi status online untuk sinkronisasi dadu statis
  const isMe = !useGameStore(s => s.isOnline) || useGameStore(s => s.players[s.currentPlayerIndex]?.userId) === auth.currentUser?.uid;

  useFrame((state, delta) => {
    if (!rigidBody.current) return;
    
    const isActive = isDragging || isRolling;

    if (!isMe) {
      if (remoteDiceState.isActive) {
        // Mode observer (live physics syncing)
        const trans = id === 1 ? remoteDiceState.d1 : remoteDiceState.d2;
        if (trans && trans.p && trans.q) {
          // Lerp position for smooth network movement
          const currentPos = rigidBody.current.translation();
          const nextPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)
            .lerp(new THREE.Vector3(trans.p.x, trans.p.y, trans.p.z), 0.2);
          
          rigidBody.current.setNextKinematicTranslation(nextPos);
          
          // Slerp rotation
          const currentQuat = new THREE.Quaternion(
            rigidBody.current.rotation().x,
            rigidBody.current.rotation().y,
            rigidBody.current.rotation().z,
            rigidBody.current.rotation().w
          );
          const targetQuat = new THREE.Quaternion(trans.q.x, trans.q.y, trans.q.z, trans.q.w);
          currentQuat.slerp(targetQuat, 0.2);
          
          rigidBody.current.setNextKinematicRotation(currentQuat);
        }
      } else {
        // Mode statis saat tidak bergerak (menampilkan hasil akhir atau idle)
        const dicePositions = useGameStore.getState().localDicePositions;
        
        let targetPos = { x: id === 1 ? -2 : 2, y: 0.5, z: 0 };
        let targetRotQuat: THREE.Quaternion | null = null;
        
        if (dicePositions && dicePositions.d1 && dicePositions.d2) {
           const posArray = id === 1 ? dicePositions.d1.pos : dicePositions.d2.pos;
           const quatArray = id === 1 ? dicePositions.d1.quat : dicePositions.d2.quat;
           
           if (posArray) targetPos = { x: posArray[0], y: posArray[1], z: posArray[2] };
           if (quatArray) targetRotQuat = new THREE.Quaternion(quatArray[0], quatArray[1], quatArray[2], quatArray[3]);
        }

        rigidBody.current.setNextKinematicTranslation(targetPos);
        
        if (targetRotQuat) {
          rigidBody.current.setNextKinematicRotation(targetRotQuat);
        } else {
          const targetRot = getRotationForValue(logicalValue);
          const euler = new THREE.Euler(targetRot.x, targetRot.y, targetRot.z);
          rigidBody.current.setNextKinematicRotation(new THREE.Quaternion().setFromEuler(euler));
        }
      }
      return;
    }

    // --- LOGIC UNTUK PEMAIN AKTIF (isMe) ---
    if (isDragging) {
      const offset = id === 1 ? -0.7 : 0.7;
      const targetPos = new THREE.Vector3(dragPoint.x + offset, 4, dragPoint.z);
      const currentPos = rigidBody.current.translation();
      
      if (delta > 0) {
        const vel = targetPos.clone().sub(lastDragPos.current).divideScalar(delta);
        vel.clampLength(0, 50);
        throwVel.current.lerp(vel, 0.3);
      }
      lastDragPos.current.copy(targetPos);
      
      const nextPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(targetPos, 0.2);
      
      rigidBody.current.setTranslation(nextPos, true);
      rigidBody.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      
      rigidBody.current.setAngvel({
        x: (Math.random() - 0.5) * 20,
        y: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20
      }, true);
    }

    // Broadcast posisi ke pemain lain
    if (isActive) {
      const p = rigidBody.current.translation();
      const q = rigidBody.current.rotation();
      if (id === 1) remoteDiceState.d1 = { p, q };
      if (id === 2) remoteDiceState.d2 = { p, q };
      remoteDiceState.isActive = true;

      // Cukup 1 dadu (id=1) yang bertanggung jawab upload agar tidak dobel
      if (id === 1) {
        const now = Date.now();
        if (now - lastBroadcastTime > 50) { // ~20fps
          lastBroadcastTime = now;
          const sessionId = useGameStore.getState().sessionId;
          if (sessionId) {
            set(ref(rtdb, `live_dice/${sessionId}`), {
              d1: remoteDiceState.d1,
              d2: remoteDiceState.d2,
              isActive: true
            });
          }
        }
      }
    } else {
      // Saat baru saja berhenti, pastikan observer tahu bahwa dadu sudah statis
      if (remoteDiceState.isActive && id === 1) {
        remoteDiceState.isActive = false;
        const sessionId = useGameStore.getState().sessionId;
        if (sessionId) {
          set(ref(rtdb, `live_dice/${sessionId}`), { isActive: false });
        }
      }
    }
  });

  useEffect(() => {
    if (prevDragging.current && !isDragging) {
      if (rigidBody.current) {
        // Ambil kecepatan terakhir saat dilepas
        const vx = throwVel.current.x * 0.8;
        const vz = throwVel.current.z * 0.8;
        const vy = -10; // Gaya lempar ke bawah

        rigidBody.current.setLinvel({
          x: vx,
          y: vy,
          z: vz
        }, true);

        // Putaran dadu mengikuti arah lemparan (rotasi fisik natural)
        rigidBody.current.setAngvel({
          x: (Math.random() - 0.5) * 10 + vz * 1.5,
          y: (Math.random() - 0.5) * 20,
          z: (Math.random() - 0.5) * 10 - vx * 1.5
        }, true);
      }
    }
    prevDragging.current = isDragging;
  }, [isDragging]);

  const physicsRollTrigger = useGameStore(s => s.physicsRollTrigger);
  const prevTrigger = useRef(physicsRollTrigger);

  useEffect(() => {
    // Hanya picu roll otomatis JIKA trigger angkanya BENAR-BENAR BERUBAH (baru ditekan),
    // BUKAN hanya karena isRolling berubah (saat user melempar manual).
    if (physicsRollTrigger > 0 && physicsRollTrigger !== prevTrigger.current && isRolling && rigidBody.current && isMe) {
      prevTrigger.current = physicsRollTrigger;
      
      // Lemparan otomatis via tombol UI (programmatic roll)
      const currentPos = rigidBody.current.translation();
      
      // Melompat dari posisinya saat ini (melanjutkan posisi terakhir)
      rigidBody.current.setTranslation({ 
        x: currentPos.x, 
        y: currentPos.y + 3 + Math.random() * 2, 
        z: currentPos.z 
      }, true);
      
      rigidBody.current.setLinvel({
        x: (Math.random() - 0.5) * 15,
        y: -5, // Sedikit lemparan ke atas/bawah
        z: (Math.random() - 0.5) * 15
      }, true);
      rigidBody.current.setAngvel({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 30,
        z: (Math.random() - 0.5) * 30
      }, true);
    }
  }, [physicsRollTrigger, isRolling, id, isMe]);

  const handleSleep = () => {
    if (isRolling && !isDragging && isMe) {
      if (rigidBody.current) {
        const q = rigidBody.current.rotation();
        const quaternion = new THREE.Quaternion(q.x, q.y, q.z, q.w);
        const val = getDiceValue(quaternion);
        
        const pos = rigidBody.current.translation();
        onSleep(val, [pos.x, pos.y, pos.z], [q.x, q.y, q.z, q.w]);
      }
    }
  };

  // Tentukan posisi awal (jika merefresh halaman, gunakan posisi terakhir)
  const initialPos = useRef<[number, number, number] | undefined>(undefined);
  const initialRot = useRef<[number, number, number] | undefined>(undefined);
  
  if (!initialPos.current) {
    const dicePositions = useGameStore.getState().localDicePositions;
    if (dicePositions && dicePositions.d1 && dicePositions.d2) {
      const posArray = id === 1 ? dicePositions.d1.pos : dicePositions.d2.pos;
      const quatArray = id === 1 ? dicePositions.d1.quat : dicePositions.d2.quat;
      
      if (posArray) {
        initialPos.current = [posArray[0], posArray[1], posArray[2]];
      }
      if (quatArray) {
        // Convert quat back to euler for the RigidBody rotation prop
        const q = new THREE.Quaternion(quatArray[0], quatArray[1], quatArray[2], quatArray[3]);
        const euler = new THREE.Euler().setFromQuaternion(q);
        initialRot.current = [euler.x, euler.y, euler.z];
      }
    }
    if (!initialPos.current) {
      initialPos.current = [id === 1 ? -2 : 2, 0.5, 0];
    }
    if (!initialRot.current) {
      const defaultRot = getRotationForValue(logicalValue);
      initialRot.current = [defaultRot.x, defaultRot.y, defaultRot.z];
    }
  }

  return (
    <RigidBody
      ref={rigidBody}
      type={isMe ? "dynamic" : "kinematicPosition"}
      position={initialPos.current}
      rotation={initialRot.current}
      colliders="cuboid"
      restitution={0.4}
      friction={0.8}
      onSleep={handleSleep}
    >
      <group scale={[0.5, 0.5, 0.5]}>
        <Box args={[1, 1, 1]} castShadow receiveShadow>
          <meshStandardMaterial color="#ffffff" />
        </Box>
        <DiceFace value={1} position={[0, 0, 0.51]} rotation={[0, 0, 0]} />
        <DiceFace value={6} position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]} />
        <DiceFace value={2} position={[0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
        <DiceFace value={5} position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]} />
        <DiceFace value={3} position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        <DiceFace value={4} position={[0, -0.51, 0]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
    </RigidBody>
  );
}

export default function PhysicsDiceManager() {
  const { phase, dice, rollDiceAction, resolveRollWithPhysics, players, currentPlayerIndex, isOnline, isDraggingDice, setIsDraggingDice } = useGameStore();
  
  const [d1Result, setD1Result] = useState<{val: number, pos: [number, number, number], quat: [number, number, number, number]} | null>(null);
  const [d2Result, setD2Result] = useState<{val: number, pos: [number, number, number], quat: [number, number, number, number]} | null>(null);
  
  const [dragPoint, setDragPoint] = useState(new THREE.Vector3(0, 3, 0));

  const currentPlayer = players[currentPlayerIndex];
  const sessionId = useGameStore(s => s.sessionId);
  const isMe = !isOnline || currentPlayer?.userId === auth.currentUser?.uid;

  // Sinkronisasi dadu live untuk observer
  useEffect(() => {
    if (isOnline && sessionId && !isMe) {
      const diceRef = ref(rtdb, `live_dice/${sessionId}`);
      const unsub = onValue(diceRef, (snap) => {
        const val = snap.val();
        if (val) {
          if (val.isActive !== undefined) remoteDiceState.isActive = val.isActive;
          if (val.d1) remoteDiceState.d1 = val.d1;
          if (val.d2) remoteDiceState.d2 = val.d2;
        }
      });
      return () => off(diceRef, 'value', unsub);
    }
  }, [isOnline, sessionId, isMe]);

  const colorHex: Record<string, string> = {
    merah: '#ef4444',
    biru: '#3b82f6',
    hijau: '#16a34a',
    kuning: '#facc15',
    ungu: '#9333ea',
    oranye: '#f97316',
  };
  const indicatorColor = currentPlayer ? colorHex[currentPlayer.color] : '#ffffff';

  const isIdle = phase === 'idle' && isMe;
  const isRolling = phase === 'rolling';

  const dragTimer = useRef<any>(null);
  const startPoint = useRef(new THREE.Vector2());
  const hasMoved = useRef(false);

  // Referensi untuk Indikator Tahan (Hold)
  const isHoldingRef = useRef(false);
  const holdStartTimeRef = useRef(0);
  const holdStartPos3DRef = useRef(new THREE.Vector3());
  const indicatorGroupRef = useRef<THREE.Group>(null);
  const progressCircleRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (indicatorGroupRef.current && progressCircleRef.current) {
      if (isHoldingRef.current && !isDraggingDice) {
        const elapsed = performance.now() - holdStartTimeRef.current;
        let progress = elapsed / 500;
        if (progress > 1) progress = 1;

        indicatorGroupRef.current.visible = true;
        indicatorGroupRef.current.position.copy(holdStartPos3DRef.current);
        indicatorGroupRef.current.position.y = 0.65; // Sedikit di atas invisible plane
        
        progressCircleRef.current.scale.setScalar(Math.max(progress, 0.001));
      } else {
        indicatorGroupRef.current.visible = false;
      }
    }
  });

  const handlePointerDown = (e: any) => {
    if (!isIdle) return;
    
    startPoint.current.set(e.clientX, e.clientY);
    hasMoved.current = false;
    
    isHoldingRef.current = true;
    holdStartTimeRef.current = performance.now();
    holdStartPos3DRef.current.copy(e.point);
    
    dragTimer.current = setTimeout(() => {
      if (!hasMoved.current) {
        setIsDraggingDice(true);
        setD1Result(null);
        setD2Result(null);
        setDragPoint(e.point);
      }
      isHoldingRef.current = false;
      dragTimer.current = null;
    }, 500);
    // Hapus e.stopPropagation() agar camera controls masih menerima event klik
  };

  const handlePointerMove = (e: any) => {
    if (isDraggingDice) {
      setDragPoint(e.point);
      e.stopPropagation();
    } else if (dragTimer.current) {
      const dist = startPoint.current.distanceTo(new THREE.Vector2(e.clientX, e.clientY));
      if (dist > 10) { // Toleransi gerakan 10 pixel
        hasMoved.current = true;
        isHoldingRef.current = false;
        clearTimeout(dragTimer.current);
        dragTimer.current = null;
      }
    }
  };

  const handlePointerUp = (e: any) => {
    isHoldingRef.current = false;
    
    if (dragTimer.current) {
      clearTimeout(dragTimer.current);
      dragTimer.current = null;
    }

    if (isDraggingDice) {
      setIsDraggingDice(false);
      rollDiceAction(); // Ubah phase jadi 'rolling'
      e.stopPropagation();
    }
  };

  useEffect(() => {
    if (isRolling && d1Result !== null && d2Result !== null && isMe) {
      const timer = setTimeout(() => {
        resolveRollWithPhysics(
          d1Result.val, 
          d2Result.val,
          { 
            d1: { pos: d1Result.pos, quat: d1Result.quat }, 
            d2: { pos: d2Result.pos, quat: d2Result.quat } 
          }
        );
      }, 500); // 500ms diam setelah jatuh, lalu mulai sekuens kamera
      return () => clearTimeout(timer);
    }
  }, [d1Result, d2Result, isRolling, isMe, resolveRollWithPhysics]);

  useEffect(() => {
    if (phase !== 'rolling' && phase !== 'dice-result-1' && phase !== 'dice-result-2' && phase !== 'pre-moving') {
      setD1Result(null);
      setD2Result(null);
    }
  }, [phase]);

  return (
    <>
      <RigidBody type="fixed" restitution={0.4} friction={0.5}>
        <Box position={[0, 0, 0]} args={[40, 1, 40]}>
          <meshBasicMaterial transparent opacity={0} />
        </Box>
      </RigidBody>
      
      {/* Invisible walls to keep dice on board */}
      <RigidBody type="fixed" position={[0, 5, -12]}><Box args={[24, 10, 1]}><meshBasicMaterial transparent opacity={0}/></Box></RigidBody>
      <RigidBody type="fixed" position={[0, 5, 12]}><Box args={[24, 10, 1]}><meshBasicMaterial transparent opacity={0}/></Box></RigidBody>
      <RigidBody type="fixed" position={[-12, 5, 0]}><Box args={[1, 10, 24]}><meshBasicMaterial transparent opacity={0}/></Box></RigidBody>
      <RigidBody type="fixed" position={[12, 5, 0]}><Box args={[1, 10, 24]}><meshBasicMaterial transparent opacity={0}/></Box></RigidBody>

      <SinglePhysicsDice 
        id={1} 
        isDragging={isDraggingDice} 
        dragPoint={dragPoint} 
        onSleep={(val, pos, quat) => setD1Result({val, pos, quat})} 
        isRolling={phase === 'rolling' || phase === 'dice-result-1' || phase === 'dice-result-2' || phase === 'pre-moving'} 
        logicalValue={dice[0]}
      />
      
      <SinglePhysicsDice 
        id={2} 
        isDragging={isDraggingDice} 
        dragPoint={dragPoint} 
        onSleep={(val, pos, quat) => setD2Result({val, pos, quat})} 
        isRolling={phase === 'rolling' || phase === 'dice-result-1' || phase === 'dice-result-2' || phase === 'pre-moving'}
        logicalValue={dice[1]}
      />

      {/* Visual Indicator saat user menahan klik */}
      <group ref={indicatorGroupRef} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
        {/* Lingkaran statis sebagai background (garis tepi luar) */}
        <mesh>
          <ringGeometry args={[1.4, 1.5, 32]} />
          <meshBasicMaterial color={indicatorColor} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Lingkaran dalam yang membesar/mengisi perlahan */}
        <mesh ref={progressCircleRef}>
          <circleGeometry args={[1.35, 32]} />
          <meshBasicMaterial color={indicatorColor} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Invisible drag area to trigger roll */}
      {isIdle && (
        <mesh 
          position={[0, 0.6, 0]} 
          rotation={[-Math.PI / 2, 0, 0]} 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerOut={handlePointerUp}
        >
          <planeGeometry args={[25, 25]} />
          <meshBasicMaterial transparent opacity={0} />
          {!isDraggingDice && (
            <Text position={[0, 0, 0.1]} fontSize={1} color="white" rotation={[0, 0, 0]} outlineWidth={0.05} outlineColor="black">
              KLIK TAHAN (0.5d) UNTUK MENGAMBIL DADU
            </Text>
          )}
        </mesh>
      )}
    </>
  );
}

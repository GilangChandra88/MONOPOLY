import React, { useRef, useState, useEffect } from 'react';
import { Text, Box, Html, Billboard, Cylinder, Sphere } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BOARD_SQUARES, COLOR_MAP } from '../../data/board';
import { getGridCoordinate } from './grid';
import { isProperty, isPurchasable } from '../../types/board';
import { useGameStore } from '../../store/useGameStore';
import { calculateRent } from '../../engine/property';
import * as THREE from 'three';

// Komponen animasi saat bangunan baru dibangun (muncul dengan pop & asap)
function AnimatedBuilding({ children, isNew }: { children: React.ReactNode, isNew: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const smokeRef = useRef<THREE.Group>(null);
  const [animTime, setAnimTime] = useState(isNew ? 0 : 2); // 0 = start anim, 2 = done

  useFrame((state, delta) => {
    if (animTime < 2) {
      setAnimTime(prev => Math.min(prev + delta * 2, 2)); // 1 detik animasi
      
      // Scale building (bounce effect)
      if (groupRef.current) {
        const scale = animTime < 0.5 
          ? Math.sin(animTime * Math.PI) * 1.2 
          : 1 + Math.max(0, Math.sin((animTime - 0.5) * Math.PI * 2)) * 0.2 * (1 - animTime/2);
        groupRef.current.scale.set(scale, scale, scale);
      }

      // Smoke particles expanding & fading
      if (smokeRef.current) {
        smokeRef.current.scale.set(1 + animTime * 2, 1 + animTime * 2, 1 + animTime * 2);
        smokeRef.current.position.y = animTime * 1.5;
        smokeRef.current.children.forEach(child => {
          const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
          m.opacity = Math.max(0, 1 - animTime);
        });
      }
    } else if (groupRef.current?.scale.x !== 1) {
      groupRef.current?.scale.set(1, 1, 1);
    }
  });

  return (
    <group>
      <group ref={groupRef} scale={isNew ? 0 : 1}>
        {children}
      </group>
      {animTime < 1 && isNew && (
        <group ref={smokeRef}>
          <Sphere args={[0.2, 8, 8]} position={[0.1, 0, 0.1]}>
            <meshStandardMaterial color="#dddddd" transparent opacity={0.8} />
          </Sphere>
          <Sphere args={[0.2, 8, 8]} position={[-0.1, 0, -0.1]}>
            <meshStandardMaterial color="#cccccc" transparent opacity={0.8} />
          </Sphere>
          <Sphere args={[0.25, 8, 8]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color="#eeeeee" transparent opacity={0.8} />
          </Sphere>
        </group>
      )}
    </group>
  );
}

// Komponen animasi melayang & berputar untuk ikon
function FloatingAnim({ children, floatSpeed = 2, floatHeight = 0.1, spinSpeed = 0.02 }: { children: React.ReactNode, floatSpeed?: number, floatHeight?: number, spinSpeed?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * floatSpeed) * floatHeight;
      ref.current.rotation.y += spinSpeed;
    }
  });
  return <group ref={ref}>{children}</group>;
}

// Custom hook untuk membuat tekstur dari teks (sangat stabil, anti Z-fighting/Frustum Culling)
function useTextTexture(name: string, rentStr: string | null, ownerId: string | null) {
  const [texture, setTexture] = React.useState<THREE.CanvasTexture | null>(null);

  React.useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 512, 512);

    const drawText = (text: string, x: number, y: number, fontSize: number, fillStyle: string) => {
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const maxW = 460; // 90% of 512

      ctx.lineWidth = fontSize * 0.15;
      ctx.strokeStyle = 'black';
      ctx.lineJoin = 'round';
      ctx.strokeText(text, x, y, maxW);
      
      ctx.fillStyle = fillStyle;
      ctx.fillText(text, x, y, maxW);
    };

    drawText(name, 256, 256, 50, 'white');

    if (rentStr) {
      drawText(rentStr, 256, 422, 45, ownerId ? '#ef4444' : '#86efac');
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    setTexture(tex);

    return () => tex.dispose();
  }, [name, rentStr, ownerId]);

  return texture;
}

// Custom hook untuk meload tekstur dengan aman (anti-crash jika gagal)
function useSafeTexture(url: string | undefined) {
  const [texture, setTexture] = React.useState<THREE.Texture | null>(null);

  React.useEffect(() => {
    if (!url) return;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    
    // Gunakan URL langsung, Wikimedia Commons mendukung CORS.
    // Jika menggunakan proxy pihak ketiga (wsrv.nl / allorigins), kadang ditolak (403) oleh Wikimedia.
    const directUrl = url;

    loader.load(
      directUrl,
      (tex) => {
        // Biar gambar tidak terbalik
        tex.colorSpace = THREE.SRGBColorSpace;
        setTexture(tex);
      },
      undefined,
      (err) => console.warn("Failed to load texture:", url)
    );
  }, [url]);

  return texture;
}

// ─── KOMPONEN IKON 3D ─────────────────────────────────────────────────────────

function ChestIcon() {
  return (
    <group position={[0, 0.6, 0]}>
      <FloatingAnim floatHeight={0.05} spinSpeed={0.01}>
        <Box args={[0.8, 0.5, 0.6]} position={[0, 0.25, 0]} castShadow>
          <meshStandardMaterial color="#8b4513" /> {/* Brown wood */}
        </Box>
        <Cylinder args={[0.3, 0.3, 0.8, 16, 1, false, 0, Math.PI]} rotation={[0, 0, -Math.PI / 2]} position={[0, 0.5, 0]} castShadow>
          <meshStandardMaterial color="#a0522d" /> {/* Lighter wood lid */}
        </Cylinder>
        <Box args={[0.1, 0.1, 0.1]} position={[0, 0.45, 0.3]} castShadow>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} /> {/* Gold lock */}
        </Box>
      </FloatingAnim>
    </group>
  );
}

function QuestionIcon() {
  return (
    <group position={[0, 0.8, 0]}>
      <FloatingAnim spinSpeed={0.02}>
        <Billboard>
          <Text fontSize={0.8} color="#f59e0b" outlineWidth={0.05} outlineColor="white" fontWeight="bold">
            ?
          </Text>
        </Billboard>
      </FloatingAnim>
    </group>
  );
}

function CoinStackIcon() {
  return (
    <group position={[0, 0.6, 0]}>
      <FloatingAnim spinSpeed={0.01}>
        <Cylinder args={[0.3, 0.3, 0.1, 16]} position={[0, 0.05, 0]} castShadow>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.1, 16]} position={[0.1, 0.2, -0.1]} castShadow>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </Cylinder>
        <Cylinder args={[0.3, 0.3, 0.1, 16]} position={[-0.1, 0.35, 0.1]} castShadow>
          <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </FloatingAnim>
    </group>
  );
}

function GoIcon() {
  return (
    <group position={[0, 0.8, 0]}>
      <FloatingAnim floatHeight={0.15} spinSpeed={0.02}>
        <Billboard>
          <Text fontSize={0.7} color="#22c55e" outlineWidth={0.05} outlineColor="white" fontWeight="bold">
            START
          </Text>
        </Billboard>
      </FloatingAnim>
    </group>
  );
}

function JailBarsIcon() {
  return (
    <group position={[0, 0.5, 0]}>
      <FloatingAnim floatHeight={0.02} spinSpeed={0}>
        <Box args={[1.2, 0.1, 0.1]} position={[0, 0.05, 0.4]} castShadow>
          <meshStandardMaterial color="#555555" />
        </Box>
        <Box args={[1.2, 0.1, 0.1]} position={[0, 0.85, 0.4]} castShadow>
          <meshStandardMaterial color="#555555" />
        </Box>
        {[-0.4, -0.15, 0.15, 0.4].map(x => (
          <Cylinder key={x} args={[0.04, 0.04, 0.8]} position={[x, 0.45, 0.4]} castShadow>
            <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
          </Cylinder>
        ))}
      </FloatingAnim>
    </group>
  );
}

function SirenIcon() {
  return (
    <group position={[0, 0.6, 0]}>
      <FloatingAnim floatHeight={0.05} spinSpeed={0.05}>
        <Cylinder args={[0.3, 0.4, 0.2, 16]} position={[0, 0.1, 0]} castShadow>
          <meshStandardMaterial color="#1e293b" />
        </Cylinder>
        <Cylinder args={[0.25, 0.25, 0.4, 16]} position={[0, 0.4, 0]} castShadow>
          <meshStandardMaterial color="#ef4444" transparent opacity={0.8} />
        </Cylinder>
        <Sphere args={[0.15, 16, 16]} position={[0, 0.4, 0]}>
          <meshBasicMaterial color="#ffffff" />
        </Sphere>
      </FloatingAnim>
    </group>
  );
}

function ParkingIcon() {
  return (
    <group position={[0, 0.8, 0]}>
      <FloatingAnim spinSpeed={0.02}>
        <Billboard>
          <Text fontSize={0.8} color="#3b82f6" outlineWidth={0.05} outlineColor="white" fontWeight="bold">
            P
          </Text>
        </Billboard>
      </FloatingAnim>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Square3D({ id }: { id: number }) {
  const sq = BOARD_SQUARES[id];
  const { x, z, rotation } = getGridCoordinate(id);
  
  // Granular subscriptions to prevent re-renders when unrelated state changes (like player moving)
  const ownerId = useGameStore(s => s.ownedProperties[id]);
  const ownerColor = useGameStore(s => s.players.find(p => p.id === ownerId)?.color);
  const houseCount = useGameStore(s => s.houses[id] || 0);
  const hasHotel = useGameStore(s => s.hotels[id] || false);
  
  const prevHouseCount = useRef(houseCount);
  const prevHasHotel = useRef(hasHotel);
  
  React.useEffect(() => {
    prevHouseCount.current = houseCount;
    prevHasHotel.current = hasHotel;
  }, [houseCount, hasHotel]);

  const rentString = useGameStore(s => {
    if (!ownerId) return null;
    if (sq.type === 'utility') {
      const ownerPlayer = s.players.find((p: any) => p.id === ownerId);
      const ownedUtils = ownerPlayer?.properties.filter((pId: number) => {
        const sSq = BOARD_SQUARES[pId];
        return sSq && sSq.type === 'utility';
      }).length || 1;
      return `Sewa: ${ownedUtils > 1 ? '10x' : '4x'} Dadu`;
    }
    const rent = calculateRent(id, s, 0);
    const fmt = rent >= 1_000_000 ? `${(rent / 1_000_000).toFixed(1)}M` : `${rent / 1_000}K`;
    return `Sewa: Rp ${fmt}`;
  });

  // Dimensions of the block
  const w = 2.0; // width (x-axis)
  const l = 2.0; // length (z-axis)
  const h = 0.5; // height (y-axis)

  // Block color
  let blockColor = '#ffffff';
  let stripColor = '#444444';

  if (isProperty(sq)) {
    // Tailwind color mapping to hex
    const colorHexMap: Record<string, string> = {
      merah: '#ef4444',
      biru: '#3b82f6',
      hijau: '#22c55e',
      kuning: '#eab308',
      ungu: '#a855f7',
      oranye: '#f97316',
      biruMuda: '#38bdf8',
      coklat: '#8b5a2b'
    };
    stripColor = colorHexMap[sq.color] || stripColor;
  }

  // Owner indicator
  const ownerHexMap: Record<string, string> = {
    merah: '#ef4444',
    biru: '#3b82f6',
    hijau: '#22c55e',
    kuning: '#eab308',
    ungu: '#a855f7',
    oranye: '#f97316',
  };
  const ownerBorderColor = ownerColor ? ownerHexMap[ownerColor] : null;

  const tex = useSafeTexture(sq.image);
  
  const rentText = (() => {
    if (!isPurchasable(sq)) return null;
    if (ownerId) return rentString;
    const price = sq.price;
    const fmt = price >= 1_000_000 ? `${(price / 1_000_000).toFixed(1)}M` : `${price / 1_000}K`;
    return `Harga: Rp ${fmt}`;
  })();

  const textTex = useTextTexture(sq.name, rentText, ownerId);

  return (
    <group position={[x, 0, z]} rotation={[0, rotation, 0]}>
      {/* Base Block */}
      <Box args={[w, h, l]} position={[0, h / 2, 0]}>
        <meshStandardMaterial color={ownerBorderColor ? ownerBorderColor : blockColor} />
      </Box>

      {/* Surface (Top Face) */}
      <mesh position={[0, h + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w - 0.1, l - 0.1]} />
        {tex ? (
          <meshBasicMaterial map={tex} color="#ffffff" />
        ) : (
          <meshStandardMaterial color="#ffffff" />
        )}
      </mesh>

      {/* Color Strip (if property) */}
      {isProperty(sq) && (
        <mesh position={[0, h + 0.02, -l/2 + 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w - 0.1, 0.4]} />
          <meshBasicMaterial color={stripColor} />
        </mesh>
      )}

      {/* Baked Text Texture Plane */}
      {textTex && (
        <mesh position={[0, h + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w, l]} />
          <meshBasicMaterial 
            map={textTex} 
            transparent={true} 
            depthWrite={false} 
          />
        </mesh>
      )}

      {/* Houses / Hotels */}
      {hasHotel ? (
        <group position={[0, h + 0.02, -l/2 + 0.3]}>
          <AnimatedBuilding isNew={!prevHasHotel.current}>
            {/* Hotel Base */}
            <Box args={[0.7, 0.4, 0.4]} position={[0, 0.2, 0]} castShadow>
              <meshStandardMaterial color="#ef4444" /> {/* Red Hotel */}
            </Box>
            {/* Hotel Roof */}
            <mesh position={[0, 0.4 + 0.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
              <cylinderGeometry args={[0.0, 0.45, 0.2, 4]} />
              <meshStandardMaterial color="#b91c1c" />
            </mesh>
          </AnimatedBuilding>
        </group>
      ) : (
        [...Array(houseCount)].map((_, i) => (
          <group key={i} position={[-0.6 + i * 0.4, h + 0.02, -l/2 + 0.3]}>
            <AnimatedBuilding isNew={i >= prevHouseCount.current}>
              {/* House Base */}
              <Box args={[0.3, 0.3, 0.3]} position={[0, 0.15, 0]} castShadow>
                <meshStandardMaterial color="#22c55e" /> {/* Green House */}
              </Box>
              {/* House Roof */}
              <mesh position={[0, 0.3 + 0.1, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
                <cylinderGeometry args={[0.0, 0.25, 0.2, 4]} />
                <meshStandardMaterial color="#15803d" />
              </mesh>
            </AnimatedBuilding>
          </group>
        ))
      )}
      {/* Ikon 3D Khusus */}
      {sq.type === 'community-chest' && <ChestIcon />}
      {sq.type === 'chance' && <QuestionIcon />}
      {sq.type === 'go' && <GoIcon />}
      {(sq.type === 'income-tax' || sq.type === 'luxury-tax') && <CoinStackIcon />}
      {sq.type === 'jail' && <JailBarsIcon />}
      {sq.type === 'go-to-jail' && <SirenIcon />}
      {sq.type === 'free-parking' && <ParkingIcon />}

      {/* Transparent Click Target for Interaction */}
      <mesh 
        position={[0, h + 0.1, 0]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onClick={() => window.dispatchEvent(new CustomEvent('square-click', { detail: id }))}
      >
        <planeGeometry args={[w, l]} />
        <meshBasicMaterial opacity={0} transparent />
      </mesh>
    </group>
  );
}

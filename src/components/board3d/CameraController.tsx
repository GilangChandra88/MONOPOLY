import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { CameraControls } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { getGridCoordinate } from './grid';
import { auth } from '../../firebase';

export default function CameraController() {
  const controlsRef = useRef<CameraControls>(null);
  const { phase, isDraggingDice, players, currentPlayerIndex, cameraStates, saveCameraState, isOnline } = useGameStore();
  const player = players[currentPlayerIndex];
  
  // Hanya ambil alih kamera jika offline, ATAU jika online dan ini giliran pemain lokal
  const shouldTrack = !isOnline || player?.userId === auth.currentUser?.uid;

  // Ambil state kamera dari Firebase untuk user ini jika ada (agar persisten antar reload/sesi)
  const userId = auth.currentUser?.uid || '';
  const mySavedCam = cameraStates?.[userId];
  
  // State untuk menyimpan posisi kamera user terakhir kali (in memory fallback)
  const savedPos = useRef(new THREE.Vector3(0, 15, 15));
  const savedTarget = useRef(new THREE.Vector3(0, 0, 0));
  const prevPhase = useRef(phase);
  const isFirstLoad = useRef(true);

  // Set posisi kamera saat baru pertama kali dirender
  useEffect(() => {
    if (controlsRef.current && isFirstLoad.current && mySavedCam) {
      const { pos, target } = mySavedCam;
      controlsRef.current.setLookAt(
        pos[0], pos[1], pos[2],
        target[0], target[1], target[2],
        false // langsung lompat ke posisi tanpa animasi
      );
      savedPos.current.set(pos[0], pos[1], pos[2]);
      savedTarget.current.set(target[0], target[1], target[2]);
      isFirstLoad.current = false;
    }
  }, [mySavedCam]);

  // Simpan posisi saat kamera berhenti bergerak (oleh user)
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    
    const onRest = () => {
      // Hanya simpan jika sedang dalam mode yang bisa dikontrol user
      const cinematicPhases = ['rolling', 'dice-result-1', 'dice-result-2', 'pre-moving', 'moving', 'post-moving'];
      if (!cinematicPhases.includes(phase)) {
        controls.getPosition(savedPos.current);
        controls.getTarget(savedTarget.current);
        
        if (userId) {
          saveCameraState(userId, 
            [savedPos.current.x, savedPos.current.y, savedPos.current.z], 
            [savedTarget.current.x, savedTarget.current.y, savedTarget.current.z]
          );
        }
      }
    };
    
    controls.addEventListener('rest', onRest);
    return () => controls.removeEventListener('rest', onRest);
  }, [phase, userId, saveCameraState]);

  useEffect(() => {
    if (!controlsRef.current || !shouldTrack) return;
    
    const cinematicPhases = ['rolling', 'dice-result-1', 'dice-result-2', 'pre-moving', 'moving', 'post-moving'];
    const wasControllable = !cinematicPhases.includes(prevPhase.current);
    const isNowCinematic = cinematicPhases.includes(phase);
    
    if (wasControllable && isNowCinematic) {
      // User akan kehilangan kontrol (masuk mode sinematik), simpan posisinya
      controlsRef.current.getPosition(savedPos.current);
      controlsRef.current.getTarget(savedTarget.current);
      
      // Simpan juga ke Firebase agar tidak reset saat direload!
      if (userId) {
        saveCameraState(userId, 
          [savedPos.current.x, savedPos.current.y, savedPos.current.z], 
          [savedTarget.current.x, savedTarget.current.y, savedTarget.current.z]
        );
      }
    }
    
    // Jika kembali ke state yang bisa dikontrol (idle, action, landed, end-turn)
    // dan sebelumnya dari state sinematik
    if (!isNowCinematic && cinematicPhases.includes(prevPhase.current)) {
      controlsRef.current.setLookAt(
        savedPos.current.x, savedPos.current.y, savedPos.current.z,
        savedTarget.current.x, savedTarget.current.y, savedTarget.current.z,
        true // smooth transition
      );
    }
    
    prevPhase.current = phase;
  }, [phase, userId, saveCameraState, shouldTrack]);

  useFrame(() => {
    if (!controlsRef.current || !shouldTrack) return;
    if (isDraggingDice) {
      // Allow user to freely drag without us overriding their view
      return;
    }

    if ((phase === 'moving' || phase === 'pre-moving' || phase === 'post-moving') && player) {
      // Track player during movement and pauses before/after
      const pos = getGridCoordinate(player.position);
      // We look at the player, and place the camera slightly behind/above them
      // To make it cinematic, let's just pan the target to the player and zoom in a bit
      const target = new THREE.Vector3(pos.x, 0, pos.z);
      
      // Calculate a camera position relative to the player
      // (For instance, offset by [0, 10, 10])
      const camPos = new THREE.Vector3(pos.x, 10, pos.z + 10);
      
      const currentPos = new THREE.Vector3();
      const currentTarget = new THREE.Vector3();
      controlsRef.current.getPosition(currentPos);
      controlsRef.current.getTarget(currentTarget);
      
      currentPos.lerp(camPos, 0.05);
      currentTarget.lerp(target, 0.1);
      
      controlsRef.current.setLookAt(
        currentPos.x, currentPos.y, currentPos.z,
        currentTarget.x, currentTarget.y, currentTarget.z,
        false
      );
    } else if (phase === 'dice-result-1' || phase === 'dice-result-2') {
      // Zoom in closely to the actual dice location
      const dicePositions = useGameStore.getState().localDicePositions;
      const isD1 = phase === 'dice-result-1';
      
      let dicePos = [isD1 ? -2 : 2, 0.5, 0]; // Default fallback (untuk observer yang dadunya diam di tengah)
      
      if (dicePositions && dicePositions.d1 && dicePositions.d2) {
        dicePos = isD1 ? dicePositions.d1.pos : dicePositions.d2.pos;
      }
      
      // Calculate camera position relative to the dice
      // (look from slightly above and to the side)
      const camPos = new THREE.Vector3(dicePos[0], dicePos[1] + 4, dicePos[2] + 4);
      const target = new THREE.Vector3(dicePos[0], dicePos[1], dicePos[2]);

      const currentPos = new THREE.Vector3();
      const currentTarget = new THREE.Vector3();
      controlsRef.current.getPosition(currentPos);
      controlsRef.current.getTarget(currentTarget);
        
        currentPos.lerp(camPos, 0.1); // lebih cepat lerp-nya agar pindah tepat waktu
        currentTarget.lerp(target, 0.15);
        
        controlsRef.current.setLookAt(
          currentPos.x, currentPos.y, currentPos.z,
          currentTarget.x, currentTarget.y, currentTarget.z,
          false
        );
    }
  });

  return (
    <CameraControls 
      ref={controlsRef} 
      enabled={!isDraggingDice}
      maxPolarAngle={Math.PI / 2 - 0.05}
      minDistance={5}
      maxDistance={40}
      makeDefault
    />
  );
}

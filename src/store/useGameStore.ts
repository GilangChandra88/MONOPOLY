// ─── Zustand Game Store ───────────────────────────────────────────────────────

import { create } from 'zustand';
import type { GameState, Player, GamePhase, TokenColor } from '../types/game';
import { auth } from '../firebase';
import { rollDice, isDoubles, diceTotal } from '../engine/dice';
import { applyGoBonus } from '../engine/movement';
import { calculateRent, getPurchasePrice } from '../engine/property';
import { sendToJail, payJailFine, useJailCard, failJailAttempt } from '../engine/jail';
import { applyCardEffect } from '../engine/cards';
import { processBankruptcy } from '../engine/bankruptcy';
import { BOARD_SQUARES, GO_MONEY, INCOME_TAX_AMOUNT, LUXURY_TAX_AMOUNT } from '../data/board';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleDeck } from '../data/cards';
import { isPurchasable, isProperty } from '../types/board';
import { uploadTurnState } from '../hooks/syncUtils';

const STARTING_MONEY = 15_000_000; // Rp 15 juta

// ─── Inisialisasi Pemain ──────────────────────────────────────────────────────
function createPlayer(id: string, name: string, color: TokenColor): Player {
  return {
    id,
    name,
    color,
    position: 0,
    money: STARTING_MONEY,
    properties: [],
    inJail: false,
    jailTurns: 0,
    jailCard: false,
    isBankrupt: false,
  };
}

// ─── Initial State ────────────────────────────────────────────────────────────
function createInitialState(players: Player[]): GameState {
  return {
    players,
    currentPlayerIndex: 0,
    phase: 'idle',
    dice: [1, 1],
    localDicePositions: null,
    cameraStates: {},
    doublesCount: 0,
    ownedProperties: {},
    houses: {},
    hotels: {},
    freeParkingMoney: 0,
    log: ['🎲 Permainan dimulai!'],
    winner: null,
    chanceDeck: shuffleDeck(CHANCE_CARDS),
    communityDeck: shuffleDeck(COMMUNITY_CHEST_CARDS),
    activeCard: null,
    activeCardType: null,
    pendingRent: null,
    pendingRentOwner: null,
    movementSteps: 0,
    movementDirection: 1,
    turnVersion: 0,
  };
}

// ─── Store Interface ──────────────────────────────────────────────────────────
interface GameStore extends GameState {
  // Sesi
  sessionId: string | null;
  sessionName: string | null;

  // Interaksi UI
  isDraggingDice: boolean;
  setIsDraggingDice: (val: boolean) => void;
  physicsRollTrigger: number;
  triggerPhysicalRoll: () => void;

  // Actions
  setSessionInfo: (id: string, name: string) => void;
  leaveGame: () => void;
  setupGame: (players: { name: string; color: TokenColor }[], isOnline?: boolean, creatorId?: string) => void;
  resetGame: () => void;

  // Aksi Giliran
  rollDiceAction: () => void;
  resolveRollWithPhysics: (
    d1: number, 
    d2: number,
    dicePositions?: { d1: [number, number, number], d2: [number, number, number] }
  ) => void;
  resolveRoll: () => void;
  _executeInstantMovement: (player: Player, steps: number, direction: 1 | -1) => void;
  endTurn: () => void;
  saveCameraState: (userId: string, pos: [number, number, number], target: [number, number, number]) => void;

  _pushHistory: () => void;
  undo: () => void;

  // Properti
  buyProperty: () => void;
  passProperty: () => void;
  payRent: () => void;
  declareBankruptcy: () => void;
  
  // Bangunan & Penjualan Aset
  buyHouse: (squareId: number) => void;
  sellHouse: (squareId: number) => void;
  sellProperty: (squareId: number) => void;

  // Penjara
  payJailFineAction: () => void;
  useJailCardAction: () => void;
  recoverStuckSession: () => void;

  // Kartu
  dismissCard: () => void;

  // Internal
  _setPhase: (phase: GamePhase) => void;
  _addLog: (msg: string) => void;
  _handleLanding: (position: number, player: Player) => void;
}

// ─── Helper: Format uang ──────────────────────────────────────────────────────
function fmt(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// ─── Store Implementation ─────────────────────────────────────────────────────
export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState([]),
  sessionId: null,
  sessionName: null,
  isOnline: false,

  isDraggingDice: false,
  setIsDraggingDice: (val) => set({ isDraggingDice: val }),

  physicsRollTrigger: 0,
  triggerPhysicalRoll: () => {
    set(s => ({ physicsRollTrigger: Date.now() }));
    get().rollDiceAction();
  },

  setSessionInfo: (id, name) => set({ sessionId: id, sessionName: name }),
  leaveGame: () => set({ players: [], sessionId: null, sessionName: null, winner: null }),

  // ── Setup ──────────────────────────────────────────────────────────────────
  setupGame: (playerConfigs, isOnline = false, creatorId?: string) => {
    const activeInviteCodes: string[] = [];
    const players = playerConfigs.map((cfg, i) => {
      const p = createPlayer(`player-${i}`, cfg.name, cfg.color);
      if (isOnline) {
        if (i === 0) {
          const uId = creatorId || auth.currentUser?.uid;
          if (uId) p.userId = uId;
          else delete p.userId;
        } else {
          const code = Math.random().toString(36).substring(2, 7).toUpperCase();
          delete p.userId;
          p.inviteCode = code;
          activeInviteCodes.push(code);
        }
      }
      return p;
    });
    set({ ...createInitialState(players), isOnline, activeInviteCodes });
  },

  resetGame: () => {
    set({
      players: [],
      currentPlayerIndex: 0,
      phase: 'idle',
      dice: [1, 1],
      doublesCount: 0,
      ownedProperties: {},
      houses: {},
      hotels: {},
      freeParkingMoney: 0,
      log: [],
      winner: null,
      chanceDeck: shuffleDeck(CHANCE_CARDS),
      communityDeck: shuffleDeck(COMMUNITY_CHEST_CARDS),
      activeCard: null,
      activeCardType: null,
      pendingRent: null,
      pendingRentOwner: null,
      movementSteps: 0,
      movementDirection: 1,
    });
  },

  // ── Lempar Dadu ────────────────────────────────────────────────────────────
  rollDiceAction: () => {
    const state = get();
    if (state.phase !== 'idle') return;
    state._pushHistory();
    set({ phase: 'rolling' });
  },

  // Dipanggil oleh komponen fisika setelah dadu benar-benar berhenti
  resolveRollWithPhysics: (
    d1: number, 
    d2: number,
    dicePositions?: { d1: [number, number, number], d2: [number, number, number] }
  ) => {
    const state = get();
    if (state.phase !== 'rolling') return;
    
    // Set hasil lemparan, mulai dengan fokus ke dadu 1
    set({ 
      dice: [d1, d2],
      localDicePositions: dicePositions || null,
      phase: 'dice-result-1' 
    });
    
    // Sequence Kamera:
    // 1. Fokus Dadu 1 (sekarang, diam 1 detik)
    setTimeout(() => {
      // 2. Fokus Dadu 2 (diam 1 detik)
      set({ phase: 'dice-result-2' });
      
      setTimeout(() => {
        // 3. Pindah ke pre-moving (fokus karakter, diam 1 detik)
        set({ phase: 'pre-moving' });

        setTimeout(() => {
          // 4. Lanjutkan logika movement (ini akan mengubah phase menjadi 'moving' atau lainnya)
          get().resolveRoll();
        }, 1000);
      }, 1000);
    }, 1000);
  },

  resolveRoll: () => {
    const state = get();
    state._pushHistory();
    const { players, currentPlayerIndex, dice } = state;
    const player = players[currentPlayerIndex];

    const doubles = isDoubles(dice);
    const total = diceTotal(dice);

    // Penjara: cek apakah bisa keluar dengan dadu kembar
    if (player.inJail) {
      if (doubles) {
        // Keluar penjara dengan dadu kembar
        const newPlayers = [...players];
        newPlayers[currentPlayerIndex] = { ...player, inJail: false, jailTurns: 0 };
        
        set({
          doublesCount: 0, // tidak dapet giliran tambahan setelah bebas dari penjara
          players: newPlayers,
          phase: 'moving',
          movementSteps: total,
          movementDirection: 1,
          log: [...state.log, `${player.name} melempar dadu kembar (${dice[0]}+${dice[1]}) dan keluar dari penjara!`],
        });
        return;
      } else {
        // Gagal keluar penjara
        const { player: updatedPlayer, forcedPay } = failJailAttempt(player);
        const newPlayers = [...players];

        if (forcedPay) {
          // Harus bayar denda paksa
          const paid = payJailFine(updatedPlayer);
          newPlayers[currentPlayerIndex] = paid;

          set({
            players: newPlayers,
            phase: 'moving',
            movementSteps: total,
            movementDirection: 1,
            log: [...state.log, `${player.name} giliran ke-3 di penjara, terpaksa bayar denda ${fmt(500_000)}.`],
          });
        } else {
          newPlayers[currentPlayerIndex] = updatedPlayer;
          set({
            players: newPlayers,
            phase: 'end-turn',
            log: [...state.log, `${player.name} gagal keluar penjara (dadu: ${dice[0]}+${dice[1]}). Giliran di penjara: ${updatedPlayer.jailTurns}/${3}`],
          });
        }
        return;
      }
    }

    // Dadu kembar ke-3 = masuk penjara
    const newDoublesCount = doubles ? state.doublesCount + 1 : 0;
    if (newDoublesCount >= 3) {
      const newPlayers = [...players];
      newPlayers[currentPlayerIndex] = sendToJail(player);
      set({
        doublesCount: 0,
        players: newPlayers,
        phase: 'end-turn',
        log: [...state.log, `${player.name} melempar dadu kembar 3x berturut-turut → masuk penjara!`],
      });
      return;
    }

    // Gerak normal (Persiapan melompat)
    set({
      doublesCount: newDoublesCount,
      log: [...state.log, `${player.name} melempar dadu ${dice[0]}+${dice[1]}=${total}`],
    });
    
    get()._executeInstantMovement(player, total, 1);
  },

  _executeInstantMovement: (player: any, steps: number, direction: 1 | -1) => {
    const state = get();
    const finalPos = (player.position + (steps * direction) + 40) % 40;
    let updatedPlayer = { ...player };
    let newLog = [...state.log];
    let newTransaction = state.lastTransaction;

    // Cek melewati GO
    if (direction === 1 && finalPos < player.position) {
      updatedPlayer = applyGoBonus(updatedPlayer);
      newLog = [...newLog, `${player.name} melewati MULAI! +${fmt(GO_MONEY)}`];
      newTransaction = {
        id: Date.now().toString() + '-go',
        amount: GO_MONEY,
        fromId: 'bank',
        toId: player.id
      };
    }
    
    updatedPlayer.position = finalPos;
    const newPlayers = [...state.players];
    const pIdx = state.players.findIndex(p => p.id === player.id);
    newPlayers[pIdx] = updatedPlayer;

    // Set state agar observer menerima posisi akhir SEKALI SAJA dan menganimasikannya sendiri
    set({
      players: newPlayers,
      movementSteps: steps, // Tells PlayerToken3D to animate 'steps' hops
      movementDirection: direction,
      phase: 'moving',
      log: newLog,
      lastTransaction: newTransaction
    });

    // Tunggu visual animasi selesai sebelum menjalankan aksi pendaratan
    // 250ms per step (karena PlayerToken3D bergerak 4 kotak per detik) + 250ms ekstra padding
    setTimeout(() => {
      set({ phase: 'post-moving', movementSteps: 0 });
      setTimeout(() => {
        get()._handleLanding(finalPos, get().players[pIdx]);
      }, 500);
    }, steps * 250 + 250);
  },


  // ── Beli Properti ──────────────────────────────────────────────────────────
  buyProperty: () => {
    const state = get();
    const { players, currentPlayerIndex } = state;
    const player = players[currentPlayerIndex];
    const square = BOARD_SQUARES[player.position];

    if (!isPurchasable(square)) return;

    const price = getPurchasePrice(player.position);
    if (player.money < price) return;

    state._pushHistory();

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = {
      ...player,
      money: player.money - price,
      properties: [...player.properties, player.position],
    };

    set({
      players: newPlayers,
      ownedProperties: { ...state.ownedProperties, [player.position]: player.id },
      phase: 'end-turn',
      log: [...state.log, `${player.name} membeli ${square.name} seharga ${fmt(price)} 🏠`],
    });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  passProperty: () => {
    const state = get();
    state._pushHistory();
    set({ phase: 'end-turn', log: [...state.log, `${state.players[state.currentPlayerIndex].name} memilih tidak membeli properti.`] });
  },

  // ── Bayar Sewa ─────────────────────────────────────────────────────────────
  payRent: () => {
    const state = get();
    const { players, currentPlayerIndex, pendingRent, pendingRentOwner } = state;
    if (pendingRent === null || !pendingRentOwner) return;

    state._pushHistory();

    const newPlayers = [...players];
    const payerIdx = currentPlayerIndex;
    const ownerIdx = players.findIndex(p => p.id === pendingRentOwner);

    newPlayers[payerIdx] = { ...newPlayers[payerIdx], money: newPlayers[payerIdx].money - pendingRent };
    let newFreeParkingMoney = state.freeParkingMoney;
    if (ownerIdx !== -1) {
      newPlayers[ownerIdx] = { ...newPlayers[ownerIdx], money: newPlayers[ownerIdx].money + pendingRent };
    } else if (pendingRentOwner === 'bank') {
      newFreeParkingMoney += pendingRent;
    }

    // Cek kebangkrutan (Harusnya tidak terjadi karena tombol disable jika uang kurang, tapi buat jaga-jaga)
    let finalState: Partial<GameStore> = {
      players: newPlayers,
      freeParkingMoney: newFreeParkingMoney,
      pendingRent: null,
      pendingRentOwner: null,
      phase: 'end-turn',
      lastTransaction: {
        id: Date.now().toString(),
        amount: pendingRent,
        fromId: newPlayers[payerIdx].id,
        toId: pendingRentOwner
      },
      log: [...state.log, `${newPlayers[payerIdx].name} membayar ${pendingRentOwner === 'bank' ? 'pajak/denda' : 'sewa'} ${fmt(pendingRent)} ke ${newPlayers[ownerIdx]?.name || 'bank'}.`],
    };

    if (newPlayers[payerIdx].money < 0) {
      const bankrupted = processBankruptcy(newPlayers[payerIdx].id, pendingRentOwner, { ...state, players: newPlayers });
      finalState = { ...bankrupted, pendingRent: null, pendingRentOwner: null, phase: bankrupted.winner ? 'end-turn' : 'end-turn' };
    }

    set(finalState as GameStore);
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  // ── Beli Rumah ─────────────────────────────────────────────────────────────
  buyHouse: (squareId: number) => {
    const state = get();
    const { players, ownedProperties } = state;
    const ownerId = ownedProperties[squareId];
    if (!ownerId) return;
    
    const ownerIndex = players.findIndex(p => p.id === ownerId);
    if (ownerIndex === -1) return;
    
    // STRICT RULE: Hanya bisa membangun di giliran sendiri
    if (ownerIndex !== state.currentPlayerIndex) return;

    const owner = players[ownerIndex];
    const square = BOARD_SQUARES[squareId];

    if (!isProperty(square)) return;
    if (state.hotels[squareId]) return; // sudah hotel

    const houses = state.houses[squareId] ?? 0;
    if (houses >= 4) {
      // Beli hotel
      if (owner.money < square.hotelCost) return;
      state._pushHistory();
      const newPlayers = [...players];
      newPlayers[ownerIndex] = { ...owner, money: owner.money - square.hotelCost };
      const newHouses = { ...state.houses };
      delete newHouses[squareId];
      set({
        players: newPlayers,
        houses: newHouses,
        hotels: { ...state.hotels, [squareId]: true },
        lastTransaction: { id: Date.now().toString(), amount: square.hotelCost, fromId: owner.id, toId: 'bank' },
        log: [...state.log, `${owner.name} membangun HOTEL di ${square.name}! 🏨`],
        ...(state.phase === 'action' && state.currentPlayerIndex === ownerIndex ? { phase: 'end-turn' as GamePhase } : {})
      });
      uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
    } else {
      if (owner.money < square.houseCost) return;
      state._pushHistory();
      const newPlayers = [...players];
      newPlayers[ownerIndex] = { ...owner, money: owner.money - square.houseCost };
      set({
        players: newPlayers,
        houses: { ...state.houses, [squareId]: houses + 1 },
        lastTransaction: { id: Date.now().toString(), amount: square.houseCost, fromId: owner.id, toId: 'bank' },
        log: [...state.log, `${owner.name} membangun 1 RUMAH di ${square.name}.`],
        ...(state.phase === 'action' && state.currentPlayerIndex === ownerIndex ? { phase: 'end-turn' as GamePhase } : {})
      });
      uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
    }
  },

  sellHouse: (squareId: number) => {
    const state = get();
    const { players, ownedProperties } = state;
    const ownerId = ownedProperties[squareId];
    if (!ownerId) return;
    
    const ownerIndex = players.findIndex(p => p.id === ownerId);
    if (ownerIndex === -1) return;
    
    // STRICT RULE: Hanya bisa jual di giliran sendiri
    if (ownerIndex !== state.currentPlayerIndex) return;
    
    const owner = players[ownerIndex];
    const square = BOARD_SQUARES[squareId];

    if (!isProperty(square)) return;

    const hasHotel = state.hotels[squareId];
    const houses = state.houses[squareId] ?? 0;

    if (hasHotel) {
      const salePrice = square.hotelCost / 2;
      const newPlayers = [...players];
      newPlayers[ownerIndex] = { ...owner, money: owner.money + salePrice };
      const newHotels = { ...state.hotels };
      delete newHotels[squareId];
      set({
        players: newPlayers,
        hotels: newHotels,
        houses: { ...state.houses, [squareId]: 4 },
        log: [...state.log, `${owner.name} menjual hotel di ${square.name} seharga ${fmt(salePrice)}.`],
      });
      uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
    } else if (houses > 0) {
      const salePrice = square.houseCost / 2;
      const newPlayers = [...players];
      newPlayers[ownerIndex] = { ...owner, money: owner.money + salePrice };
      set({
        players: newPlayers,
        houses: { ...state.houses, [squareId]: houses - 1 },
        log: [...state.log, `${owner.name} menjual 1 rumah di ${square.name} seharga ${fmt(salePrice)}.`],
      });
      uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
    }
  },

  sellProperty: (squareId: number) => {
    const state = get();
    const { players, ownedProperties, houses, hotels } = state;
    const ownerId = ownedProperties[squareId];
    
    // Pastikan ada pemiliknya
    if (!ownerId) return;
    
    const ownerIndex = players.findIndex(p => p.id === ownerId);
    if (ownerIndex === -1) return;
    
    // STRICT RULE: Hanya bisa jual di giliran sendiri
    if (ownerIndex !== state.currentPlayerIndex) return;
    
    const owner = players[ownerIndex];
    const square = BOARD_SQUARES[squareId];
    
    if (houses[squareId] > 0 || hotels[squareId]) {
      return; 
    }
    
    const salePrice = (square as any).price / 2; // Jual ke bank setengah harga (mortgage)
    const newPlayers = [...players];
    newPlayers[ownerIndex] = {
      ...owner,
      money: owner.money + salePrice,
      properties: owner.properties.filter(id => id !== squareId)
    };
    
    const newOwned = { ...ownedProperties };
    delete newOwned[squareId];
    
    set({
      players: newPlayers,
      ownedProperties: newOwned,
      log: [...state.log, `${owner.name} menjual ${square.name} ke bank seharga ${fmt(salePrice)}.`],
    });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  declareBankruptcy: () => {
    const state = get();
    const { players, currentPlayerIndex, pendingRentOwner } = state;
    const player = players[currentPlayerIndex];
    
    // Jika tidak ada pendingRentOwner, bangkrut ke bank
    const bankruptedState = processBankruptcy(player.id, pendingRentOwner || 'bank', state);
    const newVersion = (state.turnVersion ?? 0) + 1;
    
    set({
      ...bankruptedState,
      pendingRent: null,
      pendingRentOwner: null,
      phase: bankruptedState.winner ? 'end-turn' : 'end-turn',
      turnVersion: newVersion,
    });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  // ── Penjara ────────────────────────────────────────────────────────────────
  payJailFineAction: () => {
    const state = get();
    const { players, currentPlayerIndex } = state;
    const player = players[currentPlayerIndex];
    if (!player.inJail) return;

    state._pushHistory();

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = payJailFine(player);
    set({
      players: newPlayers,
      phase: 'idle',
      freeParkingMoney: state.freeParkingMoney + 500_000,
      log: [...state.log, `${player.name} membayar denda ${fmt(500_000)} untuk keluar penjara.`],
    });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  useJailCardAction: () => {
    const state = get();
    const { players, currentPlayerIndex } = state;
    const player = players[currentPlayerIndex];
    if (!player.inJail || !player.jailCard) return;

    state._pushHistory();

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = useJailCard(player);
    set({
      players: newPlayers,
      phase: 'idle',
      log: [...state.log, `${player.name} menggunakan kartu BEBAS PENJARA!`],
    });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  // ── Kartu ──────────────────────────────────────────────────────────────────
  dismissCard: () => {
    const state = get();
    const player = state.players[state.currentPlayerIndex];
    const activeCard = state.activeCard;

    if (!activeCard) return;

    state._pushHistory();

    // TERAPKAN EFEK KARTU SEKARANG (karena sebelumnya ditunda untuk dibaca user)
    const { updatedState } = applyCardEffect(activeCard, state, diceTotal(state.dice));
    
    // Kita harus memasukkan state yang diperbarui ini ke Zustand
    // TAPI kita juga mau menghapus activeCard dari UI
    set({ 
      ...updatedState, 
      activeCard: null, 
      activeCardType: null 
    });

    // Ambil state terbaru setelah update
    const newState = get();
    const updatedPlayer = newState.players[newState.currentPlayerIndex];

    // JIKA kartu menyebabkan 'moving' (seperti move-to, jail, dll),
    // trigger _executeInstantMovement
    if (activeCard.effect.type.startsWith('move') || activeCard.effect.type === 'jail') {
      const steps = updatedState.movementSteps || 0;
      const direction = updatedState.movementDirection || 1;
      // Undo efek setting phase 'moving' sementara dari applyCardEffect 
      // karena _executeInstantMovement akan menanganinya
      get()._executeInstantMovement(updatedPlayer, steps, direction as 1|-1);
      return;
    }

    // Jika tidak memindahkan pemain, giliran selesai atau bisa lanjut aksi lain
    set({ phase: 'end-turn' });
    uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
  },

  saveCameraState: (userId: string, pos: [number, number, number], target: [number, number, number]) => {
    set((state) => ({
      cameraStates: {
        ...state.cameraStates,
        [userId]: { pos, target }
      }
    }));
  },

  _pushHistory: () => {
    const s = get();
    // Simpan snapshot state saat ini
    const snap = {
      players: s.players,
      currentPlayerIndex: s.currentPlayerIndex,
      phase: s.phase,
      dice: s.dice,
      doublesCount: s.doublesCount,
      ownedProperties: s.ownedProperties,
      houses: s.houses,
      hotels: s.hotels,
      freeParkingMoney: s.freeParkingMoney,
      log: s.log,
      winner: s.winner,
      chanceDeck: s.chanceDeck,
      communityDeck: s.communityDeck,
      activeCard: s.activeCard,
      activeCardType: s.activeCardType,
      pendingRent: s.pendingRent,
      pendingRentOwner: s.pendingRentOwner,
      movementSteps: s.movementSteps,
      movementDirection: s.movementDirection
    };
    const newHistory = [...(s.history || []), snap].slice(-10); // Simpan 10 langkah terakhir
    set({ history: newHistory });
  },

  undo: () => {
    const s = get();
    if (!s.history || s.history.length === 0) return;
    const lastSnap = s.history[s.history.length - 1];
    const newHistory = s.history.slice(0, -1);
    
    // Kembalikan semua state ke kondisi snapshot, lalu update history-nya
    set({
      ...lastSnap,
      history: newHistory,
      log: [...lastSnap.log, `↩ Mengurungkan (Undo) tindakan terakhir.`]
    });
  },

  // ── Ganti Giliran ─────────────────────────────────────────────────────────
  endTurn: () => {
    const state = get();
    state._pushHistory();
    const { players, currentPlayerIndex, doublesCount } = state;

    // Jika dadu kembar, giliran lagi (kecuali habis dari penjara)
    const player = players[currentPlayerIndex];
    if (doublesCount > 0 && !player.inJail) {
      set({
        phase: 'idle',
        log: [...state.log, `🎲 ${player.name} dapat giliran tambahan karena dadu kembar!`],
      });
      // Upload sinyal "giliran lagi" ke Firebase
      const uid = auth.currentUser?.uid;
      uploadTurnState(get(), get().sessionId, uid);
      return;
    }

    // Lanjut ke pemain berikutnya
    let nextIdx = (currentPlayerIndex + 1) % players.length;
    while (players[nextIdx].isBankrupt) {
      nextIdx = (nextIdx + 1) % players.length;
    }

    const newVersion = (state.turnVersion ?? 0) + 1;
    set({
      currentPlayerIndex: nextIdx,
      phase: 'idle',
      doublesCount: 0,
      turnVersion: newVersion,
      log: [...state.log, `─── Giliran ${players[nextIdx].name} ───`],
    });

    // Upload TURN STATE ke Firebase — satu-satunya tempat upload reguler
    const uid = auth.currentUser?.uid;
    uploadTurnState(get(), get().sessionId, uid);
  },

  recoverStuckSession: () => {
    const state = get();
    // Kembalikan ke idle, paksa reset parameter animasi dan pending aksi
    set({
      phase: 'idle',
      movementSteps: 0,
      activeCard: null,
      pendingRent: null,
      pendingRentOwner: null,
      doublesCount: 0,
      log: [...state.log, `⚠️ Sesi berhasil dipulihkan dari macet. Silakan lempar dadu ulang.`],
    });
  },

  // ── Internal helpers ───────────────────────────────────────────────────────
  _setPhase: (phase) => set({ phase }),
  _addLog: (msg) => set(s => ({ log: [...s.log, msg] })),
  _handleLanding: (position: number, player: Player) => {
    const state = get();

    if (state.isGoingToJail) {
      const newPlayers = [...state.players];
      const idx = newPlayers.findIndex(p => p.id === player.id);
      newPlayers[idx] = sendToJail(newPlayers[idx]);
      set({
        players: newPlayers,
        isGoingToJail: false,
        phase: 'end-turn',
        log: [...state.log, `🚔 ${player.name} dijebloskan ke penjara!`]
      });
      return;
    }

    const square = BOARD_SQUARES[position];

    switch (square.type) {
      case 'go':
        set({ phase: 'end-turn' });
        break;

      case 'jail':
        set({ phase: 'end-turn' });
        break;

      case 'free-parking':
        if (state.freeParkingMoney > 0) {
          const newPlayers = [...state.players];
          const idx = newPlayers.findIndex(p => p.id === player.id);
          newPlayers[idx] = { ...newPlayers[idx], money: newPlayers[idx].money + state.freeParkingMoney };
          set({
            players: newPlayers,
            freeParkingMoney: 0,
            phase: 'end-turn',
            lastTransaction: {
              id: Date.now().toString() + '-fp',
              amount: state.freeParkingMoney,
              fromId: 'bank',
              toId: player.id
            },
            log: [...get().log, `${player.name} mendapat uang parkir ${fmt(state.freeParkingMoney)}! 🅿️`],
          });
          uploadTurnState(get(), get().sessionId, auth.currentUser?.uid);
        } else {
          set({ phase: 'end-turn' });
        }
        break;

      case 'go-to-jail': {
        const steps = player.position > 10 ? player.position - 10 : 10 - player.position;
        const direction = player.position > 10 ? -1 : 1;
        
        // Kita flag bahwa tujuannya adalah masuk penjara
        set({ isGoingToJail: true });
        get()._executeInstantMovement(player, steps, direction as 1|-1);
        break;
      }

      case 'income-tax': {
        set({
          pendingRent: INCOME_TAX_AMOUNT,
          pendingRentOwner: 'bank',
          phase: 'action'
        });
        break;
      }

      case 'luxury-tax': {
        set({
          pendingRent: LUXURY_TAX_AMOUNT,
          pendingRentOwner: 'bank',
          phase: 'action'
        });
        break;
      }

      case 'chance': {
        let deck = [...state.chanceDeck];
        if (deck.length === 0) deck = shuffleDeck(CHANCE_CARDS);
        const card = deck.shift()!;
        deck.push(card);
        // Jangan apply effect sekarang, cukup tampilkan UI kartunya dulu
        set({ chanceDeck: deck, activeCard: card, activeCardType: 'chance', phase: 'action' });
        break;
      }

      case 'community-chest': {
        let deck = [...state.communityDeck];
        if (deck.length === 0) deck = shuffleDeck(COMMUNITY_CHEST_CARDS);
        const card = deck.shift()!;
        deck.push(card);
        // Jangan apply effect sekarang, cukup tampilkan UI kartunya dulu
        set({ communityDeck: deck, activeCard: card, activeCardType: 'community-chest', phase: 'action' });
        break;
      }

      case 'property':
      case 'railroad':
      case 'utility': {
        const owner = state.ownedProperties[position];
        if (!owner) {
          set({ phase: 'action', specialRentRule: null });
        } else if (owner !== player.id) {
          let rent = calculateRent(position, state, diceTotal(state.dice));
          
          if (state.specialRentRule === 'railroad-double') {
            rent = rent * 2;
          } else if (state.specialRentRule === 'utility-10x') {
            rent = diceTotal(state.dice) * 10 * 100_000;
          }

          const ownerPlayer = state.players.find(p => p.id === owner);
          set({
            pendingRent: rent,
            pendingRentOwner: owner,
            specialRentRule: null,
            phase: 'action',
            log: [...get().log, `${player.name} mendarat di ${square.name} (milik ${ownerPlayer?.name}). Harus bayar sewa ${fmt(rent)}.`],
          });
        } else {
          if (square.type === 'property') {
            set({ phase: 'action', specialRentRule: null, log: [...get().log, `${player.name} mendarat di propertinya sendiri: ${square.name}. Bisa membangun rumah!`] });
          } else {
            set({ phase: 'end-turn', specialRentRule: null, log: [...get().log, `${player.name} mendarat di asetnya sendiri: ${square.name}.`] });
          }
        }
        break;
      }

      default:
        set({ phase: 'end-turn' });
    }
  },
}));

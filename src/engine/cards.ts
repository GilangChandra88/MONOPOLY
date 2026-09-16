// ─── Game Engine: Efek Kartu ──────────────────────────────────────────────────

import type { Card } from '../types/card';
import type { GameState } from '../types/game';
import { findNearestRailroad, findNearestUtility, moveToPosition, calculateNewPosition, applyGoBonus } from './movement';
import { sendToJail } from './jail';
import { getSquare } from '../data/board';
import { isProperty } from '../types/board';

export interface CardResult {
  updatedState: GameState;
  log: string;
}

/**
 * Terapkan efek kartu pada state permainan.
 */
export function applyCardEffect(
  card: Card,
  state: GameState,
  _diceTotal: number = 0
): CardResult {
  const playerIndex = state.currentPlayerIndex;
  const players = [...state.players];
  let player = { ...players[playerIndex] };
  let freeParkingMoney = state.freeParkingMoney;
  let log = '';

  const { effect } = card;

  let transaction = null;

  switch (effect.type) {
    case 'move-to': {
      let steps = (effect.position - player.position + 40) % 40;
      if (steps === 0) steps = 40;
      
      return {
        updatedState: {
          ...state,
          phase: 'moving',
          movementSteps: steps,
          movementDirection: 1,
          log: [...state.log, `${player.name}: ${card.text}`]
        },
        log: `${player.name}: ${card.text}`
      };
    }

    case 'move-steps': {
      const steps = effect.steps;
      const direction = steps > 0 ? 1 : -1;
      
      return {
        updatedState: {
          ...state,
          phase: 'moving',
          movementSteps: Math.abs(steps),
          movementDirection: direction,
          log: [...state.log, `${player.name}: ${card.text}`]
        },
        log: `${player.name}: ${card.text}`
      };
    }

    case 'move-nearest': {
      const targetPos = effect.squareType === 'railroad'
        ? findNearestRailroad(player.position)
        : findNearestUtility(player.position);
      
      let steps = (targetPos - player.position + 40) % 40;
      if (steps === 0) steps = 40;
      
      const rule = effect.squareType === 'railroad' ? 'railroad-double' : 'utility-10x';

      return {
        updatedState: {
          ...state,
          phase: 'moving',
          movementSteps: steps,
          movementDirection: 1,
          specialRentRule: rule,
          log: [...state.log, `${player.name}: ${card.text}`]
        },
        log: `${player.name}: ${card.text}`
      };
    }

    case 'money': {
      if (effect.amount > 0) {
        player.money += effect.amount;
        transaction = { id: Date.now().toString(), amount: effect.amount, fromId: 'bank', toId: player.id };
        log = `${player.name}: ${card.text} (+Rp ${effect.amount.toLocaleString('id-ID')})`;
      } else {
        const fine = Math.abs(effect.amount);
        player.money -= fine;
        freeParkingMoney += fine; // uang denda masuk parkir gratis
        transaction = { id: Date.now().toString(), amount: fine, fromId: player.id, toId: 'bank' };
        log = `${player.name}: ${card.text} (-Rp ${fine.toLocaleString('id-ID')})`;
      }
      break;
    }

    case 'money-per-player': {
      const amount = Math.abs(effect.amount);
      const isReceiving = effect.amount > 0; // cc14: tiap pemain membayarMU
      const otherPlayers = players.filter((_, i) => i !== playerIndex && !players[i].isBankrupt);
      const totalAnimAmount = amount * otherPlayers.length;

      if (isReceiving) {
        // Pemain aktif MENERIMA dari tiap pemain lain
        otherPlayers.forEach(other => {
          const idx = players.findIndex(p => p.id === other.id);
          players[idx] = { ...players[idx], money: players[idx].money - amount };
          player.money += amount;
        });
        transaction = { id: Date.now().toString(), amount: totalAnimAmount, fromId: 'bank', toId: player.id };
        log = `${player.name}: ${card.text} (+Rp ${totalAnimAmount.toLocaleString('id-ID')})`;
      } else {
        // Pemain aktif MEMBAYAR ke tiap pemain lain
        otherPlayers.forEach(other => {
          const idx = players.findIndex(p => p.id === other.id);
          players[idx] = { ...players[idx], money: players[idx].money + amount };
          player.money -= amount;
        });
        transaction = { id: Date.now().toString(), amount: totalAnimAmount, fromId: player.id, toId: 'bank' };
        log = `${player.name}: ${card.text} (-Rp ${totalAnimAmount.toLocaleString('id-ID')})`;
      }
      break;
    }

    case 'money-per-house-hotel': {
      let totalCost = 0;
      for (const sqId of player.properties) {
        const sq = getSquare(sqId);
        if (!isProperty(sq)) continue;
        const houses = state.houses[sqId] ?? 0;
        const hasHotel = state.hotels[sqId] ?? false;
        if (hasHotel) {
          totalCost += Math.abs(effect.hotel);
        } else {
          totalCost += houses * Math.abs(effect.house);
        }
      }
      player.money -= totalCost;
      freeParkingMoney += totalCost;
      if (totalCost > 0) {
        transaction = { id: Date.now().toString(), amount: totalCost, fromId: player.id, toId: 'bank' };
      }
      log = `${player.name}: ${card.text} (-Rp ${totalCost.toLocaleString('id-ID')})`;
      break;
    }

    case 'jail': {
      // Penjara ada di posisi 10.
      // Supaya tidak melewati Start (0), kita hitung jarak terpendek (atau mundur)
      // Jika di atas 10, mundur. Jika di bawah 10, maju.
      const steps = player.position > 10 ? player.position - 10 : 10 - player.position;
      const direction = player.position > 10 ? -1 : 1;

      return {
        updatedState: {
          ...state,
          phase: 'moving',
          movementSteps: steps,
          movementDirection: direction,
          isGoingToJail: true,
          log: [...state.log, `${player.name}: ${card.text}`]
        },
        log: `${player.name}: ${card.text}`
      };
    }

    case 'free-jail': {
      player.jailCard = true;
      log = `${player.name} mendapat kartu BEBAS PENJARA!`;
      break;
    }
  }

  players[playerIndex] = player;

  return {
    updatedState: {
      ...state,
      players,
      freeParkingMoney,
      ...(transaction ? { lastTransaction: transaction } : {}),
      log: [...state.log, log]
    },
    log
  };
}

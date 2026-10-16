import { useState, useCallback, useRef } from 'react';
import type { Player, GameCard, PendingAction, LogEntry, HouseLevel } from '@/game/types';
import {
  createPlayers, rollDice, propertyOwner, calculateRent, calculateStateRent, drawCard,
  getTolDestination, hasBandung, makeLog, isStateOwned, getCheapestProperty,
  getFirstProperty, getTotalHouseCount, houseLevelName, STATE_OWNED,
  SALARY, JAIL_BAIL, TAX_PER_PROPERTY, LAPAS_FINE, MAX_JAIL_TURNS,
} from '@/game/gameLogic';
import {
  BOARD, BOARD_SIZE, formatMoneyFull,
} from '@/game/boardData';

import SetupScreen from '@/components/SetupScreen';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import PlayerPanel from '@/components/PlayerPanel';
import LogPanel from '@/components/LogPanel';
import CardModal from '@/components/CardModal';
import ActionModal from '@/components/ActionModal';
import PropertySelectModal from '@/components/PropertySelectModal';
import GameOverScreen from '@/components/GameOverScreen';
import { LogOut, Building2, Landmark } from 'lucide-react';

type Screen = 'setup' | 'playing' | 'gameover';

export default function GameScreen() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [dice, setDice] = useState<[number, number]>([1, 1]);
  const [diceRolled, setDiceRolled] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [turn, setTurn] = useState(1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showCard, setShowCard] = useState<GameCard | null>(null);
  const [cardDiceValue, setCardDiceValue] = useState<number | undefined>(undefined);
  const [showPropertySelect, setShowPropertySelect] = useState<'free' | 'build' | 'upgrade' | null>(null);
  const [consecutiveDoubles, setConsecutiveDoubles] = useState(0);
  const [waitingForEndTurn, setWaitingForEndTurn] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(false);
  const [atGajian, setAtGajian] = useState(false);
  const [negaraCash, setNegaraCash] = useState(0);

  const playersRef = useRef(players);
  playersRef.current = players;

  const currentPlayer = players[currentPlayerIndex];

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, makeLog(text, type)]);
  }, []);

  const updatePlayer = (id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const startGame = (count: number) => {
    STATE_OWNED.clear();
    setNegaraCash(0);
    const newPlayers = createPlayers(count);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setTurn(1);
    setLogs([makeLog(`Permainan dimulai! ${count} pemain siap menjadi WNI.`, 'info')]);
    setScreen('playing');
    setDiceRolled(false);
    setConsecutiveDoubles(0);
    setAtGajian(false);
  };

  const nextPlayer = () => {
    setPendingAction(null);
    setDiceRolled(false);
    setConsecutiveDoubles(0);
    setWaitingForEndTurn(false);
    setAtGajian(false);

    let nextIdx = (currentPlayerIndex + 1) % players.length;
    while (players[nextIdx]?.isBankrupt) {
      nextIdx = (nextIdx + 1) % players.length;
    }

    if (nextIdx <= currentPlayerIndex) {
      setTurn(t => t + 1);
    }

    const activePlayers = players.filter(p => !p.isBankrupt);
    if (activePlayers.length <= 1) {
      setScreen('gameover');
      return;
    }

    setCurrentPlayerIndex(nextIdx);
    addLog(`${players[nextIdx].name} giliran.`, 'info');
  };

  const handleRollDice = () => {
    if (diceRolling || diceRolled || movingPlayer) return;

    setDiceRolling(true);
    const newDice = rollDice();
    setDice(newDice);

    setTimeout(() => {
      setDiceRolling(false);
      setDiceRolled(true);
      const isDoubles = newDice[0] === newDice[1];
      const total = newDice[0] + newDice[1];
      const cp = playersRef.current[currentPlayerIndex];
      addLog(`${cp.name} lempar dadu: ${newDice[0]} + ${newDice[1]} = ${total}`, 'move');

      if (cp.inJail) {
        if (isDoubles) {
          addLog(`${cp.name} dapet dobel! Bebas dari lapas!`, 'good');
          updatePlayer(cp.id, { inJail: false, jailTurns: 0 });
          setPendingAction(null);
          movePlayerSteps(cp.id, total);
        } else {
          const newJailTurns = cp.jailTurns + 1;
          if (newJailTurns >= MAX_JAIL_TURNS) {
            if (cp.cash >= LAPAS_FINE) {
              addLog(`${cp.name} udah 3 putaran di lapas. Bayar denda ${formatMoneyFull(LAPAS_FINE)}.`, 'bad');
              updatePlayer(cp.id, { cash: cp.cash - LAPAS_FINE, inJail: false, jailTurns: 0 });
              setPendingAction(null);
              movePlayerSteps(cp.id, total);
            } else {
              addLog(`${cp.name} gak bisa bayar denda lapas. Bangkrut!`, 'bad');
              updatePlayer(cp.id, { isBankrupt: true, inJail: false });
              setPendingAction(null);
              setWaitingForEndTurn(true);
            }
          } else {
            addLog(`${cp.name} masih di lapas. Putaran ${newJailTurns}/${MAX_JAIL_TURNS}.`, 'bad');
            updatePlayer(cp.id, { jailTurns: newJailTurns });
            setPendingAction(null);
            setWaitingForEndTurn(true);
          }
        }
        return;
      }

      if (isDoubles) {
        const newDoubles = consecutiveDoubles + 1;
        setConsecutiveDoubles(newDoubles);
        if (newDoubles >= 3) {
          addLog(`${cp.name} dobel 3x! Kena OTK, masuk lapas!`, 'bad');
          updatePlayer(cp.id, { position: 8, inJail: true, jailTurns: 0 });
          setConsecutiveDoubles(0);
          setWaitingForEndTurn(true);
          return;
        }
      } else {
        setConsecutiveDoubles(0);
      }

      movePlayerSteps(cp.id, total);
    }, 800);
  };

  const movePlayerSteps = (playerId: number, steps: number) => {
    const player = playersRef.current.find(p => p.id === playerId)!;
    setMovingPlayer(true);

    let currentPos = player.position;
    const targetPos = (currentPos + steps) % BOARD_SIZE;
    let stepCount = 0;
    let passedStart = false;

    const interval = setInterval(() => {
      currentPos = (currentPos + 1) % BOARD_SIZE;
      stepCount++;

      if (currentPos === 0 && stepCount < steps) {
        const p = playersRef.current.find(p => p.id === playerId)!;
        updatePlayer(playerId, { cash: p.cash + SALARY, position: 0 });
        addLog(`${p.name} lewat Start, gajian ${formatMoneyFull(SALARY)}!`, 'good');
        passedStart = true;
      } else {
        updatePlayer(playerId, { position: currentPos });
      }

      if (stepCount >= steps) {
        clearInterval(interval);
        setMovingPlayer(false);
        setTimeout(() => {
          handleTileLanding(playerId, targetPos, passedStart);
        }, 200);
      }
    }, 150);
  };

  const handleTileLanding = (playerId: number, tileId: number, justGajian: boolean) => {
    const player = playersRef.current.find(p => p.id === playerId)!;
    const tile = BOARD[tileId];
    addLog(`${player.name} mendarat di ${tile.name}.`, 'move');

    switch (tile.type) {
      case 'start':
        addLog(`${player.name} tepat di Start! Gajian ${formatMoneyFull(SALARY)}!`, 'good');
        updatePlayer(playerId, { cash: player.cash + SALARY });
        setAtGajian(true);
        break;

      case 'property': {
        if (isStateOwned(tileId)) {
          const rent = calculateStateRent(tile);
          addLog(`${player.name} injak tanah milik negara. Bayar sewa ${formatMoneyFull(rent)} ke negara.`, 'bad');
          if (player.cash >= rent) {
            updatePlayer(playerId, { cash: player.cash - rent });
            setNegaraCash(n => n + rent);
          } else {
            addLog(`${player.name} gak bisa bayar sewa negara! Bangkrut!`, 'bad');
            updatePlayer(playerId, { isBankrupt: true, cash: 0 });
          }
          setWaitingForEndTurn(true);
          break;
        }

        const owner = propertyOwner(playersRef.current, tileId);
        if (!owner) {
          setPendingAction({ type: 'buy', tileId });
        } else if (owner.id === playerId) {
          addLog(`${player.name} mendarat di tanah sendiri.`, 'info');
          setWaitingForEndTurn(true);
        } else {
          const rent = calculateRent(tile, owner);
          if (player.cash >= rent) {
            addLog(`${player.name} bayar sewa ${formatMoneyFull(rent)} ke ${owner.name}.`, 'bad');
            updatePlayer(playerId, { cash: player.cash - rent });
            updatePlayer(owner.id, { cash: owner.cash + rent });
            setWaitingForEndTurn(true);
          } else {
            addLog(`${player.name} gak bisa bayar sewa ${formatMoneyFull(rent)}! Bangkrut!`, 'bad');
            updatePlayer(playerId, { isBankrupt: true, cash: 0 });
            const newProps = [...owner.properties, ...player.properties];
            const newHouses = { ...owner.houses };
            for (const propId of player.properties) {
              const h = player.houses[propId] || 0;
              if (h > 0) newHouses[propId] = (newHouses[propId] || 0) + h;
            }
            updatePlayer(owner.id, { properties: newProps, houses: newHouses, cash: owner.cash + player.cash });
            setWaitingForEndTurn(true);
          }
        }
        break;
      }

      case 'musibah': {
        const card = drawCard('musibah');
        if (player.protectionCards > 0 && card.effect.money && card.effect.money < 0) {
          addLog(`${player.name} pakai Kartu Pelindung untuk menangkal ${card.title}!`, 'good');
          updatePlayer(playerId, { protectionCards: player.protectionCards - 1 });
          setWaitingForEndTurn(true);
        } else {
          setShowCard(card);
          setCardDiceValue(undefined);
        }
        break;
      }

      case 'takdir': {
        const card = drawCard('takdir');
        setShowCard(card);
        setCardDiceValue(undefined);
        break;
      }

      case 'targetir': {
        const card = drawCard('targetir');
        setShowCard(card);
        setCardDiceValue(undefined);
        break;
      }

      case 'lapas':
        addLog(`${player.name} kena OTK! Masuk lapas!`, 'bad');
        updatePlayer(playerId, { position: 8, inJail: true, jailTurns: 0 });
        setWaitingForEndTurn(true);
        break;

      case 'pajak': {
        const tax = player.properties.length * TAX_PER_PROPERTY;
        if (tax === 0) {
          addLog(`${player.name} gak punya tanah. Pajak gratis!`, 'info');
        } else if (player.cash >= tax) {
          addLog(`${player.name} bayar pajak tahunan ${formatMoneyFull(tax)} (${player.properties.length} tanah x ${formatMoneyFull(TAX_PER_PROPERTY)}).`, 'bad');
          updatePlayer(playerId, { cash: player.cash - tax });
          setNegaraCash(n => n + tax);
        } else {
          addLog(`${player.name} gak bisa bayar pajak! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
        setWaitingForEndTurn(true);
        break;
      }

      case 'pengadilan':
        setPendingAction({ type: 'pengadilan', tileId });
        break;

      case 'pungli':
        if (hasBandung(player)) {
          addLog(`${player.name} punya tanah di Bandung. Bebas pungli!`, 'good');
          setWaitingForEndTurn(true);
        } else {
          setPendingAction({ type: 'pungli', tileId });
        }
        break;

      case 'tol': {
        const dest = getTolDestination(tileId);
        addLog(`${player.name} masuk jalan tol, tembus ke ${BOARD[dest].name}!`, 'move');
        const passStart = dest < tileId;
        if (passStart) {
          updatePlayer(playerId, { position: dest, cash: player.cash + SALARY });
          addLog(`${player.name} lewat Start, gajian ${formatMoneyFull(SALARY)}!`, 'good');
        } else {
          updatePlayer(playerId, { position: dest });
        }
        setTimeout(() => {
          handleTileLanding(playerId, dest, passStart);
        }, 300);
        break;
      }

      case 'tilang':
        addLog(`${player.name} kena tilang! Dapat 1 tiket tilang.`, 'bad');
        updatePlayer(playerId, { tilangTickets: player.tilangTickets + 1 });
        setPendingAction({ type: 'tilang', tileId });
        break;

      default:
        setWaitingForEndTurn(true);
    }

    if (justGajian && tile.type !== 'start') {
      setAtGajian(true);
    }
  };

  const handleCardClose = () => {
    const card = showCard;
    if (!card || !currentPlayer) return;
    applyCardEffect(currentPlayer.id, card, cardDiceValue);
    setShowCard(null);
    setCardDiceValue(undefined);
  };

  const applyCardEffect = (playerId: number, card: GameCard, diceVal?: number) => {
    const player = playersRef.current.find(p => p.id === playerId)!;
    const effect = card.effect;

    if (effect.rollDice && diceVal === undefined) {
      setShowCard(card);
      setPendingAction({ type: 'card-dice', card });
      return;
    }

    if (effect.rollDice && diceVal !== undefined) {
      if (diceVal % 2 === 0) {
        const reward = effect.evenReward || 0;
        addLog(`Genap! ${player.name} untung ${formatMoneyFull(reward)}!`, 'good');
        updatePlayer(playerId, { cash: player.cash + reward });
      } else {
        const penalty = effect.oddPenalty || 0;
        addLog(`Ganjil! ${player.name} sial, bayar ${formatMoneyFull(penalty)}.`, 'bad');
        if (player.cash >= penalty) {
          updatePlayer(playerId, { cash: player.cash - penalty });
        } else {
          addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
      }
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.money !== undefined) {
      const amount = effect.money;
      if (amount > 0) addLog(`${player.name} dapat ${formatMoneyFull(amount)}!`, 'good');
      else addLog(`${player.name} bayar ${formatMoneyFull(-amount)}.`, 'bad');
      if (player.cash + amount >= 0) {
        updatePlayer(playerId, { cash: player.cash + amount });
      } else {
        addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
        updatePlayer(playerId, { isBankrupt: true, cash: 0 });
      }
    }

    if (effect.payPerProperty !== undefined) {
      const total = player.properties.length * effect.payPerProperty;
      if (total > 0) {
        if (player.cash >= total) {
          addLog(`${player.name} bayar ${formatMoneyFull(total)} (${player.properties.length} properti x ${formatMoneyFull(effect.payPerProperty)}).`, 'bad');
          updatePlayer(playerId, { cash: player.cash - total });
        } else {
          addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
      }
    }

    if (effect.payPerHouse !== undefined) {
      const houseCount = getTotalHouseCount(player);
      const total = houseCount * effect.payPerHouse;
      if (total > 0) {
        if (player.cash >= total) {
          addLog(`${player.name} bayar ${formatMoneyFull(total)} (${houseCount} rumah x ${formatMoneyFull(effect.payPerHouse)}).`, 'bad');
          updatePlayer(playerId, { cash: player.cash - total });
        } else {
          addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
      }
    }

    if (effect.payPerPlayer !== undefined) {
      const others = playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt);
      const total = others.length * effect.payPerPlayer;
      if (player.cash >= total) {
        addLog(`${player.name} bayar ${formatMoneyFull(effect.payPerPlayer)} ke ${others.length} pemain.`, 'bad');
        updatePlayer(playerId, { cash: player.cash - total });
        others.forEach(op => updatePlayer(op.id, { cash: op.cash + effect.payPerPlayer! }));
      } else {
        addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
        updatePlayer(playerId, { isBankrupt: true, cash: 0 });
      }
    }

    if (effect.collectPerPlayer !== undefined) {
      const others = playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt);
      const total = others.length * effect.collectPerPlayer;
      addLog(`${player.name} kumpul ${formatMoneyFull(effect.collectPerPlayer)} dari ${others.length} pemain.`, 'good');
      updatePlayer(playerId, { cash: player.cash + total });
      others.forEach(op => {
        const newCash = Math.max(0, op.cash - effect.collectPerPlayer!);
        updatePlayer(op.id, { cash: newCash, isBankrupt: newCash === 0 && op.properties.length === 0 });
      });
    }

    if (effect.periksaTilang) {
      if (player.tilangTickets > 0) {
        const fine = player.tilangTickets * 500_000;
        addLog(`${player.name} punya ${player.tilangTickets} tiket tilang. Bayar ${formatMoneyFull(fine)}.`, 'bad');
        if (player.cash >= fine) {
          updatePlayer(playerId, { cash: player.cash - fine, tilangTickets: 0 });
        } else {
          addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
      } else {
        addLog(`${player.name} bersih, gak ada tiket tilang. Selamat!`, 'good');
      }
    }

    if (effect.goToJail) {
      addLog(`${player.name} masuk lapas!`, 'bad');
      updatePlayer(playerId, { position: 8, inJail: true, jailTurns: 0 });
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.getOutCard) {
      addLog(`${player.name} dapat Kartu Bebas Lapas!`, 'good');
      updatePlayer(playerId, { getOutCards: player.getOutCards + 1 });
    }

    if (effect.protection) {
      addLog(`${player.name} dapat Kartu Pelindung!`, 'good');
      updatePlayer(playerId, { protectionCards: player.protectionCards + 1 });
    }

    if (effect.moveTo !== undefined) {
      const dest = effect.moveTo;
      const passStart = dest < player.position;
      if (passStart) {
        addLog(`${player.name} pindah ke ${BOARD[dest].name}, lewat Start, gajian!`, 'good');
        updatePlayer(playerId, { position: dest, cash: player.cash + SALARY });
      } else {
        addLog(`${player.name} pindah ke ${BOARD[dest].name}.`, 'move');
        updatePlayer(playerId, { position: dest });
      }
      setTimeout(() => handleTileLanding(playerId, dest, passStart), 300);
      return;
    }

    if (effect.freeProperty) {
      setShowPropertySelect('free');
      return;
    }

    if (effect.freeUpgrade) {
      setShowPropertySelect('upgrade');
      return;
    }

    if (effect.galiLubang || effect.jualWajib) {
      const targetId = getCheapestProperty(player);
      if (targetId === null) {
        addLog(`${player.name} gak punya tanah. Aman!`, 'good');
        setWaitingForEndTurn(true);
        return;
      }
      const tile = BOARD[targetId];
      const refund = Math.floor((tile.price || 0) * 0.5);
      addLog(`${player.name} tanah ${tile.name} disita negara. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      const newProps = player.properties.filter(id => id !== targetId);
      const newHouses = { ...player.houses };
      delete newHouses[targetId];
      updatePlayer(playerId, { properties: newProps, houses: newHouses, cash: player.cash + refund });
      STATE_OWNED.add(targetId);
      addLog(`${tile.name} sekarang milik negara. Siapa pun yang injak bayar sewa ke negara.`, 'card');
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.pembebasanLahan) {
      const targetId = getFirstProperty(player);
      if (targetId === null) {
        addLog(`${player.name} gak punya tanah. Aman!`, 'good');
        setWaitingForEndTurn(true);
        return;
      }
      const tile = BOARD[targetId];
      const refund = Math.floor((tile.price || 0) * 0.5);
      addLog(`${player.name} tanah ${tile.name} digusur untuk jalan tol! Gak boleh nolak. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      const newProps = player.properties.filter(id => id !== targetId);
      const newHouses = { ...player.houses };
      delete newHouses[targetId];
      updatePlayer(playerId, { properties: newProps, houses: newHouses, cash: player.cash + refund });
      const updatedBoard = [...BOARD];
      updatedBoard[targetId] = { ...tile, type: 'tol', isTol: true, name: `Tol ${tile.name}` };
      addLog(`${tile.name} berubah menjadi jalan tol!`, 'card');
      setWaitingForEndTurn(true);
      return;
    }

    setWaitingForEndTurn(true);
  };

  const handleBuy = () => {
    if (!pendingAction?.tileId || !currentPlayer) return;
    const tile = BOARD[pendingAction.tileId];
    if (currentPlayer.cash < (tile.price || 0)) return;
    addLog(`${currentPlayer.name} beli ${tile.name} seharga ${formatMoneyFull(tile.price || 0)}.`, 'money');
    updatePlayer(currentPlayer.id, {
      cash: currentPlayer.cash - (tile.price || 0),
      properties: [...currentPlayer.properties, tile.id],
    });
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handleSkip = () => {
    if (!currentPlayer) return;
    addLog(`${currentPlayer.name} skip beli tanah.`, 'info');
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handlePayBail = () => {
    if (!currentPlayer) return;
    addLog(`${currentPlayer.name} bayar jaminan lapas ${formatMoneyFull(JAIL_BAIL)}.`, 'bad');
    updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - JAIL_BAIL, inJail: false, jailTurns: 0 });
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handleUseGetOutCard = () => {
    if (!currentPlayer) return;
    addLog(`${currentPlayer.name} gunakan Kartu Bebas Lapas!`, 'good');
    updatePlayer(currentPlayer.id, { getOutCards: currentPlayer.getOutCards - 1, inJail: false, jailTurns: 0 });
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handleRollForJail = () => {
    if (!currentPlayer) return;
    const jailDice = rollDice();
    const isDoubles = jailDice[0] === jailDice[1];
    addLog(`${currentPlayer.name} lempar dadu: ${jailDice[0]} + ${jailDice[1]}`, 'move');

    if (pendingAction?.type === 'pengadilan') {
      const total = jailDice[0] + jailDice[1];
      if (total % 2 === 0) {
        addLog(`Genap! ${currentPlayer.name} bebas dari pengadilan.`, 'good');
        setPendingAction(null);
        setWaitingForEndTurn(true);
      } else {
        addLog(`Ganjil! ${currentPlayer.name} masuk lapas + bayar denda ${formatMoneyFull(LAPAS_FINE)}.`, 'bad');
        if (currentPlayer.cash >= LAPAS_FINE) {
          updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, position: 8, inJail: true, jailTurns: 0 });
        } else {
          updatePlayer(currentPlayer.id, { isBankrupt: true, cash: 0 });
        }
        setPendingAction(null);
        setWaitingForEndTurn(true);
      }
    } else {
      if (isDoubles) {
        addLog(`Dobel! ${currentPlayer.name} bebas dari lapas!`, 'good');
        updatePlayer(currentPlayer.id, { inJail: false, jailTurns: 0 });
        setPendingAction(null);
        movePlayerSteps(currentPlayer.id, jailDice[0] + jailDice[1]);
      } else {
        const newTurns = currentPlayer.jailTurns + 1;
        if (newTurns >= MAX_JAIL_TURNS) {
          if (currentPlayer.cash >= LAPAS_FINE) {
            addLog(`3 putaran habis. Bayar denda ${formatMoneyFull(LAPAS_FINE)} dan keluar.`, 'bad');
            updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, inJail: false, jailTurns: 0 });
            setPendingAction(null);
            movePlayerSteps(currentPlayer.id, jailDice[0] + jailDice[1]);
          } else {
            addLog(`${currentPlayer.name} gak bisa bayar. Bangkrut!`, 'bad');
            updatePlayer(currentPlayer.id, { isBankrupt: true, inJail: false });
            setPendingAction(null);
            setWaitingForEndTurn(true);
          }
        } else {
          addLog(`Masih di lapas. Putaran ${newTurns}/${MAX_JAIL_TURNS}.`, 'bad');
          updatePlayer(currentPlayer.id, { jailTurns: newTurns });
          setPendingAction(null);
          setWaitingForEndTurn(true);
        }
      }
    }
  };

  const handlePayFine = (amount: number) => {
    if (!currentPlayer) return;
    if (currentPlayer.cash < amount) return;
    addLog(`${currentPlayer.name} bayar ${formatMoneyFull(amount)}.`, 'bad');
    updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - amount });
    setNegaraCash(n => n + amount);
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handlePropertySelect = (tileId: number) => {
    if (tileId === -1) {
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
      return;
    }
    if (showPropertySelect === 'free') {
      addLog(`${currentPlayer.name} dapat ${BOARD[tileId].name} gratis!`, 'good');
      updatePlayer(currentPlayer.id, { properties: [...currentPlayer.properties, tileId] });
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
    } else if (showPropertySelect === 'build') {
      const tile = BOARD[tileId];
      const level = currentPlayer.houses[tileId] || 0;
      if (level >= 2) {
        addLog(`${currentPlayer.name} upgrade ${tile.name} ke Rumah OKB!`, 'money');
        updatePlayer(currentPlayer.id, {
          cash: currentPlayer.cash - (tile.okbPrice || 0),
          houses: { ...currentPlayer.houses, [tileId]: 3 as HouseLevel },
        });
      } else {
        addLog(`${currentPlayer.name} bangun Rumah Subsidi di ${tile.name}.`, 'money');
        updatePlayer(currentPlayer.id, {
          cash: currentPlayer.cash - (tile.housePrice || 0),
          houses: { ...currentPlayer.houses, [tileId]: (level + 1) as HouseLevel },
        });
      }
      setShowPropertySelect(null);
    } else if (showPropertySelect === 'upgrade') {
      const tile = BOARD[tileId];
      const level = currentPlayer.houses[tileId] || 0;
      if (level >= 1 && level <= 2) {
        addLog(`${currentPlayer.name} dapat upgrade gratis: ${tile.name} jadi Rumah OKB!`, 'good');
        updatePlayer(currentPlayer.id, {
          houses: { ...currentPlayer.houses, [tileId]: 3 as HouseLevel },
        });
      } else if (level === 0) {
        addLog(`${currentPlayer.name} dapat Rumah Subsidi gratis di ${tile.name}!`, 'good');
        updatePlayer(currentPlayer.id, {
          houses: { ...currentPlayer.houses, [tileId]: 1 as HouseLevel },
        });
      }
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
    }
  };

  const handleBuildHouse = () => {
    setShowPropertySelect('build');
  };

  const handleGajianBuild = () => {
    setShowPropertySelect('build');
  };

  if (screen === 'setup') return <SetupScreen onStart={startGame} />;
  if (screen === 'gameover') return <GameOverScreen players={players} negaraCash={negaraCash} onRestart={() => setScreen('setup')} />;
  if (!currentPlayer) return null;

  const currentTile = BOARD[currentPlayer.position];
  const tileOwner = pendingAction?.tileId !== undefined ? propertyOwner(players, pendingAction.tileId) : null;
  const canBuy = currentPlayer.cash >= (BOARD[pendingAction?.tileId ?? -1]?.price || 0);
  const canBuildNow = atGajian && !diceRolled && !pendingAction && !showCard && currentPlayer.properties.length > 0;
  const stateOwned = isStateOwned(currentPlayer.position);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">WNI</span>
            </div>
            <div>
              <h1 className="text-white font-black text-base sm:text-lg leading-tight">WNI Simulator</h1>
              <p className="text-slate-500 text-xs">Putaran {turn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 bg-slate-800">
              <Landmark className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 text-xs font-bold">Negara: {formatMoneyFull(negaraCash)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-slate-800" style={{ borderLeft: `3px solid ${currentPlayer.color}` }}>
              <span className="text-lg">{currentPlayer.emoji}</span>
              <span className="text-white font-bold text-sm">{currentPlayer.name}</span>
              <span className="text-amber-400 text-sm font-bold">{formatMoneyFull(currentPlayer.cash)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
          <div className="space-y-3">
            <GameBoard players={players} currentPlayerId={currentPlayerIndex} stateOwnedTiles={Array.from(STATE_OWNED)} />

            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Dice
                values={dice}
                rolling={diceRolling}
                rolled={diceRolled}
                onRoll={handleRollDice}
                disabled={diceRolled || movingPlayer || !!pendingAction || !!showCard || currentPlayer.inJail || waitingForEndTurn}
              />

              <div className="flex flex-col items-center gap-2">
                {atGajian && !diceRolled && !pendingAction && !showCard && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-amber-400 text-xs font-bold animate-pulse">Saatnya gajian! Bangun/upgrade rumah sebelum jalan.</p>
                    {currentPlayer.properties.length > 0 && (
                      <button
                        onClick={handleGajianBuild}
                        className="px-4 py-2 rounded-xl bg-green-600/80 text-white font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Bangun/Upgrade Rumah
                      </button>
                    )}
                    <button
                      onClick={() => { setAtGajian(false); }}
                      className="px-4 py-1.5 rounded-xl bg-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-500 transition-colors"
                    >
                      Lanjut Jalan
                    </button>
                  </div>
                )}
                {waitingForEndTurn && !pendingAction && !showCard && !atGajian && (
                  <button
                    onClick={nextPlayer}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
                  >
                    <LogOut className="w-4 h-4" />
                    Akhiri Giliran
                  </button>
                )}
                {currentPlayer.inJail && !pendingAction && !showCard && !diceRolled && !atGajian && (
                  <button
                    onClick={() => setPendingAction({ type: 'jail' })}
                    className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    Keluar dari Lapas
                  </button>
                )}
              </div>
            </div>

            <LogPanel logs={logs} />
          </div>

          <div className="space-y-3">
            <PlayerPanel players={players} currentPlayerId={currentPlayerIndex} />

            <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50">
              <h3 className="text-slate-300 font-bold text-sm mb-2 px-1">Lokasi Saat Ini</h3>
              <div className="bg-slate-700/40 rounded-xl p-3">
                <p className="text-white font-bold text-sm">{currentTile.name}</p>
                {currentTile.island && <p className="text-slate-500 text-xs">Pulau {currentTile.island}</p>}
                {stateOwned && <p className="text-red-400 text-xs mt-1 font-bold">Milik Negara</p>}
                {currentTile.price && <p className="text-amber-400 text-xs mt-1">Harga: {formatMoneyFull(currentTile.price)}</p>}
                {currentTile.rent && <p className="text-slate-500 text-xs">Sewa tanah: {formatMoneyFull(currentTile.rent)}</p>}
                {currentTile.rentSubsidi1 && <p className="text-green-400 text-xs">Sewa 1 RS: {formatMoneyFull(currentTile.rentSubsidi1)}</p>}
                {currentTile.rentSubsidi2 && <p className="text-green-400 text-xs">Sewa 2 RS: {formatMoneyFull(currentTile.rentSubsidi2)}</p>}
                {currentTile.rentOKB && <p className="text-red-400 text-xs">Sewa OKB: {formatMoneyFull(currentTile.rentOKB)}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCard && (
        <CardModal card={showCard} onClose={handleCardClose} diceValue={cardDiceValue} />
      )}

      {pendingAction && (
        <ActionModal
          action={pendingAction}
          tile={BOARD[pendingAction.tileId ?? currentPlayer.position]}
          currentPlayer={currentPlayer}
          owner={tileOwner}
          onBuy={handleBuy}
          onSkip={handleSkip}
          onPayBail={handlePayBail}
          onUseGetOutCard={handleUseGetOutCard}
          onRollForJail={handleRollForJail}
          onPayFine={handlePayFine}
          onDismiss={() => { setPendingAction(null); setWaitingForEndTurn(true); }}
          canAfford={canBuy}
        />
      )}

      {showPropertySelect && (
        <PropertySelectModal
          players={players}
          onSelect={handlePropertySelect}
          title={showPropertySelect === 'free' ? 'Properti Gratis' : showPropertySelect === 'upgrade' ? 'Upgrade Gratis' : 'Bangun/Upgrade Rumah'}
          description={showPropertySelect === 'free' ? 'Pilih tanah kosong' : showPropertySelect === 'upgrade' ? 'Pilih tanah untuk di-upgrade' : 'Pilih tanah milikmu'}
          mode={showPropertySelect}
          currentPlayer={currentPlayer}
        />
      )}
    </div>
  );
}

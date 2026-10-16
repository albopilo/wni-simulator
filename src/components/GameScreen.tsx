import { useState, useCallback, useRef } from 'react';
import type { Player, GameCard, PendingAction, LogEntry, HouseLevel, MusibahTier } from '@/game/types';
import {
  createPlayers, rollDice, rollSingleDie, propertyOwner, calculateRent, calculateStateRent, drawCard,
  getTolDestinations, hasBandung, makeLog, isStateOwned, isTolTile, getTile, getBoardSnapshot,
  getCheapestProperty, getFirstProperty, getTotalHouseCount, houseLevelName,
  getSeverityFromDie, severityLabel, getTieredMoney, getTieredPayPerProperty, getTieredPayPerHouse,
  canBuildHouse, getBuildCost, getSellValue,
  STATE_OWNED, BOARD_OVERRIDES,
  SALARY, JAIL_BAIL, TAX_PER_PROPERTY, LAPAS_FINE, MAX_JAIL_TURNS, TOL_FEE,
  PENGADILAN_COMPENSATION, STOPWATCH_ROUND_THRESHOLD,
} from '@/game/gameLogic';
import {
  BOARD, BOARD_SIZE, formatMoneyFull, LAPAS_TILE_ID,
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
  const [cardSeverity, setCardSeverity] = useState<MusibahTier | undefined>(undefined);
  const [showPropertySelect, setShowPropertySelect] = useState<'free' | 'build' | 'upgrade' | 'sell' | null>(null);
  const [waitingForEndTurn, setWaitingForEndTurn] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(false);
  const [atGajian, setAtGajian] = useState(false);
  const [negaraCash, setNegaraCash] = useState(0);
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);

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
    BOARD_OVERRIDES.clear();
    setNegaraCash(0);
    setStopwatchActive(false);
    setBoardVersion(v => v + 1);
    const newPlayers = createPlayers(count);
    setPlayers(newPlayers);
    setCurrentPlayerIndex(0);
    setTurn(1);
    setLogs([makeLog(`Permainan dimulai! ${count} pemain siap menjadi WNI.`, 'info')]);
    setScreen('playing');
    setDiceRolled(false);
    setAtGajian(false);
  };

  const checkStopwatch = () => {
    if (stopwatchActive) return;
    const allPassedTwo = playersRef.current.every(p => p.turnsPlayed >= STOPWATCH_ROUND_THRESHOLD);
    if (allPassedTwo && playersRef.current.length > 0) {
      setStopwatchActive(true);
      addLog('Kartu stopwatch sekarang aktif! Semua pemain sudah lewat 2 putaran.', 'card');
    }
  };

  const nextPlayer = () => {
    setPendingAction(null);
    setDiceRolled(false);
    setWaitingForEndTurn(false);
    setAtGajian(false);

    const cp = playersRef.current[currentPlayerIndex];
    if (cp) {
      updatePlayer(cp.id, { turnsPlayed: cp.turnsPlayed + 1 });
    }

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

    setTimeout(checkStopwatch, 100);
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
              setNegaraCash(n => n + LAPAS_FINE);
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
        addLog(`${cp.name} dapet dadu kembar! Setelah efek lokasi, wajib ambil kartu Takdir.`, 'card');
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
    const tile = getTile(tileId);
    addLog(`${player.name} mendarat di ${tile.name}.`, 'move');

    const wasDoubles = dice[0] === dice[1];

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
          if (owner.inJail) {
            addLog(`${owner.name} sedang di lapas! Sewa ${formatMoneyFull(rent)} disita negara.`, 'bad');
            if (player.cash >= rent) {
              updatePlayer(playerId, { cash: player.cash - rent });
              setNegaraCash(n => n + rent);
            } else {
              addLog(`${player.name} gak bisa bayar sewa! Bangkrut!`, 'bad');
              updatePlayer(playerId, { isBankrupt: true, cash: 0 });
            }
            setWaitingForEndTurn(true);
          } else if (player.cash >= rent) {
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
              if (h > 0) newHouses[propId] = ((newHouses[propId] || 0) + h) as HouseLevel;
            }
            updatePlayer(owner.id, { properties: newProps, houses: newHouses, cash: owner.cash + player.cash });
            setWaitingForEndTurn(true);
          }
        }
        break;
      }

      case 'musibah': {
        const card = drawCard('musibah', stopwatchActive);
        if (player.protectionCards > 0) {
          addLog(`${player.name} pakai Kartu Pelindung untuk menangkal ${card.title}!`, 'good');
          updatePlayer(playerId, { protectionCards: player.protectionCards - 1 });
          setWaitingForEndTurn(true);
        } else {
          setShowCard(card);
          setCardDiceValue(undefined);
          setCardSeverity(undefined);
          setPendingAction({ type: 'musibah-roll', card });
        }
        break;
      }

      case 'takdir': {
        const card = drawCard('takdir', stopwatchActive);
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
        break;
      }

      case 'targetir': {
        const card = drawCard('targetir', stopwatchActive);
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
        break;
      }

      case 'lapas':
        addLog(`${player.name} mendarat di Lapas. Kunjungan doang, aman!`, 'info');
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
        const dests = getTolDestinations(tileId);
        if (dests.length === 0) {
          addLog(`${player.name} di jalan tol tapi tidak ada tol lain!`, 'info');
          setWaitingForEndTurn(true);
        } else {
          setPendingAction({ type: 'tol-choose', tileId, tolDestinations: dests });
        }
        break;
      }

      case 'tilang':
        addLog(`${player.name} kena tilang! Bayar denda ${formatMoneyFull(500_000)} ke negara.`, 'bad');
        if (player.cash >= 500_000) {
          updatePlayer(playerId, { cash: player.cash - 500_000 });
          setNegaraCash(n => n + 500_000);
        } else {
          addLog(`${player.name} gak bisa bayar tilang! Bangkrut!`, 'bad');
          updatePlayer(playerId, { isBankrupt: true, cash: 0 });
        }
        setWaitingForEndTurn(true);
        break;

      default:
        setWaitingForEndTurn(true);
    }

    if (justGajian && tile.type !== 'start') {
      setAtGajian(true);
    }
  };

  const handleMusibahRoll = () => {
    const dieVal = rollSingleDie();
    const tier = getSeverityFromDie(dieVal);
    addLog(`Dadu musibah: ${dieVal} — ${severityLabel(tier)}!`, 'card');
    setCardDiceValue(dieVal);
    setCardSeverity(tier);
  };

  const handleCardClose = () => {
    const card = showCard;
    if (!card || !currentPlayer) return;

    if (card.type === 'musibah' && cardSeverity === undefined) {
      return;
    }

    applyCardEffect(currentPlayer.id, card, cardDiceValue, cardSeverity);
    setShowCard(null);
    setCardDiceValue(undefined);
    setCardSeverity(undefined);
  };

  const applyCardEffect = (playerId: number, card: GameCard, diceVal?: number, severity?: MusibahTier) => {
    const player = playersRef.current.find(p => p.id === playerId)!;
    const effect = card.effect;

    if (effect.goToJail) {
      addLog(`${player.name} masuk lapas!`, 'bad');
      updatePlayer(playerId, { position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.getOutCard) {
      addLog(`${player.name} dapat Kartu Bebas Lapas!`, 'good');
      updatePlayer(playerId, { getOutCards: player.getOutCards + 1 });
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.protection) {
      addLog(`${player.name} dapat Kartu Pelindung!`, 'good');
      updatePlayer(playerId, { protectionCards: player.protectionCards + 1 });
      setWaitingForEndTurn(true);
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
      const tile = getTile(targetId);
      const refund = Math.floor((tile.price || 0) * 0.5);
      addLog(`${player.name} tanah ${tile.name} disita negara. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      const newProps = player.properties.filter(id => id !== targetId);
      const newHouses = { ...player.houses };
      delete newHouses[targetId];
      updatePlayer(playerId, { properties: newProps, houses: newHouses, cash: player.cash + refund });
      STATE_OWNED.add(targetId);
      addLog(`${tile.name} sekarang milik negara. Siapa pun yang injak bayar sewu ke negara.`, 'card');
      setBoardVersion(v => v + 1);
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
      const tile = getTile(targetId);
      const refund = Math.floor((tile.price || 0) * 0.5);
      addLog(`${player.name} tanah ${tile.name} digusur untuk jalan tol! Gak boleh nolak. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      const newProps = player.properties.filter(id => id !== targetId);
      const newHouses = { ...player.houses };
      delete newHouses[targetId];
      updatePlayer(playerId, { properties: newProps, houses: newHouses, cash: player.cash + refund });
      BOARD_OVERRIDES.set(targetId, { ...tile, type: 'tol', isTol: true, name: `Tol ${tile.name}` });
      addLog(`${tile.name} berubah menjadi jalan tol!`, 'card');
      setBoardVersion(v => v + 1);
      setWaitingForEndTurn(true);
      return;
    }

    let moneyChange = 0;
    let payToNegara = false;

    if (card.tieredMoney && severity) {
      moneyChange = -getTieredMoney(card, severity);
      payToNegara = true;
    } else if (card.tieredPayPerProperty && severity) {
      moneyChange = -(player.properties.length * getTieredPayPerProperty(card, severity));
    } else if (card.tieredPayPerHouse && severity) {
      moneyChange = -(getTotalHouseCount(player) * getTieredPayPerHouse(card, severity));
    } else if (effect.money !== undefined) {
      moneyChange = effect.money;
    } else if (effect.payPerProperty !== undefined) {
      moneyChange = -(player.properties.length * effect.payPerProperty);
      payToNegara = true;
    }

    if (moneyChange !== 0) {
      if (moneyChange > 0) {
        addLog(`${player.name} dapat ${formatMoneyFull(moneyChange)}!`, 'good');
        updatePlayer(playerId, { cash: player.cash + moneyChange });
      } else {
        const amount = -moneyChange;
        if (player.cash >= amount) {
          addLog(`${player.name} bayar ${formatMoneyFull(amount)}.`, 'bad');
          updatePlayer(playerId, { cash: player.cash - amount });
          if (payToNegara) setNegaraCash(n => n + amount);
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

    if (effect.moveTo !== undefined) {
      const dest = effect.moveTo;
      const passStart = dest < player.position;
      if (passStart) {
        addLog(`${player.name} pindah ke ${getTile(dest).name}, lewat Start, gajian!`, 'good');
        updatePlayer(playerId, { position: dest, cash: player.cash + SALARY });
      } else {
        addLog(`${player.name} pindah ke ${getTile(dest).name}.`, 'move');
        updatePlayer(playerId, { position: dest });
      }
      setTimeout(() => handleTileLanding(playerId, dest, passStart), 300);
      return;
    }

    setWaitingForEndTurn(true);
  };

  const handleBuy = () => {
    if (!pendingAction?.tileId || !currentPlayer) return;
    const tile = getTile(pendingAction.tileId);
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
    setNegaraCash(n => n + JAIL_BAIL);
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
      const dieVal = rollSingleDie();
      addLog(`Dadu pengadilan: ${dieVal}`, 'move');
      if (dieVal >= 5) {
        addLog(`Menang pengadilan! ${currentPlayer.name} dapat kompensasi ${formatMoneyFull(PENGADILAN_COMPENSATION)}.`, 'good');
        updatePlayer(currentPlayer.id, { cash: currentPlayer.cash + PENGADILAN_COMPENSATION });
      } else if (dieVal >= 3) {
        addLog(`Kalah pengadilan! ${currentPlayer.name} masuk lapas + bayar denda ${formatMoneyFull(LAPAS_FINE)}.`, 'bad');
        if (currentPlayer.cash >= LAPAS_FINE) {
          updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
          setNegaraCash(n => n + LAPAS_FINE);
        } else {
          updatePlayer(currentPlayer.id, { isBankrupt: true, cash: 0 });
        }
      } else {
        const seized = Math.floor(currentPlayer.cash * 0.5);
        addLog(`Brutal! ${currentPlayer.name} masuk lapas + 50% uang (${formatMoneyFull(seized)}) disita negara.`, 'bad');
        updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - seized, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
        setNegaraCash(n => n + seized);
      }
      setPendingAction(null);
      setWaitingForEndTurn(true);
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
            setNegaraCash(n => n + LAPAS_FINE);
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
    addLog(`${currentPlayer.name} bayar ${formatMoneyFull(amount)} ke negara.`, 'bad');
    updatePlayer(currentPlayer.id, { cash: currentPlayer.cash - amount });
    setNegaraCash(n => n + amount);
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handleTolChoose = (destId: number) => {
    if (!currentPlayer) return;
    const cp = currentPlayer;
    if (cp.cash < TOL_FEE) {
      addLog(`${cp.name} gak bisa bayar tol ${formatMoneyFull(TOL_FEE)}! Bangkrut!`, 'bad');
      updatePlayer(cp.id, { isBankrupt: true, cash: 0 });
      setPendingAction(null);
      setWaitingForEndTurn(true);
      return;
    }
    addLog(`${cp.name} bayar tol ${formatMoneyFull(TOL_FEE)} dan pindah ke ${getTile(destId).name}.`, 'move');
    updatePlayer(cp.id, { cash: cp.cash - TOL_FEE, position: destId });
    setNegaraCash(n => n + TOL_FEE);
    setPendingAction(null);
    setWaitingForEndTurn(true);
  };

  const handlePropertySelect = (tileId: number) => {
    if (tileId === -1) {
      setShowPropertySelect(null);
      if (showPropertySelect !== 'build') {
        setWaitingForEndTurn(true);
      }
      return;
    }
    if (showPropertySelect === 'free') {
      addLog(`${currentPlayer.name} dapat ${getTile(tileId).name} gratis!`, 'good');
      updatePlayer(currentPlayer.id, { properties: [...currentPlayer.properties, tileId] });
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
    } else if (showPropertySelect === 'build') {
      const tile = getTile(tileId);
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
    } else if (showPropertySelect === 'upgrade') {
      const tile = getTile(tileId);
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

  const handleGajianBuildDone = () => {
    setAtGajian(false);
    const cp = playersRef.current[currentPlayerIndex];
    if (cp && !cp.inJail) {
      const wasDoubles = dice[0] === dice[1];
      if (wasDoubles) {
        const card = drawCard('takdir', stopwatchActive);
        addLog(`${cp.name} ambil kartu Takdir karena dadu kembar.`, 'card');
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
      } else {
        setWaitingForEndTurn(true);
      }
    }
  };

  const handleGajianContinue = () => {
    setAtGajian(false);
    const cp = playersRef.current[currentPlayerIndex];
    if (cp && !cp.inJail) {
      const wasDoubles = dice[0] === dice[1];
      if (wasDoubles) {
        const card = drawCard('takdir', stopwatchActive);
        addLog(`${cp.name} ambil kartu Takdir karena dadu kembar.`, 'card');
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
      } else {
        setWaitingForEndTurn(true);
      }
    }
  };

  if (screen === 'setup') return <SetupScreen onStart={startGame} />;
  if (screen === 'gameover') return <GameOverScreen players={players} negaraCash={negaraCash} onRestart={() => setScreen('setup')} />;
  if (!currentPlayer) return null;

  const currentTile = getTile(currentPlayer.position);
  const tileOwner = pendingAction?.tileId !== undefined ? propertyOwner(players, pendingAction.tileId) : null;
  const canBuy = currentPlayer.cash >= (getTile(pendingAction?.tileId ?? -1)?.price || 0);
  const stateOwned = isStateOwned(currentPlayer.position);
  const boardTiles = getBoardSnapshot();

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
              <p className="text-slate-500 text-xs">Putaran {turn}{stopwatchActive && ' • Stopwatch aktif'}</p>
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
            <GameBoard key={boardVersion} players={players} currentPlayerId={currentPlayerIndex} stateOwnedTiles={Array.from(STATE_OWNED)} boardTiles={boardTiles} />

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
                        onClick={() => setShowPropertySelect('build')}
                        className="px-4 py-2 rounded-xl bg-green-600/80 text-white font-bold text-sm flex items-center gap-2 hover:bg-green-600 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Bangun/Upgrade Rumah
                      </button>
                    )}
                    <button
                      onClick={handleGajianContinue}
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
                    className="px-6 py-3 rounded-xl bg-orange-600 text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
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
                {currentTile.price && !stateOwned && <p className="text-amber-400 text-xs mt-1">Harga: {formatMoneyFull(currentTile.price)}</p>}
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
        <CardModal
          card={showCard}
          onClose={handleCardClose}
          diceValue={cardDiceValue}
          severity={cardSeverity}
          onRollMusibah={handleMusibahRoll}
          canClose={cardSeverity !== undefined || showCard.type !== 'musibah'}
        />
      )}

      {pendingAction && (
        <ActionModal
          action={pendingAction}
          tile={getTile(pendingAction.tileId ?? currentPlayer.position)}
          currentPlayer={currentPlayer}
          owner={tileOwner}
          onBuy={handleBuy}
          onSkip={handleSkip}
          onPayBail={handlePayBail}
          onUseGetOutCard={handleUseGetOutCard}
          onRollForJail={handleRollForJail}
          onPayFine={handlePayFine}
          onTolChoose={handleTolChoose}
          onDismiss={() => { setPendingAction(null); setWaitingForEndTurn(true); }}
          canAfford={canBuy}
        />
      )}

      {showPropertySelect && (
        <PropertySelectModal
          players={players}
          onSelect={handlePropertySelect}
          title={showPropertySelect === 'free' ? 'Properti Gratis' : showPropertySelect === 'upgrade' ? 'Upgrade Gratis' : 'Bangun/Upgrade Rumah'}
          description={showPropertySelect === 'free' ? 'Pilih tanah kosong' : showPropertySelect === 'upgrade' ? 'Pilih tanah untuk di-upgrade' : 'Pilih tanah milikmu (bisa bangun di beberapa tanah)'}
          mode={showPropertySelect as 'free' | 'build' | 'upgrade'}
          currentPlayer={currentPlayer}
          onDone={showPropertySelect === 'build' ? handleGajianBuildDone : undefined}
        />
      )}
    </div>
  );
}

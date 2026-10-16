import { useState, useCallback, useRef } from 'react';
import type { Player, GameCard, PendingAction, LogEntry, MusibahTier } from '@/game/types';
import {
  createPlayers, rollDice, rollSingleDie, propertyOwner, calculateRent, calculateStateRent, drawCard,
  getTolDestinations, hasBandung, makeLog, isStateOwned, getTile, getBoardSnapshot,
  getCheapestProperty, getFirstProperty, getTotalHouseCount,
  getSeverityFromDie, severityLabel, getTieredMoney, getTieredPayPerProperty, getTieredPayPerHouse,
  STATE_OWNED, BOARD_OVERRIDES,
  SALARY, JAIL_BAIL, TAX_PER_PROPERTY, LAPAS_FINE, MAX_JAIL_TURNS, TOL_FEE,
  PENGADILAN_COMPENSATION, STOPWATCH_ROUND_THRESHOLD, TILANG_FINE,
  buyProperty, buildHouse, freeUpgradeHouse, confiscateProperty,
  transferPropertiesOnBankruptcy, advanceToTile, findNextPlayer,
  countActivePlayers, collectFromAllPlayers, payAllPlayers,
} from '@/game/gameLogic';
import {
  BOARD_SIZE, formatMoneyFull, LAPAS_TILE_ID,
} from '@/game/boardData';
import { RULES } from '@/game/gameRules';

import SetupScreen from '@/components/SetupScreen';
import GameBoard from '@/components/GameBoard';
import Dice from '@/components/Dice';
import PlayerPanel from '@/components/PlayerPanel';
import LogPanel from '@/components/LogPanel';
import CardModal from '@/components/CardModal';
import ActionModal from '@/components/ActionModal';
import PropertySelectModal from '@/components/PropertySelectModal';
import GameOverScreen from '@/components/GameOverScreen';
import RulesModal from '@/components/RulesModal';
import { LogOut, Building2, Landmark, HelpCircle } from 'lucide-react';

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
  const [showPropertySelect, setShowPropertySelect] = useState<'free' | 'build' | 'upgrade' | null>(null);
  const [waitingForEndTurn, setWaitingForEndTurn] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(false);
  const [atGajian, setAtGajian] = useState(false);
  const [negaraCash, setNegaraCash] = useState(0);
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const [showRules, setShowRules] = useState(false);

  const playersRef = useRef(players);
  playersRef.current = players;
  const stopwatchRef = useRef(stopwatchActive);
  stopwatchRef.current = stopwatchActive;
  const diceRef = useRef(dice);
  diceRef.current = dice;

  const currentPlayer = players[currentPlayerIndex];

  const addLog = useCallback((text: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, makeLog(text, type)]);
  }, []);

  const updateOne = useCallback((id: number, updates: Partial<Player>) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const startGame = useCallback((count: number) => {
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
    setDiceRolling(false);
    setAtGajian(false);
    setPendingAction(null);
    setShowCard(null);
    setWaitingForEndTurn(false);
    setMovingPlayer(false);
  }, []);

  const checkStopwatch = useCallback(() => {
    if (stopwatchRef.current) return;
    const allPassedTwo = playersRef.current.every(p => p.turnsPlayed >= STOPWATCH_ROUND_THRESHOLD);
    if (allPassedTwo && playersRef.current.length > 0) {
      setStopwatchActive(true);
      addLog('Kartu stopwatch sekarang aktif! Semua pemain sudah lewat 2 putaran.', 'card');
    }
  }, [addLog]);

  const nextPlayer = useCallback(() => {
    setPendingAction(null);
    setDiceRolled(false);
    setWaitingForEndTurn(false);
    setAtGajian(false);
    setCardDiceValue(undefined);
    setCardSeverity(undefined);

    const cp = playersRef.current[currentPlayerIndex];
    if (cp) {
      updateOne(cp.id, { turnsPlayed: cp.turnsPlayed + 1 });
    }

    const { nextIndex, newTurn } = findNextPlayer(playersRef.current, currentPlayerIndex);

    if (countActivePlayers(playersRef.current) <= 1) {
      setScreen('gameover');
      return;
    }

    if (newTurn) {
      setTurn(t => t + 1);
    }

    setCurrentPlayerIndex(nextIndex);
    addLog(`${playersRef.current[nextIndex].name} giliran.`, 'info');

    setTimeout(checkStopwatch, 100);
  }, [currentPlayerIndex, addLog, checkStopwatch, updateOne]);

  const handleTileLanding = useCallback((playerId: number, tileId: number, justGajian: boolean) => {
    const player = playersRef.current.find(p => p.id === playerId);
    if (!player) return;
    const tile = getTile(tileId);
    addLog(`${player.name} mendarat di ${tile.name}.`, 'move');

    switch (tile.type) {
      case 'start':
        addLog(`${player.name} tepat di Start! Gajian ${formatMoneyFull(SALARY)}!`, 'good');
        updateOne(playerId, { cash: player.cash + SALARY });
        setAtGajian(true);
        break;

      case 'property': {
        if (isStateOwned(tileId)) {
          const rent = calculateStateRent(tile);
          addLog(`${player.name} injak tanah milik negara. Bayar sewa ${formatMoneyFull(rent)} ke negara.`, 'bad');
          if (player.cash >= rent) {
            updateOne(playerId, { cash: player.cash - rent });
            setNegaraCash(n => n + rent);
          } else {
            addLog(`${player.name} gak bisa bayar sewa negara! Bangkrut!`, 'bad');
            updateOne(playerId, { isBankrupt: true, cash: 0 });
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
              updateOne(playerId, { cash: player.cash - rent });
              updateOne(owner.id, { cash: owner.cash });
              setNegaraCash(n => n + rent);
            } else {
              addLog(`${player.name} gak bisa bayar sewa! Bangkrut!`, 'bad');
              updateOne(playerId, { isBankrupt: true, cash: 0 });
            }
            setWaitingForEndTurn(true);
          } else if (player.cash >= rent) {
            addLog(`${player.name} bayar sewa ${formatMoneyFull(rent)} ke ${owner.name}.`, 'bad');
            updateOne(playerId, { cash: player.cash - rent });
            updateOne(owner.id, { cash: owner.cash + rent });
            setWaitingForEndTurn(true);
          } else {
            addLog(`${player.name} gak bisa bayar sewa ${formatMoneyFull(rent)}! Bangkrut! Properti diserahkan ke ${owner.name}.`, 'bad');
            const { creditor } = transferPropertiesOnBankruptcy(player, owner);
            updateOne(owner.id, { properties: creditor.properties, houses: creditor.houses, cash: creditor.cash });
            updateOne(playerId, { isBankrupt: true, cash: 0, properties: [], houses: {} });
            setBoardVersion(v => v + 1);
            setWaitingForEndTurn(true);
          }
        }
        break;
      }

      case 'musibah': {
        const card = drawCard('musibah', stopwatchRef.current);
        if (player.protectionCards > 0) {
          addLog(`${player.name} pakai Kartu Pelindung untuk menangkal ${card.title}!`, 'good');
          updateOne(playerId, { protectionCards: player.protectionCards - 1 });
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
        const card = drawCard('takdir', stopwatchRef.current);
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
        break;
      }

      case 'targetir': {
        const card = drawCard('targetir', stopwatchRef.current);
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
          updateOne(playerId, { cash: player.cash - tax });
          setNegaraCash(n => n + tax);
        } else {
          addLog(`${player.name} gak bisa bayar pajak! Bangkrut!`, 'bad');
          updateOne(playerId, { isBankrupt: true, cash: 0 });
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
        addLog(`${player.name} kena tilang! Bayar denda ${formatMoneyFull(TILANG_FINE)} ke negara.`, 'bad');
        if (player.cash >= TILANG_FINE) {
          updateOne(playerId, { cash: player.cash - TILANG_FINE });
          setNegaraCash(n => n + TILANG_FINE);
        } else {
          addLog(`${player.name} gak bisa bayar tilang! Bangkrut!`, 'bad');
          updateOne(playerId, { isBankrupt: true, cash: 0 });
        }
        setWaitingForEndTurn(true);
        break;

      default:
        setWaitingForEndTurn(true);
    }

    if (justGajian && tile.type !== 'start') {
      setAtGajian(true);
    }
  }, [addLog, updateOne]);

  const movePlayerSteps = useCallback((playerId: number, steps: number) => {
    const player = playersRef.current.find(p => p.id === playerId);
    if (!player) return;
    setMovingPlayer(true);

    let currentPos = player.position;
    const targetPos = (currentPos + steps) % BOARD_SIZE;
    let stepCount = 0;
    let passedStart = false;

    const interval = setInterval(() => {
      currentPos = (currentPos + 1) % BOARD_SIZE;
      stepCount++;

      if (currentPos === 0 && stepCount < steps) {
        const p = playersRef.current.find(p => p.id === playerId);
        if (p) {
          updateOne(playerId, { cash: p.cash + SALARY, position: 0 });
          addLog(`${p.name} lewat Start, gajian ${formatMoneyFull(SALARY)}!`, 'good');
        }
        passedStart = true;
      } else {
        updateOne(playerId, { position: currentPos });
      }

      if (stepCount >= steps) {
        clearInterval(interval);
        setMovingPlayer(false);
        setTimeout(() => {
          handleTileLanding(playerId, targetPos, passedStart);
        }, 200);
      }
    }, 150);
  }, [addLog, updateOne, handleTileLanding]);

  const handleRollDice = useCallback(() => {
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
      if (!cp) return;
      addLog(`${cp.name} lempar dadu: ${newDice[0]} + ${newDice[1]} = ${total}`, 'move');

      if (cp.inJail) {
        if (isDoubles) {
          addLog(`${cp.name} dapet dobel! Bebas dari lapas!`, 'good');
          updateOne(cp.id, { inJail: false, jailTurns: 0 });
          setPendingAction(null);
          movePlayerSteps(cp.id, total);
        } else {
          const newJailTurns = cp.jailTurns + 1;
          if (newJailTurns >= MAX_JAIL_TURNS) {
            if (cp.cash >= LAPAS_FINE) {
              addLog(`${cp.name} udah 3 putaran di lapas. Bayar denda ${formatMoneyFull(LAPAS_FINE)}.`, 'bad');
              updateOne(cp.id, { cash: cp.cash - LAPAS_FINE, inJail: false, jailTurns: 0 });
              setNegaraCash(n => n + LAPAS_FINE);
              setPendingAction(null);
              movePlayerSteps(cp.id, total);
            } else {
              addLog(`${cp.name} gak bisa bayar denda lapas. Bangkrut!`, 'bad');
              updateOne(cp.id, { isBankrupt: true, inJail: false });
              setPendingAction(null);
              setWaitingForEndTurn(true);
            }
          } else {
            addLog(`${cp.name} masih di lapas. Putaran ${newJailTurns}/${MAX_JAIL_TURNS}.`, 'bad');
            updateOne(cp.id, { jailTurns: newJailTurns });
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
  }, [diceRolling, diceRolled, movingPlayer, currentPlayerIndex, addLog, updateOne, movePlayerSteps]);

  const handleMusibahRoll = useCallback(() => {
    const dieVal = rollSingleDie();
    const tier = getSeverityFromDie(dieVal);
    addLog(`Dadu musibah: ${dieVal} — ${severityLabel(tier)}!`, 'card');
    setCardDiceValue(dieVal);
    setCardSeverity(tier);
  }, [addLog]);

  const applyCardEffect = useCallback((playerId: number, card: GameCard, _diceVal?: number, severity?: MusibahTier) => {
    const player = playersRef.current.find(p => p.id === playerId);
    if (!player) return;
    const effect = card.effect;

    if (effect.goToJail) {
      addLog(`${player.name} masuk lapas!`, 'bad');
      updateOne(playerId, { position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.getOutCard) {
      addLog(`${player.name} dapat Kartu Bebas Lapas!`, 'good');
      updateOne(playerId, { getOutCards: player.getOutCards + 1 });
      setWaitingForEndTurn(true);
      return;
    }

    if (effect.protection) {
      addLog(`${player.name} dapat Kartu Pelindung!`, 'good');
      updateOne(playerId, { protectionCards: player.protectionCards + 1 });
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
      const { player: newPlayer, refund } = confiscateProperty(player, targetId);
      addLog(`${player.name} tanah ${tile.name} disita negara. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      updateOne(playerId, { properties: newPlayer.properties, houses: newPlayer.houses, cash: newPlayer.cash });
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
      const { player: newPlayer, refund } = confiscateProperty(player, targetId);
      addLog(`${player.name} tanah ${tile.name} digusur untuk jalan tol! Gak boleh nolak. Dapat ganti rugi ${formatMoneyFull(refund)}.`, 'bad');
      updateOne(playerId, { properties: newPlayer.properties, houses: newPlayer.houses, cash: newPlayer.cash });
      BOARD_OVERRIDES.set(targetId, { ...tile, type: 'tol', isTol: true, name: `Tol ${tile.name}` });
      addLog(`${tile.name} berubah menjadi jalan tol!`, 'card');
      setBoardVersion(v => v + 1);
      setWaitingForEndTurn(true);
      return;
    }

    let moneyChange = 0;
    let payToNegaraFlag = false;

    if (card.tieredMoney && severity) {
      moneyChange = -getTieredMoney(card, severity);
      payToNegaraFlag = true;
    } else if (card.tieredPayPerProperty && severity) {
      moneyChange = -(player.properties.length * getTieredPayPerProperty(card, severity));
    } else if (card.tieredPayPerHouse && severity) {
      moneyChange = -(getTotalHouseCount(player) * getTieredPayPerHouse(card, severity));
    } else if (effect.money !== undefined) {
      moneyChange = effect.money;
    } else if (effect.payPerProperty !== undefined) {
      moneyChange = -(player.properties.length * effect.payPerProperty);
      payToNegaraFlag = true;
    }

    if (moneyChange !== 0) {
      if (moneyChange > 0) {
        addLog(`${player.name} dapat ${formatMoneyFull(moneyChange)}!`, 'good');
        updateOne(playerId, { cash: player.cash + moneyChange });
      } else {
        const amount = -moneyChange;
        if (player.cash >= amount) {
          addLog(`${player.name} bayar ${formatMoneyFull(amount)}.`, 'bad');
          updateOne(playerId, { cash: player.cash - amount });
          if (payToNegaraFlag) setNegaraCash(n => n + amount);
        } else {
          addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
          updateOne(playerId, { isBankrupt: true, cash: 0 });
        }
      }
    }

    if (effect.payPerPlayer !== undefined) {
      const { players: newPlayers, success } = payAllPlayers(
        playersRef.current, playerId, effect.payPerPlayer, true,
      );
      if (success) {
        addLog(`${player.name} bayar ${formatMoneyFull(effect.payPerPlayer)} per pemain ke negara.`, 'bad');
        const negaraGain = (playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt).length) * effect.payPerPlayer;
        setPlayers(newPlayers);
        setNegaraCash(n => n + negaraGain);
      } else {
        addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
        setPlayers(newPlayers);
      }
    }

    if (effect.collectPerPlayer !== undefined) {
      const { players: newPlayers, totalCollected } = collectFromAllPlayers(
        playersRef.current, playerId, effect.collectPerPlayer,
      );
      addLog(`${player.name} kumpul ${formatMoneyFull(effect.collectPerPlayer)} dari ${playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt).length} pemain. Total: ${formatMoneyFull(totalCollected)}.`, 'good');
      setPlayers(newPlayers);
    }

    if (effect.moveTo !== undefined) {
      const dest = effect.moveTo;
      const { player: newPlayer, passedStart } = advanceToTile(player, dest, BOARD_SIZE, SALARY);
      if (passedStart) {
        addLog(`${player.name} pindah ke ${getTile(dest).name}, lewat Start, gajian!`, 'good');
      } else {
        addLog(`${player.name} pindah ke ${getTile(dest).name}.`, 'move');
      }
      updateOne(playerId, { position: newPlayer.position, cash: newPlayer.cash });
      setTimeout(() => handleTileLanding(playerId, dest, passedStart), 300);
      return;
    }

    setWaitingForEndTurn(true);
  }, [addLog, updateOne, handleTileLanding]);

  const handleCardClose = useCallback(() => {
    const card = showCard;
    if (!card || !currentPlayer) return;

    if (card.type === 'musibah' && cardSeverity === undefined) {
      return;
    }

    applyCardEffect(currentPlayer.id, card, cardDiceValue, cardSeverity);
    setShowCard(null);
    setCardDiceValue(undefined);
    setCardSeverity(undefined);
  }, [showCard, currentPlayer, cardSeverity, cardDiceValue, applyCardEffect]);

  const handleBuy = useCallback(() => {
    if (!pendingAction?.tileId || !currentPlayer) return;
    const tile = getTile(pendingAction.tileId);
    const updated = buyProperty(currentPlayer, tile);
    if (!updated) return;
    addLog(`${currentPlayer.name} beli ${tile.name} seharga ${formatMoneyFull(tile.price || 0)}.`, 'money');
    updateOne(currentPlayer.id, { cash: updated.cash, properties: updated.properties });
    setPendingAction(null);
    setWaitingForEndTurn(true);
  }, [pendingAction, currentPlayer, addLog, updateOne]);

  const handleSkip = useCallback(() => {
    if (!currentPlayer) return;
    addLog(`${currentPlayer.name} skip beli tanah.`, 'info');
    setPendingAction(null);
    setWaitingForEndTurn(true);
  }, [currentPlayer, addLog]);

  const handlePayBail = useCallback(() => {
    if (!currentPlayer) return;
    if (currentPlayer.cash < JAIL_BAIL) return;
    addLog(`${currentPlayer.name} bayar jaminan lapas ${formatMoneyFull(JAIL_BAIL)}.`, 'bad');
    updateOne(currentPlayer.id, { cash: currentPlayer.cash - JAIL_BAIL, inJail: false, jailTurns: 0 });
    setNegaraCash(n => n + JAIL_BAIL);
    setPendingAction(null);
    setWaitingForEndTurn(true);
  }, [currentPlayer, addLog, updateOne]);

  const handleUseGetOutCard = useCallback(() => {
    if (!currentPlayer || currentPlayer.getOutCards <= 0) return;
    addLog(`${currentPlayer.name} gunakan Kartu Bebas Lapas!`, 'good');
    updateOne(currentPlayer.id, { getOutCards: currentPlayer.getOutCards - 1, inJail: false, jailTurns: 0 });
    setPendingAction(null);
    setWaitingForEndTurn(true);
  }, [currentPlayer, addLog, updateOne]);

  const handleRollForJail = useCallback(() => {
    if (!currentPlayer) return;
    const jailDice = rollDice();
    const isDoubles = jailDice[0] === jailDice[1];
    addLog(`${currentPlayer.name} lempar dadu: ${jailDice[0]} + ${jailDice[1]}`, 'move');

    if (pendingAction?.type === 'pengadilan') {
      const dieVal = rollSingleDie();
      addLog(`Dadu pengadilan: ${dieVal}`, 'move');
      if (dieVal >= RULES.pengadilan.winThreshold) {
        addLog(`Menang pengadilan! ${currentPlayer.name} dapat kompensasi ${formatMoneyFull(PENGADILAN_COMPENSATION)}.`, 'good');
        updateOne(currentPlayer.id, { cash: currentPlayer.cash + PENGADILAN_COMPENSATION });
      } else if (dieVal >= RULES.pengadilan.loseThreshold) {
        addLog(`Kalah pengadilan! ${currentPlayer.name} masuk lapas + bayar denda ${formatMoneyFull(LAPAS_FINE)}.`, 'bad');
        if (currentPlayer.cash >= LAPAS_FINE) {
          updateOne(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
          setNegaraCash(n => n + LAPAS_FINE);
        } else {
          updateOne(currentPlayer.id, { isBankrupt: true, cash: 0 });
        }
      } else {
        const seized = Math.floor(currentPlayer.cash * 0.5);
        addLog(`Brutal! ${currentPlayer.name} masuk lapas + 50% uang (${formatMoneyFull(seized)}) disita negara.`, 'bad');
        updateOne(currentPlayer.id, { cash: currentPlayer.cash - seized, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
        setNegaraCash(n => n + seized);
      }
      setPendingAction(null);
      setWaitingForEndTurn(true);
    } else {
      if (isDoubles) {
        addLog(`Dobel! ${currentPlayer.name} bebas dari lapas!`, 'good');
        updateOne(currentPlayer.id, { inJail: false, jailTurns: 0 });
        setPendingAction(null);
        movePlayerSteps(currentPlayer.id, jailDice[0] + jailDice[1]);
      } else {
        const newTurns = currentPlayer.jailTurns + 1;
        if (newTurns >= MAX_JAIL_TURNS) {
          if (currentPlayer.cash >= LAPAS_FINE) {
            addLog(`3 putaran habis. Bayar denda ${formatMoneyFull(LAPAS_FINE)} dan keluar.`, 'bad');
            updateOne(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, inJail: false, jailTurns: 0 });
            setNegaraCash(n => n + LAPAS_FINE);
            setPendingAction(null);
            movePlayerSteps(currentPlayer.id, jailDice[0] + jailDice[1]);
          } else {
            addLog(`${currentPlayer.name} gak bisa bayar. Bangkrut!`, 'bad');
            updateOne(currentPlayer.id, { isBankrupt: true, inJail: false });
            setPendingAction(null);
            setWaitingForEndTurn(true);
          }
        } else {
          addLog(`Masih di lapas. Putaran ${newTurns}/${MAX_JAIL_TURNS}.`, 'bad');
          updateOne(currentPlayer.id, { jailTurns: newTurns });
          setPendingAction(null);
          setWaitingForEndTurn(true);
        }
      }
    }
  }, [currentPlayer, pendingAction, addLog, updateOne, movePlayerSteps]);

  const handlePayFine = useCallback((amount: number) => {
    if (!currentPlayer) return;
    if (currentPlayer.cash < amount) return;
    addLog(`${currentPlayer.name} bayar ${formatMoneyFull(amount)} ke negara.`, 'bad');
    updateOne(currentPlayer.id, { cash: currentPlayer.cash - amount });
    setNegaraCash(n => n + amount);
    setPendingAction(null);
    setWaitingForEndTurn(true);
  }, [currentPlayer, addLog, updateOne]);

  const handleTolChoose = useCallback((destId: number) => {
    if (!currentPlayer) return;
    if (currentPlayer.cash < TOL_FEE) {
      addLog(`${currentPlayer.name} gak bisa bayar tol ${formatMoneyFull(TOL_FEE)}! Bangkrut!`, 'bad');
      updateOne(currentPlayer.id, { isBankrupt: true, cash: 0 });
      setPendingAction(null);
      setWaitingForEndTurn(true);
      return;
    }
    addLog(`${currentPlayer.name} bayar tol ${formatMoneyFull(TOL_FEE)} dan pindah ke ${getTile(destId).name}.`, 'move');
    updateOne(currentPlayer.id, { cash: currentPlayer.cash - TOL_FEE, position: destId });
    setNegaraCash(n => n + TOL_FEE);
    setPendingAction(null);
    setTimeout(() => handleTileLanding(currentPlayer.id, destId, false), 300);
  }, [currentPlayer, addLog, updateOne, handleTileLanding]);

  const handlePropertySelect = useCallback((tileId: number) => {
    if (tileId === -1) {
      setShowPropertySelect(null);
      if (showPropertySelect !== 'build') {
        setWaitingForEndTurn(true);
      }
      return;
    }
    const cp = playersRef.current[currentPlayerIndex];
    if (!cp) return;

    if (showPropertySelect === 'free') {
      addLog(`${cp.name} dapat ${getTile(tileId).name} gratis!`, 'good');
      updateOne(cp.id, { properties: [...cp.properties, tileId] });
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
    } else if (showPropertySelect === 'build') {
      const result = buildHouse(cp, tileId);
      if (!result) return;
      const tile = getTile(tileId);
      const level = cp.houses[tileId] || 0;
      if (level >= 2) {
        addLog(`${cp.name} upgrade ${tile.name} ke Rumah OKB!`, 'money');
      } else {
        addLog(`${cp.name} bangun Rumah Subsidi di ${tile.name}.`, 'money');
      }
      updateOne(cp.id, { cash: result.player.cash, houses: result.player.houses });
    } else if (showPropertySelect === 'upgrade') {
      const updated = freeUpgradeHouse(cp, tileId);
      if (!updated) return;
      const tile = getTile(tileId);
      const level = cp.houses[tileId] || 0;
      if (level >= 1 && level <= 2) {
        addLog(`${cp.name} dapat upgrade gratis: ${tile.name} jadi Rumah OKB!`, 'good');
      } else if (level === 0) {
        addLog(`${cp.name} dapat Rumah Subsidi gratis di ${tile.name}!`, 'good');
      }
      updateOne(cp.id, { houses: updated.houses });
      setShowPropertySelect(null);
      setWaitingForEndTurn(true);
    }
  }, [showPropertySelect, currentPlayerIndex, addLog, updateOne]);

  const handleGajianDone = useCallback(() => {
    setAtGajian(false);
    const cp = playersRef.current[currentPlayerIndex];
    if (cp && !cp.inJail) {
      const wasDoubles = diceRef.current[0] === diceRef.current[1];
      if (wasDoubles) {
        const card = drawCard('takdir', stopwatchRef.current);
        addLog(`${cp.name} ambil kartu Takdir karena dadu kembar.`, 'card');
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
      } else {
        setWaitingForEndTurn(true);
      }
    }
  }, [currentPlayerIndex, addLog]);

  if (screen === 'setup') return <SetupScreen onStart={startGame} />;
  if (screen === 'gameover') return <GameOverScreen players={players} negaraCash={negaraCash} onRestart={() => { setScreen('setup'); }} />;
  if (!currentPlayer) return null;

  const currentTile = getTile(currentPlayer.position);
  const canBuy = currentPlayer.cash >= (getTile(pendingAction?.tileId ?? -1)?.price || 0);
  const stateOwned = isStateOwned(currentPlayer.position);
  const boardTiles = getBoardSnapshot();

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">WNI</span>
            </div>
            <div>
              <h1 className="text-stone-100 font-black text-base sm:text-lg leading-tight">WNI Simulator</h1>
              <p className="text-stone-500 text-xs">Putaran {turn}{stopwatchActive && ' • Stopwatch aktif'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-400 text-xs font-bold">Aturan</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 bg-stone-800">
              <Landmark className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-300 text-xs font-bold">Negara: {formatMoneyFull(negaraCash)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-stone-800" style={{ borderLeft: `3px solid ${currentPlayer.color}` }}>
              <span className="text-lg">{currentPlayer.emoji}</span>
              <span className="text-stone-100 font-bold text-sm">{currentPlayer.name}</span>
              <span className="text-amber-400 text-sm font-bold">{formatMoneyFull(currentPlayer.cash)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
          <div className="space-y-3">
            <GameBoard
              key={boardVersion}
              players={players}
              currentPlayerId={currentPlayerIndex}
              stateOwnedTiles={Array.from(STATE_OWNED)}
              boardTiles={boardTiles}
              turn={turn}
              diceValues={dice}
              diceRolled={diceRolled}
              currentPlayerObj={currentPlayer}
            />

            <div className="bg-stone-800/60 rounded-2xl p-4 border border-stone-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 hover:bg-emerald-600 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Bangun/Upgrade Rumah
                      </button>
                    )}
                    <button
                      onClick={handleGajianDone}
                      className="px-4 py-1.5 rounded-xl bg-stone-600 text-stone-300 text-xs font-bold hover:bg-stone-500 transition-colors"
                    >
                      Lanjut Jalan
                    </button>
                  </div>
                )}
                {waitingForEndTurn && !pendingAction && !showCard && !atGajian && (
                  <button
                    onClick={nextPlayer}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-stone-600 to-stone-700 text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
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

            <div className="bg-stone-800/40 rounded-2xl p-3 border border-stone-700/50">
              <h3 className="text-stone-300 font-bold text-sm mb-2 px-1">Lokasi Saat Ini</h3>
              <div className="bg-stone-700/40 rounded-xl p-3">
                <p className="text-stone-100 font-bold text-sm">{currentTile.name}</p>
                {currentTile.island && <p className="text-stone-500 text-xs">Pulau {currentTile.island}</p>}
                {stateOwned && <p className="text-red-400 text-xs mt-1 font-bold">Milik Negara</p>}
                {currentTile.price && !stateOwned && <p className="text-amber-400 text-xs mt-1">Harga: {formatMoneyFull(currentTile.price)}</p>}
                {currentTile.rent && <p className="text-stone-500 text-xs">Sewa tanah: {formatMoneyFull(currentTile.rent)}</p>}
                {currentTile.rentSubsidi1 && <p className="text-emerald-400 text-xs">Sewa 1 RS: {formatMoneyFull(currentTile.rentSubsidi1)}</p>}
                {currentTile.rentSubsidi2 && <p className="text-emerald-400 text-xs">Sewa 2 RS: {formatMoneyFull(currentTile.rentSubsidi2)}</p>}
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
          onBuy={handleBuy}
          onSkip={handleSkip}
          onPayBail={handlePayBail}
          onUseGetOutCard={handleUseGetOutCard}
          onRollForJail={handleRollForJail}
          onPayFine={handlePayFine}
          onTolChoose={handleTolChoose}
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
          onDone={showPropertySelect === 'build' ? handleGajianDone : undefined}
        />
      )}

      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}

import { useState, useCallback, useRef } from 'react';
import type { Player, GameCard, PendingAction, LogEntry, MusibahTier, Tile, Transaction } from '@/game/types';
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
import PropertyDetailSheet from '@/components/PropertyDetailSheet';
import { LogOut, Building2, Landmark, HelpCircle, Zap } from 'lucide-react';

type Screen = 'setup' | 'playing' | 'gameover';

// Helper: structured transaction log
function txLog(
  addLog: (text: string, type: LogEntry['type']) => void,
  playerName: string,
  reason: string,
  prevCash: number,
  delta: number,
  newCash: number,
  extra?: string,
) {
  const sign = delta >= 0 ? '+' : '-';
  const absDelta = Math.abs(delta);
  const type: LogEntry['type'] = delta > 0 ? 'good' : delta < 0 ? 'bad' : 'info';
  let msg = `${playerName} ${reason}: ${sign}${formatMoneyFull(absDelta)}`;
  msg += ` (${formatMoneyFull(prevCash)} → ${formatMoneyFull(newCash)})`;
  if (extra) msg += `. ${extra}`;
  addLog(msg, type);
}

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
  const [takdirGood, setTakdirGood] = useState<boolean | undefined>(undefined);
  const [showPropertySelect, setShowPropertySelect] = useState<'free' | 'build' | 'upgrade' | null>(null);
  const [waitingForEndTurn, setWaitingForEndTurn] = useState(false);
  const [movingPlayer, setMovingPlayer] = useState(false);
  const [atGajian, setAtGajian] = useState(false);
  const [negaraCash, setNegaraCash] = useState(0);
  const [stopwatchActive, setStopwatchActive] = useState(false);
  const [boardVersion, setBoardVersion] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [detailTile, setDetailTile] = useState<Tile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  const playersRef = useRef(players);
  playersRef.current = players;
  const stopwatchRef = useRef(stopwatchActive);
  stopwatchRef.current = stopwatchActive;
  const diceRef = useRef(dice);
  diceRef.current = dice;
  const animationsRef = useRef(animationsEnabled);
  animationsRef.current = animationsEnabled;
  const drewCardFromTileRef = useRef(false);

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
    setTransactions([]);
    setDetailTile(null);
  }, []);

  const checkStopwatch = useCallback(() => {
    if (stopwatchRef.current) return;
    const allPassedTwo = playersRef.current.every(p => p.turnsPlayed >= STOPWATCH_ROUND_THRESHOLD);
    if (allPassedTwo && playersRef.current.length > 0) {
      setStopwatchActive(true);
      addLog('Kartu stopwatch sekarang aktif! Semua pemain sudah lewat 2 putaran.', 'card');
    }
  }, [addLog]);

  const recordTransaction = useCallback((amount: number, sender: string, receiver: string, reason: string) => {
    setTransactions(prev => [...prev, { id: prev.length + 1, amount, sender, receiver, reason, turn }]);
  }, [turn]);

  const nextPlayer = useCallback(() => {
    const cp = playersRef.current[currentPlayerIndex];
    const wasDoubles = diceRef.current[0] === diceRef.current[1];
    if (cp && !cp.inJail && wasDoubles && !drewCardFromTileRef.current && !showCard && !pendingAction) {
      drewCardFromTileRef.current = true;
      const card = drawCard('takdir', stopwatchRef.current);
      addLog(`${cp.name} ambil kartu Takdir karena dadu kembar.`, 'card');
      setShowCard(card);
      setCardDiceValue(undefined);
      setCardSeverity(undefined);
      return;
    }

    setPendingAction(null);
    setDiceRolled(false);
    setWaitingForEndTurn(false);
    setAtGajian(false);
    setCardDiceValue(undefined);
    setCardSeverity(undefined);
    drewCardFromTileRef.current = false;

    if (cp) {
      updateOne(cp.id, { turnsPlayed: cp.turnsPlayed + 1, consecutiveDoubles: 0 });
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
  }, [currentPlayerIndex, addLog, checkStopwatch, updateOne, showCard, pendingAction]);

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
          if (player.cash >= rent) {
            txLog(addLog, player.name, `sewa tanah negara (${tile.name})`, player.cash, -rent, player.cash - rent);
            updateOne(playerId, { cash: player.cash - rent });
            setNegaraCash(n => n + rent);
          } else {
            addLog(`${player.name} gak bisa bayar sewa negara ${formatMoneyFull(rent)}! Bangkrut!`, 'bad');
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
              txLog(addLog, player.name, `sewa (${owner.name} di lapas, ${tile.name})`, player.cash, -rent, player.cash - rent, `→ Negara`);
              updateOne(playerId, { cash: player.cash - rent });
              setNegaraCash(n => n + rent);
            } else {
              addLog(`${player.name} gak bisa bayar sewa ${formatMoneyFull(rent)}! Bangkrut!`, 'bad');
              updateOne(playerId, { isBankrupt: true, cash: 0 });
            }
            setWaitingForEndTurn(true);
          } else if (player.cash >= rent) {
            txLog(addLog, player.name, `sewa ${tile.name}`, player.cash, -rent, player.cash - rent, `→ ${owner.name} (${formatMoneyFull(owner.cash)} → ${formatMoneyFull(owner.cash + rent)})`);
            recordTransaction(rent, player.name, owner.name, `Sewa ${tile.name}`);
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
        drewCardFromTileRef.current = true;
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
        drewCardFromTileRef.current = true;
        const card = drawCard('takdir', stopwatchRef.current);
        setShowCard(card);
        setCardDiceValue(undefined);
        setCardSeverity(undefined);
        break;
      }

      case 'targetir': {
        drewCardFromTileRef.current = true;
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
          txLog(addLog, player.name, `pajak tahunan (${player.properties.length} tanah × ${formatMoneyFull(TAX_PER_PROPERTY)})`, player.cash, -tax, player.cash - tax, `→ Negara`);
          recordTransaction(tax, player.name, 'Negara', `Pajak tahunan`);
          updateOne(playerId, { cash: player.cash - tax });
          setNegaraCash(n => n + tax);
        } else {
          addLog(`${player.name} gak bisa bayar pajak ${formatMoneyFull(tax)}! Bangkrut!`, 'bad');
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
        if (player.cash >= TILANG_FINE) {
          txLog(addLog, player.name, `tilang`, player.cash, -TILANG_FINE, player.cash - TILANG_FINE, `→ Negara`);
          recordTransaction(TILANG_FINE, player.name, 'Negara', 'Tilang');
          updateOne(playerId, { cash: player.cash - TILANG_FINE });
          setNegaraCash(n => n + TILANG_FINE);
        } else {
          addLog(`${player.name} gak bisa bayar tilang ${formatMoneyFull(TILANG_FINE)}! Bangkrut!`, 'bad');
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
          const prevCash = p.cash;
          const newCash = prevCash + SALARY;
          updateOne(playerId, { cash: newCash, position: 0 });
          txLog(addLog, p.name, 'gajian (lewat Start)', prevCash, SALARY, newCash);
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
        }, animationsRef.current ? 200 : 0);
      }
    }, animationsRef.current ? 150 : 1);
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
        // Jail: doubles releases but does NOT grant extra turn
        if (isDoubles) {
          addLog(`${cp.name} dapet dobel! Bebas dari lapas!`, 'good');
          updateOne(cp.id, { inJail: false, jailTurns: 0, consecutiveDoubles: 0 });
          setPendingAction(null);
          movePlayerSteps(cp.id, total);
        } else {
          const newJailTurns = cp.jailTurns + 1;
          if (newJailTurns >= MAX_JAIL_TURNS) {
            if (cp.cash >= LAPAS_FINE) {
              txLog(addLog, cp.name, `denda lapas (3 putaran habis)`, cp.cash, -LAPAS_FINE, cp.cash - LAPAS_FINE, `→ Negara`);
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

      // Doubles logic (not in jail)
      if (isDoubles) {
        const newConsecutive = (cp.consecutiveDoubles || 0) + 1;
        if (newConsecutive >= RULES.doublesJailThreshold) {
          addLog(`${cp.name} lempar dobel ${newConsecutive}x berturut-turut! OTK! Langsung ke Lapas!`, 'bad');
          updateOne(cp.id, { position: LAPAS_TILE_ID, inJail: true, jailTurns: 0, consecutiveDoubles: 0 });
          setWaitingForEndTurn(true);
          return;
        }
        updateOne(cp.id, { consecutiveDoubles: newConsecutive });
        addLog(`${cp.name} dapet dadu kembar (${newConsecutive}/${RULES.doublesJailThreshold})! Setelah efek lokasi, ambil kartu Takdir (kecuali sudah ambil kartu dari lokasi).`, 'card');
      } else {
        updateOne(cp.id, { consecutiveDoubles: 0 });
      }

      movePlayerSteps(cp.id, total);
    }, animationsRef.current ? 800 : 50);
  }, [diceRolling, diceRolled, movingPlayer, currentPlayerIndex, addLog, updateOne, movePlayerSteps]);

  const handleMusibahRoll = useCallback(() => {
    const dieVal = rollSingleDie();
    const tier = getSeverityFromDie(dieVal);
    addLog(`Dadu musibah: ${dieVal} — ${severityLabel(tier)}!`, 'card');
    setCardDiceValue(dieVal);
    setCardSeverity(tier);
  }, [addLog]);

  const handleTakdirRoll = useCallback(() => {
    const dieVal = rollSingleDie();
    const good = dieVal % 2 === 0;
    addLog(`Dadu takdir: ${dieVal} — ${good ? 'Bagus' : 'Buruk'}!`, 'card');
    setCardDiceValue(dieVal);
    setTakdirGood(good);
  }, [addLog]);

  const applyCardEffect = useCallback((playerId: number, card: GameCard, _diceVal?: number, severity?: MusibahTier, takdirGood?: boolean) => {
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
      txLog(addLog, player.name, `tanah ${tile.name} disita negara (ganti rugi 50%)`, player.cash, refund, newPlayer.cash);
      updateOne(playerId, { properties: newPlayer.properties, houses: newPlayer.houses, cash: newPlayer.cash });
      STATE_OWNED.add(targetId);
      addLog(`${tile.name} sekarang milik negara. Siapa pun yang injak bayar sewa ke negara.`, 'card');
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
      txLog(addLog, player.name, `tanah ${tile.name} digusur untuk tol (ganti rugi 50%)`, player.cash, refund, newPlayer.cash);
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
    } else if (effect.rollDice && effect.evenReward !== undefined && effect.oddPenalty !== undefined) {
      moneyChange = takdirGood ? effect.evenReward : -effect.oddPenalty;
    } else if (effect.money !== undefined) {
      moneyChange = effect.money;
    } else if (effect.payPerProperty !== undefined) {
      moneyChange = -(player.properties.length * effect.payPerProperty);
      payToNegaraFlag = true;
    }

    if (card.affectsAllPlayers && severity) {
      // Musibah that hits ALL players (e.g. banjir, gempa)
      const allPlayers = playersRef.current;
      const newPlayers = allPlayers.map(p => {
        if (p.isBankrupt) return p;
        let pChange = 0;
        if (card.tieredMoney) pChange = -getTieredMoney(card, severity);
        else if (card.tieredPayPerProperty) pChange = -(p.properties.length * getTieredPayPerProperty(card, severity));
        else if (card.tieredPayPerHouse) pChange = -(getTotalHouseCount(p) * getTieredPayPerHouse(card, severity));
        if (pChange === 0) return p;
        const newCash = p.cash + pChange;
        if (newCash < 0) {
          addLog(`${p.name} gak bisa bayar ${formatMoneyFull(-pChange)}! Bangkrut!`, 'bad');
          return { ...p, isBankrupt: true, cash: 0 };
        }
        txLog(addLog, p.name, `${card.title}`, p.cash, pChange, newCash);
        return { ...p, cash: newCash };
      });
      setPlayers(newPlayers);
      setWaitingForEndTurn(true);
      return;
    }

    if (moneyChange !== 0) {
      if (moneyChange > 0) {
        txLog(addLog, player.name, `${card.title}`, player.cash, moneyChange, player.cash + moneyChange);
        updateOne(playerId, { cash: player.cash + moneyChange });
      } else {
        const amount = -moneyChange;
        if (player.cash >= amount) {
          txLog(addLog, player.name, `${card.title}`, player.cash, -amount, player.cash - amount, payToNegaraFlag ? `→ Negara` : undefined);
          updateOne(playerId, { cash: player.cash - amount });
          if (payToNegaraFlag) setNegaraCash(n => n + amount);
        } else {
          addLog(`${player.name} gak bisa bayar ${formatMoneyFull(amount)}! Bangkrut!`, 'bad');
          updateOne(playerId, { isBankrupt: true, cash: 0 });
        }
      }
    }

    if (effect.payPerPlayer !== undefined) {
      const { players: newPlayers, success } = payAllPlayers(
        playersRef.current, playerId, effect.payPerPlayer, true,
      );
      if (success) {
        const negaraGain = (playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt).length) * effect.payPerPlayer;
        txLog(addLog, player.name, `${card.title} (${negaraGain / effect.payPerPlayer} pemain × ${formatMoneyFull(effect.payPerPlayer)})`, player.cash, -negaraGain, player.cash - negaraGain, `→ Negara`);
        setPlayers(newPlayers);
        setNegaraCash(n => n + negaraGain);
      } else {
        addLog(`${player.name} gak bisa bayar! Bangkrut!`, 'bad');
        setPlayers(newPlayers);
      }
    }

    if (effect.collectPerPlayer !== undefined && takdirGood !== false) {
      const { players: newPlayers, totalCollected } = collectFromAllPlayers(
        playersRef.current, playerId, effect.collectPerPlayer,
      );
      txLog(addLog, player.name, `${card.title} (${playersRef.current.filter(p => p.id !== playerId && !p.isBankrupt).length} pemain)`, player.cash, totalCollected, player.cash + totalCollected);
      setPlayers(newPlayers);
    }

    if (effect.moveTo !== undefined) {
      const dest = effect.moveTo;
      const { player: newPlayer, passedStart } = advanceToTile(player, dest, BOARD_SIZE, SALARY);
      if (passedStart) {
        txLog(addLog, player.name, `pindah ke ${getTile(dest).name} (lewat Start)`, player.cash, SALARY, newPlayer.cash);
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
    if (card.type === 'takdir' && card.effect.rollDice && cardDiceValue === undefined) {
      return;
    }

    applyCardEffect(currentPlayer.id, card, cardDiceValue, cardSeverity, takdirGood);
    setShowCard(null);
    setCardDiceValue(undefined);
    setCardSeverity(undefined);
    setTakdirGood(undefined);
  }, [showCard, currentPlayer, cardSeverity, cardDiceValue, applyCardEffect]);

  const handleBuy = useCallback(() => {
    if (!pendingAction?.tileId || !currentPlayer) return;
    const tile = getTile(pendingAction.tileId);
    const updated = buyProperty(currentPlayer, tile);
    if (!updated) return;
    txLog(addLog, currentPlayer.name, `beli ${tile.name}`, currentPlayer.cash, -(tile.price || 0), updated.cash);
    recordTransaction(tile.price || 0, currentPlayer.name, 'Bank', `Beli ${tile.name}`);
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
    txLog(addLog, currentPlayer.name, `jaminan lapas`, currentPlayer.cash, -JAIL_BAIL, currentPlayer.cash - JAIL_BAIL, `→ Negara`);
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
        txLog(addLog, currentPlayer.name, `menang pengadilan (dadu ${dieVal})`, currentPlayer.cash, PENGADILAN_COMPENSATION, currentPlayer.cash + PENGADILAN_COMPENSATION);
        updateOne(currentPlayer.id, { cash: currentPlayer.cash + PENGADILAN_COMPENSATION });
      } else if (dieVal >= RULES.pengadilan.loseThreshold) {
        if (currentPlayer.cash >= LAPAS_FINE) {
          txLog(addLog, currentPlayer.name, `kalah pengadilan (dadu ${dieVal})`, currentPlayer.cash, -LAPAS_FINE, currentPlayer.cash - LAPAS_FINE, `Lapas + → Negara`);
          updateOne(currentPlayer.id, { cash: currentPlayer.cash - LAPAS_FINE, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
          setNegaraCash(n => n + LAPAS_FINE);
        } else {
          addLog(`${currentPlayer.name} kalah pengadilan & gak bisa bayar denda. Bangkrut!`, 'bad');
          updateOne(currentPlayer.id, { isBankrupt: true, cash: 0 });
        }
      } else {
        const seized = Math.floor(currentPlayer.cash * 0.5);
        txLog(addLog, currentPlayer.name, `brutal pengadilan (dadu ${dieVal}, 50% disita)`, currentPlayer.cash, -seized, currentPlayer.cash - seized, `Lapas + → Negara`);
        updateOne(currentPlayer.id, { cash: currentPlayer.cash - seized, position: LAPAS_TILE_ID, inJail: true, jailTurns: 0 });
        setNegaraCash(n => n + seized);
      }
      setPendingAction(null);
      setWaitingForEndTurn(true);
    } else {
      // Jail roll for release — doubles releases but no extra turn
      if (isDoubles) {
        addLog(`Dobel! ${currentPlayer.name} bebas dari lapas!`, 'good');
        updateOne(currentPlayer.id, { inJail: false, jailTurns: 0, consecutiveDoubles: 0 });
        setPendingAction(null);
        movePlayerSteps(currentPlayer.id, jailDice[0] + jailDice[1]);
      } else {
        const newTurns = currentPlayer.jailTurns + 1;
        if (newTurns >= MAX_JAIL_TURNS) {
          if (currentPlayer.cash >= LAPAS_FINE) {
            txLog(addLog, currentPlayer.name, `denda lapas (3 putaran habis)`, currentPlayer.cash, -LAPAS_FINE, currentPlayer.cash - LAPAS_FINE, `→ Negara`);
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
    txLog(addLog, currentPlayer.name, `bayar denda`, currentPlayer.cash, -amount, currentPlayer.cash - amount, `→ Negara`);
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
    txLog(addLog, currentPlayer.name, `tol → ${getTile(destId).name}`, currentPlayer.cash, -TOL_FEE, currentPlayer.cash - TOL_FEE, `→ Negara`);
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
      const newLevel = level >= 2 ? 3 : level + 1;
      if (newLevel === 3) {
        txLog(addLog, cp.name, `upgrade ${tile.name} → OKB`, cp.cash, -result.cost, result.player.cash);
      } else {
        txLog(addLog, cp.name, `bangun Rumah Subsidi di ${tile.name}`, cp.cash, -result.cost, result.player.cash);
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
      if (wasDoubles && !drewCardFromTileRef.current) {
        drewCardFromTileRef.current = true;
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
  const canRoll = !diceRolled && !movingPlayer && !pendingAction && !showCard && !currentPlayer.inJail && !waitingForEndTurn;

  return (
    <div className="min-h-screen bg-paper-100 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rust-500 to-gold-500 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-sm">WNI</span>
            </div>
            <div>
              <h1 className="text-navy-800 font-black text-base sm:text-lg leading-tight">WNI Simulator</h1>
              <p className="text-navy-500 text-xs">Putaran {turn}{stopwatchActive && ' • Stopwatch aktif'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 bg-navy-700 hover:bg-navy-600 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-paper-100" />
              <span className="text-paper-100 text-xs font-bold hidden sm:inline">Aturan</span>
            </button>
            <button
              onClick={() => setAnimationsEnabled(a => !a)}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors ${animationsEnabled ? 'bg-navy-700 hover:bg-navy-600' : 'bg-gold-400 hover:bg-gold-300'}`}
              title={animationsEnabled ? 'Animasi aktif' : 'Animasi mati'}
            >
              <Zap className={`w-3.5 h-3.5 ${animationsEnabled ? 'text-paper-100' : 'text-navy-800'}`} />
              <span className={`text-xs font-bold hidden sm:inline ${animationsEnabled ? 'text-paper-100' : 'text-navy-800'}`}>Animasi</span>
            </button>
            <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 bg-navy-700">
              <Landmark className="w-3.5 h-3.5 text-gold-300" />
              <span className="text-paper-100 text-xs font-bold">Negara: {formatMoneyFull(negaraCash)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-1.5 bg-navy-700" style={{ borderLeft: `3px solid ${currentPlayer.color}` }}>
              <span className="text-lg">{currentPlayer.emoji}</span>
              <span className="text-paper-100 font-bold text-sm hidden sm:inline">{currentPlayer.name}</span>
              <span className="text-gold-300 text-sm font-bold">{formatMoneyFull(currentPlayer.cash)}</span>
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
              onTileClick={(tile) => setDetailTile(tile)}
            />

            <div className="bg-paper-200 rounded-2xl p-4 border border-paper-300 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Dice
                values={dice}
                rolling={diceRolling}
                rolled={diceRolled}
                onRoll={handleRollDice}
                disabled={!canRoll}
              />

              <div className="flex flex-col items-center gap-2">
                {atGajian && !diceRolled && !pendingAction && !showCard && (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-gold-600 text-xs font-bold animate-pulse">Saatnya gajian! Bangun/upgrade rumah sebelum jalan.</p>
                    {currentPlayer.properties.length > 0 && (
                      <button
                        onClick={() => setShowPropertySelect('build')}
                        className="px-4 py-2 rounded-xl bg-forest-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-forest-500 transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        Bangun/Upgrade Rumah
                      </button>
                    )}
                    <button
                      onClick={handleGajianDone}
                      className="px-4 py-1.5 rounded-xl bg-navy-600 text-paper-100 text-xs font-bold hover:bg-navy-500 transition-colors"
                    >
                      Lanjut Jalan
                    </button>
                  </div>
                )}
                {waitingForEndTurn && !pendingAction && !showCard && !atGajian && (
                  <button
                    onClick={nextPlayer}
                    className="px-6 py-3 rounded-xl bg-gradient-to-br from-navy-600 to-navy-700 text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    Akhiri Giliran
                  </button>
                )}
                {currentPlayer.inJail && !pendingAction && !showCard && !diceRolled && !atGajian && (
                  <button
                    onClick={() => setPendingAction({ type: 'jail' })}
                    className="px-6 py-3 rounded-xl bg-rust-500 text-white font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform shadow-md"
                  >
                    Keluar dari Lapas
                  </button>
                )}
              </div>
            </div>

            <LogPanel logs={logs} transactions={transactions} />
          </div>

          <div className="space-y-3">
            <PlayerPanel players={players} currentPlayerId={currentPlayerIndex} />

            <div className="hidden lg:block bg-paper-200 rounded-2xl p-3 border border-paper-300">
              <h3 className="text-navy-700 font-bold text-sm mb-2 px-1">Lokasi Saat Ini</h3>
              <div className="bg-paper-100 rounded-xl p-3 border border-paper-300">
                <p className="text-navy-800 font-bold text-sm">{currentTile.name}</p>
                {currentTile.island && <p className="text-navy-500 text-xs">Pulau {currentTile.island}</p>}
                {stateOwned && <p className="text-rust-500 text-xs mt-1 font-bold">Milik Negara</p>}
                {currentTile.price && !stateOwned && <p className="text-gold-600 text-xs mt-1">Harga: {formatMoneyFull(currentTile.price)}</p>}
                {currentTile.rent && <p className="text-navy-500 text-xs">Sewa tanah: {formatMoneyFull(currentTile.rent)}</p>}
                {currentTile.rentSubsidi1 && <p className="text-forest-600 text-xs">Sewa 1 RS: {formatMoneyFull(currentTile.rentSubsidi1)}</p>}
                {currentTile.rentSubsidi2 && <p className="text-forest-600 text-xs">Sewa 2 RS: {formatMoneyFull(currentTile.rentSubsidi2)}</p>}
                {currentTile.rentOKB && <p className="text-rust-500 text-xs">Sewa OKB: {formatMoneyFull(currentTile.rentOKB)}</p>}
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
          onRollTakdir={handleTakdirRoll}
          takdirGood={takdirGood}
          canClose={cardSeverity !== undefined || (showCard.type === 'takdir' && showCard.effect.rollDice ? cardDiceValue !== undefined : showCard.type !== 'musibah')}
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

      <PropertyDetailSheet
        tile={detailTile}
        players={players}
        currentPlayer={currentPlayer}
        onClose={() => setDetailTile(null)}
      />
    </div>
  );
}

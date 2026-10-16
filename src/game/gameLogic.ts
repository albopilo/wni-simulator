import type { Player, Tile, GameCard, HouseLevel, CardType, MusibahTier } from './types';
import {
  BOARD, TOL_TILES, MUSIBAH_CARDS, TAKDIR_CARDS, TARGETIR_CARDS, BANDUNG_TILE_ID,
} from './boardData';
import { RULES } from './gameRules';

export const PLAYER_PRESETS = [
  { name: 'Pemain 1', color: '#ef4444', emoji: '🤓' },
  { name: 'Pemain 2', color: '#3b82f6', emoji: '😎' },
  { name: 'Pemain 3', color: '#22c55e', emoji: '🥳' },
  { name: 'Pemain 4', color: '#f59e0b', emoji: '🤠' },
  { name: 'Pemain 5', color: '#ec4899', emoji: '🤯' },
];

export const STARTING_CASH = RULES.startingCash;
export const SALARY = RULES.salary;
export const JAIL_BAIL = RULES.jailBail;
export const TAX_PER_PROPERTY = RULES.taxPerProperty;
export const PUNGLI_FEE = RULES.pungliFee;
export const TILANG_FINE = RULES.tilangFine;
export const LAPAS_FINE = RULES.lapasFine;
export const TOL_FEE = RULES.tolFee;
export const PENGADILAN_COMPENSATION = RULES.pengadilanCompensation;
export const MAX_JAIL_TURNS = RULES.maxJailTurns;
export const STOPWATCH_ROUND_THRESHOLD = RULES.stopwatchRoundThreshold;

export const STATE_OWNED = new Set<number>();
export const BOARD_OVERRIDES = new Map<number, Tile>();

let logCounter = 0;
export function makeLog(text: string, type: 'info' | 'money' | 'bad' | 'good' | 'move' | 'card' = 'info') {
  return { id: ++logCounter, text, type };
}

export function createPlayers(count: number): Player[] {
  return PLAYER_PRESETS.slice(0, count).map((preset, i) => ({
    id: i,
    name: preset.name,
    color: preset.color,
    emoji: preset.emoji,
    cash: STARTING_CASH,
    position: 0,
    properties: [],
    houses: {},
    inJail: false,
    jailTurns: 0,
    getOutCards: 0,
    isBankrupt: false,
    turnsPlayed: 0,
    protectionCards: 0,
    pendingGajian: false,
  }));
}

export function rollDice(): [number, number] {
  return [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)];
}

export function rollSingleDie(): number {
  return Math.ceil(Math.random() * 6);
}

export function getTile(id: number): Tile {
  return BOARD_OVERRIDES.get(id) || BOARD[id];
}

export function getBoardSnapshot(): Tile[] {
  return BOARD.map((t, i) => BOARD_OVERRIDES.get(i) || t);
}

export function propertyOwner(players: Player[], tileId: number): Player | null {
  for (const p of players) {
    if (p.properties.includes(tileId)) return p;
  }
  return null;
}

export function isStateOwned(tileId: number): boolean {
  return STATE_OWNED.has(tileId);
}

export function isTolTile(tileId: number): boolean {
  const tile = getTile(tileId);
  return tile.isTol === true;
}

export function getTolDestinations(currentPos: number): number[] {
  const allTol = new Set<number>();
  for (const id of TOL_TILES) allTol.add(id);
  for (const [id, tile] of BOARD_OVERRIDES) {
    if (tile.isTol) allTol.add(id);
  }
  return Array.from(allTol).filter(id => id !== currentPos);
}

export function calculateRent(tile: Tile, owner: Player): number {
  const level = owner.houses[tile.id] || 0;
  switch (level) {
    case 0: return tile.rent || 0;
    case 1: return tile.rentSubsidi1 || tile.rent || 0;
    case 2: return tile.rentSubsidi2 || tile.rent || 0;
    case 3: return tile.rentOKB || tile.rent || 0;
    default: return tile.rent || 0;
  }
}

export function calculateStateRent(tile: Tile): number {
  return Math.floor((tile.rent || 0) * RULES.stateOwnedRentRate);
}

export function getSeverityFromDie(die: number): MusibahTier {
  if (die >= RULES.musibah.ringanMin) return 'ringan';
  if (die >= RULES.musibah.sedangMin) return 'sedang';
  return 'brutal';
}

export function severityLabel(tier: MusibahTier): string {
  switch (tier) {
    case 'ringan': return 'Ringan';
    case 'sedang': return 'Sedang';
    case 'brutal': return 'Brutal';
  }
}

export function getTieredMoney(card: GameCard, tier: MusibahTier): number {
  if (card.tieredMoney) return card.tieredMoney[tier];
  return 0;
}

export function getTieredPayPerProperty(card: GameCard, tier: MusibahTier): number {
  if (card.tieredPayPerProperty) return card.tieredPayPerProperty[tier];
  return 0;
}

export function getTieredPayPerHouse(card: GameCard, tier: MusibahTier): number {
  if (card.tieredPayPerHouse) return card.tieredPayPerHouse[tier];
  return 0;
}

export function drawCard(type: CardType, stopwatchActive: boolean): GameCard {
  const deck = type === 'musibah' ? MUSIBAH_CARDS : type === 'takdir' ? TAKDIR_CARDS : TARGETIR_CARDS;
  if (stopwatchActive) {
    return deck[Math.floor(Math.random() * deck.length)];
  }
  const filtered = deck.filter(c => !c.hasStopwatch);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function hasBandung(player: Player): boolean {
  return player.properties.includes(BANDUNG_TILE_ID);
}

export function calculateNetWorth(player: Player): number {
  let total = player.cash;
  for (const tileId of player.properties) {
    const tile = getTile(tileId);
    total += tile.price || 0;
    const level = player.houses[tileId] || 0;
    if (level >= 1 && level <= 2) total += (tile.housePrice || 0) * level;
    if (level === 3) total += (tile.housePrice || 0) * 2 + (tile.okbPrice || 0);
  }
  return total;
}

export function houseLevelName(level: HouseLevel): string {
  switch (level) {
    case 0: return 'Tanah kosong';
    case 1: return '1 Rumah Subsidi';
    case 2: return '2 Rumah Subsidi';
    case 3: return 'Rumah OKB';
    default: return '';
  }
}

export function getCheapestProperty(player: Player): number | null {
  if (player.properties.length === 0) return null;
  let cheapest = player.properties[0];
  let cheapestPrice = getTile(cheapest).price || Infinity;
  for (const tileId of player.properties) {
    if ((getTile(tileId).price || 0) < cheapestPrice) {
      cheapest = tileId;
      cheapestPrice = getTile(tileId).price || 0;
    }
  }
  return cheapest;
}

export function getFirstProperty(player: Player): number | null {
  return player.properties.length > 0 ? player.properties[0] : null;
}

export function getTotalHouseCount(player: Player): number {
  let count = 0;
  for (const tileId of player.properties) {
    count += player.houses[tileId] || 0;
  }
  return count;
}

export function canBuildHouse(player: Player, tileId: number): boolean {
  if (!player.properties.includes(tileId)) return false;
  const tile = getTile(tileId);
  const level = player.houses[tileId] || 0;
  if (level === 0 || level === 1) return player.cash >= (tile.housePrice || 0);
  if (level === 2) return player.cash >= (tile.okbPrice || 0);
  return false;
}

export function getBuildCost(player: Player, tileId: number): number {
  const tile = getTile(tileId);
  const level = player.houses[tileId] || 0;
  if (level === 2) return tile.okbPrice || 0;
  return tile.housePrice || 0;
}

export function getSellValue(tileId: number): number {
  const tile = getTile(tileId);
  return Math.floor((tile.price || 0) * 0.5);
}

// --- Typed engine functions ---

export interface TransferResult {
  success: boolean;
  payer: Player;
  receiver: Player | null;
  amount: number;
}

export function transferMoney(
  players: Player[],
  payerId: number,
  receiverId: number | null,
  amount: number,
): Player[] {
  if (amount <= 0) return players;
  return players.map(p => {
    if (p.id === payerId) {
      return { ...p, cash: Math.max(0, p.cash - amount), isBankrupt: p.cash < amount };
    }
    if (p.id === receiverId) {
      return { ...p, cash: p.cash + amount };
    }
    return p;
  });
}

export function payToNegara(
  players: Player[],
  payerId: number,
  amount: number,
): { players: Player[]; negaraGain: number } {
  if (amount <= 0) return { players, negaraGain: 0 };
  const payer = players.find(p => p.id === payerId);
  if (!payer) return { players, negaraGain: 0 };
  const canPay = payer.cash >= amount;
  const newPlayers = players.map(p => {
    if (p.id === payerId) {
      return { ...p, cash: Math.max(0, p.cash - amount), isBankrupt: !canPay };
    }
    return p;
  });
  return { players: newPlayers, negaraGain: canPay ? amount : payer.cash };
}

export function collectFromNegara(
  players: Player[],
  receiverId: number,
  amount: number,
): { players: Player[]; negaraLoss: number } {
  if (amount <= 0) return { players, negaraLoss: 0 };
  const newPlayers = players.map(p => {
    if (p.id === receiverId) return { ...p, cash: p.cash + amount };
    return p;
  });
  return { players: newPlayers, negaraLoss: amount };
}

export function collectFromAllPlayers(
  players: Player[],
  collectorId: number,
  amountPerPlayer: number,
): { players: Player[]; totalCollected: number } {
  let totalCollected = 0;
  const newPlayers = players.map(p => {
    if (p.id === collectorId) return p;
    if (p.isBankrupt) return p;
    const actualAmount = Math.min(p.cash, amountPerPlayer);
    totalCollected += actualAmount;
    const newCash = p.cash - actualAmount;
    const isBankrupt = newCash === 0 && p.properties.length === 0;
    return { ...p, cash: Math.max(0, newCash), isBankrupt };
  });
  const collector = newPlayers.find(p => p.id === collectorId);
  if (collector) {
    const idx = newPlayers.findIndex(p => p.id === collectorId);
    newPlayers[idx] = { ...collector, cash: collector.cash + totalCollected };
  }
  return { players: newPlayers, totalCollected };
}

export function payAllPlayers(
  players: Player[],
  payerId: number,
  amountPerPlayer: number,
  toNegara: boolean,
): { players: Player[]; negaraGain: number; success: boolean } {
  const payer = players.find(p => p.id === payerId);
  if (!payer) return { players, negaraGain: 0, success: false };
  const others = players.filter(p => p.id !== payerId && !p.isBankrupt);
  const total = others.length * amountPerPlayer;
  if (payer.cash < total) {
    return {
      players: players.map(p => p.id === payerId ? { ...p, isBankrupt: true, cash: 0 } : p),
      negaraGain: 0,
      success: false,
    };
  }
  let negaraGain = 0;
  const newPlayers = players.map(p => {
    if (p.id === payerId) return { ...p, cash: p.cash - total };
    if (p.isBankrupt) return p;
    if (toNegara) {
      negaraGain += amountPerPlayer;
      return p;
    }
    return { ...p, cash: p.cash + amountPerPlayer };
  });
  return { players: newPlayers, negaraGain, success: true };
}

export function confiscateProperty(
  player: Player,
  tileId: number,
): { player: Player; refund: number } {
  const tile = getTile(tileId);
  const refund = Math.floor((tile.price || 0) * RULES.confiscation.refundRate);
  const newProps = player.properties.filter(id => id !== tileId);
  const newHouses = { ...player.houses };
  delete newHouses[tileId];
  return {
    player: { ...player, properties: newProps, houses: newHouses, cash: player.cash + refund },
    refund,
  };
}

export function transferPropertiesOnBankruptcy(
  bankrupt: Player,
  creditor: Player,
): { creditor: Player } {
  const newProps = [...creditor.properties, ...bankrupt.properties];
  const newHouses = { ...creditor.houses };
  for (const propId of bankrupt.properties) {
    const h = bankrupt.houses[propId] || 0;
    if (h > 0) {
      const existing = newHouses[propId] || 0;
      newHouses[propId] = (existing === 0 ? h : Math.max(existing, h)) as HouseLevel;
    }
  }
  return {
    creditor: {
      ...creditor,
      properties: newProps,
      houses: newHouses,
      cash: creditor.cash + bankrupt.cash,
    },
  };
}

export function buyProperty(player: Player, tile: Tile): Player | null {
  const price = tile.price || 0;
  if (player.cash < price) return null;
  return {
    ...player,
    cash: player.cash - price,
    properties: [...player.properties, tile.id],
  };
}

export function buildHouse(player: Player, tileId: number): { player: Player; cost: number } | null {
  if (!canBuildHouse(player, tileId)) return null;
  const level = player.houses[tileId] || 0;
  const cost = getBuildCost(player, tileId);
  const newLevel = (level === 2 ? 3 : level + 1) as HouseLevel;
  return {
    player: {
      ...player,
      cash: player.cash - cost,
      houses: { ...player.houses, [tileId]: newLevel },
    },
    cost,
  };
}

export function freeUpgradeHouse(player: Player, tileId: number): Player | null {
  if (!player.properties.includes(tileId)) return null;
  const level = player.houses[tileId] || 0;
  if (level === 3) return null;
  const newLevel = (level === 0 ? 1 : 3) as HouseLevel;
  return {
    ...player,
    houses: { ...player.houses, [tileId]: newLevel },
  };
}

export function advanceToTile(
  player: Player,
  destTileId: number,
  boardSize: number,
  salary: number,
): { player: Player; passedStart: boolean } {
  const passedStart = destTileId < player.position;
  const newCash = passedStart ? player.cash + salary : player.cash;
  return {
    player: { ...player, position: destTileId, cash: newCash },
    passedStart,
  };
}

export function findNextPlayer(
  players: Player[],
  currentIndex: number,
): { nextIndex: number; newTurn: boolean } {
  let nextIdx = (currentIndex + 1) % players.length;
  while (players[nextIdx]?.isBankrupt && nextIdx !== currentIndex) {
    nextIdx = (nextIdx + 1) % players.length;
  }
  return {
    nextIndex: nextIdx,
    newTurn: nextIdx <= currentIndex,
  };
}

export function countActivePlayers(players: Player[]): number {
  return players.filter(p => !p.isBankrupt).length;
}

export function getWinner(players: Player[]): Player | null {
  const active = players.filter(p => !p.isBankrupt);
  if (active.length === 0) return null;
  if (active.length === 1) return active[0];
  return active.sort((a, b) => calculateNetWorth(b) - calculateNetWorth(a))[0];
}

import type { Player, Tile, GameCard, HouseLevel, CardType, MusibahTier } from './types';
import {
  BOARD, BOARD_SIZE, TOL_TILES, MUSIBAH_CARDS, TAKDIR_CARDS, TARGETIR_CARDS, BANDUNG_TILE_ID, LAPAS_TILE_ID,
} from './boardData';

export const PLAYER_PRESETS = [
  { name: 'Pemain 1', color: '#ef4444', emoji: '🤓' },
  { name: 'Pemain 2', color: '#3b82f6', emoji: '😎' },
  { name: 'Pemain 3', color: '#22c55e', emoji: '🥳' },
  { name: 'Pemain 4', color: '#f59e0b', emoji: '🤠' },
  { name: 'Pemain 5', color: '#ec4899', emoji: '🤯' },
];

export const STARTING_CASH = 5_000_000;
export const SALARY = 1_000_000;
export const JAIL_BAIL = 1_500_000;
export const TAX_PER_PROPERTY = 500_000;
export const PUNGLI_FEE = 1_000_000;
export const TILANG_FINE = 500_000;
export const LAPAS_FINE = 1_500_000;
export const TOL_FEE = 500_000;
export const PENGADILAN_COMPENSATION = 1_000_000;
export const MAX_JAIL_TURNS = 3;
export const STOPWATCH_ROUND_THRESHOLD = 2;

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
  return Math.floor((tile.rent || 0) * 0.5);
}

export function getSeverityFromDie(die: number): MusibahTier {
  if (die >= 5) return 'ringan';
  if (die >= 3) return 'sedang';
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

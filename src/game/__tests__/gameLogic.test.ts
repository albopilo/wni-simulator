import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPlayers, rollDice, rollSingleDie, propertyOwner, calculateRent, calculateStateRent,
  getSeverityFromDie, severityLabel, getTieredMoney, getTieredPayPerProperty, getTieredPayPerHouse,
  drawCard, hasBandung, calculateNetWorth, houseLevelName, getCheapestProperty, getFirstProperty,
  getTotalHouseCount, canBuildHouse, getBuildCost, getSellValue,
  transferMoney, payToNegara, collectFromNegara, collectFromAllPlayers, payAllPlayers,
  confiscateProperty, transferPropertiesOnBankruptcy, buyProperty, buildHouse, freeUpgradeHouse,
  advanceToTile, findNextPlayer, countActivePlayers, getWinner,
  getTolDestinations, isStateOwned, isTolTile, makeLog,
  STATE_OWNED, BOARD_OVERRIDES,
  STARTING_CASH, SALARY,
} from '../gameLogic';
import { BOARD, BOARD_SIZE, MUSIBAH_CARDS, TAKDIR_CARDS, TARGETIR_CARDS, BANDUNG_TILE_ID, LAPAS_TILE_ID } from '../boardData';
import { RULES } from '../gameRules';
import type { Player, GameCard, HouseLevel } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockRandom(value: number) {
  vi.spyOn(Math, 'random').mockReturnValue(value);
}

function restoreRandom() {
  vi.restoreAllMocks();
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 0,
    name: 'Test',
    color: '#ef4444',
    emoji: '🤓',
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
    consecutiveDoubles: 0,
    ...overrides,
  };
}

function makePlayerWithProps(cash: number, tileIds: number[], houses: Record<number, HouseLevel> = {}): Player {
  return makePlayer({ cash, properties: tileIds, houses });
}

// ---------------------------------------------------------------------------
// Board integrity
// ---------------------------------------------------------------------------

describe('Board integrity', () => {
  it('has exactly 32 tiles', () => {
    expect(BOARD).toHaveLength(BOARD_SIZE);
    expect(BOARD_SIZE).toBe(32);
  });

  it('has sequential tile IDs from 0 to 31', () => {
    BOARD.forEach((tile, idx) => {
      expect(tile.id).toBe(idx);
    });
  });

  it('has a Start tile at position 0', () => {
    expect(BOARD[0].type).toBe('start');
  });

  it('has a Lapas tile at id 8', () => {
    expect(BOARD[LAPAS_TILE_ID].type).toBe('lapas');
  });

  it('has property tiles with all required economic fields', () => {
    const props = BOARD.filter(t => t.type === 'property');
    expect(props.length).toBeGreaterThan(0);
    for (const p of props) {
      expect(p.price).toBeDefined();
      expect(p.rent).toBeDefined();
      expect(p.rentSubsidi1).toBeDefined();
      expect(p.rentSubsidi2).toBeDefined();
      expect(p.rentOKB).toBeDefined();
      expect(p.housePrice).toBeDefined();
      expect(p.okbPrice).toBeDefined();
    }
  });

  it('has exactly 2 tol tiles', () => {
    const tols = BOARD.filter(t => t.isTol);
    expect(tols).toHaveLength(2);
  });

  it('has a Bandung tile at id 9', () => {
    expect(BOARD[BANDUNG_TILE_ID].name).toBe('Bandung');
  });

  it('card decks are non-empty', () => {
    expect(MUSIBAH_CARDS.length).toBeGreaterThan(0);
    expect(TAKDIR_CARDS.length).toBeGreaterThan(0);
    expect(TARGETIR_CARDS.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Player creation
// ---------------------------------------------------------------------------

describe('createPlayers', () => {
  it('creates the requested number of players', () => {
    expect(createPlayers(3)).toHaveLength(3);
    expect(createPlayers(4)).toHaveLength(4);
    expect(createPlayers(5)).toHaveLength(5);
  });

  it('gives each player the starting cash', () => {
    const players = createPlayers(3);
    for (const p of players) {
      expect(p.cash).toBe(STARTING_CASH);
      expect(p.cash).toBe(5_000_000);
    }
  });

  it('starts all players at position 0', () => {
    const players = createPlayers(3);
    for (const p of players) {
      expect(p.position).toBe(0);
    }
  });

  it('assigns unique ids', () => {
    const players = createPlayers(5);
    const ids = players.map(p => p.id);
    expect(new Set(ids).size).toBe(5);
  });

  it('starts with no properties, no houses, not in jail, not bankrupt', () => {
    const players = createPlayers(3);
    for (const p of players) {
      expect(p.properties).toEqual([]);
      expect(p.houses).toEqual({});
      expect(p.inJail).toBe(false);
      expect(p.jailTurns).toBe(0);
      expect(p.isBankrupt).toBe(false);
      expect(p.getOutCards).toBe(0);
      expect(p.protectionCards).toBe(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Dice
// ---------------------------------------------------------------------------

describe('rollDice', () => {
  beforeEach(() => restoreRandom());

  it('returns two values between 1 and 6', () => {
    mockRandom(0.99);
    const [d1, d2] = rollDice();
    expect(d1).toBeGreaterThanOrEqual(1);
    expect(d1).toBeLessThanOrEqual(6);
    expect(d2).toBeGreaterThanOrEqual(1);
    expect(d2).toBeLessThanOrEqual(6);
    restoreRandom();
  });

  it('produces deterministic [1,1] when random returns ~0', () => {
    mockRandom(0.001);
    const [d1, d2] = rollDice();
    expect(d1).toBe(1);
    expect(d2).toBe(1);
    restoreRandom();
  });

  it('produces deterministic [6,6] when random returns ~1', () => {
    mockRandom(0.999);
    const [d1, d2] = rollDice();
    expect(d1).toBe(6);
    expect(d2).toBe(6);
    restoreRandom();
  });
});

describe('rollSingleDie', () => {
  beforeEach(() => restoreRandom());

  it('returns a value between 1 and 6', () => {
    mockRandom(0.5);
    const val = rollSingleDie();
    expect(val).toBeGreaterThanOrEqual(1);
    expect(val).toBeLessThanOrEqual(6);
    restoreRandom();
  });

  it('is deterministic', () => {
    mockRandom(0.001);
    expect(rollSingleDie()).toBe(1);
    restoreRandom();
    mockRandom(0.999);
    expect(rollSingleDie()).toBe(6);
    restoreRandom();
  });
});

// ---------------------------------------------------------------------------
// Movement and salary
// ---------------------------------------------------------------------------

describe('advanceToTile', () => {
  it('detects passing Start (moving backward in id)', () => {
    const player = makePlayer({ position: 30 });
    const { player: moved, passedStart } = advanceToTile(player, 5, BOARD_SIZE, SALARY);
    expect(passedStart).toBe(true);
    expect(moved.position).toBe(5);
    expect(moved.cash).toBe(player.cash + SALARY);
  });

  it('does not give salary when not passing Start', () => {
    const player = makePlayer({ position: 5 });
    const { player: moved, passedStart } = advanceToTile(player, 10, BOARD_SIZE, SALARY);
    expect(passedStart).toBe(false);
    expect(moved.cash).toBe(player.cash);
  });

  it('does not give salary when landing on Start itself (position 0 → 0)', () => {
    const player = makePlayer({ position: 0 });
    const { passedStart } = advanceToTile(player, 0, BOARD_SIZE, SALARY);
    expect(passedStart).toBe(false);
  });

  it('gives salary when moving to Start from a higher position', () => {
    const player = makePlayer({ position: 20 });
    const { player: moved, passedStart } = advanceToTile(player, 0, BOARD_SIZE, SALARY);
    expect(passedStart).toBe(true);
    expect(moved.cash).toBe(player.cash + SALARY);
  });
});

// ---------------------------------------------------------------------------
// Property ownership and rent
// ---------------------------------------------------------------------------

describe('propertyOwner', () => {
  it('returns null when no one owns the tile', () => {
    const players = createPlayers(2);
    expect(propertyOwner(players, 1)).toBeNull();
  });

  it('returns the player who owns the tile', () => {
    const players = createPlayers(2);
    players[0].properties = [1, 5];
    const owner = propertyOwner(players, 1);
    expect(owner).not.toBeNull();
    expect(owner!.id).toBe(0);
  });

  it('returns null for non-property tiles', () => {
    const players = createPlayers(2);
    expect(propertyOwner(players, 0)).toBeNull();
  });
});

describe('calculateRent', () => {
  const tile = BOARD[1]; // Aceh

  it('returns base rent at level 0', () => {
    const owner = makePlayerWithProps(5_000_000, [1], { 1: 0 });
    expect(calculateRent(tile, owner)).toBe(tile.rent);
  });

  it('returns rentSubsidi1 at level 1', () => {
    const owner = makePlayerWithProps(5_000_000, [1], { 1: 1 });
    expect(calculateRent(tile, owner)).toBe(tile.rentSubsidi1);
  });

  it('returns rentSubsidi2 at level 2', () => {
    const owner = makePlayerWithProps(5_000_000, [1], { 1: 2 });
    expect(calculateRent(tile, owner)).toBe(tile.rentSubsidi2);
  });

  it('returns rentOKB at level 3', () => {
    const owner = makePlayerWithProps(5_000_000, [1], { 1: 3 });
    expect(calculateRent(tile, owner)).toBe(tile.rentOKB);
  });

  it('falls back to base rent if subsidi fields missing', () => {
    const owner = makePlayerWithProps(5_000_000, [1], { 1: 1 });
    const partialTile = { ...tile, rentSubsidi1: undefined };
    expect(calculateRent(partialTile, owner)).toBe(tile.rent);
  });
});

describe('calculateStateRent', () => {
  it('returns 50% of base rent (floored)', () => {
    const tile = BOARD[1]; // rent 40_000
    expect(calculateStateRent(tile)).toBe(20_000);
  });

  it('returns 0 when tile has no rent', () => {
    const tile = BOARD[0]; // Start, no rent
    expect(calculateStateRent(tile)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

describe('buyProperty', () => {
  const tile = BOARD[1]; // Aceh, price 600_000

  it('deducts price and adds tile to properties', () => {
    const player = makePlayer({ cash: 5_000_000 });
    const result = buyProperty(player, tile);
    expect(result).not.toBeNull();
    expect(result!.cash).toBe(5_000_000 - 600_000);
    expect(result!.properties).toContain(1);
  });

  it('returns null when player cannot afford', () => {
    const player = makePlayer({ cash: 100_000 });
    const result = buyProperty(player, tile);
    expect(result).toBeNull();
  });

  it('does not mutate the original player', () => {
    const player = makePlayer({ cash: 5_000_000, properties: [] });
    buyProperty(player, tile);
    expect(player.cash).toBe(5_000_000);
    expect(player.properties).toEqual([]);
  });
});

describe('buildHouse', () => {
  it('builds from level 0 to level 1 and deducts housePrice', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 0 });
    const result = buildHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.player.houses[1]).toBe(1);
    expect(result!.player.cash).toBe(5_000_000 - 300_000);
    expect(result!.cost).toBe(300_000);
  });

  it('builds from level 1 to level 2', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 1 });
    const result = buildHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.player.houses[1]).toBe(2);
    expect(result!.cost).toBe(300_000);
  });

  it('upgrades from level 2 to level 3 (OKB) and deducts okbPrice', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 2 });
    const result = buildHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.player.houses[1]).toBe(3);
    expect(result!.cost).toBe(500_000);
    expect(result!.player.cash).toBe(5_000_000 - 500_000);
  });

  it('returns null at level 3 (max)', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 3 });
    expect(buildHouse(player, 1)).toBeNull();
  });

  it('returns null when player does not own the tile', () => {
    const player = makePlayerWithProps(5_000_000, [], {});
    expect(buildHouse(player, 1)).toBeNull();
  });

  it('returns null when player cannot afford', () => {
    const player = makePlayerWithProps(100_000, [1], { 1: 0 });
    expect(buildHouse(player, 1)).toBeNull();
  });
});

describe('freeUpgradeHouse', () => {
  it('upgrades from level 0 to level 1 for free', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 0 });
    const result = freeUpgradeHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.houses[1]).toBe(1);
    expect(result!.cash).toBe(5_000_000);
  });

  it('upgrades from level 1 to level 3 (OKB) for free', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 1 });
    const result = freeUpgradeHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.houses[1]).toBe(3);
  });

  it('upgrades from level 2 to level 3 (OKB) for free', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 2 });
    const result = freeUpgradeHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.houses[1]).toBe(3);
  });

  it('returns null at level 3', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 3 });
    expect(freeUpgradeHouse(player, 1)).toBeNull();
  });

  it('returns null when player does not own the tile', () => {
    const player = makePlayerWithProps(5_000_000, [], {});
    expect(freeUpgradeHouse(player, 1)).toBeNull();
  });
});

describe('canBuildHouse', () => {
  it('allows building at level 0 if affordable', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 0 });
    expect(canBuildHouse(player, 1)).toBe(true);
  });

  it('blocks building at level 3', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 3 });
    expect(canBuildHouse(player, 1)).toBe(false);
  });

  it('blocks building if not affordable', () => {
    const player = makePlayerWithProps(200_000, [1], { 1: 0 });
    expect(canBuildHouse(player, 1)).toBe(false);
  });
});

describe('getBuildCost', () => {
  it('returns housePrice for levels 0 and 1', () => {
    const player0 = makePlayerWithProps(5_000_000, [1], { 1: 0 });
    const player1 = makePlayerWithProps(5_000_000, [1], { 1: 1 });
    expect(getBuildCost(player0, 1)).toBe(300_000);
    expect(getBuildCost(player1, 1)).toBe(300_000);
  });

  it('returns okbPrice for level 2', () => {
    const player = makePlayerWithProps(5_000_000, [1], { 1: 2 });
    expect(getBuildCost(player, 1)).toBe(500_000);
  });
});

// ---------------------------------------------------------------------------
// Musibah severity
// ---------------------------------------------------------------------------

describe('getSeverityFromDie', () => {
  it('returns "ringan" for die >= 5', () => {
    expect(getSeverityFromDie(5)).toBe('ringan');
    expect(getSeverityFromDie(6)).toBe('ringan');
  });

  it('returns "sedang" for die 3-4', () => {
    expect(getSeverityFromDie(3)).toBe('sedang');
    expect(getSeverityFromDie(4)).toBe('sedang');
  });

  it('returns "brutal" for die 1-2', () => {
    expect(getSeverityFromDie(1)).toBe('brutal');
    expect(getSeverityFromDie(2)).toBe('brutal');
  });
});

describe('severityLabel', () => {
  it('returns correct labels', () => {
    expect(severityLabel('ringan')).toBe('Ringan');
    expect(severityLabel('sedang')).toBe('Sedang');
    expect(severityLabel('brutal')).toBe('Brutal');
  });
});

describe('Tiered money helpers', () => {
  const card: GameCard = {
    id: 'test', type: 'musibah', title: 'Test', description: 'Test',
    effect: {},
    tieredMoney: { ringan: 100_000, sedang: 300_000, brutal: 500_000 },
    tieredPayPerProperty: { ringan: 50_000, sedang: 100_000, brutal: 200_000 },
    tieredPayPerHouse: { ringan: 25_000, sedang: 50_000, brutal: 100_000 },
  };

  it('getTieredMoney returns correct amounts per tier', () => {
    expect(getTieredMoney(card, 'ringan')).toBe(100_000);
    expect(getTieredMoney(card, 'sedang')).toBe(300_000);
    expect(getTieredMoney(card, 'brutal')).toBe(500_000);
  });

  it('getTieredPayPerProperty returns correct amounts per tier', () => {
    expect(getTieredPayPerProperty(card, 'ringan')).toBe(50_000);
    expect(getTieredPayPerProperty(card, 'brutal')).toBe(200_000);
  });

  it('getTieredPayPerHouse returns correct amounts per tier', () => {
    expect(getTieredPayPerHouse(card, 'sedang')).toBe(50_000);
    expect(getTieredPayPerHouse(card, 'brutal')).toBe(100_000);
  });

  it('returns 0 when card does not have tiered fields', () => {
    const plainCard: GameCard = { id: 'p', type: 'takdir', title: 'P', description: 'P', effect: {} };
    expect(getTieredMoney(plainCard, 'ringan')).toBe(0);
    expect(getTieredPayPerProperty(plainCard, 'brutal')).toBe(0);
    expect(getTieredPayPerHouse(plainCard, 'sedang')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Card drawing
// ---------------------------------------------------------------------------

describe('drawCard', () => {
  beforeEach(() => restoreRandom());

  it('draws from the correct deck by type', () => {
    mockRandom(0.001);
    const musibah = drawCard('musibah', false);
    expect(musibah.type).toBe('musibah');
    restoreRandom();

    mockRandom(0.001);
    const takdir = drawCard('takdir', false);
    expect(takdir.type).toBe('takdir');
    restoreRandom();

    mockRandom(0.001);
    const targetir = drawCard('targetir', false);
    expect(targetir.type).toBe('targetir');
    restoreRandom();
  });

  it('excludes stopwatch cards when stopwatch is inactive', () => {
    for (let i = 0; i < 100; i++) {
      mockRandom(i / 100);
      const card = drawCard('musibah', false);
      expect(card.hasStopwatch).toBeFalsy();
      restoreRandom();
    }
  });

  it('includes stopwatch cards when stopwatch is active', () => {
    let foundStopwatch = false;
    for (let i = 0; i < 100; i++) {
      mockRandom(i / 100);
      const card = drawCard('musibah', true);
      if (card.hasStopwatch) foundStopwatch = true;
      restoreRandom();
    }
    expect(foundStopwatch).toBe(true);
  });

  it('is deterministic with a fixed random value', () => {
    mockRandom(0.5);
    const card1 = drawCard('takdir', false);
    restoreRandom();
    mockRandom(0.5);
    const card2 = drawCard('takdir', false);
    restoreRandom();
    expect(card1.id).toBe(card2.id);
  });
});

// ---------------------------------------------------------------------------
// Bandung / Pungli exemption
// ---------------------------------------------------------------------------

describe('hasBandung', () => {
  it('returns true when player owns Bandung (id 9)', () => {
    const player = makePlayerWithProps(5_000_000, [9]);
    expect(hasBandung(player)).toBe(true);
  });

  it('returns false when player does not own Bandung', () => {
    const player = makePlayerWithProps(5_000_000, [1, 2, 3]);
    expect(hasBandung(player)).toBe(false);
  });

  it('returns false when player has no properties', () => {
    const player = makePlayerWithProps(5_000_000, []);
    expect(hasBandung(player)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Net worth
// ---------------------------------------------------------------------------

describe('calculateNetWorth', () => {
  it('returns just cash when no properties', () => {
    const player = makePlayer({ cash: 3_000_000 });
    expect(calculateNetWorth(player)).toBe(3_000_000);
  });

  it('includes property price', () => {
    const player = makePlayerWithProps(3_000_000, [1]); // Aceh 600_000
    expect(calculateNetWorth(player)).toBe(3_000_000 + 600_000);
  });

  it('includes house investments at level 1', () => {
    const player = makePlayerWithProps(3_000_000, [1], { 1: 1 }); // +300_000
    expect(calculateNetWorth(player)).toBe(3_000_000 + 600_000 + 300_000);
  });

  it('includes house investments at level 2', () => {
    const player = makePlayerWithProps(3_000_000, [1], { 1: 2 }); // +600_000
    expect(calculateNetWorth(player)).toBe(3_000_000 + 600_000 + 600_000);
  });

  it('includes OKB investment at level 3', () => {
    const player = makePlayerWithProps(3_000_000, [1], { 1: 3 }); // 2*300k + 500k
    expect(calculateNetWorth(player)).toBe(3_000_000 + 600_000 + 600_000 + 500_000);
  });
});

// ---------------------------------------------------------------------------
// Property helpers
// ---------------------------------------------------------------------------

describe('getCheapestProperty', () => {
  it('returns null when player has no properties', () => {
    expect(getCheapestProperty(makePlayerWithProps(5_000_000, []))).toBeNull();
  });

  it('returns the cheapest tile id', () => {
    const player = makePlayerWithProps(5_000_000, [11, 1, 7]); // Jakarta 2M, Aceh 600k, Palembang 1.2M
    expect(getCheapestProperty(player)).toBe(1);
  });
});

describe('getFirstProperty', () => {
  it('returns null when empty', () => {
    expect(getFirstProperty(makePlayerWithProps(5_000_000, []))).toBeNull();
  });

  it('returns the first property in the list', () => {
    const player = makePlayerWithProps(5_000_000, [7, 1, 11]);
    expect(getFirstProperty(player)).toBe(7);
  });
});

describe('getTotalHouseCount', () => {
  it('returns 0 when no houses', () => {
    const player = makePlayerWithProps(5_000_000, [1, 2]);
    expect(getTotalHouseCount(player)).toBe(0);
  });

  it('sums all house levels across properties', () => {
    const player = makePlayerWithProps(5_000_000, [1, 2, 4], { 1: 1, 2: 2, 4: 3 });
    expect(getTotalHouseCount(player)).toBe(6);
  });
});

describe('houseLevelName', () => {
  it('returns correct names for each level', () => {
    expect(houseLevelName(0)).toBe('Tanah kosong');
    expect(houseLevelName(1)).toBe('1 Rumah Subsidi');
    expect(houseLevelName(2)).toBe('2 Rumah Subsidi');
    expect(houseLevelName(3)).toBe('Rumah OKB');
  });
});

// ---------------------------------------------------------------------------
// Toll tiles
// ---------------------------------------------------------------------------

describe('Tol tiles', () => {
  it('identifies tol tiles', () => {
    expect(isTolTile(15)).toBe(true);
    expect(isTolTile(28)).toBe(true);
    expect(isTolTile(0)).toBe(false);
  });

  it('getTolDestinations excludes current tile', () => {
    const dests = getTolDestinations(15);
    expect(dests).not.toContain(15);
    expect(dests).toContain(28);
  });

  it('getTolDestinations includes board-override tol tiles', () => {
    BOARD_OVERRIDES.set(5, { ...BOARD[5], type: 'tol', isTol: true, name: 'Tol Padang' });
    const dests = getTolDestinations(15);
    expect(dests).toContain(5);
    expect(dests).toContain(28);
    BOARD_OVERRIDES.delete(5);
  });
});

// ---------------------------------------------------------------------------
// State-owned land
// ---------------------------------------------------------------------------

describe('State-owned land', () => {
  beforeEach(() => {
    STATE_OWNED.clear();
    BOARD_OVERRIDES.clear();
  });

  it('isStateOwned returns false by default', () => {
    expect(isStateOwned(1)).toBe(false);
  });

  it('isStateOwned returns true after adding to STATE_OWNED', () => {
    STATE_OWNED.add(1);
    expect(isStateOwned(1)).toBe(true);
  });

  it('confiscateProperty removes property and gives 50% refund', () => {
    const player = makePlayerWithProps(1_000_000, [1, 4], { 1: 2 });
    const { player: newPlayer, refund } = confiscateProperty(player, 1);
    expect(refund).toBe(300_000); // 50% of 600_000
    expect(newPlayer.cash).toBe(1_300_000);
    expect(newPlayer.properties).not.toContain(1);
    expect(newPlayer.properties).toContain(4);
    expect(newPlayer.houses[1]).toBeUndefined();
  });

  it('confiscateProperty does not mutate original player', () => {
    const player = makePlayerWithProps(1_000_000, [1]);
    confiscateProperty(player, 1);
    expect(player.properties).toContain(1);
    expect(player.cash).toBe(1_000_000);
  });
});

// ---------------------------------------------------------------------------
// Money transfer functions
// ---------------------------------------------------------------------------

describe('transferMoney', () => {
  it('transfers money between two players', () => {
    const players = createPlayers(2);
    const result = transferMoney(players, 0, 1, 500_000);
    expect(result[0].cash).toBe(STARTING_CASH - 500_000);
    expect(result[1].cash).toBe(STARTING_CASH + 500_000);
  });

  it('transfers to negara when receiverId is null', () => {
    const players = createPlayers(2);
    const result = transferMoney(players, 0, null, 500_000);
    expect(result[0].cash).toBe(STARTING_CASH - 500_000);
    expect(result[1].cash).toBe(STARTING_CASH);
  });

  it('does nothing for zero or negative amount', () => {
    const players = createPlayers(2);
    const result = transferMoney(players, 0, 1, 0);
    expect(result).toBe(players);
  });

  it('marks payer bankrupt if they cannot afford', () => {
    const players = createPlayers(2);
    players[0].cash = 100_000;
    const result = transferMoney(players, 0, 1, 500_000);
    expect(result[0].isBankrupt).toBe(true);
    expect(result[0].cash).toBe(0);
  });
});

describe('payToNegara', () => {
  it('deducts from payer and returns negaraGain', () => {
    const players = createPlayers(2);
    const { players: newPlayers, negaraGain } = payToNegara(players, 0, 500_000);
    expect(newPlayers[0].cash).toBe(STARTING_CASH - 500_000);
    expect(negaraGain).toBe(500_000);
  });

  it('returns partial negaraGain when payer cannot afford full amount', () => {
    const players = createPlayers(2);
    players[0].cash = 200_000;
    const { players: newPlayers, negaraGain } = payToNegara(players, 0, 500_000);
    expect(newPlayers[0].isBankrupt).toBe(true);
    expect(newPlayers[0].cash).toBe(0);
    expect(negaraGain).toBe(200_000);
  });

  it('does nothing for zero amount', () => {
    const players = createPlayers(2);
    const { negaraGain } = payToNegara(players, 0, 0);
    expect(negaraGain).toBe(0);
  });
});

describe('collectFromNegara', () => {
  it('adds money to receiver', () => {
    const players = createPlayers(2);
    const { players: newPlayers, negaraLoss } = collectFromNegara(players, 0, 1_000_000);
    expect(newPlayers[0].cash).toBe(STARTING_CASH + 1_000_000);
    expect(negaraLoss).toBe(1_000_000);
  });
});

describe('collectFromAllPlayers', () => {
  it('collects from each non-bankrupt player and gives to collector', () => {
    const players = createPlayers(3);
    const { players: newPlayers, totalCollected } = collectFromAllPlayers(players, 0, 300_000);
    expect(totalCollected).toBe(600_000); // 2 others × 300_000
    expect(newPlayers[0].cash).toBe(STARTING_CASH + 600_000);
    expect(newPlayers[1].cash).toBe(STARTING_CASH - 300_000);
    expect(newPlayers[2].cash).toBe(STARTING_CASH - 300_000);
  });

  it('skips bankrupt players', () => {
    const players = createPlayers(3);
    players[1].isBankrupt = true;
    const { totalCollected } = collectFromAllPlayers(players, 0, 300_000);
    expect(totalCollected).toBe(300_000); // only player 2
  });

  it('does not partially mutate original players array', () => {
    const players = createPlayers(3);
    const original = players.map(p => ({ ...p }));
    collectFromAllPlayers(players, 0, 300_000);
    expect(players).toEqual(original);
  });
});

describe('payAllPlayers', () => {
  it('pays each non-bankrupt player when toNegara is false', () => {
    const players = createPlayers(3);
    const { players: newPlayers, success } = payAllPlayers(players, 0, 200_000, false);
    expect(success).toBe(true);
    expect(newPlayers[0].cash).toBe(STARTING_CASH - 400_000);
    expect(newPlayers[1].cash).toBe(STARTING_CASH + 200_000);
    expect(newPlayers[2].cash).toBe(STARTING_CASH + 200_000);
  });

  it('pays to negara when toNegara is true', () => {
    const players = createPlayers(3);
    const { players: newPlayers, negaraGain, success } = payAllPlayers(players, 0, 500_000, true);
    expect(success).toBe(true);
    expect(newPlayers[0].cash).toBe(STARTING_CASH - 1_000_000);
    expect(newPlayers[1].cash).toBe(STARTING_CASH); // unchanged
    expect(negaraGain).toBe(1_000_000);
  });

  it('fails when payer cannot afford total', () => {
    const players = createPlayers(3);
    players[0].cash = 100_000;
    const { success, negaraGain } = payAllPlayers(players, 0, 500_000, true);
    expect(success).toBe(false);
    expect(negaraGain).toBe(0);
  });

  it('marks payer bankrupt on failure', () => {
    const players = createPlayers(3);
    players[0].cash = 100_000;
    const { players: newPlayers } = payAllPlayers(players, 0, 500_000, true);
    expect(newPlayers[0].isBankrupt).toBe(true);
    expect(newPlayers[0].cash).toBe(0);
  });

  it('does not mutate original players on failure', () => {
    const players = createPlayers(3);
    players[0].cash = 100_000;
    const original = players.map(p => ({ ...p }));
    payAllPlayers(players, 0, 500_000, true);
    expect(players).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// Bankruptcy and property transfer
// ---------------------------------------------------------------------------

describe('transferPropertiesOnBankruptcy', () => {
  it('transfers all properties and cash to creditor', () => {
    const bankrupt = makePlayerWithProps(500_000, [1, 4], { 1: 2 });
    const creditor = makePlayer({ id: 1, cash: 2_000_000, properties: [7] });
    const { creditor: newCreditor } = transferPropertiesOnBankruptcy(bankrupt, creditor);
    expect(newCreditor.properties).toContain(1);
    expect(newCreditor.properties).toContain(4);
    expect(newCreditor.properties).toContain(7);
    expect(newCreditor.cash).toBe(2_500_000);
    expect(newCreditor.houses[1]).toBe(2);
  });

  it('does not mutate original creditor', () => {
    const bankrupt = makePlayerWithProps(500_000, [1]);
    const creditor = makePlayer({ id: 1, cash: 2_000_000, properties: [7] });
    transferPropertiesOnBankruptcy(bankrupt, creditor);
    expect(creditor.properties).toEqual([7]);
    expect(creditor.cash).toBe(2_000_000);
  });

  it('merges house levels keeping the higher one', () => {
    const bankrupt = makePlayerWithProps(0, [1], { 1: 3 });
    const creditor = makePlayer({ id: 1, properties: [1], houses: { 1: 1 } });
    // This scenario shouldn't happen in practice (two players can't own same tile)
    // but we test the max-merge logic anyway
    const { creditor: newCreditor } = transferPropertiesOnBankruptcy(bankrupt, creditor);
    expect(newCreditor.houses[1]).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Turn progression
// ---------------------------------------------------------------------------

describe('findNextPlayer', () => {
  it('finds the next non-bankrupt player', () => {
    const players = createPlayers(3);
    const { nextIndex, newTurn } = findNextPlayer(players, 0);
    expect(nextIndex).toBe(1);
    expect(newTurn).toBe(false);
  });

  it('wraps around and signals a new turn', () => {
    const players = createPlayers(3);
    const { nextIndex, newTurn } = findNextPlayer(players, 2);
    expect(nextIndex).toBe(0);
    expect(newTurn).toBe(true);
  });

  it('skips bankrupt players', () => {
    const players = createPlayers(4);
    players[1].isBankrupt = true;
    const { nextIndex } = findNextPlayer(players, 0);
    expect(nextIndex).toBe(2);
  });

  it('wraps past multiple bankrupt players', () => {
    const players = createPlayers(4);
    players[0].isBankrupt = true;
    players[1].isBankrupt = true;
    players[2].isBankrupt = true;
    const { nextIndex } = findNextPlayer(players, 3);
    expect(nextIndex).toBe(3); // only player 3 is active
  });
});

describe('countActivePlayers', () => {
  it('counts non-bankrupt players', () => {
    const players = createPlayers(4);
    expect(countActivePlayers(players)).toBe(4);
    players[0].isBankrupt = true;
    players[2].isBankrupt = true;
    expect(countActivePlayers(players)).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Winner determination
// ---------------------------------------------------------------------------

describe('getWinner', () => {
  it('returns null when all players are bankrupt', () => {
    const players = createPlayers(3);
    players.forEach(p => p.isBankrupt = true);
    expect(getWinner(players)).toBeNull();
  });

  it('returns the sole survivor', () => {
    const players = createPlayers(3);
    players[0].isBankrupt = true;
    players[1].isBankrupt = true;
    const winner = getWinner(players);
    expect(winner).not.toBeNull();
    expect(winner!.id).toBe(2);
  });

  it('returns the highest net worth when multiple survivors', () => {
    const players = createPlayers(3);
    players[0].cash = 10_000_000;
    players[1].cash = 1_000_000;
    players[2].cash = 5_000_000;
    const winner = getWinner(players);
    expect(winner!.id).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Sell value
// ---------------------------------------------------------------------------

describe('getSellValue', () => {
  it('returns 50% of property price (floored)', () => {
    expect(getSellValue(1)).toBe(300_000); // Aceh 600k → 300k
    expect(getSellValue(11)).toBe(1_000_000); // Jakarta 2M → 1M
  });
});

// ---------------------------------------------------------------------------
// makeLog
// ---------------------------------------------------------------------------

describe('makeLog', () => {
  it('creates a log entry with incremental id', () => {
    const log1 = makeLog('Hello', 'info');
    const log2 = makeLog('World', 'bad');
    expect(log2.id).toBeGreaterThan(log1.id);
    expect(log1.text).toBe('Hello');
    expect(log1.type).toBe('info');
  });
});

// ---------------------------------------------------------------------------
// Transaction safety: no double application / partial mutation
// ---------------------------------------------------------------------------

describe('Transaction safety', () => {
  it('buyProperty does not partially apply on insufficient funds', () => {
    const player = makePlayer({ cash: 100_000, properties: [] });
    const result = buyProperty(player, BOARD[11]); // Jakarta 2M
    expect(result).toBeNull();
    expect(player.cash).toBe(100_000);
    expect(player.properties).toEqual([]);
  });

  it('buildHouse does not partially apply on insufficient funds', () => {
    const player = makePlayerWithProps(100_000, [1], { 1: 0 });
    const result = buildHouse(player, 1);
    expect(result).toBeNull();
    expect(player.cash).toBe(100_000);
    expect(player.houses[1] || 0).toBe(0);
  });

  it('payAllPlayers does not partially deduct on failure', () => {
    const players = createPlayers(3);
    players[0].cash = 100_000;
    const originalCash = players.map(p => p.cash);
    const { players: newPlayers, success } = payAllPlayers(players, 0, 500_000, true);
    expect(success).toBe(false);
    // Other players should be unchanged
    expect(newPlayers[1].cash).toBe(originalCash[1]);
    expect(newPlayers[2].cash).toBe(originalCash[2]);
    // Payer should be bankrupt with 0 cash, not partially deducted
    expect(newPlayers[0].cash).toBe(0);
    expect(newPlayers[0].isBankrupt).toBe(true);
  });

  it('transferMoney is idempotent when applied once (no side effects on original)', () => {
    const players = createPlayers(2);
    const original = players.map(p => ({ ...p }));
    transferMoney(players, 0, 1, 500_000);
    // Original array unchanged
    expect(players).toEqual(original);
  });

  it('confiscateProperty is a pure function (no side effects)', () => {
    STATE_OWNED.clear();
    const player = makePlayerWithProps(1_000_000, [1, 4], { 1: 2 });
    const original = { ...player, properties: [...player.properties], houses: { ...player.houses } };
    confiscateProperty(player, 1);
    expect(player).toEqual(original);
    // STATE_OWNED should not be modified by confiscateProperty itself
    expect(STATE_OWNED.has(1)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Pengadilan outcomes (based on RULES thresholds)
// ---------------------------------------------------------------------------

describe('Pengadilan thresholds', () => {
  it('win threshold is 5 (die >= 5 wins)', () => {
    expect(RULES.pengadilan.winThreshold).toBe(5);
  });

  it('lose threshold is 3 (die 3-4 loses)', () => {
    expect(RULES.pengadilan.loseThreshold).toBe(3);
  });

  it('brutal max is 2 (die <= 2 brutal)', () => {
    expect(RULES.pengadilan.brutalMax).toBe(2);
  });

  it('compensation is 1,000,000', () => {
    expect(RULES.pengadilanCompensation).toBe(1_000_000);
  });

  it('lapas fine is 1,500,000', () => {
    expect(RULES.lapasFine).toBe(1_500_000);
  });
});

// ---------------------------------------------------------------------------
// Jail constants
// ---------------------------------------------------------------------------

describe('Jail constants', () => {
  it('max jail turns is 3', () => {
    expect(RULES.maxJailTurns).toBe(3);
  });

  it('jail bail is 1,500,000', () => {
    expect(RULES.jailBail).toBe(1_500_000);
  });

  it('lapas tile id is 8', () => {
    expect(LAPAS_TILE_ID).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// Rules configurability
// ---------------------------------------------------------------------------

describe('Rules configurability', () => {
  it('startingCash is 5,000,000', () => {
    expect(RULES.startingCash).toBe(5_000_000);
  });

  it('salary is 1,000,000', () => {
    expect(RULES.salary).toBe(1_000_000);
  });

  it('taxPerProperty is 500,000', () => {
    expect(RULES.taxPerProperty).toBe(500_000);
  });

  it('pungliFee is 1,000,000', () => {
    expect(RULES.pungliFee).toBe(1_000_000);
  });

  it('tilangFine is 500,000', () => {
    expect(RULES.tilangFine).toBe(500_000);
  });

  it('tolFee is 500,000', () => {
    expect(RULES.tolFee).toBe(500_000);
  });

  it('stateOwnedRentRate is 0.5', () => {
    expect(RULES.stateOwnedRentRate).toBe(0.5);
  });

  it('confiscation refundRate is 0.5', () => {
    expect(RULES.confiscation.refundRate).toBe(0.5);
  });

  it('doublesExtraTurn is true (unverified but now implemented)', () => {
    expect(RULES.doublesExtraTurn).toBe(true);
  });

  it('doublesJailThreshold is 3', () => {
    expect(RULES.doublesJailThreshold).toBe(3);
  });

  it('stopwatchRoundThreshold is 2', () => {
    expect(RULES.stopwatchRoundThreshold).toBe(2);
  });
});

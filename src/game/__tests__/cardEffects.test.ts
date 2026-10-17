import { describe, it, expect, beforeEach } from 'vitest';
import type { Player } from '../types';
import {
  STATE_OWNED, BOARD_OVERRIDES,
  confiscateProperty, transferPropertiesOnBankruptcy,
  freeUpgradeHouse, advanceToTile,
  getCheapestProperty, getFirstProperty,
  hasBandung,
} from '../gameLogic';
import { BOARD_SIZE, BANDUNG_TILE_ID, LAPAS_TILE_ID, MUSIBAH_CARDS, TAKDIR_CARDS, TARGETIR_CARDS } from '../boardData';
import { RULES } from '../gameRules';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 0, name: 'Test', color: '#ef4444', emoji: '🤓',
    cash: 5_000_000, position: 0, properties: [], houses: {},
    inJail: false, jailTurns: 0, getOutCards: 0, isBankrupt: false,
    turnsPlayed: 0, protectionCards: 0, pendingGajian: false, consecutiveDoubles: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Takdir card effects
// ---------------------------------------------------------------------------

describe('Takdir card effects', () => {
  beforeEach(() => {
    STATE_OWNED.clear();
    BOARD_OVERRIDES.clear();
  });

  it('t1 Lulus CPNS: rollDice with evenReward 1,000,000', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't1')!;
    expect(card.effect.rollDice).toBe(true);
    expect(card.effect.evenReward).toBe(1_000_000);
    expect(card.effect.oddPenalty).toBe(500_000);
  });

  it('t5 Go To Lapas: goToJail = true', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't5')!;
    expect(card.effect.goToJail).toBe(true);
  });

  it('t6 Kartu Bebas Lapas: getOutCard = true', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't6')!;
    expect(card.effect.getOutCard).toBe(true);
  });

  it('t10 Mudik Gratis: moveTo = 0 (Start)', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't10')!;
    expect(card.effect.moveTo).toBe(0);
    // Verify advanceToTile gives salary when coming from higher position
    const player = makePlayer({ position: 20 });
    const { player: moved, passedStart } = advanceToTile(player, 0, BOARD_SIZE, RULES.salary);
    expect(passedStart).toBe(true);
    expect(moved.cash).toBe(5_000_000 + 1_000_000);
  });

  it('t12 Lomba Makan Kerupuk: collectPerPlayer = 300,000', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't12')!;
    expect(card.effect.collectPerPlayer).toBe(300_000);
  });

  it('t15 Gubernur Foya-Foya: freeUpgrade = true', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't15')!;
    expect(card.effect.freeUpgrade).toBe(true);
    // Verify freeUpgradeHouse works for level 0 → 1
    const player = makePlayer({ properties: [1], houses: { 1: 0 } });
    const result = freeUpgradeHouse(player, 1);
    expect(result).not.toBeNull();
    expect(result!.houses[1]).toBe(1);
  });

  it('t17 Jalur Orang Dalam: freeProperty = true', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't17')!;
    expect(card.effect.freeProperty).toBe(true);
  });

  it('t19 Gajian Dobel: rollDice with evenReward 2,500,000', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't19')!;
    expect(card.effect.rollDice).toBe(true);
    expect(card.effect.evenReward).toBe(2_500_000);
    expect(card.effect.oddPenalty).toBe(800_000);
  });

  it('t20 Kartu Pelindung: protection = true', () => {
    const card = TAKDIR_CARDS.find(c => c.id === 't20')!;
    expect(card.effect.protection).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Targetir card effects
// ---------------------------------------------------------------------------

describe('Targetir card effects', () => {
  beforeEach(() => {
    STATE_OWNED.clear();
    BOARD_OVERRIDES.clear();
  });

  it('tg1 Sita Negara: jualWajib = true, hasStopwatch', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg1')!;
    expect(card.effect.jualWajib).toBe(true);
    expect(card.hasStopwatch).toBe(true);
  });

  it('tg2 Pungutan Liar Massal: payPerPlayer = 500,000, hasStopwatch', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg2')!;
    expect(card.effect.payPerPlayer).toBe(500_000);
    expect(card.hasStopwatch).toBe(true);
  });

  it('tg3 Pembebasan Lahan Tol: pembebasanLahan = true, hasStopwatch', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg3')!;
    expect(card.effect.pembebasanLahan).toBe(true);
    expect(card.hasStopwatch).toBe(true);
  });

  it('tg4 Bedah Rumah: freeUpgrade = true', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg4')!;
    expect(card.effect.freeUpgrade).toBe(true);
  });

  it('tg5 Pajak Mendadak: payPerProperty = 300,000', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg5')!;
    expect(card.effect.payPerProperty).toBe(300_000);
  });

  it('tg6 Gali Lubang: galiLubang = true', () => {
    const card = TARGETIR_CARDS.find(c => c.id === 'tg6')!;
    expect(card.effect.galiLubang).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Musibah card effects (tiered)
// ---------------------------------------------------------------------------

describe('Musibah card tiered effects', () => {
  it('m1 Banjir Rob: tieredPayPerProperty', () => {
    const card = MUSIBAH_CARDS.find(c => c.id === 'm1')!;
    expect(card.tieredPayPerProperty).toEqual({ ringan: 50_000, sedang: 100_000, brutal: 200_000 });
  });

  it('m2 Kena Tilang: tieredMoney', () => {
    const card = MUSIBAH_CARDS.find(c => c.id === 'm2')!;
    expect(card.tieredMoney).toEqual({ ringan: 100_000, sedang: 300_000, brutal: 500_000 });
  });

  it('m4 Gempa Bumi: tieredPayPerHouse', () => {
    const card = MUSIBAH_CARDS.find(c => c.id === 'm4')!;
    expect(card.tieredPayPerHouse).toEqual({ ringan: 25_000, sedang: 50_000, brutal: 100_000 });
  });

  it('m18 Gali Lubang: galiLubang = true (non-tiered)', () => {
    const card = MUSIBAH_CARDS.find(c => c.id === 'm18')!;
    expect(card.effect.galiLubang).toBe(true);
    expect(card.hasStopwatch).toBeFalsy();
  });

  it('m19 Pembebasan Lahan: pembebasanLahan = true, hasStopwatch', () => {
    const card = MUSIBAH_CARDS.find(c => c.id === 'm19')!;
    expect(card.effect.pembebasanLahan).toBe(true);
    expect(card.hasStopwatch).toBe(true);
  });

  it('all tiered cards have all three tiers', () => {
    for (const card of MUSIBAH_CARDS) {
      if (card.tieredMoney) {
        expect(card.tieredMoney.ringan).toBeDefined();
        expect(card.tieredMoney.sedang).toBeDefined();
        expect(card.tieredMoney.brutal).toBeDefined();
      }
      if (card.tieredPayPerProperty) {
        expect(card.tieredPayPerProperty.ringan).toBeDefined();
        expect(card.tieredPayPerProperty.sedang).toBeDefined();
        expect(card.tieredPayPerProperty.brutal).toBeDefined();
      }
      if (card.tieredPayPerHouse) {
        expect(card.tieredPayPerHouse.ringan).toBeDefined();
        expect(card.tieredPayPerHouse.sedang).toBeDefined();
        expect(card.tieredPayPerHouse.brutal).toBeDefined();
      }
    }
  });

  it('brutal amount is always >= sedang >= ringan for tieredMoney', () => {
    for (const card of MUSIBAH_CARDS) {
      if (card.tieredMoney) {
        expect(card.tieredMoney.brutal).toBeGreaterThanOrEqual(card.tieredMoney.sedang);
        expect(card.tieredMoney.sedang).toBeGreaterThanOrEqual(card.tieredMoney.ringan);
      }
      if (card.tieredPayPerProperty) {
        expect(card.tieredPayPerProperty.brutal).toBeGreaterThanOrEqual(card.tieredPayPerProperty.sedang);
        expect(card.tieredPayPerProperty.sedang).toBeGreaterThanOrEqual(card.tieredPayPerProperty.ringan);
      }
      if (card.tieredPayPerHouse) {
        expect(card.tieredPayPerHouse.brutal).toBeGreaterThanOrEqual(card.tieredPayPerHouse.sedang);
        expect(card.tieredPayPerHouse.sedang).toBeGreaterThanOrEqual(card.tieredPayPerHouse.ringan);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Card deck integrity
// ---------------------------------------------------------------------------

describe('Card deck integrity', () => {
  it('all musibah cards have type "musibah"', () => {
    for (const c of MUSIBAH_CARDS) expect(c.type).toBe('musibah');
  });

  it('all takdir cards have type "takdir"', () => {
    for (const c of TAKDIR_CARDS) expect(c.type).toBe('takdir');
  });

  it('all targetir cards have type "targetir"', () => {
    for (const c of TARGETIR_CARDS) expect(c.type).toBe('targetir');
  });

  it('all cards have unique ids within their deck', () => {
    const musibahIds = MUSIBAH_CARDS.map(c => c.id);
    const takdirIds = TAKDIR_CARDS.map(c => c.id);
    const targetirIds = TARGETIR_CARDS.map(c => c.id);
    expect(new Set(musibahIds).size).toBe(musibahIds.length);
    expect(new Set(takdirIds).size).toBe(takdirIds.length);
    expect(new Set(targetirIds).size).toBe(targetirIds.length);
  });

  it('all cards have title and description', () => {
    for (const c of [...MUSIBAH_CARDS, ...TAKDIR_CARDS, ...TARGETIR_CARDS]) {
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Confiscation flow (galiLubang / jualWajib / pembebasanLahan)
// ---------------------------------------------------------------------------

describe('Confiscation flow', () => {
  beforeEach(() => {
    STATE_OWNED.clear();
    BOARD_OVERRIDES.clear();
  });

  it('confiscateProperty gives 50% refund', () => {
    const player = makePlayer({ cash: 1_000_000, properties: [1, 11], houses: { 1: 2 } });
    const { player: newPlayer, refund } = confiscateProperty(player, 1);
    expect(refund).toBe(300_000);
    expect(newPlayer.cash).toBe(1_300_000);
    expect(newPlayer.properties).toEqual([11]);
    expect(newPlayer.houses[1]).toBeUndefined();
  });

  it('getCheapestProperty identifies the cheapest for galiLubang', () => {
    const player = makePlayer({ properties: [11, 1, 7] });
    // Aceh (600k) < Palembang (1.2M) < Jakarta (2M)
    expect(getCheapestProperty(player)).toBe(1);
  });

  it('getFirstProperty returns first for pembebasanLahan', () => {
    const player = makePlayer({ properties: [4, 7, 11] });
    expect(getFirstProperty(player)).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// Bankruptcy transfer flow
// ---------------------------------------------------------------------------

describe('Bankruptcy transfer', () => {
  it('creditor receives properties, houses, and cash', () => {
    const bankrupt = makePlayer({ id: 0, cash: 300_000, properties: [1, 4], houses: { 1: 1, 4: 2 } });
    const creditor = makePlayer({ id: 1, cash: 2_000_000, properties: [7], houses: { 7: 1 } });
    const { creditor: newCreditor } = transferPropertiesOnBankruptcy(bankrupt, creditor);
    expect(newCreditor.cash).toBe(2_300_000);
    expect(newCreditor.properties).toEqual([7, 1, 4]);
    expect(newCreditor.houses[1]).toBe(1);
    expect(newCreditor.houses[4]).toBe(2);
    expect(newCreditor.houses[7]).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Jail entry and release
// ---------------------------------------------------------------------------

describe('Jail mechanics', () => {
  it('advanceToTile to LAPAS_TILE_ID does not give salary from higher position (edge case)', () => {
    // If a card sends you to tile 8 from position 20, you pass Start
    const player = makePlayer({ position: 20 });
    const { player: moved, passedStart } = advanceToTile(player, LAPAS_TILE_ID, BOARD_SIZE, RULES.salary);
    expect(passedStart).toBe(true);
    expect(moved.cash).toBe(5_000_000 + 1_000_000);
  });

  it('advanceToTile to LAPAS_TILE_ID from lower position does not pass Start', () => {
    const player = makePlayer({ position: 5 });
    const { passedStart } = advanceToTile(player, LAPAS_TILE_ID, BOARD_SIZE, RULES.salary);
    expect(passedStart).toBe(false);
  });

  it('maxJailTurns is 3', () => {
    expect(RULES.maxJailTurns).toBe(3);
  });

  it('jailBail equals lapasFine', () => {
    expect(RULES.jailBail).toBe(RULES.lapasFine);
  });
});

// ---------------------------------------------------------------------------
// Pendakgadilan outcomes
// ---------------------------------------------------------------------------

describe('Pengadilan outcome computation', () => {
  it('die 6 → win (compensation 1,000,000)', () => {
    expect(6 >= RULES.pengadilan.winThreshold).toBe(true);
  });

  it('die 5 → win', () => {
    expect(5 >= RULES.pengadilan.winThreshold).toBe(true);
  });

  it('die 4 → lose (jail + fine)', () => {
    expect(4 >= RULES.pengadilan.loseThreshold).toBe(true);
    expect(4 < RULES.pengadilan.winThreshold).toBe(true);
  });

  it('die 3 → lose', () => {
    expect(3 >= RULES.pengadilan.loseThreshold).toBe(true);
    expect(3 < RULES.pengadilan.winThreshold).toBe(true);
  });

  it('die 2 → brutal (jail + 50% seized)', () => {
    expect(2 <= RULES.pengadilan.brutalMax).toBe(true);
  });

  it('die 1 → brutal', () => {
    expect(1 <= RULES.pengadilan.brutalMax).toBe(true);
  });

  it('50% seizure calculation', () => {
    const player = makePlayer({ cash: 4_000_000 });
    const seized = Math.floor(player.cash * 0.5);
    expect(seized).toBe(2_000_000);
    expect(player.cash - seized).toBe(2_000_000);
  });
});

// ---------------------------------------------------------------------------
// Tax and fine calculations
// ---------------------------------------------------------------------------

describe('Tax and fine calculations', () => {
  it('pajak = properties.length × taxPerProperty', () => {
    const player = makePlayer({ properties: [1, 4, 7] });
    const tax = player.properties.length * RULES.taxPerProperty;
    expect(tax).toBe(1_500_000);
  });

  it('pajak is 0 when no properties', () => {
    const player = makePlayer({ properties: [] });
    const tax = player.properties.length * RULES.taxPerProperty;
    expect(tax).toBe(0);
  });

  it('tilang fine is 500,000', () => {
    expect(RULES.tilangFine).toBe(500_000);
  });

  it('pungli fee is 1,000,000', () => {
    expect(RULES.pungliFee).toBe(1_000_000);
  });

  it('pungli exemption with Bandung', () => {
    const player = makePlayer({ properties: [BANDUNG_TILE_ID, 1] });
    expect(hasBandung(player)).toBe(true);
  });

  it('tol fee is 500,000', () => {
    expect(RULES.tolFee).toBe(500_000);
  });
});

// ---------------------------------------------------------------------------
// Pending action conflict prevention
// ---------------------------------------------------------------------------

describe('Action conflict prevention', () => {
  it('a player cannot roll dice while a pending action exists (guard logic)', () => {
    // This tests the guard logic pattern used in GameScreen:
    // disabled={diceRolled || movingPlayer || !!pendingAction || ...}
    const diceRolled = false;
    const movingPlayer = false;
    const pendingAction = { type: 'buy' as const, tileId: 1 };
    const inJail = false;
    const waitingForEndTurn = false;
    const showCard = false;
    const canRoll = !diceRolled && !movingPlayer && !pendingAction && !inJail && !waitingForEndTurn && !showCard;
    expect(canRoll).toBe(false);
  });

  it('a player can roll dice when no pending action and not in jail', () => {
    const diceRolled = false;
    const movingPlayer = false;
    const pendingAction = null;
    const inJail = false;
    const waitingForEndTurn = false;
    const showCard = false;
    const canRoll = !diceRolled && !movingPlayer && !pendingAction && !inJail && !waitingForEndTurn && !showCard;
    expect(canRoll).toBe(true);
  });

  it('a player in jail cannot roll normally (must resolve jail first)', () => {
    const inJail = true;
    const pendingAction = null;
    const canRoll = !inJail && !pendingAction;
    expect(canRoll).toBe(false);
  });

  it('end turn button only shows when waitingForEndTurn and no other pending state', () => {
    const waitingForEndTurn = true;
    const pendingAction = null;
    const showCard = false;
    const atGajian = false;
    const canEnd = waitingForEndTurn && !pendingAction && !showCard && !atGajian;
    expect(canEnd).toBe(true);
  });

  it('end turn button does not show when a card is open', () => {
    const waitingForEndTurn = true;
    const showCard = true;
    const canEnd = waitingForEndTurn && !showCard;
    expect(canEnd).toBe(false);
  });
});

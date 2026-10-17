export type TileType =
  | 'start'
  | 'property'
  | 'musibah'
  | 'takdir'
  | 'targetir'
  | 'lapas'
  | 'pajak'
  | 'pengadilan'
  | 'pungli'
  | 'tol'
  | 'tilang';

export type Island = 'Sumatera' | 'Jawa' | 'Kalimantan' | 'Sulawesi' | 'Papua';

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  island?: Island;
  price?: number;
  rent?: number;
  rentSubsidi1?: number;
  rentSubsidi2?: number;
  rentOKB?: number;
  housePrice?: number;
  okbPrice?: number;
  isTol?: boolean;
}

export type HouseLevel = 0 | 1 | 2 | 3;
// 0 = tanah kosong, 1 = 1 Rumah Subsidi, 2 = 2 Rumah Subsidi, 3 = Rumah OKB

export interface Player {
  id: number;
  name: string;
  color: string;
  emoji: string;
  cash: number;
  position: number;
  properties: number[];
  houses: Record<number, HouseLevel>;
  inJail: boolean;
  jailTurns: number;
  getOutCards: number;
  isBankrupt: boolean;
  turnsPlayed: number;
  protectionCards: number;
  pendingGajian: boolean;
  consecutiveDoubles: number;
}

export type CardType = 'musibah' | 'takdir' | 'targetir';

export type MusibahTier = 'ringan' | 'sedang' | 'brutal';

export interface MusibahEffect {
  ringan: number;
  sedang: number;
  brutal: number;
}

export interface GameCard {
  id: string;
  title: string;
  description: string;
  type: CardType;
  effect: CardEffect;
  hasStopwatch?: boolean;
  affectsAllPlayers?: boolean;
  // For musibah cards with tiered effects
  tieredMoney?: MusibahEffect;
  tieredPayPerProperty?: MusibahEffect;
  tieredPayPerHouse?: MusibahEffect;
}

export interface CardEffect {
  money?: number;
  moveTo?: number;
  goToJail?: boolean;
  getOutCard?: boolean;
  payPerProperty?: number;
  payPerHouse?: number;
  collectPerPlayer?: number;
  payPerPlayer?: number;
  rollDice?: boolean;
  evenReward?: number;
  oddPenalty?: number;
  freeProperty?: boolean;
  protection?: boolean;
  freeUpgrade?: boolean;
  pembebasanLahan?: boolean;
  gubernurFoya?: boolean;
  galiLubang?: boolean;
  jualWajib?: boolean;
}

export interface PendingAction {
  type: 'buy' | 'jail' | 'pengadilan' | 'pungli' | 'card-dice' | 'musibah-roll' | 'free-property' | 'free-upgrade' | 'pembebasan' | 'jual-wajib' | 'gajian-build' | 'tol-choose' | 'sell';
  tileId?: number;
  card?: GameCard;
  diceValue?: number;
  message?: string;
  amount?: number;
  tolDestinations?: number[];
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'money' | 'bad' | 'good' | 'move' | 'card';
}

export interface Transaction {
  id: number;
  amount: number;
  sender: string;
  receiver: string;
  reason: string;
  turn: number;
}

export interface DiceRoll {
  values: [number, number];
  isDoubles: boolean;
  total: number;
}

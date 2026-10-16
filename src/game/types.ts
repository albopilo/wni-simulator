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
  tilangTickets: number;
  protectionCards: number;
  pendingGajian: boolean;
}

export type CardType = 'musibah' | 'takdir' | 'targetir';

export interface GameCard {
  id: string;
  title: string;
  description: string;
  type: CardType;
  effect: CardEffect;
  hasStopwatch?: boolean;
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
  tilang?: boolean;
  freeProperty?: boolean;
  protection?: boolean;
  freeUpgrade?: boolean;
  pembebasanLahan?: boolean;
  gubernurFoya?: boolean;
  galiLubang?: boolean;
  jualWajib?: boolean;
  periksaTilang?: boolean;
}

export interface PendingAction {
  type: 'buy' | 'jail' | 'tilang' | 'pengadilan' | 'pungli' | 'card-dice' | 'free-property' | 'free-upgrade' | 'pembebasan' | 'jual-wajib' | 'sita-negara' | 'gajian-build';
  tileId?: number;
  card?: GameCard;
  diceValue?: number;
  message?: string;
  amount?: number;
}

export interface LogEntry {
  id: number;
  text: string;
  type: 'info' | 'money' | 'bad' | 'good' | 'move' | 'card';
}

export interface DiceRoll {
  values: [number, number];
  isDoubles: boolean;
  total: number;
}

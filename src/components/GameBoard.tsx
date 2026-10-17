import type { Player, Tile, HouseLevel } from '@/game/types';
import { BOARD, formatMoneyFull } from '@/game/boardData';
import { propertyOwner, isStateOwned } from '@/game/gameLogic';
import { Dices } from 'lucide-react';

interface GameBoardProps {
  players: Player[];
  currentPlayerId: number;
  stateOwnedTiles?: number[];
  boardTiles?: Tile[];
  turn?: number;
  diceValues?: [number, number];
  diceRolled?: boolean;
  currentPlayerObj?: Player;
  onTileClick?: (tile: Tile) => void;
}

const ISLAND_COLORS: Record<string, string> = {
  Sumatera: 'bg-forest-600',
  Jawa: 'bg-navy-600',
  Kalimantan: 'bg-gold-500',
  Sulawesi: 'bg-rust-500',
  Papua: 'bg-teal-600',
};

const TILE_ICON: Record<string, string> = {
  musibah: '⚠',
  takdir: '✦',
  targetir: '◎',
  lapas: '🔒',
  pajak: '§',
  pengadilan: '⚖',
  pungli: '$',
  tilang: '✕',
  tol: '≡',
};

function HouseIndicator({ level }: { level: HouseLevel }) {
  if (level === 0) return null;
  if (level === 3) {
    return (
      <div className="absolute bottom-0.5 left-1 flex items-center gap-0.5">
        <div className="w-1.5 h-1.5 bg-rust-400 rounded-sm shadow-sm" />
        <span className="text-[5px] text-rust-300 font-bold">OKB</span>
      </div>
    );
  }
  return (
    <div className="absolute bottom-0.5 left-1 flex gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <div key={i} className="w-1 h-1 bg-forest-400 rounded-sm shadow-sm" />
      ))}
    </div>
  );
}

function TileBg({ tile }: { tile: Tile }) {
  const bgMap: Record<string, string> = {
    start: 'bg-gradient-to-br from-gold-400 to-rust-600',
    musibah: 'bg-gradient-to-br from-rust-700 to-rust-900',
    takdir: 'bg-gradient-to-br from-navy-600 to-navy-900',
    targetir: 'bg-gradient-to-br from-rust-600 to-navy-800',
    lapas: 'bg-gradient-to-br from-rust-500 to-gold-700',
    pajak: 'bg-gradient-to-br from-teal-600 to-navy-800',
    pengadilan: 'bg-gradient-to-br from-navy-600 to-navy-900',
    pungli: 'bg-gradient-to-br from-gold-500 to-gold-700',
    tol: 'bg-gradient-to-br from-navy-400 to-navy-700',
    tilang: 'bg-gradient-to-br from-gold-500 to-gold-600',
  };
  if (tile.type === 'property') {
    return <div className="absolute inset-0 bg-paper-300" />;
  }
  return <div className={`absolute inset-0 ${bgMap[tile.type] || ''}`} />;
}

function TileView({
  tile, playersHere, owner, houseLevel, isCurrent, stateOwned, onClick,
}: {
  tile: Tile;
  playersHere: Player[];
  owner?: Player | null;
  houseLevel: HouseLevel;
  isCurrent: boolean;
  stateOwned: boolean;
  onClick?: () => void;
}) {
  const isSpecial = tile.type !== 'property' && tile.type !== 'start';

  return (
    <div
      onClick={onClick}
      className={`relative rounded-lg overflow-hidden transition-all duration-300 w-full h-full ${
        isCurrent ? 'ring-2 ring-gold-400 shadow-lg shadow-gold-500/30 z-10 scale-105' : ''
      } ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-gold-400/40' : ''}`}
    >
      {stateOwned ? (
        <div className="absolute inset-0 bg-navy-800" />
      ) : (
        <TileBg tile={tile} />
      )}

      {tile.island && (
        <div className="absolute top-0 left-0 right-0 h-1 ${ISLAND_COLORS[tile.island] || ''}" />
      )}

      {stateOwned && (
        <div className="absolute top-0 right-0 bg-rust-600 text-white text-[5px] font-bold px-0.5 py-0.5 rounded-bl leading-none">
          NEGARA
        </div>
      )}

      {owner && !stateOwned && (
        <div className="absolute top-0 right-0 w-3 h-3 rounded-bl-lg" style={{ backgroundColor: owner.color }} />
      )}

      {isSpecial && TILE_ICON[tile.type] && (
        <div className="absolute top-1 right-1 text-white/30 text-[10px] font-bold">
          {TILE_ICON[tile.type]}
        </div>
      )}

      <HouseIndicator level={houseLevel} />

      <div className="px-0.5 pt-1.5 pb-0.5 relative">
        <p className={`text-[6px] sm:text-[7px] font-bold text-center leading-tight line-clamp-2 ${
          tile.type === 'start' ? 'text-white' : tile.type === 'property' && !stateOwned ? 'text-navy-800' : 'text-white'
        }`}>
          {tile.name}
        </p>
        {tile.price && !stateOwned && (
          <p className="text-[5px] text-gold-700 text-center mt-0.5 font-medium">
            {(tile.price / 1_000_000).toFixed(1)}jt
          </p>
        )}
        {stateOwned && (
          <p className="text-[5px] text-paper-500 text-center mt-0.5">—</p>
        )}
      </div>

      {playersHere.length > 0 && (
        <div className="absolute bottom-0.5 right-0.5 flex flex-wrap gap-0.5 max-w-[60%] justify-end">
          {playersHere.map(p => (
            <div
              key={p.id}
              className="w-2.5 h-2.5 rounded-full flex items-center justify-center text-[6px] border border-white/30 shadow-sm"
              style={{ backgroundColor: p.color }}
            >
              {p.emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CenterPanel({
  players, currentPlayerId, turn, diceValues, diceRolled, currentPlayerObj,
}: {
  players: Player[];
  currentPlayerId: number;
  turn: number;
  diceValues?: [number, number];
  diceRolled?: boolean;
  currentPlayerObj?: Player;
}) {
  const cp = currentPlayerObj || players[currentPlayerId];
  if (!cp) return null;

  const activeCount = players.filter(p => !p.isBankrupt).length;

  return (
    <div className="text-center px-2 py-1">
      <div className="inline-flex items-center gap-2 mb-1">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
          style={{ backgroundColor: cp.color + '30', border: `2px solid ${cp.color}` }}
        >
          {cp.emoji}
        </div>
      </div>
      <div className="text-navy-800 font-bold text-xs sm:text-sm truncate max-w-[120px] mx-auto">{cp.name}</div>
      <div className="text-gold-600 font-bold text-xs sm:text-sm">{formatMoneyFull(cp.cash)}</div>

      {diceValues && diceRolled && (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <Dices className="w-3 h-3 text-navy-500" />
          <span className="text-navy-700 text-xs font-bold">
            {diceValues[0]} + {diceValues[1]} = {diceValues[0] + diceValues[1]}
          </span>
          {diceValues[0] === diceValues[1] && (
            <span className="text-rust-500 text-[10px] font-bold">DBL</span>
          )}
        </div>
      )}

      <div className="text-navy-500 text-[8px] sm:text-[9px] mt-1">
        Putaran {turn} • {activeCount} pemain aktif
      </div>
      {cp.inJail && (
        <div className="inline-flex items-center gap-1 text-rust-600 text-[8px] font-bold mt-1 bg-rust-500/15 px-1.5 py-0.5 rounded">
          🔒 Lapas {cp.jailTurns}/3
        </div>
      )}
    </div>
  );
}

// Pentagon geometry: 5 vertices of a regular pentagon
// Center at (50%, 50%), radius 48% (percentage of container)
// Top vertex at 12 o'clock, going clockwise
const PENTAGON_CX = 50;
const PENTAGON_CY = 51;
const PENTAGON_R = 48;

const PENTAGON_VERTICES = [
  { x: PENTAGON_CX, y: PENTAGON_CY - PENTAGON_R }, // top
  { x: PENTAGON_CX + PENTAGON_R * Math.sin((2 * Math.PI) / 5), y: PENTAGON_CY - PENTAGON_R * Math.cos((2 * Math.PI) / 5) }, // upper right
  { x: PENTAGON_CX + PENTAGON_R * Math.sin((4 * Math.PI) / 5), y: PENTAGON_CY - PENTAGON_R * Math.cos((4 * Math.PI) / 5) }, // lower right
  { x: PENTAGON_CX + PENTAGON_R * Math.sin((6 * Math.PI) / 5), y: PENTAGON_CY - PENTAGON_R * Math.cos((6 * Math.PI) / 5) }, // lower left
  { x: PENTAGON_CX + PENTAGON_R * Math.sin((8 * Math.PI) / 5), y: PENTAGON_CY - PENTAGON_R * Math.cos((8 * Math.PI) / 5) }, // upper left
];

// Distribute tiles along the 5 edges of the pentagon
// 32 tiles, 5 edges → tiles per edge with vertices shared
// Edge 0: vertex0 → vertex1 (includes vertex0, excludes vertex1)
// We distribute tiles evenly along each edge
function getTilePosition(index: number, totalTiles: number): { left: string; top: string } {
  const tilesPerEdge = totalTiles / 5;
  const edgeIndex = Math.floor(index / tilesPerEdge);
  const posInEdge = (index % tilesPerEdge) / tilesPerEdge;

  const v0 = PENTAGON_VERTICES[edgeIndex];
  const v1 = PENTAGON_VERTICES[(edgeIndex + 1) % 5];

  const x = v0.x + (v1.x - v0.x) * posInEdge;
  const y = v0.y + (v1.y - v0.y) * posInEdge;

  return { left: `${x}%`, top: `${y}%` };
}

export default function GameBoard({
  players, currentPlayerId, stateOwnedTiles = [], boardTiles, turn = 1, diceValues, diceRolled, currentPlayerObj, onTileClick,
}: GameBoardProps) {
  const tiles = boardTiles || BOARD;
  const currentPlayer = players[currentPlayerId];
  const totalTiles = tiles.length;

  return (
    <div className="rounded-2xl p-2 sm:p-3 border border-paper-300 bg-gradient-to-br from-paper-50 to-paper-200 shadow-md">
      <div className="relative w-full" style={{ aspectRatio: '1 / 1' }}>
        {/* Pentagon outline */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={PENTAGON_VERTICES.map(v => `${v.x},${v.y}`).join(' ')}
            fill="rgba(255,255,255,0.4)"
            stroke="rgba(180,160,120,0.3)"
            strokeWidth="0.3"
          />
        </svg>

        {/* Center panel */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[34%] h-[34%] bg-gradient-to-br from-paper-100 to-paper-200 rounded-2xl border border-paper-300 flex flex-col items-center justify-center p-1.5 shadow-inner">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rust-500 to-gold-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-[10px]">WNI</span>
              </div>
            </div>
            <div className="text-gold-600 font-black text-sm sm:text-base leading-tight">WNI</div>
            <div className="text-rust-500 font-black text-xs sm:text-sm">SIMULATOR</div>
            <CenterPanel
              players={players}
              currentPlayerId={currentPlayerId}
              turn={turn}
              diceValues={diceValues}
              diceRolled={diceRolled}
              currentPlayerObj={currentPlayerObj}
            />
          </div>
        </div>

        {/* Tiles positioned along pentagon edges */}
        {tiles.map((tile, index) => {
          const pos = getTilePosition(index, totalTiles);
          const playersHere = players.filter(p => p.position === tile.id && !p.isBankrupt);
          const owner = propertyOwner(players, tile.id);
          const houseLevel = (owner?.houses[tile.id] || 0) as HouseLevel;
          const owned = isStateOwned(tile.id) || stateOwnedTiles.includes(tile.id);

          return (
            <div
              key={tile.id}
              className="absolute"
              style={{
                left: pos.left,
                top: pos.top,
                width: '7.5%',
                height: '7.5%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <TileView
                tile={tile}
                playersHere={playersHere}
                owner={owner}
                houseLevel={houseLevel}
                isCurrent={currentPlayer?.position === tile.id}
                stateOwned={owned}
                onClick={onTileClick ? () => onTileClick(tile) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

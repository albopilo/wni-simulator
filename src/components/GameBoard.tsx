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
  Sumatera: 'bg-emerald-600',
  Jawa: 'bg-blue-700',
  Kalimantan: 'bg-amber-600',
  Sulawesi: 'bg-rose-600',
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
        <div className="w-2 h-2 bg-red-400 rounded-sm shadow-sm" />
        <span className="text-[7px] text-red-300 font-bold">OKB</span>
      </div>
    );
  }
  return (
    <div className="absolute bottom-0.5 left-1 flex gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 bg-emerald-400 rounded-sm shadow-sm" />
      ))}
    </div>
  );
}

function TileBg({ tile }: { tile: Tile }) {
  const bgMap: Record<string, string> = {
    start: 'bg-gradient-to-br from-amber-500 to-orange-700',
    musibah: 'bg-gradient-to-br from-red-800 to-red-950',
    takdir: 'bg-gradient-to-br from-blue-800 to-blue-950',
    targetir: 'bg-gradient-to-br from-rose-800 to-stone-900',
    lapas: 'bg-gradient-to-br from-orange-700 to-amber-900',
    pajak: 'bg-gradient-to-br from-teal-700 to-cyan-900',
    pengadilan: 'bg-gradient-to-br from-indigo-700 to-indigo-950',
    pungli: 'bg-gradient-to-br from-yellow-600 to-amber-800',
    tol: 'bg-gradient-to-br from-cyan-600 to-cyan-900',
    tilang: 'bg-gradient-to-br from-yellow-600 to-amber-700',
  };
  if (tile.type === 'property') {
    return <div className="absolute inset-0 bg-stone-700" />;
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
      className={`relative rounded-lg overflow-hidden transition-all duration-300 ${
        isCurrent ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/30 z-10 scale-105' : ''
      } ${onClick ? 'cursor-pointer hover:ring-1 hover:ring-amber-400/40' : ''}`}
      style={{ minHeight: '64px' }}
    >
      {stateOwned ? (
        <div className="absolute inset-0 bg-stone-800" />
      ) : (
        <TileBg tile={tile} />
      )}

      {tile.island && (
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${ISLAND_COLORS[tile.island] || ''}`} />
      )}

      {stateOwned && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[6px] font-bold px-1 py-0.5 rounded-bl leading-none">
          NEGARA
        </div>
      )}

      {owner && !stateOwned && (
        <div className="absolute top-0 right-0 w-4 h-4 rounded-bl-lg" style={{ backgroundColor: owner.color }} />
      )}

      {isSpecial && TILE_ICON[tile.type] && (
        <div className="absolute top-2 right-1.5 text-white/30 text-xs font-bold">
          {TILE_ICON[tile.type]}
        </div>
      )}

      <HouseIndicator level={houseLevel} />

      <div className="px-1 pt-2.5 pb-1 relative">
        <p className={`text-[8px] sm:text-[9px] font-bold text-center leading-tight line-clamp-2 ${
          tile.type === 'start' ? 'text-white' : tile.type === 'property' && !stateOwned ? 'text-stone-200' : 'text-white'
        }`}>
          {tile.name}
        </p>
        {tile.price && !stateOwned && (
          <p className="text-[7px] text-amber-300/80 text-center mt-0.5 font-medium">
            {(tile.price / 1_000_000).toFixed(1)}jt
          </p>
        )}
        {stateOwned && (
          <p className="text-[7px] text-stone-500 text-center mt-0.5">—</p>
        )}
      </div>

      {playersHere.length > 0 && (
        <div className="absolute bottom-0.5 right-1 flex flex-wrap gap-0.5 max-w-[60%] justify-end">
          {playersHere.map(p => (
            <div
              key={p.id}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white/30 shadow-sm"
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
      <div className="text-stone-100 font-bold text-xs sm:text-sm truncate max-w-[120px] mx-auto">{cp.name}</div>
      <div className="text-amber-400 font-bold text-xs sm:text-sm">{formatMoneyFull(cp.cash)}</div>

      {diceValues && diceRolled && (
        <div className="flex items-center justify-center gap-1 mt-1.5">
          <Dices className="w-3 h-3 text-stone-500" />
          <span className="text-stone-300 text-xs font-bold">
            {diceValues[0]} + {diceValues[1]} = {diceValues[0] + diceValues[1]}
          </span>
          {diceValues[0] === diceValues[1] && (
            <span className="text-orange-400 text-[10px] font-bold">DBL</span>
          )}
        </div>
      )}

      <div className="text-stone-600 text-[8px] sm:text-[9px] mt-1">
        Putaran {turn} • {activeCount} pemain aktif
      </div>
      {cp.inJail && (
        <div className="inline-flex items-center gap-1 text-orange-400 text-[8px] font-bold mt-1 bg-orange-500/10 px-1.5 py-0.5 rounded">
          🔒 Lapas {cp.jailTurns}/3
        </div>
      )}
    </div>
  );
}

export default function GameBoard({
  players, currentPlayerId, stateOwnedTiles = [], boardTiles, turn = 1, diceValues, diceRolled, currentPlayerObj, onTileClick,
}: GameBoardProps) {
  const tiles = boardTiles || BOARD;
  const gridSize = 9;
  const grid: (Tile | null)[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  );

  for (let i = 0; i <= 8; i++) grid[8][i] = tiles[i];
  for (let i = 0; i <= 6; i++) grid[7 - i][8] = tiles[9 + i];
  for (let i = 0; i <= 8; i++) grid[0][8 - i] = tiles[16 + i];
  for (let i = 0; i <= 6; i++) grid[1 + i][0] = tiles[25 + i];

  const currentPlayer = players[currentPlayerId];

  return (
    <div className="rounded-2xl p-2 sm:p-3 border border-stone-700/60 bg-gradient-to-br from-stone-900/80 to-stone-950/80">
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {grid.map((row, rowIdx) =>
          row.map((tile, colIdx) => {
            if (!tile) {
              const isCenter = rowIdx >= 2 && rowIdx <= 6 && colIdx >= 2 && colIdx <= 6;
              if (isCenter) {
                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className="flex items-center justify-center"
                    style={{
                      gridRow: `${2} / ${7}`,
                      gridColumn: `${2} / ${7}`,
                    }}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-stone-800/60 to-stone-900/60 rounded-xl border border-stone-700/40 flex flex-col items-center justify-center p-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-black text-[10px]">WNI</span>
                        </div>
                      </div>
                      <div className="text-amber-500 font-black text-sm sm:text-base leading-tight">WNI</div>
                      <div className="text-orange-400 font-black text-xs sm:text-sm">SIMULATOR</div>
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
                );
              }
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}
                />
              );
            }

            const playersHere = players.filter(p => p.position === tile.id && !p.isBankrupt);
            const owner = propertyOwner(players, tile.id);
            const houseLevel = (owner?.houses[tile.id] || 0) as HouseLevel;
            const owned = isStateOwned(tile.id) || stateOwnedTiles.includes(tile.id);

            return (
              <div key={tile.id} style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}>
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
          })
        )}
      </div>
    </div>
  );
}

import type { Player, Tile, HouseLevel } from '@/game/types';
import { BOARD, BOARD_SIZE } from '@/game/boardData';
import { propertyOwner, isStateOwned } from '@/game/gameLogic';

interface GameBoardProps {
  players: Player[];
  currentPlayerId: number;
  stateOwnedTiles?: number[];
}

const TILE_COLORS: Record<string, string> = {
  start: 'bg-gradient-to-br from-amber-500 to-orange-600',
  property: 'bg-slate-700',
  musibah: 'bg-gradient-to-br from-red-600 to-red-800',
  takdir: 'bg-gradient-to-br from-blue-600 to-blue-800',
  targetir: 'bg-gradient-to-br from-fuchsia-700 to-purple-900',
  lapas: 'bg-gradient-to-br from-orange-600 to-amber-800',
  pajak: 'bg-gradient-to-br from-teal-600 to-cyan-800',
  pengadilan: 'bg-gradient-to-br from-indigo-600 to-indigo-800',
  pungli: 'bg-gradient-to-br from-yellow-600 to-amber-700',
  tol: 'bg-gradient-to-br from-cyan-600 to-cyan-800',
  tilang: 'bg-gradient-to-br from-yellow-500 to-amber-600',
};

const ISLAND_COLORS: Record<string, string> = {
  Sumatera: 'bg-green-500',
  Jawa: 'bg-blue-500',
  Kalimantan: 'bg-amber-500',
  Sulawesi: 'bg-rose-500',
  Papua: 'bg-emerald-500',
};

function HouseIndicator({ level }: { level: HouseLevel }) {
  if (level === 0) return null;
  if (level === 3) {
    return (
      <div className="absolute bottom-0.5 left-1 flex items-center gap-0.5">
        <div className="w-2 h-2 bg-red-400 rounded-sm" />
        <span className="text-[7px] text-red-300 font-bold">OKB</span>
      </div>
    );
  }
  return (
    <div className="absolute bottom-0.5 left-1 flex gap-0.5">
      {Array.from({ length: level }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 bg-green-400 rounded-sm" />
      ))}
    </div>
  );
}

function TileView({
  tile, playersHere, owner, houseLevel, isCurrent, stateOwned,
}: {
  tile: Tile;
  playersHere: Player[];
  owner?: Player | null;
  houseLevel: HouseLevel;
  isCurrent: boolean;
  stateOwned: boolean;
}) {
  return (
    <div
      className={`relative rounded-lg ${TILE_COLORS[tile.type] || 'bg-slate-700'} ${
        isCurrent ? 'ring-2 ring-amber-400 shadow-lg shadow-amber-500/30 z-10' : ''
      } transition-all duration-300 overflow-hidden`}
      style={{ minHeight: '70px' }}
    >
      {tile.island && (
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${ISLAND_COLORS[tile.island] || ''}`} />
      )}

      {stateOwned && (
        <div className="absolute top-0 right-0 bg-red-600 text-white text-[6px] font-bold px-1 py-0.5 rounded-bl">
          NEGARA
        </div>
      )}

      {owner && !stateOwned && (
        <div className="absolute top-0 right-0 w-4 h-4 rounded-bl-lg" style={{ backgroundColor: owner.color }} />
      )}

      <HouseIndicator level={houseLevel} />

      <div className="px-1 pt-2.5 pb-1">
        <p className="text-[8px] sm:text-[9px] font-bold text-white text-center leading-tight line-clamp-2">
          {tile.name}
        </p>
        {tile.price && !stateOwned && (
          <p className="text-[7px] text-slate-300 text-center mt-0.5">
            {(tile.price / 1_000_000).toFixed(1)}jt
          </p>
        )}
      </div>

      {playersHere.length > 0 && (
        <div className="absolute bottom-0.5 right-1 flex flex-wrap gap-0.5 max-w-[60%] justify-end">
          {playersHere.map(p => (
            <div
              key={p.id}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] border border-white/30"
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

export default function GameBoard({ players, currentPlayerId, stateOwnedTiles = [] }: GameBoardProps) {
  const gridSize = 9;
  const grid: (Tile | null)[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => null)
  );

  for (let i = 0; i <= 8; i++) grid[8][i] = BOARD[i];
  for (let i = 0; i <= 6; i++) grid[7 - i][8] = BOARD[9 + i];
  for (let i = 0; i <= 8; i++) grid[0][8 - i] = BOARD[16 + i];
  for (let i = 0; i <= 6; i++) grid[1 + i][0] = BOARD[25 + i];

  const currentPlayer = players[currentPlayerId];

  return (
    <div className="bg-slate-900/60 rounded-2xl p-2 sm:p-4 border border-slate-700">
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
              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className="flex items-center justify-center"
                  style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}
                >
                  {rowIdx === 4 && colIdx === 4 && (
                    <div className="text-center">
                      <div className="text-amber-400 font-black text-lg sm:text-2xl leading-tight">WNI</div>
                      <div className="text-orange-400 font-black text-sm sm:text-lg">SIMULATOR</div>
                      <div className="text-slate-500 text-[8px] sm:text-xs mt-1">
                        Putaran {Math.floor(currentPlayer?.turnsPlayed || 0) + 1}
                      </div>
                    </div>
                  )}
                </div>
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
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export { BOARD_SIZE };

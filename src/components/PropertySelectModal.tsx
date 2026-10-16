import type { Player, HouseLevel } from '@/game/types';
import { BOARD } from '@/game/boardData';
import { propertyOwner, houseLevelName, canBuildHouse, getBuildCost } from '@/game/gameLogic';
import { formatMoneyFull } from '@/game/boardData';
import { Building2, CheckCircle2 } from 'lucide-react';

interface PropertySelectModalProps {
  players: Player[];
  onSelect: (tileId: number) => void;
  title: string;
  description: string;
  mode: 'free' | 'build' | 'upgrade';
  currentPlayer: Player;
  onDone?: () => void;
}

export default function PropertySelectModal({
  players, onSelect, title, description, mode, currentPlayer, onDone,
}: PropertySelectModalProps) {
  const availableProperties = BOARD.filter(t => {
    if (t.type !== 'property') return false;
    if (mode === 'free') {
      return !propertyOwner(players, t.id);
    }
    if (mode === 'build') {
      return currentPlayer.properties.includes(t.id) && canBuildHouse(currentPlayer, t.id);
    }
    if (mode === 'upgrade') {
      const owns = currentPlayer.properties.includes(t.id);
      const level = currentPlayer.houses[t.id] || 0;
      return owns && level >= 0 && level <= 2;
    }
    return false;
  });

  const allProps = currentPlayer.properties;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="max-w-md w-full max-h-[80vh] overflow-hidden rounded-3xl shadow-2xl border border-stone-700 bg-gradient-to-br from-stone-800 to-stone-900 flex flex-col animate-[slideUp_0.3s_ease]">
        <div className="p-5 border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-stone-100 font-bold text-lg">{title}</h2>
              <p className="text-stone-400 text-xs">{description}</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-2">
          {mode === 'build' && allProps.length > 0 && (
            <div className="bg-stone-700/20 rounded-xl p-2 mb-2">
              <p className="text-stone-500 text-[10px] text-center">
                Kamu bisa bangun di beberapa tanah sekaligus. Klik tanah untuk bangun, lalu klik "Selesai" untuk lanjut.
              </p>
            </div>
          )}
          {availableProperties.length === 0 && allProps.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-8">
              {mode === 'free' ? 'Tidak ada tanah kosong.' : mode === 'upgrade' ? 'Tidak ada tanah yang bisa di-upgrade.' : 'Kamu belum punya tanah.'}
            </p>
          ) : mode === 'build' && availableProperties.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-8">
              Semua tanah sudah maksimal atau uang kurang.
            </p>
          ) : (
            availableProperties.map(tile => {
              const level = (currentPlayer.houses[tile.id] || 0) as HouseLevel;
              const isUpgradeToOKB = mode === 'build' && level === 2;
              const cost = mode === 'build' ? getBuildCost(currentPlayer, tile.id) : 0;
              return (
                <button
                  key={tile.id}
                  onClick={() => onSelect(tile.id)}
                  className="w-full flex items-center gap-3 bg-stone-700/40 hover:bg-stone-700/70 rounded-xl p-3 transition-colors text-left"
                >
                  <div className="flex-1">
                    <p className="text-stone-100 font-semibold text-sm">{tile.name}</p>
                    <p className="text-stone-500 text-xs">
                      {tile.island}
                      {level > 0 && ` • ${houseLevelName(level)}`}
                    </p>
                  </div>
                  {mode === 'free' ? (
                    <span className="text-emerald-400 text-sm font-bold">Gratis</span>
                  ) : mode === 'upgrade' ? (
                    <span className="text-emerald-400 text-sm font-bold">
                      {level === 0 ? '+ Rumah Subsidi' : 'Gratis OKB!'}
                    </span>
                  ) : isUpgradeToOKB ? (
                    <div className="text-right">
                      <p className="text-red-400 text-sm font-bold">{formatMoneyFull(cost)}</p>
                      <p className="text-red-300 text-[10px]">→ OKB</p>
                    </div>
                  ) : (
                    <div className="text-right">
                      <p className="text-amber-400 text-sm font-bold">{formatMoneyFull(cost)}</p>
                      {level === 0 && <p className="text-emerald-300 text-[10px]">→ 1 RS</p>}
                      {level === 1 && <p className="text-emerald-300 text-[10px]">→ 2 RS</p>}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-stone-700">
          {mode === 'build' && onDone ? (
            <button
              onClick={onDone}
              className="w-full py-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selesai Bangun
            </button>
          ) : (
            <button
              onClick={() => onSelect(-1)}
              className="w-full py-2.5 rounded-xl bg-stone-700 text-stone-300 font-bold text-sm hover:bg-stone-600 transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

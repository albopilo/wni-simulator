import type { Player } from '@/game/types';
import { formatMoneyFull } from '@/game/boardData';
import { calculateNetWorth } from '@/game/gameLogic';
import { Trophy, RotateCcw, Landmark } from 'lucide-react';

interface GameOverScreenProps {
  players: Player[];
  negaraCash: number;
  onRestart: () => void;
}

export default function GameOverScreen({ players, negaraCash, onRestart }: GameOverScreenProps) {
  const sorted = [...players].sort((a, b) => calculateNetWorth(b) - calculateNetWorth(a));
  const activePlayers = sorted.filter(p => !p.isBankrupt);
  const winner = activePlayers[0] || sorted[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 items-center justify-center shadow-2xl shadow-amber-500/30 mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2">Game Over!</h1>
          <p className="text-slate-400">
            {activePlayers.length === 0
              ? 'Semua WNI bangkrut! Negara menang!'
              : `${winner.emoji} ${winner.name} bertahan sebagai WNI terbaik!`}
          </p>
        </div>

        {/* Negara score */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="text-slate-300 font-bold text-sm">Negara / Pemerintah</p>
            <p className="text-slate-500 text-xs">Pemenang sejati</p>
          </div>
          <span className="text-slate-300 font-bold text-sm">{formatMoneyFull(negaraCash)}</span>
        </div>

        <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 space-y-3 mb-6">
          {sorted.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                idx === 0 && !player.isBankrupt ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : 'bg-slate-700/30'
              } ${player.isBankrupt ? 'opacity-40' : ''}`}
            >
              <span className="text-slate-500 font-bold text-lg w-6">#{idx + 1}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: player.color + '30', border: `2px solid ${player.color}` }}
              >
                {player.emoji}
              </div>
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{player.name}</p>
                <p className="text-slate-500 text-xs">
                  {player.properties.length} properti {player.isBankrupt ? '• Bangkrut' : ''}
                </p>
              </div>
              <span className="text-amber-400 font-bold text-sm">
                {formatMoneyFull(calculateNetWorth(player))}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-orange-500/30"
        >
          <RotateCcw className="w-5 h-5" />
          Main Lagi
        </button>
      </div>
    </div>
  );
}

import type { Player } from '@/game/types';
import { calculateNetWorth } from '@/game/gameLogic';
import { formatMoneyFull } from '@/game/boardData';
import { Wallet, Home, KeyRound, Lock, Shield } from 'lucide-react';

interface PlayerPanelProps {
  players: Player[];
  currentPlayerId: number;
}

export default function PlayerPanel({ players, currentPlayerId }: PlayerPanelProps) {
  return (
    <div className="space-y-2">
      {players.map(player => {
        const isCurrent = player.id === currentPlayerId;
        const netWorth = calculateNetWorth(player);
        return (
          <div
            key={player.id}
            className={`rounded-2xl p-3 transition-all duration-300 ${
              isCurrent
                ? 'bg-slate-700/80 ring-2 scale-[1.02]'
                : 'bg-slate-800/40'
            } ${player.isBankrupt ? 'opacity-40' : ''}`}
            style={isCurrent ? { boxShadow: `0 0 20px ${player.color}40`, borderColor: player.color } : {}}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: player.color + '30', border: `2px solid ${player.color}` }}
              >
                {player.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{player.name}</div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Wallet className="w-3 h-3" />
                  {formatMoneyFull(player.cash)}
                </div>
              </div>
              {player.inJail && (
                <div className="flex items-center gap-1 text-xs text-orange-400 bg-orange-500/20 px-2 py-1 rounded-lg">
                  <Lock className="w-3 h-3" />
                  Lapas
                </div>
              )}
              {player.getOutCards > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/20 px-2 py-1 rounded-lg">
                  <KeyRound className="w-3 h-3" />
                  {player.getOutCards}
                </div>
              )}
              {player.protectionCards > 0 && (
                <div className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-lg">
                  <Shield className="w-3 h-3" />
                  {player.protectionCards}
                </div>
              )}
              {player.isBankrupt && (
                <div className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded-lg font-bold">
                  Bangkrut
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Home className="w-3 h-3" />
                {player.properties.length} tanah
              </span>
              <span>Total: {formatMoneyFull(netWorth)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

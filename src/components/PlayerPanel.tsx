import type { Player } from '@/game/types';
import { calculateNetWorth, getTotalHouseCount } from '@/game/gameLogic';
import { formatMoneyFull } from '@/game/boardData';
import { Wallet, Home, KeyRound, Lock, Shield, Building2 } from 'lucide-react';

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
        const houseCount = getTotalHouseCount(player);
        return (
          <div
            key={player.id}
            className={`rounded-2xl p-3 transition-all duration-300 ${
              isCurrent
                ? 'bg-paper-50 ring-2 scale-[1.02] border border-paper-300'
                : 'bg-paper-200/60 border border-paper-300/50'
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
                <div className="text-navy-800 font-bold text-sm truncate">{player.name}</div>
                <div className="flex items-center gap-1 text-xs text-navy-500">
                  <Wallet className="w-3 h-3" />
                  {formatMoneyFull(player.cash)}
                </div>
              </div>
              {player.inJail && !player.isBankrupt && (
                <div className="flex items-center gap-1 text-xs text-rust-600 bg-rust-500/15 px-2 py-1 rounded-lg">
                  <Lock className="w-3 h-3" />
                  Lapas
                </div>
              )}
              {player.getOutCards > 0 && (
                <div className="flex items-center gap-1 text-xs text-forest-600 bg-forest-500/15 px-2 py-1 rounded-lg">
                  <KeyRound className="w-3 h-3" />
                  {player.getOutCards}
                </div>
              )}
              {player.protectionCards > 0 && (
                <div className="flex items-center gap-1 text-xs text-navy-600 bg-navy-500/15 px-2 py-1 rounded-lg">
                  <Shield className="w-3 h-3" />
                  {player.protectionCards}
                </div>
              )}
              {player.isBankrupt && (
                <div className="text-xs text-rust-600 bg-rust-500/15 px-2 py-1 rounded-lg font-bold">
                  Bangkrut
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-navy-500">
              <span className="flex items-center gap-1">
                <Home className="w-3 h-3" />
                {player.properties.length} tanah
              </span>
              {houseCount > 0 && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {houseCount} rumah
                </span>
              )}
              <span className="ml-auto text-gold-600 font-semibold">Total: {formatMoneyFull(netWorth)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

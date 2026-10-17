import type { Player } from '@/game/types';
import { formatMoneyFull } from '@/game/boardData';
import { calculateNetWorth, getTotalHouseCount } from '@/game/gameLogic';
import { Trophy, RotateCcw, Landmark, Home, Building2, Wallet } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-800 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(200,156,18,0.15) 35px, rgba(200,156,18,0.15) 70px)`,
      }} />

      <div className="max-w-md w-full relative">
        <div className="text-center mb-8">
          <div className="inline-flex w-20 h-20 rounded-3xl bg-gradient-to-br from-gold-400 to-rust-500 items-center justify-center shadow-2xl shadow-gold-500/30 mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-paper-50 mb-2">Game Over!</h1>
          <p className="text-paper-200">
            {activePlayers.length === 0
              ? 'Semua WNI bangkrut! Negara menang!'
              : `${winner.emoji} ${winner.name} bertahan sebagai WNI terbaik!`}
          </p>
        </div>

        {/* Winner stats */}
        {winner && !winner.isBankrupt && (
          <div className="bg-gradient-to-br from-gold-400/10 to-rust-500/10 rounded-2xl p-4 border border-gold-400/30 mb-3">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                style={{ backgroundColor: winner.color + '30', border: `2px solid ${winner.color}` }}
              >
                {winner.emoji}
              </div>
              <div className="flex-1">
                <p className="text-gold-600 font-bold text-sm">Pemenang</p>
                <p className="text-navy-800 font-bold">{winner.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-paper-100 rounded-lg px-2 py-1.5 border border-paper-200">
                <Wallet className="w-3 h-3 text-gold-600" />
                <span className="text-navy-500">Tunai</span>
                <span className="text-navy-800 font-bold ml-auto">{formatMoneyFull(winner.cash)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-paper-100 rounded-lg px-2 py-1.5 border border-paper-200">
                <Home className="w-3 h-3 text-navy-500" />
                <span className="text-navy-500">Tanah</span>
                <span className="text-navy-800 font-bold ml-auto">{winner.properties.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-paper-100 rounded-lg px-2 py-1.5 border border-paper-200">
                <Building2 className="w-3 h-3 text-forest-600" />
                <span className="text-navy-500">Rumah</span>
                <span className="text-navy-800 font-bold ml-auto">{getTotalHouseCount(winner)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gold-400/10 rounded-lg px-2 py-1.5 border border-gold-400/20">
                <Trophy className="w-3 h-3 text-gold-600" />
                <span className="text-navy-500">Total</span>
                <span className="text-gold-700 font-bold ml-auto">{formatMoneyFull(calculateNetWorth(winner))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Negara score */}
        <div className="bg-paper-50/90 rounded-2xl p-4 border border-paper-300 mb-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-700 flex items-center justify-center">
            <Landmark className="w-5 h-5 text-gold-300" />
          </div>
          <div className="flex-1">
            <p className="text-navy-700 font-bold text-sm">Negara / Pemerintah</p>
            <p className="text-navy-500 text-xs">Pemenang sejati</p>
          </div>
          <span className="text-navy-700 font-bold text-sm">{formatMoneyFull(negaraCash)}</span>
        </div>

        <div className="bg-paper-50/90 rounded-3xl p-6 border border-paper-300 space-y-3 mb-6">
          {sorted.map((player, idx) => (
            <div
              key={player.id}
              className={`flex items-center gap-3 rounded-xl p-3 ${
                idx === 0 && !player.isBankrupt ? 'bg-gold-400/10 ring-1 ring-gold-400/30' : 'bg-paper-100'
              } ${player.isBankrupt ? 'opacity-40' : ''}`}
            >
              <span className="text-navy-400 font-bold text-lg w-6">#{idx + 1}</span>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: player.color + '30', border: `2px solid ${player.color}` }}
              >
                {player.emoji}
              </div>
              <div className="flex-1">
                <p className="text-navy-800 font-bold text-sm">{player.name}</p>
                <p className="text-navy-500 text-xs">
                  {player.properties.length} properti {player.isBankrupt ? '• Bangkrut' : ''}
                </p>
              </div>
              <span className="text-gold-600 font-bold text-sm">
                {formatMoneyFull(calculateNetWorth(player))}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-gold-400 to-rust-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-rust-500/30"
        >
          <RotateCcw className="w-5 h-5" />
          Main Lagi
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Users, Play, MapPin } from 'lucide-react';
import { PLAYER_PRESETS } from '@/game/gameLogic';
import { RULES } from '@/game/gameRules';
import { formatMoneyFull } from '@/game/boardData';

interface SetupScreenProps {
  onStart: (playerCount: number) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-800 via-navy-700 to-navy-800 flex items-center justify-center p-4">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(200,156,18,0.15) 35px, rgba(200,156,18,0.15) 70px)`,
      }} />

      <div className="max-w-2xl w-full relative">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rust-500 to-gold-500 flex items-center justify-center shadow-2xl shadow-rust-500/30">
              <MapPin className="w-9 h-9 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-paper-50 tracking-tight mb-2">
            WNI <span className="text-gold-400">SIMULATOR</span>
          </h1>
          <p className="text-paper-200 text-lg">
            Bertahan hidup sebagai Warga Negara Indonesia
          </p>
          <p className="text-paper-400 text-sm mt-1">
            Versi digital — terinspirasi dari board game by Hecticholic
          </p>
        </div>

        {/* Player selection */}
        <div className="bg-paper-50/95 backdrop-blur rounded-3xl p-8 border border-paper-300 shadow-2xl">
          <div className="flex items-center gap-2 text-navy-700 mb-5">
            <Users className="w-5 h-5" />
            <span className="font-semibold">Jumlah Pemain</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {[3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                  playerCount === n
                    ? 'bg-gradient-to-br from-gold-400 to-rust-500 text-white scale-105 shadow-lg shadow-rust-500/30'
                    : 'bg-paper-200 text-navy-500 hover:bg-paper-300 hover:text-navy-700'
                }`}
              >
                {n} Pemain
              </button>
            ))}
          </div>

          {/* Player previews */}
          <div className="space-y-2 mb-6">
            {PLAYER_PRESETS.slice(0, playerCount).map(p => (
              <div
                key={p.name}
                className="flex items-center gap-3 bg-paper-100 rounded-xl px-4 py-3 border border-paper-200"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: p.color + '30' }}
                >
                  {p.emoji}
                </div>
                <span className="text-navy-700 font-medium">{p.name}</span>
                <div
                  className="ml-auto w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            ))}
          </div>

          {/* Starting info */}
          <div className="bg-paper-100 rounded-xl p-3 mb-6 flex items-center justify-between text-xs border border-paper-200">
            <span className="text-navy-500">Uang awal setiap pemain</span>
            <span className="text-gold-600 font-bold">{formatMoneyFull(RULES.startingCash)}</span>
          </div>

          <button
            onClick={() => onStart(playerCount)}
            className="w-full py-4 rounded-2xl bg-gradient-to-br from-gold-400 to-rust-500 text-white font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg shadow-rust-500/30"
          >
            <Play className="w-5 h-5" />
            Mulai Bermain
          </button>
        </div>

        <p className="text-center text-paper-400 text-xs mt-6">
          Game satir kehidupan warga +62 — bukan siapa yang menang, tapi siapa yang bertahan
        </p>
      </div>
    </div>
  );
}

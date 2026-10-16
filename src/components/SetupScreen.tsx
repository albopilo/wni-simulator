import { useState } from 'react';
import { Users, Play, MapPin } from 'lucide-react';
import { PLAYER_PRESETS } from '@/game/gameLogic';

interface SetupScreenProps {
  onStart: (playerCount: number) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30">
              <MapPin className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-2">
            WNI <span className="text-amber-400">SIMULATOR</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Bertahan hidup sebagai Warga Negara Indonesia
          </p>
          <p className="text-slate-500 text-sm mt-1">
            Versi digital — terinspirasi dari board game by Hecticholic
          </p>
        </div>

        {/* Player selection */}
        <div className="bg-slate-800/50 backdrop-blur rounded-3xl p-8 border border-slate-700 shadow-2xl">
          <div className="flex items-center gap-2 text-slate-300 mb-5">
            <Users className="w-5 h-5" />
            <span className="font-semibold">Jumlah Pemain</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {[3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`py-4 rounded-2xl font-bold text-lg transition-all duration-200 ${
                  playerCount === n
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white scale-105 shadow-lg shadow-orange-500/30'
                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                }`}
              >
                {n} Pemain
              </button>
            ))}
          </div>

          {/* Player previews */}
          <div className="space-y-2 mb-8">
            {PLAYER_PRESETS.slice(0, playerCount).map(p => (
              <div
                key={p.name}
                className="flex items-center gap-3 bg-slate-700/30 rounded-xl px-4 py-3"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: p.color + '30' }}
                >
                  {p.emoji}
                </div>
                <span className="text-slate-300 font-medium">{p.name}</span>
                <div
                  className="ml-auto w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
              </div>
            ))}
          </div>

          <button
            onClick={() => onStart(playerCount)}
            className="w-full py-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 shadow-lg shadow-orange-500/30"
          >
            <Play className="w-5 h-5" />
            Mulai Bermain
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Game satir kehidupan warga +62 — bukan siapa yang menang, tapi siapa yang bertahan
        </p>
      </div>
    </div>
  );
}

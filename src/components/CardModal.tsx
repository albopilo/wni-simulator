import type { GameCard } from '@/game/types';
import { AlertTriangle, Sparkles, Target } from 'lucide-react';

interface CardModalProps {
  card: GameCard;
  onClose: () => void;
  diceValue?: number;
}

export default function CardModal({ card, onClose, diceValue }: CardModalProps) {
  const isMusibah = card.type === 'musibah';
  const isTakdir = card.type === 'takdir';
  const isTargetir = card.type === 'targetir';

  const bgClass = isMusibah
    ? 'bg-gradient-to-br from-red-900 to-slate-900 border-red-500/50'
    : isTakdir
      ? 'bg-gradient-to-br from-blue-900 to-slate-900 border-blue-500/50'
      : 'bg-gradient-to-br from-fuchsia-900 to-slate-900 border-fuchsia-500/50';

  const iconBg = isMusibah ? 'bg-red-500/30' : isTakdir ? 'bg-blue-500/30' : 'bg-fuchsia-500/30';
  const label = isMusibah ? 'Kartu Musibah' : isTakdir ? 'Kartu Takdir' : 'Kartu Targetir';
  const labelColor = isMusibah ? 'text-red-400' : isTakdir ? 'text-blue-400' : 'text-fuchsia-400';
  const btnClass = isMusibah
    ? 'bg-gradient-to-br from-red-500 to-red-700'
    : isTakdir
      ? 'bg-gradient-to-br from-blue-500 to-blue-700'
      : 'bg-gradient-to-br from-fuchsia-500 to-purple-700';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className={`max-w-sm w-full rounded-3xl p-6 shadow-2xl border-2 ${bgClass} animate-[slideUp_0.3s_ease]`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
            {isMusibah ? (
              <AlertTriangle className="w-6 h-6 text-red-400" />
            ) : isTakdir ? (
              <Sparkles className="w-6 h-6 text-blue-400" />
            ) : (
              <Target className="w-6 h-6 text-fuchsia-400" />
            )}
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
              {label}
              {card.hasStopwatch && <span className="ml-2 text-slate-400">⏱ Stopwatch</span>}
            </p>
            <h2 className="text-white font-bold text-lg">{card.title}</h2>
          </div>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">{card.description}</p>

        {diceValue !== undefined && (
          <div className="bg-slate-800/60 rounded-xl p-4 mb-4 text-center">
            <p className="text-slate-400 text-xs mb-1">Dadu: {diceValue} — {diceValue % 2 === 0 ? 'Genap (Untung!)' : 'Ganjil (Sial!)'}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${btnClass}`}
        >
          Terima Nasib
        </button>
      </div>
    </div>
  );
}

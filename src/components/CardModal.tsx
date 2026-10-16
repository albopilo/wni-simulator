import type { GameCard, MusibahTier } from '@/game/types';
import { AlertTriangle, Sparkles, Target, Dice5 } from 'lucide-react';

interface CardModalProps {
  card: GameCard;
  onClose: () => void;
  diceValue?: number;
  severity?: MusibahTier;
  onRollMusibah?: () => void;
  canClose: boolean;
}

const SEVERITY_STYLE: Record<MusibahTier, { color: string; label: string; bg: string }> = {
  ringan: { color: 'text-green-400', label: 'Ringan', bg: 'bg-green-500/20' },
  sedang: { color: 'text-yellow-400', label: 'Sedang', bg: 'bg-yellow-500/20' },
  brutal: { color: 'text-red-400', label: 'Brutal', bg: 'bg-red-500/20' },
};

export default function CardModal({ card, onClose, diceValue, severity, onRollMusibah, canClose }: CardModalProps) {
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

  const showRollButton = isMusibah && severity === undefined && onRollMusibah;

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

        {isMusibah && (
          <div className="bg-slate-800/60 rounded-xl p-4 mb-4">
            <p className="text-slate-400 text-xs mb-2 text-center">
              Kocok 1 dadu untuk menentukan tingkat musibah:
            </p>
            <div className="flex justify-center gap-2 text-[10px] mb-3">
              <span className="text-green-400">5-6: Ringan</span>
              <span className="text-yellow-400">3-4: Sedang</span>
              <span className="text-red-400">1-2: Brutal</span>
            </div>
            {diceValue !== undefined && severity !== undefined && (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${SEVERITY_STYLE[severity].bg}`}>
                  <Dice5 className="w-4 h-4 text-white" />
                  <span className="text-white font-bold text-sm">Dadu: {diceValue}</span>
                  <span className={`${SEVERITY_STYLE[severity].color} font-bold text-sm`}>
                    {SEVERITY_STYLE[severity].label}!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {showRollButton ? (
          <button
            onClick={onRollMusibah}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${btnClass} flex items-center justify-center gap-2`}
          >
            <Dice5 className="w-5 h-5" />
            Kocok Dadu Musibah
          </button>
        ) : (
          <button
            onClick={onClose}
            disabled={!canClose}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${btnClass} ${
              !canClose ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {canClose ? 'Terima Nasib' : 'Kocok dadu dulu...'}
          </button>
        )}
      </div>
    </div>
  );
}

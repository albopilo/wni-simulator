import type { GameCard, MusibahTier } from '@/game/types';
import { AlertTriangle, Sparkles, Target, Dice5 } from 'lucide-react';

interface CardModalProps {
  card: GameCard;
  onClose: () => void;
  diceValue?: number;
  severity?: MusibahTier;
  onRollMusibah?: () => void;
  onRollTakdir?: () => void;
  takdirGood?: boolean;
  canClose: boolean;
}

const SEVERITY_STYLE: Record<MusibahTier, { color: string; label: string; bg: string }> = {
  ringan: { color: 'text-forest-300', label: 'Ringan', bg: 'bg-forest-400/20' },
  sedang: { color: 'text-gold-300', label: 'Sedang', bg: 'bg-gold-400/20' },
  brutal: { color: 'text-rust-300', label: 'Brutal', bg: 'bg-rust-500/20' },
};

export default function CardModal({ card, onClose, diceValue, severity, onRollMusibah, onRollTakdir, takdirGood, canClose }: CardModalProps) {
  const isMusibah = card.type === 'musibah';
  const isTakdir = card.type === 'takdir';

  const bgClass = isMusibah
    ? 'bg-gradient-to-br from-rust-800 via-rust-700 to-rust-900 border-rust-600/50'
    : isTakdir
      ? 'bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 border-navy-500/50'
      : 'bg-gradient-to-br from-rust-800 via-rust-700 to-paper-50 border-rust-500/50';

  const iconBg = isMusibah ? 'bg-rust-600/40' : isTakdir ? 'bg-navy-500/40' : 'bg-rust-500/40';
  const label = isMusibah ? 'Kartu Musibah' : isTakdir ? 'Kartu Takdir' : 'Kartu Targetir';
  const labelColor = isMusibah ? 'text-rust-300' : isTakdir ? 'text-gold-300' : 'text-rust-300';
  const titleColor = isMusibah ? 'text-paper-50' : isTakdir ? 'text-paper-50' : 'text-paper-50';
  const descColor = isMusibah ? 'text-paper-200' : isTakdir ? 'text-paper-200' : 'text-paper-200';
  const btnClass = isMusibah
    ? 'bg-gradient-to-br from-rust-500 to-rust-700'
    : isTakdir
      ? 'bg-gradient-to-br from-gold-400 to-navy-600'
      : 'bg-gradient-to-br from-rust-500 to-rust-700';

  const showRollButton = isMusibah && severity === undefined && onRollMusibah;
  const showTakdirRollButton = isTakdir && diceValue === undefined && onRollTakdir;
  const showTakdirResult = isTakdir && diceValue !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className={`max-w-sm w-full rounded-3xl p-6 shadow-2xl border-2 ${bgClass} animate-[slideUp_0.3s_ease]`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${iconBg}`}>
            {isMusibah ? (
              <AlertTriangle className="w-6 h-6 text-rust-300" />
            ) : isTakdir ? (
              <Sparkles className="w-6 h-6 text-gold-300" />
            ) : (
              <Target className="w-6 h-6 text-rust-300" />
            )}
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${labelColor}`}>
              {label}
              {card.hasStopwatch && <span className="ml-2 text-gold-300">⏱ Stopwatch</span>}
            </p>
            <h2 className={`${titleColor} font-bold text-lg`}>{card.title}</h2>
          </div>
        </div>

        <p className={`${descColor} text-sm leading-relaxed mb-4`}>{card.description}</p>

        {isMusibah && (
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-paper-200 text-xs mb-2 text-center">
              Kocok 1 dadu untuk menentukan tingkat musibah:
            </p>
            <div className="flex justify-center gap-2 text-[10px] mb-3">
              <span className="text-forest-300 font-bold">5-6: Ringan</span>
              <span className="text-gold-300 font-bold">3-4: Sedang</span>
              <span className="text-rust-300 font-bold">1-2: Brutal</span>
            </div>
            {diceValue !== undefined && severity !== undefined && (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${SEVERITY_STYLE[severity].bg}`}>
                  <Dice5 className="w-4 h-4 text-white" />
                  <span className="text-paper-50 font-bold text-sm">Dadu: {diceValue}</span>
                  <span className={`${SEVERITY_STYLE[severity].color} font-bold text-sm`}>
                    {SEVERITY_STYLE[severity].label}!
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {isTakdir && (
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <p className="text-paper-200 text-xs mb-2 text-center">
              Kocok 1 dadu untuk menentukan nasib:
            </p>
            <div className="flex justify-center gap-2 text-[10px] mb-3">
              <span className="text-forest-300 font-bold">2,4,6: Bagus</span>
              <span className="text-rust-300 font-bold">1,3,5: Buruk</span>
            </div>
            {showTakdirResult && (
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${takdirGood ? 'bg-forest-400/20' : 'bg-rust-500/20'}`}>
                  <Dice5 className="w-4 h-4 text-white" />
                  <span className="text-paper-50 font-bold text-sm">Dadu: {diceValue}</span>
                  <span className={`${takdirGood ? 'text-forest-300' : 'text-rust-300'} font-bold text-sm`}>
                    {takdirGood ? 'Bagus!' : 'Buruk!'}
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
        ) : showTakdirRollButton ? (
          <button
            onClick={onRollTakdir}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] ${btnClass} flex items-center justify-center gap-2`}
          >
            <Dice5 className="w-5 h-5" />
            Kocok Dadu Takdir
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

import { Dices } from 'lucide-react';

interface DiceProps {
  values: [number, number];
  rolling: boolean;
  rolled: boolean;
  onRoll: () => void;
  disabled: boolean;
}

// Standard dice pip layouts using a 3x3 grid (positions 0-8):
// 0  1  2
// 3  4  5
// 6  7  8
const DICE_FACES: number[][] = [
  [], // 0 — unused
  [4], // 1 — center
  [0, 8], // 2 — top-left, bottom-right
  [0, 4, 8], // 3 — top-left, center, bottom-right
  [0, 2, 6, 8], // 4 — four corners
  [0, 2, 4, 6, 8], // 5 — four corners + center
  [0, 2, 3, 5, 6, 8], // 6 — two columns of 3
];

const DOT_STYLES: Record<number, string> = {
  0: 'top-[15%] left-[15%]',
  1: 'top-[15%] left-1/2 -translate-x-1/2',
  2: 'top-[15%] right-[15%]',
  3: 'top-1/2 left-[15%] -translate-y-1/2',
  4: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  5: 'top-1/2 right-[15%] -translate-y-1/2',
  6: 'bottom-[15%] left-[15%]',
  7: 'bottom-[15%] left-1/2 -translate-x-1/2',
  8: 'bottom-[15%] right-[15%]',
};

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = DICE_FACES[value] || [];

  return (
    <div
      className={`w-12 h-12 bg-gradient-to-br from-paper-50 to-paper-200 rounded-xl shadow-lg relative ${
        rolling ? 'animate-spin' : ''
      }`}
      style={{ transitionDuration: '150ms' }}
    >
      {dots.map((pos, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 bg-navy-800 rounded-full absolute ${DOT_STYLES[pos]}`}
        />
      ))}
    </div>
  );
}

export default function Dice({ values, rolling, rolled, onRoll, disabled }: DiceProps) {
  const displayValues = rolling
    ? [Math.ceil(Math.random() * 6), Math.ceil(Math.random() * 6)] as [number, number]
    : values;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-3">
        <DiceFace value={displayValues[0]} rolling={rolling} />
        <DiceFace value={displayValues[1]} rolling={rolling} />
      </div>
      {rolled && !rolling && (
        <div className="text-gold-600 font-bold text-lg">
          Total: {values[0] + values[1]}
          {values[0] === values[1] && (
            <span className="ml-2 text-rust-500 text-sm">(Dobel!)</span>
          )}
        </div>
      )}
      <button
        onClick={onRoll}
        disabled={disabled || rolling}
        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 ${
          disabled || rolling
            ? 'bg-navy-700 text-paper-400 cursor-not-allowed'
            : 'bg-gradient-to-br from-gold-400 to-rust-500 text-white hover:scale-105 active:scale-95 shadow-lg shadow-rust-500/20'
        }`}
      >
        <Dices className="w-5 h-5" />
        {rolling ? 'Lempar...' : rolled ? 'Lempar Lagi' : 'Lempar Dadu'}
      </button>
    </div>
  );
}

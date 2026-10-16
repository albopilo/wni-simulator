import { Dices } from 'lucide-react';

interface DiceProps {
  values: [number, number];
  rolling: boolean;
  rolled: boolean;
  onRoll: () => void;
  disabled: boolean;
}

const DICE_FACES: number[][] = [
  [],
  [],
  [0, 2],
  [0, 2, 4],
  [0, 1, 2, 3, 4],
  [0, 1, 2, 3, 4, 5],
  [0, 1, 2, 3, 4, 5],
];

const DOT_POSITIONS = [
  'top-1 left-1', 'top-1 right-1', 'top-1/2 left-1', 'top-1/2 right-1',
  'bottom-1 left-1', 'bottom-1 right-1', 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
];

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  const dots = DICE_FACES[value] || [];

  return (
    <div
      className={`w-12 h-12 bg-gradient-to-br from-stone-50 to-stone-200 rounded-xl shadow-lg relative ${
        rolling ? 'animate-spin' : ''
      }`}
      style={{ transitionDuration: '150ms' }}
    >
      {dots.map((pos, i) => (
        <div
          key={i}
          className={`w-2 h-2 bg-stone-800 rounded-full absolute ${DOT_POSITIONS[pos]}`}
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
        <div className="text-amber-400 font-bold text-lg">
          Total: {values[0] + values[1]}
          {values[0] === values[1] && (
            <span className="ml-2 text-orange-400 text-sm">(Dobel!)</span>
          )}
        </div>
      )}
      <button
        onClick={onRoll}
        disabled={disabled || rolling}
        className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all duration-200 ${
          disabled || rolling
            ? 'bg-stone-700 text-stone-500 cursor-not-allowed'
            : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/20'
        }`}
      >
        <Dices className="w-5 h-5" />
        {rolling ? 'Lempar...' : rolled ? 'Lempar Lagi' : 'Lempar Dadu'}
      </button>
    </div>
  );
}

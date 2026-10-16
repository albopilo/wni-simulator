import type { LogEntry } from '@/game/types';
import { useEffect, useRef } from 'react';
import {
  Info, TrendingDown, TrendingUp, MoveRight, CreditCard, AlertOctagon,
} from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
}

const TYPE_CONFIG: Record<string, { color: string; icon: typeof Info }> = {
  info: { color: 'text-stone-400', icon: Info },
  money: { color: 'text-amber-400', icon: CreditCard },
  bad: { color: 'text-red-400', icon: TrendingDown },
  good: { color: 'text-emerald-400', icon: TrendingUp },
  move: { color: 'text-blue-400', icon: MoveRight },
  card: { color: 'text-rose-400', icon: AlertOctagon },
};

export default function LogPanel({ logs }: LogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-stone-800/40 rounded-2xl p-3 border border-stone-700/50">
      <h3 className="text-stone-300 font-bold text-sm mb-2 px-1">Log Permainan</h3>
      <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
        {logs.length === 0 ? (
          <p className="text-stone-600 text-xs px-1">Lempar dadu untuk mulai...</p>
        ) : (
          logs.slice(-30).map(log => {
            const config = TYPE_CONFIG[log.type] || TYPE_CONFIG.info;
            const Icon = config.icon;
            return (
              <div
                key={log.id}
                className={`text-xs leading-relaxed ${config.color} px-1 py-0.5 rounded flex items-start gap-1.5`}
              >
                <Icon className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                <span>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

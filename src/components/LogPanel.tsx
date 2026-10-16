import type { LogEntry } from '@/game/types';
import { useEffect, useRef } from 'react';

interface LogPanelProps {
  logs: LogEntry[];
}

const TYPE_STYLES: Record<string, string> = {
  info: 'text-slate-400',
  money: 'text-amber-400',
  bad: 'text-red-400',
  good: 'text-green-400',
  move: 'text-blue-400',
  card: 'text-purple-400',
};

export default function LogPanel({ logs }: LogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-800/40 rounded-2xl p-3 border border-slate-700/50">
      <h3 className="text-slate-300 font-bold text-sm mb-2 px-1">Log Permainan</h3>
      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
        {logs.length === 0 ? (
          <p className="text-slate-600 text-xs px-1">Lempar dadu untuk mulai...</p>
        ) : (
          logs.slice(-20).map(log => (
            <div
              key={log.id}
              className={`text-xs leading-relaxed ${TYPE_STYLES[log.type] || 'text-slate-400'} px-1`}
            >
              {log.text}
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}

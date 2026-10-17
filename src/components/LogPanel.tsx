import type { LogEntry, Transaction } from '@/game/types';
import { useEffect, useRef, useState } from 'react';
import {
  Info, TrendingDown, TrendingUp, MoveRight, CreditCard, AlertOctagon,
  ChevronDown, Receipt,
} from 'lucide-react';
import { formatMoneyFull } from '@/game/boardData';

interface LogPanelProps {
  logs: LogEntry[];
  transactions?: Transaction[];
}

const TYPE_CONFIG: Record<string, { color: string; icon: typeof Info }> = {
  info: { color: 'text-navy-600', icon: Info },
  money: { color: 'text-gold-700', icon: CreditCard },
  bad: { color: 'text-rust-600', icon: TrendingDown },
  good: { color: 'text-forest-600', icon: TrendingUp },
  move: { color: 'text-navy-500', icon: MoveRight },
  card: { color: 'text-rust-500', icon: AlertOctagon },
};

export default function LogPanel({ logs, transactions = [] }: LogPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-paper-200 rounded-2xl border border-paper-300 overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-3 hover:bg-paper-300/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-navy-700 font-bold text-sm">Log Permainan</h3>
          <span className="text-navy-400 text-xs">{logs.length} entri</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-navy-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`overflow-y-auto space-y-1 px-3 pr-3 transition-all duration-300 ${
        expanded ? 'max-h-64 pb-3' : 'max-h-36 pb-3'
      }`}>
        {logs.length === 0 ? (
          <p className="text-navy-400 text-xs px-1 py-2">Lempar dadu untuk mulai...</p>
        ) : (
          logs.slice(-50).map(log => {
            const config = TYPE_CONFIG[log.type] || TYPE_CONFIG.info;
            const Icon = config.icon;
            return (
              <div
                key={log.id}
                className={`text-xs leading-relaxed ${config.color} py-0.5 rounded flex items-start gap-1.5`}
              >
                <Icon className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                <span>{log.text}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {transactions.length > 0 && (
        <>
          <button
            onClick={() => setShowTransactions(s => !s)}
            className="w-full flex items-center justify-between px-3 py-2 border-t border-paper-300 hover:bg-paper-300/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Receipt className="w-3.5 h-3.5 text-navy-500" />
              <span className="text-navy-600 text-xs font-bold">Transaksi ({transactions.length})</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-navy-500 transition-transform ${showTransactions ? 'rotate-180' : ''}`} />
          </button>
          {showTransactions && (
            <div className="max-h-48 overflow-y-auto px-3 pb-3 space-y-1">
              {transactions.slice(-30).map(tx => (
                <div key={tx.id} className="text-xs flex items-center gap-2 py-1 border-b border-paper-300/50 last:border-0">
                  <span className="text-navy-400 shrink-0">P{tx.turn}</span>
                  <span className="text-navy-700 truncate">
                    <span className="text-rust-600">{tx.sender}</span>
                    <span className="text-navy-400"> → </span>
                    <span className="text-forest-600">{tx.receiver}</span>
                  </span>
                  <span className="text-gold-700 font-bold ml-auto shrink-0">{formatMoneyFull(tx.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

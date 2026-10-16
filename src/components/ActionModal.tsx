import type { Player, Tile, PendingAction } from '@/game/types';
import { BOARD, formatMoneyFull } from '@/game/boardData';
import { Home, Lock, Gavel, Coins, Route } from 'lucide-react';

interface ActionModalProps {
  action: PendingAction;
  tile: Tile;
  currentPlayer: Player;
  owner: Player | null;
  onBuy: () => void;
  onSkip: () => void;
  onPayBail: () => void;
  onUseGetOutCard: () => void;
  onRollForJail: () => void;
  onPayFine: (amount: number) => void;
  onTolChoose: (destId: number) => void;
  onDismiss: () => void;
  canAfford: boolean;
}

export default function ActionModal({
  action, tile, currentPlayer, owner, onBuy, onSkip,
  onPayBail, onUseGetOutCard, onRollForJail, onPayFine, onTolChoose, onDismiss, canAfford,
}: ActionModalProps) {
  const renderContent = () => {
    switch (action.type) {
      case 'buy': {
        return (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Home className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-xs font-bold uppercase tracking-wide">Beli Tanah?</p>
                <h2 className="text-white font-bold text-lg">{tile.name}</h2>
                {tile.island && <p className="text-slate-400 text-xs">Pulau {tile.island}</p>}
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Harga Beli</span>
                <span className="text-white font-bold">{formatMoneyFull(tile.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sewa Tanah Kosong</span>
                <span className="text-white">{formatMoneyFull(tile.rent || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sewa 1 Rumah Subsidi</span>
                <span className="text-white">{formatMoneyFull(tile.rentSubsidi1 || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sewa 2 Rumah Subsidi</span>
                <span className="text-white">{formatMoneyFull(tile.rentSubsidi2 || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sewa Rumah OKB</span>
                <span className="text-white">{formatMoneyFull(tile.rentOKB || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Uang Kamu</span>
                <span className="text-white font-bold">{formatMoneyFull(currentPlayer.cash)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={onBuy}
                disabled={!canAfford}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  canAfford
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Beli' : 'Uang Kurang'}
              </button>
            </div>
          </>
        );
      }

      case 'jail': {
        return (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                <Lock className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-orange-400 text-xs font-bold uppercase tracking-wide">Lapas</p>
                <h2 className="text-white font-bold text-lg">Kena OTK!</h2>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Kamu masuk lapas. Pilih cara untuk keluar:
            </p>
            <div className="space-y-2">
              <button
                onClick={onPayBail}
                disabled={currentPlayer.cash < 1_500_000}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-between px-4 transition-all ${
                  currentPlayer.cash >= 1_500_000
                    ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white hover:scale-[1.01]'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Bayar Jaminan</span>
                <span className="text-sm">{formatMoneyFull(1_500_000)}</span>
              </button>
              {currentPlayer.getOutCards > 0 && (
                <button
                  onClick={onUseGetOutCard}
                  className="w-full py-3 rounded-xl bg-gradient-to-br from-green-500 to-green-700 text-white font-bold flex items-center justify-between px-4 hover:scale-[1.01] transition-all"
                >
                  <span>Gunakan Kartu Bebas Lapas</span>
                  <span className="text-sm">({currentPlayer.getOutCards} kartu)</span>
                </button>
              )}
              <button
                onClick={onRollForJail}
                className="w-full py-3 rounded-xl bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition-colors"
              >
                Lempar Dadu (Dobel = Bebas)
              </button>
            </div>
          </>
        );
      }

      case 'pengadilan': {
        return (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Gavel className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-indigo-400 text-xs font-bold uppercase tracking-wide">Pengadilan</p>
                <h2 className="text-white font-bold text-lg">Sidang Pengadilan</h2>
              </div>
            </div>
            <div className="bg-slate-800/60 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-400">5-6: Menang</span>
                <span className="text-white">Dapat {formatMoneyFull(1_000_000)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">3-4: Kalah</span>
                <span className="text-white">Lapas + {formatMoneyFull(1_500_000)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">1-2: Brutal</span>
                <span className="text-white">Lapas + 50% uang disita</span>
              </div>
            </div>
            <button
              onClick={onRollForJail}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold hover:scale-[1.02] transition-all"
            >
              Kocok Dadu Nasib
            </button>
          </>
        );
      }

      case 'pungli': {
        return (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
                <Coins className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-400 text-xs font-bold uppercase tracking-wide">Pungli</p>
                <h2 className="text-white font-bold text-lg">Pungutan Liar</h2>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Bayar pungli {formatMoneyFull(1_000_000)} ke negara. Tapi kalau kamu punya tanah di Bandung, kamu bebas.
            </p>
            <button
              onClick={() => onPayFine(1_000_000)}
              disabled={currentPlayer.cash < 1_000_000}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                currentPlayer.cash >= 1_000_000
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white hover:scale-[1.02]'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              {currentPlayer.cash >= 1_000_000 ? `Bayar ${formatMoneyFull(1_000_000)}` : 'Uang Kurang'}
            </button>
          </>
        );
      }

      case 'tol-choose': {
        const dests = action.tolDestinations || [];
        return (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
                <Route className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-cyan-400 text-xs font-bold uppercase tracking-wide">Jalan Tol</p>
                <h2 className="text-white font-bold text-lg">Pilih Tujuan Tol</h2>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              Bayar {formatMoneyFull(500_000)} lalu pindah ke salah satu jalan tol berikut:
            </p>
            <div className="space-y-2 mb-4">
              {dests.map(id => (
                <button
                  key={id}
                  onClick={() => onTolChoose(id)}
                  className="w-full py-3 rounded-xl bg-slate-700 text-slate-200 font-bold hover:bg-slate-600 transition-colors text-left px-4"
                >
                  <Route className="w-4 h-4 inline mr-2 text-cyan-400" />
                  {BOARD[id]?.name || `Tile ${id}`}
                </button>
              ))}
            </div>
          </>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 animate-[slideUp_0.3s_ease]">
        {renderContent()}
      </div>
    </div>
  );
}

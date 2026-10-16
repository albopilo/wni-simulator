import type { Player, Tile, PendingAction } from '@/game/types';
import { BOARD, formatMoneyFull } from '@/game/boardData';
import { JAIL_BAIL, PENGADILAN_COMPENSATION, LAPAS_FINE, PUNGLI_FEE, TOL_FEE } from '@/game/gameLogic';
import { Home, Lock, Gavel, Coins, Route } from 'lucide-react';

interface ActionModalProps {
  action: PendingAction;
  tile: Tile;
  currentPlayer: Player;
  onBuy: () => void;
  onSkip: () => void;
  onPayBail: () => void;
  onUseGetOutCard: () => void;
  onRollForJail: () => void;
  onPayFine: (amount: number) => void;
  onTolChoose: (destId: number) => void;
  canAfford: boolean;
}

export default function ActionModal({
  action, tile, currentPlayer, onBuy, onSkip,
  onPayBail, onUseGetOutCard, onRollForJail, onPayFine, onTolChoose, canAfford,
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
                <h2 className="text-stone-100 font-bold text-lg">{tile.name}</h2>
                {tile.island && <p className="text-stone-400 text-xs">Pulau {tile.island}</p>}
              </div>
            </div>
            <div className="bg-stone-800/60 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Harga Beli</span>
                <span className="text-stone-100 font-bold">{formatMoneyFull(tile.price || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Sewa Tanah Kosong</span>
                <span className="text-stone-200">{formatMoneyFull(tile.rent || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Sewa 1 Rumah Subsidi</span>
                <span className="text-stone-200">{formatMoneyFull(tile.rentSubsidi1 || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Sewa 2 Rumah Subsidi</span>
                <span className="text-stone-200">{formatMoneyFull(tile.rentSubsidi2 || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Sewa Rumah OKB</span>
                <span className="text-stone-200">{formatMoneyFull(tile.rentOKB || 0)}</span>
              </div>
              <div className="border-t border-stone-700/50 pt-2 flex justify-between text-sm">
                <span className="text-stone-400">Uang Kamu</span>
                <span className="text-stone-100 font-bold">{formatMoneyFull(currentPlayer.cash)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onSkip}
                className="flex-1 py-3 rounded-xl bg-stone-700 text-stone-300 font-bold hover:bg-stone-600 transition-colors"
              >
                Skip
              </button>
              <button
                onClick={onBuy}
                disabled={!canAfford}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                  canAfford
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:scale-[1.02] active:scale-[0.98]'
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
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
                <h2 className="text-stone-100 font-bold text-lg">Kena OTK!</h2>
              </div>
            </div>
            <p className="text-stone-300 text-sm mb-4">
              Kamu masuk lapas. Pilih cara untuk keluar:
            </p>
            <div className="space-y-2">
              <button
                onClick={onPayBail}
                disabled={currentPlayer.cash < JAIL_BAIL}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-between px-4 transition-all ${
                  currentPlayer.cash >= JAIL_BAIL
                    ? 'bg-gradient-to-br from-orange-500 to-orange-700 text-white hover:scale-[1.01]'
                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                }`}
              >
                <span>Bayar Jaminan</span>
                <span className="text-sm">{formatMoneyFull(JAIL_BAIL)}</span>
              </button>
              {currentPlayer.getOutCards > 0 && (
                <button
                  onClick={onUseGetOutCard}
                  className="w-full py-3 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold flex items-center justify-between px-4 hover:scale-[1.01] transition-all"
                >
                  <span>Gunakan Kartu Bebas Lapas</span>
                  <span className="text-sm">({currentPlayer.getOutCards} kartu)</span>
                </button>
              )}
              <button
                onClick={onRollForJail}
                className="w-full py-3 rounded-xl bg-stone-700 text-stone-200 font-bold hover:bg-stone-600 transition-colors"
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
                <h2 className="text-stone-100 font-bold text-lg">Sidang Pengadilan</h2>
              </div>
            </div>
            <div className="bg-stone-800/60 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400">5-6: Menang</span>
                <span className="text-stone-100">Dapat {formatMoneyFull(PENGADILAN_COMPENSATION)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">3-4: Kalah</span>
                <span className="text-stone-100">Lapas + {formatMoneyFull(LAPAS_FINE)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-400">1-2: Brutal</span>
                <span className="text-stone-100">Lapas + 50% uang disita</span>
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
                <h2 className="text-stone-100 font-bold text-lg">Pungutan Liar</h2>
              </div>
            </div>
            <p className="text-stone-300 text-sm mb-4">
              Bayar pungli {formatMoneyFull(PUNGLI_FEE)} ke negara. Tapi kalau kamu punya tanah di Bandung, kamu bebas.
            </p>
            <button
              onClick={() => onPayFine(PUNGLI_FEE)}
              disabled={currentPlayer.cash < PUNGLI_FEE}
              className={`w-full py-3 rounded-xl font-bold transition-all ${
                currentPlayer.cash >= PUNGLI_FEE
                  ? 'bg-gradient-to-br from-yellow-500 to-amber-600 text-white hover:scale-[1.02]'
                  : 'bg-stone-700 text-stone-500 cursor-not-allowed'
              }`}
            >
              {currentPlayer.cash >= PUNGLI_FEE ? `Bayar ${formatMoneyFull(PUNGLI_FEE)}` : 'Uang Kurang'}
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
                <h2 className="text-stone-100 font-bold text-lg">Pilih Tujuan Tol</h2>
              </div>
            </div>
            <p className="text-stone-300 text-sm mb-4">
              Bayar {formatMoneyFull(TOL_FEE)} lalu pindah ke salah satu jalan tol berikut:
            </p>
            <div className="space-y-2 mb-4">
              {dests.map(id => (
                <button
                  key={id}
                  onClick={() => onTolChoose(id)}
                  className="w-full py-3 rounded-xl bg-stone-700 text-stone-200 font-bold hover:bg-stone-600 transition-colors text-left px-4"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="max-w-sm w-full rounded-3xl p-6 shadow-2xl border border-stone-700 bg-gradient-to-br from-stone-800 to-stone-900 animate-[slideUp_0.3s_ease]">
        {renderContent()}
      </div>
    </div>
  );
}

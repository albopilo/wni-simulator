import type { Tile, Player, HouseLevel } from '@/game/types';
import { formatMoneyFull } from '@/game/boardData';
import { propertyOwner, calculateRent, houseLevelName, isStateOwned } from '@/game/gameLogic';
import { Home, Building2, X, MapPin, Wallet, Landmark, Lock } from 'lucide-react';

interface PropertyDetailSheetProps {
  tile: Tile | null;
  players: Player[];
  currentPlayer: Player;
  onClose: () => void;
}

const ISLAND_COLORS: Record<string, string> = {
  Sumatera: 'bg-emerald-600',
  Jawa: 'bg-blue-700',
  Kalimantan: 'bg-amber-600',
  Sulawesi: 'bg-rose-600',
  Papua: 'bg-teal-600',
};

export default function PropertyDetailSheet({ tile, players, onClose }: PropertyDetailSheetProps) {
  if (!tile) return null;

  const owner = propertyOwner(players, tile.id);
  const stateOwned = isStateOwned(tile.id);
  const houseLevel: HouseLevel = owner ? (owner.houses[tile.id] || 0) as HouseLevel : 0;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden animate-[slideUp_0.3s_ease]">
        <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-t-3xl border-t border-stone-700 shadow-2xl max-h-[75vh] overflow-y-auto">
          <div className="sticky top-0 bg-stone-800/95 backdrop-blur px-5 pt-3 pb-2 border-b border-stone-700/50 flex items-center justify-between">
            <div className="w-10 h-1 rounded-full bg-stone-600 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
            <div className="flex items-center gap-2">
              {tile.island && <div className={`w-2 h-6 rounded-full ${ISLAND_COLORS[tile.island] || 'bg-stone-600'}`} />}
              <div>
                <h2 className="text-stone-100 font-bold text-base">{tile.name}</h2>
                {tile.island && <p className="text-stone-500 text-xs">Pulau {tile.island}</p>}
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-stone-700 flex items-center justify-center active:scale-90 transition-transform">
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {tile.type === 'property' && !stateOwned && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-stone-700/40 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                      <Wallet className="w-3 h-3" />
                      <span>Harga Beli</span>
                    </div>
                    <p className="text-amber-400 font-bold text-sm">{formatMoneyFull(tile.price || 0)}</p>
                  </div>
                  <div className="bg-stone-700/40 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-stone-500 text-xs mb-1">
                      <Home className="w-3 h-3" />
                      <span>Sewa Tanah</span>
                    </div>
                    <p className="text-stone-200 font-bold text-sm">{formatMoneyFull(tile.rent || 0)}</p>
                  </div>
                </div>

                <div className="bg-stone-700/30 rounded-xl divide-y divide-stone-700/40">
                  {[
                    { label: 'Sewa 1 Rumah Subsidi', value: tile.rentSubsidi1, icon: Home, color: 'text-emerald-400' },
                    { label: 'Sewa 2 Rumah Subsidi', value: tile.rentSubsidi2, icon: Home, color: 'text-emerald-400' },
                    { label: 'Sewa Rumah OKB', value: tile.rentOKB, icon: Building2, color: 'text-red-400' },
                    { label: 'Harga Bangun Rumah', value: tile.housePrice, icon: Building2, color: 'text-blue-400' },
                    { label: 'Harga Upgrade OKB', value: tile.okbPrice, icon: Building2, color: 'text-blue-400' },
                  ].map(item => item.value !== undefined && (
                    <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                        <span className="text-stone-300 text-sm">{item.label}</span>
                      </div>
                      <span className="text-stone-100 font-semibold text-sm">{formatMoneyFull(item.value)}</span>
                    </div>
                  ))}
                </div>

                {owner ? (
                  <div className="bg-stone-700/40 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: owner.color + '30', border: `2px solid ${owner.color}` }}>
                      {owner.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-500 text-xs">Pemilik</p>
                      <p className="text-stone-100 font-bold text-sm">{owner.name}</p>
                      <p className="text-stone-400 text-xs">{houseLevelName(houseLevel)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-stone-500 text-xs">Sewa saat ini</p>
                      <p className="text-amber-400 font-bold text-sm">{formatMoneyFull(calculateRent(tile, owner))}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/10 rounded-xl p-4 flex items-center gap-2 border border-emerald-500/20">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <p className="text-emerald-400 text-sm font-bold">Tanah kosong — bisa dibeli</p>
                  </div>
                )}
              </>
            )}

            {stateOwned && (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-bold text-sm">Milik Negara</p>
                  <p className="text-stone-400 text-xs">Sewa: {formatMoneyFull(Math.floor((tile.rent || 0) * 0.5))}</p>
                </div>
              </div>
            )}

            {tile.type === 'start' && (
              <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
                <p className="text-amber-400 font-bold text-sm">Gajian! {formatMoneyFull(1_000_000)}</p>
                <p className="text-stone-400 text-xs mt-1">Setiap kali lewat atau mendarat di Start</p>
              </div>
            )}

            {(tile.type === 'musibah' || tile.type === 'takdir' || tile.type === 'targetir') && (
              <div className="bg-stone-700/30 rounded-xl p-4 text-center">
                <p className="text-stone-300 text-sm">Ambil kartu {tile.type === 'musibah' ? 'Musibah' : tile.type === 'takdir' ? 'Takdir' : 'Targetir'}</p>
              </div>
            )}

            {tile.type === 'lapas' && (
              <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20 flex items-center gap-2">
                <Lock className="w-5 h-5 text-orange-400" />
                <p className="text-orange-400 font-bold text-sm">Lapas — kunjungan aman</p>
              </div>
            )}

            {/* Players on this tile */}
            {players.filter(p => p.position === tile.id && !p.isBankrupt).length > 0 && (
              <div className="bg-stone-700/30 rounded-xl p-3">
                <p className="text-stone-500 text-xs mb-2">Pemain di sini</p>
                <div className="flex gap-2 flex-wrap">
                  {players.filter(p => p.position === tile.id && !p.isBankrupt).map(p => (
                    <div key={p.id} className="flex items-center gap-1.5 bg-stone-700/50 rounded-lg px-2 py-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: p.color + '30', border: `1.5px solid ${p.color}` }}>
                        {p.emoji}
                      </div>
                      <span className="text-stone-300 text-xs font-medium">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

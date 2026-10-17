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
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease]"
        onClick={onClose}
      />
      {/* Desktop: centered modal */}
      <div className="hidden lg:flex fixed inset-0 z-50 items-center justify-center pointer-events-none animate-[fadeIn_0.2s_ease]">
        <div className="pointer-events-auto bg-paper-50 rounded-2xl border border-paper-300 shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <SheetContent tile={tile} owner={owner} stateOwned={stateOwned} houseLevel={houseLevel} players={players} onClose={onClose} ISLAND_COLORS={ISLAND_COLORS} />
        </div>
      </div>
      {/* Mobile: bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 animate-[slideUp_0.3s_ease]">
        <div className="bg-gradient-to-br from-paper-50 to-paper-100 rounded-t-3xl border-t border-paper-300 shadow-2xl max-h-[75vh] overflow-y-auto">
          <SheetContent tile={tile} owner={owner} stateOwned={stateOwned} houseLevel={houseLevel} players={players} onClose={onClose} ISLAND_COLORS={ISLAND_COLORS} mobile />
        </div>
      </div>
    </>
  );
}

function SheetContent({
  tile, owner, stateOwned, houseLevel, players, onClose, ISLAND_COLORS, mobile = false,
}: {
  tile: Tile;
  owner: Player | null;
  stateOwned: boolean;
  houseLevel: HouseLevel;
  players: Player[];
  onClose: () => void;
  ISLAND_COLORS: Record<string, string>;
  mobile?: boolean;
}) {
  return (
    <>
      <div className={`sticky top-0 bg-paper-50/95 backdrop-blur px-5 pt-3 pb-2 border-b border-paper-300 flex items-center justify-between ${mobile ? '' : 'rounded-t-2xl'}`}>
        {mobile && <div className="w-10 h-1 rounded-full bg-paper-400 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />}
        <div className="flex items-center gap-2">
          {tile.island && <div className={`w-2 h-6 rounded-full ${ISLAND_COLORS[tile.island] || 'bg-paper-400'}`} />}
          <div>
            <h2 className="text-navy-800 font-bold text-base">{tile.name}</h2>
            {tile.island && <p className="text-navy-400 text-xs">Pulau {tile.island}</p>}
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-paper-300 flex items-center justify-center active:scale-90 transition-transform">
          <X className="w-4 h-4 text-navy-500" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {tile.type === 'property' && !stateOwned && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-paper-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-navy-500 text-xs mb-1">
                  <Wallet className="w-3 h-3" />
                  <span>Harga Beli</span>
                </div>
                <p className="text-gold-600 font-bold text-sm">{formatMoneyFull(tile.price || 0)}</p>
              </div>
              <div className="bg-paper-100 rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-navy-500 text-xs mb-1">
                  <Home className="w-3 h-3" />
                  <span>Sewa Tanah</span>
                </div>
                <p className="text-navy-700 font-bold text-sm">{formatMoneyFull(tile.rent || 0)}</p>
              </div>
            </div>

            <div className="bg-paper-200/50 rounded-xl divide-y divide-paper-100">
              {[
                { label: 'Sewa 1 Rumah Subsidi', value: tile.rentSubsidi1, icon: Home, color: 'text-forest-600' },
                { label: 'Sewa 2 Rumah Subsidi', value: tile.rentSubsidi2, icon: Home, color: 'text-forest-600' },
                { label: 'Sewa Rumah OKB', value: tile.rentOKB, icon: Building2, color: 'text-rust-500' },
                { label: 'Harga Bangun Rumah', value: tile.housePrice, icon: Building2, color: 'text-navy-500' },
                { label: 'Harga Upgrade OKB', value: tile.okbPrice, icon: Building2, color: 'text-navy-500' },
              ].map(item => item.value !== undefined && (
                <div key={item.label} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <item.icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="text-navy-700 text-sm">{item.label}</span>
                  </div>
                  <span className="text-navy-800 font-semibold text-sm">{formatMoneyFull(item.value)}</span>
                </div>
              ))}
            </div>

            {owner ? (
              <div className="bg-paper-100 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: owner.color + '30', border: `2px solid ${owner.color}` }}>
                  {owner.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-navy-500 text-xs">Pemilik</p>
                  <p className="text-navy-800 font-bold text-sm">{owner.name}</p>
                  <p className="text-navy-500 text-xs">{houseLevelName(houseLevel)}</p>
                </div>
                <div className="text-right">
                  <p className="text-navy-500 text-xs">Sewa saat ini</p>
                  <p className="text-gold-600 font-bold text-sm">{formatMoneyFull(calculateRent(tile, owner))}</p>
                </div>
              </div>
            ) : (
              <div className="bg-forest-500/10 rounded-xl p-4 flex items-center gap-2 border border-forest-500/20">
                <MapPin className="w-4 h-4 text-forest-600" />
                <p className="text-forest-600 text-sm font-bold">Tanah kosong — bisa dibeli</p>
              </div>
            )}
          </>
        )}

        {stateOwned && (
          <div className="bg-rust-500/10 rounded-xl p-4 border border-rust-500/20 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-rust-500" />
            <div>
              <p className="text-rust-500 font-bold text-sm">Milik Negara</p>
              <p className="text-navy-500 text-xs">Sewa: {formatMoneyFull(Math.floor((tile.rent || 0) * 0.5))}</p>
            </div>
          </div>
        )}

        {tile.type === 'start' && (
          <div className="bg-gold-400/10 rounded-xl p-4 border border-gold-400/20 text-center">
            <p className="text-gold-600 font-bold text-sm">Gajian! {formatMoneyFull(1_000_000)}</p>
            <p className="text-navy-500 text-xs mt-1">Setiap kali lewat atau mendarat di Start</p>
          </div>
        )}

        {(tile.type === 'musibah' || tile.type === 'takdir' || tile.type === 'targetir') && (
          <div className="bg-paper-200/50 rounded-xl p-4 text-center">
            <p className="text-navy-700 text-sm">Ambil kartu {tile.type === 'musibah' ? 'Musibah' : tile.type === 'takdir' ? 'Takdir' : 'Targetir'}</p>
          </div>
        )}

        {tile.type === 'lapas' && (
          <div className="bg-rust-500/10 rounded-xl p-4 border border-rust-500/20 flex items-center gap-2">
            <Lock className="w-5 h-5 text-rust-500" />
            <p className="text-rust-500 font-bold text-sm">Lapas — kunjungan aman</p>
          </div>
        )}

        {/* Players on this tile */}
        {players.filter(p => p.position === tile.id && !p.isBankrupt).length > 0 && (
          <div className="bg-paper-200/50 rounded-xl p-3">
            <p className="text-navy-500 text-xs mb-2">Pemain di sini</p>
            <div className="flex gap-2 flex-wrap">
              {players.filter(p => p.position === tile.id && !p.isBankrupt).map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-paper-200/50 rounded-lg px-2 py-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: p.color + '30', border: `1.5px solid ${p.color}` }}>
                    {p.emoji}
                  </div>
                  <span className="text-navy-700 text-xs font-medium">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

import type { Tile, GameCard } from './types';

export const BOARD_SIZE = 32;

export const BOARD: Tile[] = [
  { id: 0, name: 'Start — Gajian!', type: 'start' },
  { id: 1, name: 'Aceh', type: 'property', island: 'Sumatera', price: 600_000, rent: 40_000, rentSubsidi1: 100_000, rentSubsidi2: 200_000, rentOKB: 400_000, housePrice: 300_000, okbPrice: 500_000 },
  { id: 2, name: 'Medan', type: 'property', island: 'Sumatera', price: 600_000, rent: 40_000, rentSubsidi1: 100_000, rentSubsidi2: 200_000, rentOKB: 400_000, housePrice: 300_000, okbPrice: 500_000 },
  { id: 3, name: 'Musibah', type: 'musibah' },
  { id: 4, name: 'Padang', type: 'property', island: 'Sumatera', price: 1_000_000, rent: 60_000, rentSubsidi1: 150_000, rentSubsidi2: 300_000, rentOKB: 600_000, housePrice: 500_000, okbPrice: 800_000 },
  { id: 5, name: 'Pekanbaru', type: 'property', island: 'Sumatera', price: 1_000_000, rent: 60_000, rentSubsidi1: 150_000, rentSubsidi2: 300_000, rentOKB: 600_000, housePrice: 500_000, okbPrice: 800_000 },
  { id: 6, name: 'Takdir', type: 'takdir' },
  { id: 7, name: 'Palembang', type: 'property', island: 'Sumatera', price: 1_200_000, rent: 80_000, rentSubsidi1: 200_000, rentSubsidi2: 400_000, rentOKB: 800_000, housePrice: 600_000, okbPrice: 1_000_000 },
  { id: 8, name: 'Lapas', type: 'lapas' },
  { id: 9, name: 'Bandung', type: 'property', island: 'Jawa', price: 1_400_000, rent: 100_000, rentSubsidi1: 250_000, rentSubsidi2: 500_000, rentOKB: 1_000_000, housePrice: 700_000, okbPrice: 1_200_000 },
  { id: 10, name: 'Tilang', type: 'tilang' },
  { id: 11, name: 'Jakarta', type: 'property', island: 'Jawa', price: 2_000_000, rent: 150_000, rentSubsidi1: 400_000, rentSubsidi2: 800_000, rentOKB: 1_500_000, housePrice: 1_000_000, okbPrice: 1_500_000 },
  { id: 12, name: 'Targetir', type: 'targetir' },
  { id: 13, name: 'Semarang', type: 'property', island: 'Jawa', price: 1_600_000, rent: 120_000, rentSubsidi1: 300_000, rentSubsidi2: 600_000, rentOKB: 1_200_000, housePrice: 800_000, okbPrice: 1_300_000 },
  { id: 14, name: 'Yogyakarta', type: 'property', island: 'Jawa', price: 1_600_000, rent: 120_000, rentSubsidi1: 300_000, rentSubsidi2: 600_000, rentOKB: 1_200_000, housePrice: 800_000, okbPrice: 1_300_000 },
  { id: 15, name: 'Tol Trans-Jawa', type: 'tol', isTol: true },
  { id: 16, name: 'Pajak Tahunan', type: 'pajak' },
  { id: 17, name: 'Surabaya', type: 'property', island: 'Jawa', price: 1_800_000, rent: 140_000, rentSubsidi1: 350_000, rentSubsidi2: 700_000, rentOKB: 1_400_000, housePrice: 900_000, okbPrice: 1_400_000 },
  { id: 18, name: 'Takdir', type: 'takdir' },
  { id: 19, name: 'Denpasar', type: 'property', island: 'Jawa', price: 1_800_000, rent: 140_000, rentSubsidi1: 350_000, rentSubsidi2: 700_000, rentOKB: 1_400_000, housePrice: 900_000, okbPrice: 1_400_000 },
  { id: 20, name: 'Pungli', type: 'pungli' },
  { id: 21, name: 'Pontianak', type: 'property', island: 'Kalimantan', price: 2_200_000, rent: 180_000, rentSubsidi1: 450_000, rentSubsidi2: 900_000, rentOKB: 1_800_000, housePrice: 1_100_000, okbPrice: 1_700_000 },
  { id: 22, name: 'Musibah', type: 'musibah' },
  { id: 23, name: 'Banjarmasin', type: 'property', island: 'Kalimantan', price: 2_200_000, rent: 180_000, rentSubsidi1: 450_000, rentSubsidi2: 900_000, rentOKB: 1_800_000, housePrice: 1_100_000, okbPrice: 1_700_000 },
  { id: 24, name: 'Pengadilan', type: 'pengadilan' },
  { id: 25, name: 'Samarinda', type: 'property', island: 'Kalimantan', price: 2_400_000, rent: 200_000, rentSubsidi1: 500_000, rentSubsidi2: 1_000_000, rentOKB: 2_000_000, housePrice: 1_200_000, okbPrice: 1_800_000 },
  { id: 26, name: 'Targetir', type: 'targetir' },
  { id: 27, name: 'Makassar', type: 'property', island: 'Sulawesi', price: 2_600_000, rent: 220_000, rentSubsidi1: 550_000, rentSubsidi2: 1_100_000, rentOKB: 2_200_000, housePrice: 1_300_000, okbPrice: 2_000_000 },
  { id: 28, name: 'Tol Trans-Sulawesi', type: 'tol', isTol: true },
  { id: 29, name: 'Manado', type: 'property', island: 'Sulawesi', price: 2_600_000, rent: 220_000, rentSubsidi1: 550_000, rentSubsidi2: 1_100_000, rentOKB: 2_200_000, housePrice: 1_300_000, okbPrice: 2_000_000 },
  { id: 30, name: 'Tilang', type: 'tilang' },
  { id: 31, name: 'Ambon', type: 'property', island: 'Papua', price: 3_000_000, rent: 260_000, rentSubsidi1: 650_000, rentSubsidi2: 1_300_000, rentOKB: 2_600_000, housePrice: 1_500_000, okbPrice: 2_300_000 },
];

export const TOL_TILES = BOARD.filter(t => t.isTol).map(t => t.id);
export const BANDUNG_TILE_ID = 9;
export const LAPAS_TILE_ID = 8;

export const MUSIBAH_CARDS: GameCard[] = [
  { id: 'm1', type: 'musibah', title: 'Banjir Rob', description: 'Banjir rob! Semua pemain bayar perbaikan per properti.', effect: {}, affectsAllPlayers: true, tieredPayPerProperty: { ringan: 50_000, sedang: 100_000, brutal: 200_000 } },
  { id: 'm2', type: 'musibah', title: 'Kena Tilang', description: 'Lupa helm! Bayar denda ke negara.', effect: {}, tieredMoney: { ringan: 100_000, sedang: 300_000, brutal: 500_000 } },
  { id: 'm3', type: 'musibah', title: 'Harga BBM Naik', description: 'Bensin naik! Semua pemain bayar per properti.', effect: {}, affectsAllPlayers: true, tieredPayPerProperty: { ringan: 50_000, sedang: 100_000, brutal: 150_000 } },
  { id: 'm4', type: 'musibah', title: 'Gempa Bumi', description: 'Gempa bumi! Semua pemain bayar perbaikan per rumah.', effect: {}, affectsAllPlayers: true, tieredPayPerHouse: { ringan: 25_000, sedang: 50_000, brutal: 100_000 } },
  { id: 'm5', type: 'musibah', title: 'Kena Tipu Online', description: 'Belanja online palsu. Rugi.', effect: {}, tieredMoney: { ringan: 100_000, sedang: 250_000, brutal: 400_000 } },
  { id: 'm6', type: 'musibah', title: 'Motor Dicomet', description: 'Motor dicomot Satlantas. Bayar.', effect: {}, tieredMoney: { ringan: 50_000, sedang: 150_000, brutal: 250_000 } },
  { id: 'm7', type: 'musibah', title: 'Sakit Demam Berdarah', description: 'Kena DBD. Bayar RS.', effect: {}, tieredMoney: { ringan: 200_000, sedang: 350_000, brutal: 500_000 } },
  { id: 'm8', type: 'musibah', title: 'Jalan Lubang', description: 'Ban pecah karena lubang. Bayar.', effect: {}, tieredMoney: { ringan: 50_000, sedang: 100_000, brutal: 150_000 } },
  { id: 'm9', type: 'musibah', title: 'Pencurian Listrik', description: 'Dituduh ngebobol token listrik. Denda.', effect: {}, tieredMoney: { ringan: 100_000, sedang: 200_000, brutal: 350_000 } },
  { id: 'm10', type: 'musibah', title: 'Hujan Badai', description: 'Hujan badai! Semua pemain atap bocor, bayar per properti.', effect: {}, affectsAllPlayers: true, tieredPayPerProperty: { ringan: 50_000, sedang: 100_000, brutal: 200_000 } },
  { id: 'm11', type: 'musibah', title: 'Razia Gocek', description: 'Kena razia gocek. Denda ke negara.', effect: {}, tieredMoney: { ringan: 100_000, sedang: 200_000, brutal: 300_000 } },
  { id: 'm12', type: 'musibah', title: 'Anak Sakit', description: 'Anak demam. Bayar RS.', effect: {}, tieredMoney: { ringan: 200_000, sedang: 400_000, brutal: 600_000 } },
  { id: 'm13', type: 'musibah', title: 'HP Hilang', description: 'HP dicopet di angkot. Beli baru.', effect: {}, tieredMoney: { ringan: 300_000, sedang: 500_000, brutal: 800_000 } },
  { id: 'm14', type: 'musibah', title: 'Korsleting Listrik', description: 'Korsleting massal! Semua pemain bayar per properti.', effect: {}, affectsAllPlayers: true, tieredPayPerProperty: { ringan: 75_000, sedang: 150_000, brutal: 300_000 } },
  { id: 'm15', type: 'musibah', title: 'Debt Collector', description: 'Dikejar debt collector. Bayar.', effect: {}, tieredMoney: { ringan: 200_000, sedang: 350_000, brutal: 500_000 } },
  { id: 'm16', type: 'musibah', title: 'Macet Total', description: 'Macet 5 jam! Telat kerja, potong gaji.', effect: {}, tieredMoney: { ringan: 50_000, sedang: 100_000, brutal: 200_000 } },
  { id: 'm17', type: 'musibah', title: 'Pungli Mendadak', description: 'Kena pungli mendadak! Bayar ke negara.', effect: {}, tieredMoney: { ringan: 400_000, sedang: 700_000, brutal: 1_200_000 } },
  { id: 'm18', type: 'musibah', title: 'Gali Lubang Tutup Lubang', description: 'Proyek gagal! Tanahmu yang paling murah disita negara seharga 50%.', effect: { galiLubang: true } },
  { id: 'm19', type: 'musibah', title: 'Pembebasan Lahan', description: 'Tanahmu digusur untuk jalan tol! Tanahmu yang pertama disita dan diubah jadi tol. Gak boleh nolak.', effect: { pembebasanLahan: true }, hasStopwatch: true },
];

export const TAKDIR_CARDS: GameCard[] = [
  { id: 't1', type: 'takdir', title: 'Lulus CPNS!', description: 'Lulus CPNS! Kocok dadu: genap dapat gaji, ganjil malah bayar biaya tes.', effect: { rollDice: true, evenReward: 1_000_000, oddPenalty: 500_000 } },
  { id: 't2', type: 'takdir', title: 'Menang Arisan', description: 'Arisan ketemu! Genap dapat jackpot, ganjil malah setor iuran.', effect: { rollDice: true, evenReward: 1_500_000, oddPenalty: 300_000 } },
  { id: 't3', type: 'takdir', title: 'Warisan Datang', description: 'Ada warisan dari om jauh. Genap dapat warisan, ganjil malah biaya waris.', effect: { rollDice: true, evenReward: 2_000_000, oddPenalty: 800_000 } },
  { id: 't4', type: 'takdir', title: 'BLT Cair', description: 'BLT katanya cair. Genap dapat BLT, ganjil malah ditolak dan bayar administrasi.', effect: { rollDice: true, evenReward: 800_000, oddPenalty: 200_000 } },
  { id: 't5', type: 'takdir', title: 'Go To Lapas', description: 'Kena OTK! Langsung ke lapas. Gak perlu kocok dadu.', effect: { goToJail: true } },
  { id: 't6', type: 'takdir', title: 'Kartu Bebas Lapas', description: 'Dapat surat dari orang dalam. Simpan untuk bebas dari lapas.', effect: { getOutCard: true } },
  { id: 't7', type: 'takdir', title: 'Jual Gorengan Laris', description: 'Buka jualan gorengan. Genap laris untung, ganjil sepi rugi modal.', effect: { rollDice: true, evenReward: 500_000, oddPenalty: 150_000 } },
  { id: 't8', type: 'takdir', title: 'THR Lebaran', description: 'THR katanya cair. Genap dapat THR penuh, ganjil malah dipotong pajak THR.', effect: { rollDice: true, evenReward: 1_200_000, oddPenalty: 400_000 } },
  { id: 't9', type: 'takdir', title: 'Untung Saham', description: 'Saham naik! Genap profit, ganjil malah rugi saham.', effect: { rollDice: true, evenReward: 1_800_000, oddPenalty: 600_000 } },
  { id: 't10', type: 'takdir', title: 'Mudik Gratis', description: 'Program mudik gratis! Pindah ke Start dan terima gajian.', effect: { moveTo: 0 } },
  { id: 't11', type: 'takdir', title: 'Promosi Kantor', description: 'Naik jabatan! Genap dapat bonus, ganjil malah dipindah ke cabang terpencil.', effect: { rollDice: true, evenReward: 1_500_000, oddPenalty: 500_000 } },
  { id: 't12', type: 'takdir', title: 'Lomba Makan Kerupuk', description: 'Ikut lomba! Genap menang dapat hadiah dari semua pemain, ganjil malah bayar kompensasi.', effect: { rollDice: true, evenReward: 1_000_000, oddPenalty: 300_000, collectPerPlayer: 300_000 } },
  { id: 't13', type: 'takdir', title: 'Beasiswa Anak', description: 'Anak daftar beasiswa. Genap dapat beasiswa, ganjil malah bayar SPP.', effect: { rollDice: true, evenReward: 1_000_000, oddPenalty: 350_000 } },
  { id: 't14', type: 'takdir', title: 'Rumah Dikontrak', description: 'Sewa rumah laku. Genap dapat dari semua pemain, ganjil malah bocor dan bayar perbaikan.', effect: { rollDice: true, evenReward: 1_500_000, oddPenalty: 500_000, collectPerPlayer: 700_000 } },
  { id: 't15', type: 'takdir', title: 'Gubernur Foya-Foya', description: 'Gubernur foya-foya! Langsung dapat 1 Rumah Subsidi gratis di tanah milikmu.', effect: { freeUpgrade: true } },
  { id: 't16', type: 'takdir', title: 'Menang Undian', description: 'Ikut undian sembako. Genap menang, ganjil malah kena tipu undian.', effect: { rollDice: true, evenReward: 600_000, oddPenalty: 200_000 } },
  { id: 't17', type: 'takdir', title: 'Jalur Orang Dalam', description: 'Kenal orang dalam. Dapat properti gratis di lokasi kosong mana saja!', effect: { freeProperty: true } },
  { id: 't18', type: 'takdir', title: 'Dana Desa Cair', description: 'Dana desa katanya cair. Genap dapat dana, ganjil malah dana disalahgunakan.', effect: { rollDice: true, evenReward: 900_000, oddPenalty: 300_000 } },
  { id: 't19', type: 'takdir', title: 'Gajian Dobel', description: 'Lembur intens! Genap gajian dobel, ganjil malah dipotong karena telat.', effect: { rollDice: true, evenReward: 2_500_000, oddPenalty: 800_000 } },
  { id: 't20', type: 'takdir', title: 'Kartu Pelindung', description: 'Dapat kartu pelindung! Simpan untuk menangkal 1 musibah.', effect: { protection: true } },
];

export const TARGETIR_CARDS: GameCard[] = [
  { id: 'tg1', type: 'targetir', title: 'Sita Negara', description: 'Negara sita tanahmu yang paling murah! Dapat 50% harga beli. Tanah jadi milik negara (bayar sewu ke negara).', effect: { jualWajib: true }, hasStopwatch: true },
  { id: 'tg2', type: 'targetir', title: 'Pungutan Liar Massal', description: 'Semua pemain bayar Rp500.000 ke negara.', effect: { payPerPlayer: 500_000 }, hasStopwatch: true },
  { id: 'tg3', type: 'targetir', title: 'Pembebasan Lahan Tol', description: 'Tanahmu yang pertama dibeli diubah jadi jalan tol! Digusur, gak boleh nolak. Dapat ganti rugi 50%.', effect: { pembebasanLahan: true }, hasStopwatch: true },
  { id: 'tg4', type: 'targetir', title: 'Bedah Rumah', description: 'Program bedah rumah! Kamu dapat upgrade 1 Rumah Subsidi jadi Rumah OKB secara gratis.', effect: { freeUpgrade: true } },
  { id: 'tg5', type: 'targetir', title: 'Pajak Mendadak', description: 'Pajak mendadak! Bayar Rp300.000 per properti yang kamu miliki.', effect: { payPerProperty: 300_000 } },
  { id: 'tg6', type: 'targetir', title: 'Gali Lubang Tutup Lubang', description: 'Proyek gagal! Tanahmu yang paling murah disita negara seharga 50%.', effect: { galiLubang: true } },
];

export function formatMoney(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return m % 1 === 0 ? `Rp ${m} jt` : `Rp ${m.toFixed(1)} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)}rb`;
  }
  return `Rp ${amount}`;
}

export function formatMoneyFull(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

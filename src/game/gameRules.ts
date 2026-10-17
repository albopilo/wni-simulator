/**
 * Central rules configuration for WNI Simulator.
 * All numerical values preserved from the original implementation.
 * Values marked as "unverified" have not been checked against the official rulebook.
 */

export const RULES = {
  // [Terverifikasi] Starting cash: Rp10,000,000 per player (gameplay demo)
  startingCash: 10_000_000,
  // [Terverifikasi] Salary: Rp1,000,000 when passing/landing on Start (gameplay demo)
  salary: 1_000_000,
  // [Implementasi] Jail bail — unverified, matches lapasFine
  jailBail: 1_500_000,
  // [Terverifikasi] Annual tax: Rp500,000 per land certificate owned (gameplay demo)
  taxPerProperty: 500_000,
  // [Terverifikasi] Pungli fee: Rp1,000,000 (gameplay demo)
  pungliFee: 1_000_000,
  // [Implementasi] Tilang fine — unverified
  tilangFine: 500_000,
  // [Terverifikasi] Pengadilan lose outcome: go to jail + pay Rp1,500,000 (gameplay demo)
  lapasFine: 1_500_000,
  // [Terverifikasi] Toll fee: Rp500,000 (gameplay demo)
  tolFee: 500_000,
  // [Terverifikasi] Pengadilan win outcome: receive Rp1,000,000 (gameplay demo)
  pengadilanCompensation: 1_000_000,
  // [Implementasi] Max jail turns — unverified
  maxJailTurns: 3,
  // [Terverifikasi] Stopwatch cards active after every player has passed 2 rounds (gameplay demo)
  stopwatchRoundThreshold: 2,

  // [Terverifikasi] Pengadilan die outcomes (gameplay demo):
  // Roll 1–2: go to jail and lose 50% of current cash to the state
  // Roll 3–4: go to jail and pay Rp1,500,000
  // Roll 5–6: receive Rp1,000,000
  pengadilan: {
    winThreshold: 5,    // die >= 5 → win compensation
    loseThreshold: 3,   // die >= 3 → jail + fine
    brutalMax: 2,       // die <= 2 → jail + 50% cash seized
  },

  // Musibah severity die thresholds
  musibah: {
    ringanMin: 5,   // die >= 5
    sedangMin: 3,   // die >= 3
    // die 1-2 → brutal
  },

  // Bankruptcy: creditor seizes bankrupt player's cash + properties
  bankruptcy: {
    propertyRefundRate: 0, // bankrupt player's properties transfered to creditor at no cost
  },

  // State confiscation (galiLubang, jualWajib, pembebasanLahan)
  confiscation: {
    refundRate: 0.5, // 50% of purchase price returned
  },

  // State-owned land rent is 50% of base rent
  stateOwnedRentRate: 0.5,

  // [Terverifikasi] Doubles do NOT grant an extra movement turn.
  // Resolve the landing effect first, then resolve the applicable Takdir effect.
  // (gameplay demo: "Dobel dadu tidak otomatis dapat giliran lagi")
  doublesExtraTurn: false,
  // [Implementasi] Three consecutive doubles send to Lapas — unverified
  doublesJailThreshold: 3,

  // Victory: last non-bankrupt player wins
  victoryCondition: 'lastStanding' as 'lastStanding' | 'netWorth',
} as const;

/**
 * Indonesian-language rules reference.
 * Items marked [Terverifikasi] are verified against the official rulebook.
 * Items marked [Implementasi] are configurable implementation rules that
 * have NOT been verified against the official rulebook.
 */
export const RULES_REFERENCE: { category: string; items: { label: string; value: string; verified: boolean }[] }[] = [
  {
    category: 'Uang & Gajian',
    items: [
      { label: 'Uang Awal', value: 'Rp 10.000.000', verified: true },
      { label: 'Gajian di Start', value: 'Rp 1.000.000', verified: true },
      { label: 'Gajian Dobel (kartu)', value: 'Rp 2.500.000', verified: false },
    ],
  },
  {
    category: 'Lapas (Penjara)',
    items: [
      { label: 'Bebas dengan Jaminan', value: 'Rp 1.500.000', verified: false },
      { label: 'Denda setelah 3 putaran', value: 'Rp 1.500.000', verified: false },
      { label: 'Maksimal putaran di lapas', value: '3 putaran', verified: false },
      { label: 'Dobel dadu = bebas', value: 'Ya', verified: false },
    ],
  },
  {
    category: 'Pajak & Denda',
    items: [
      { label: 'Pajak Tahunan (per properti)', value: 'Rp 500.000', verified: true },
      { label: 'Tilang', value: 'Rp 500.000', verified: false },
      { label: 'Pungli', value: 'Rp 1.000.000', verified: true },
      { label: 'Bebas Pungli (punya Bandung)', value: 'Ya', verified: false },
    ],
  },
  {
    category: 'Pengadilan',
    items: [
      { label: 'Menang (dadu 5-6)', value: 'Kompensasi Rp 1.000.000', verified: true },
      { label: 'Kalah (dadu 3-4)', value: 'Lapas + denda Rp 1.500.000', verified: true },
      { label: 'Brutal (dadu 1-2)', value: 'Lapas + 50% uang disita', verified: true },
    ],
  },
  {
    category: 'Jalan Tol',
    items: [
      { label: 'Biaya Tol', value: 'Rp 500.000', verified: true },
      { label: 'Pindah ke tol lain', value: 'Ya, pilih tujuan', verified: false },
    ],
  },
  {
    category: 'Musibah',
    items: [
      { label: 'Dadu 5-6', value: 'Ringan', verified: false },
      { label: 'Dadu 3-4', value: 'Sedang', verified: false },
      { label: 'Dadu 1-2', value: 'Brutal', verified: false },
    ],
  },
  {
    category: 'Bangunan',
    items: [
      { label: 'Level 1', value: '1 Rumah Subsidi', verified: false },
      { label: 'Level 2', value: '2 Rumah Subsidi', verified: false },
      { label: 'Level 3', value: 'Rumah OKB', verified: false },
      { label: 'Bangun saat gajian', value: 'Ya, sebelum jalan', verified: true },
    ],
  },
  {
    category: 'Kartu Khusus',
    items: [
      { label: 'Kartu Bebas Lapas', value: 'Bebas dari lapas tanpa bayar', verified: false },
      { label: 'Kartu Pelindung', value: 'Tangkal 1 musibah', verified: false },
      { label: 'Stopwatch', value: 'Aktif setelah semua pemain 2 putaran', verified: true },
    ],
  },
  {
    category: 'Dadu Kembar (Doubles)',
    items: [
      { label: 'Extra turn on doubles', value: 'Tidak (tidak dapat giliran lagi)', verified: true },
      { label: 'Batas kembar berturut-turut', value: '3x = langsung Lapas', verified: false },
      { label: 'Dobel di Lapas', value: 'Bebas, tanpa extra turn', verified: false },
    ],
  },
  {
    category: 'Kemenangan',
    items: [
      { label: 'Kondisi menang', value: 'Pemain terakhir yang tidak bangkrut', verified: false },
    ],
  },
];

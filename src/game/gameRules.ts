/**
 * Central rules configuration for WNI Simulator.
 * All numerical values preserved from the original implementation.
 * Values marked as "unverified" have not been checked against the official rulebook.
 */

export const RULES = {
  startingCash: 5_000_000,
  salary: 1_000_000,
  jailBail: 1_500_000,
  taxPerProperty: 500_000,
  pungliFee: 1_000_000,
  tilangFine: 500_000,
  lapasFine: 1_500_000,
  tolFee: 500_000,
  pengadilanCompensation: 1_000_000,
  maxJailTurns: 3,
  stopwatchRoundThreshold: 2,

  // Pengadilan die thresholds
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

  // Doubles: rolling doubles grants an extra turn.
  // UNVERIFIED — the official WNI Simulator rulebook has not been checked.
  // When enabled: rolling doubles gives the player another turn after resolving
  // the current tile. Three consecutive doubles send the player to Lapas (jail).
  // Jail exception: doubles rolled while in jail only releases the player — it
  // does NOT grant an extra turn.
  doublesExtraTurn: true,
  doublesJailThreshold: 3, // consecutive doubles that trigger jail

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
      { label: 'Uang Awal', value: 'Rp 5.000.000', verified: false },
      { label: 'Gajian di Start', value: 'Rp 1.000.000', verified: false },
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
      { label: 'Pajak Tahunan (per properti)', value: 'Rp 500.000', verified: false },
      { label: 'Tilang', value: 'Rp 500.000', verified: false },
      { label: 'Pungli', value: 'Rp 1.000.000', verified: false },
      { label: 'Bebas Pungli (punya Bandung)', value: 'Ya', verified: false },
    ],
  },
  {
    category: 'Pengadilan',
    items: [
      { label: 'Menang (dadu 5-6)', value: 'Kompensasi Rp 1.000.000', verified: false },
      { label: 'Kalah (dadu 3-4)', value: 'Lapas + denda Rp 1.500.000', verified: false },
      { label: 'Brutal (dadu 1-2)', value: 'Lapas + 50% uang disita', verified: false },
    ],
  },
  {
    category: 'Jalan Tol',
    items: [
      { label: 'Biaya Tol', value: 'Rp 500.000', verified: false },
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
      { label: 'Bangun saat gajian', value: 'Ya, sebelum jalan', verified: false },
    ],
  },
  {
    category: 'Kartu Khusus',
    items: [
      { label: 'Kartu Bebas Lapas', value: 'Bebas dari lapas tanpa bayar', verified: false },
      { label: 'Kartu Pelindung', value: 'Tangkal 1 musibah', verified: false },
      { label: 'Stopwatch', value: 'Aktif setelah semua pemain 2 putaran', verified: false },
    ],
  },
  {
    category: 'Dadu Kembar (Doubles)',
    items: [
      { label: 'Extra turn on doubles', value: 'Ya (dapat giliran lagi)', verified: false },
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

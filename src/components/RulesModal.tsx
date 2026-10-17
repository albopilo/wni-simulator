import { RULES_REFERENCE } from '@/game/gameRules';
import { X, BookOpen } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease]">
      <div className="max-w-2xl w-full max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl border border-paper-300 bg-gradient-to-br from-paper-50 to-paper-100 flex flex-col animate-[slideUp_0.3s_ease]">
        <div className="flex items-center justify-between p-5 border-b border-paper-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-400/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h2 className="text-navy-800 font-bold text-lg">Aturan Permainan</h2>
              <p className="text-navy-500 text-xs">Referensi aturan WNI Simulator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-paper-300 hover:bg-paper-400 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-navy-500" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          <div className="bg-gold-400/10 rounded-xl p-3 border border-gold-400/20">
            <p className="text-gold-700 text-xs leading-relaxed">
              <strong>Catatan:</strong> Nilai ditandai <span className="text-navy-600">[Implementasi]</span> belum diverifikasi
              dengan buku aturan resmi. Nilai bertanda <span className="text-forest-600">[Terverifikasi]</span> sesuai gameplay demo.
            </p>
          </div>

          {RULES_REFERENCE.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-gold-600 font-bold text-sm uppercase tracking-wide">{section.category}</h3>
              <div className="bg-paper-200/50 rounded-xl divide-y divide-paper-300/50 border border-paper-300/50">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-navy-700 text-sm">{item.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                        item.verified
                          ? 'bg-forest-500/20 text-forest-600'
                          : 'bg-paper-300 text-navy-400'
                      }`}>
                        {item.verified ? 'Terverifikasi' : 'Implementasi'}
                      </span>
                    </div>
                    <span className="text-navy-800 font-semibold text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="bg-paper-200/50 rounded-xl p-4 border border-paper-300/50">
            <h3 className="text-gold-600 font-bold text-sm uppercase tracking-wide mb-2">Cara Bermain</h3>
            <ul className="text-navy-600 text-xs leading-relaxed space-y-1.5">
              <li>• Lempar dadu untuk bergerak di papan. Lewat Start = gajian Rp 1.000.000.</li>
              <li>• Beli tanah kosong yang kamu injak, atau skip. Tanah punya sewa untuk pemain lain yang mendarat.</li>
              <li>• Bangun Rumah Subsidi (level 1-2) lalu upgrade ke Rumah OKB (level 3) saat gajian.</li>
              <li>• Musibah: kocok dadu untuk tingkat keparahan (5-6 ringan, 3-4 sedang, 1-2 brutal).</li>
              <li>• Dobel dadu = wajib ambil kartu Takdir (tanpa giliran lagi). 3x dobel berturut-turut = langsung Lapas.</li>
              <li>• Targetir: kartu pemerintah yang merugikan pemain.</li>
              <li>• Lapas: 3 putaran max. Bayar jaminan, gunakan kartu bebas, atau lempar dobel.</li>
              <li>• Pengadilan: kocok dadu nasib — menang, kalah, atau brutal.</li>
              <li>• Pungli: bayar ke negara, kecuali punya tanah Bandung (bebas).</li>
              <li>• Pajak: bayar per properti yang dimiliki.</li>
              <li>• Jalan Tol: bayar tol, pindah ke tol lain.</li>
              <li>• Kartu Pelindung: tangkal 1 musibah. Kartu Bebas Lapas: bebas tanpa bayar.</li>
              <li>• Pemain terakhir yang tidak bangkrut = pemenang. Tapi negara selalu menang.</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border-t border-paper-300">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-gold-400 to-rust-500 text-white font-bold hover:scale-[1.01] transition-all"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}

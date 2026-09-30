import React from 'react';
import { X, Check } from 'lucide-react';
import { formatRupiah } from '../utils/format';

interface QrisModalProps {
  isOpen: boolean;
  totalAmount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const QrisModal: React.FC<QrisModalProps> = ({
  isOpen,
  totalAmount,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-center">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-base">📱</span>
            <h3 className="font-black text-sm text-slate-900">QRIS Dinamis Kasir Kios</h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer p-1 leading-none"
            title="Keluar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Total Tagihan Pembayaran:
            </span>
            <div className="text-2xl font-black text-emerald-950 font-mono mt-0.5">
              {formatRupiah(totalAmount)}
            </div>
          </div>

          {/* Visual QRIS Card */}
          <div className="p-4 bg-white rounded-2xl border-2 border-slate-900 shadow-md inline-block mx-auto">
            <div className="text-[10px] font-black tracking-widest text-slate-900 uppercase mb-2">
              QRIS STANDAR PEMBAYARAN NASIONAL
            </div>
            <div className="w-48 h-48 mx-auto bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center text-white">
              <svg className="w-36 h-36 text-white" viewBox="0 0 100 100" fill="currentColor">
                <path d="M10 10h30v30h-30zM15 15v20h20v-20zM20 20h10v10h-10zM60 10h30v30h-30zM65 15v20h20v-20zM70 20h10v10h-10zM10 60h30v30h-30zM15 65v20h20v-20zM20 70h10v10h-10zM50 50h10v10h-10zM70 50h10v10h-10zM50 70h10v20h-10zM70 70h20v10h-20zM80 80h10v10h-10z" />
              </svg>
              <span className="font-mono font-bold mt-1 text-[9px] text-emerald-400">NMID: ID102030495819</span>
            </div>
            <div className="text-[11px] font-extrabold text-slate-900 mt-2">PT. NIRWANA JAYA NUGRAHA</div>
            <div className="text-[9px] text-slate-500">BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay</div>
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Arahkan kamera smartphone ke kode QR</span>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={onClose}
              type="button"
              className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold text-xs cursor-pointer transition-colors"
            >
              🚪 Keluar / Batal
            </button>
            <button
              onClick={onConfirm}
              type="button"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs cursor-pointer shadow-xs transition-colors inline-flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>Konfirmasi Lunas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

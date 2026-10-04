import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { PosProduct } from '../types';
import { ProductImage } from './ProductImage';

interface RestockModalProps {
  product: PosProduct | null;
  initialQty?: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (productId: string, qty: number, notes?: string) => void;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  product,
  initialQty = 10,
  isOpen,
  onClose,
  onSave
}) => {
  const [qty, setQty] = useState(initialQty);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (product) {
      setQty(initialQty > 0 ? initialQty : 10);
      setNotes('');
    }
  }, [product, initialQty]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty > 0) {
      onSave(product.id, qty, notes);
      onClose();
    }
  };

  const isCritical = product.urgency === 'critical';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
              +
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900">Tambah Stok Masuk (Restok)</h3>
              <p className="text-[10px] text-slate-500">Pembaruan stok inventaris kios &amp; gudang NJN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer p-1 leading-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info Produk & Analisis Restok */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Produk Terpilih:</span>
              <span
                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                  isCritical
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isCritical ? '🚨 Stok Kritis' : '⚠️ Perlu Restok'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <ProductImage
                src={product.imageUrl}
                alt={product.name}
                category={product.category}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="font-black text-sm text-slate-900 leading-snug">{product.name}</div>
                <div className="text-[10px] font-mono text-slate-400">{product.sku} • {product.category}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Stok Ready:</span>
                <strong className="text-slate-800 font-mono font-bold">
                  {product.stock} {product.unit}
                </strong>
              </div>
              <div className="border-x border-slate-200 px-2 text-center">
                <span className="text-slate-400 text-[10px] block">Laju Jual:</span>
                <strong className="text-blue-700 font-mono font-bold">
                  ~{product.monthlyAvgSales}/bln
                </strong>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Saran Sistem:</span>
                <strong className="text-emerald-700 font-mono font-black">
                  +{product.recommendedReorderQty || 10}
                </strong>
              </div>
            </div>
          </div>

          {/* Input Jumlah Penambahan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jumlah Stok Tambahan yang Masuk:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-black text-slate-700 text-lg flex items-center justify-center cursor-pointer select-none transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min="1"
                max="100000"
                value={qty}
                onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                required
                className="flex-1 px-3 py-2 h-10 text-center font-mono font-black text-lg rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#c62828] bg-white text-slate-900"
              />
              <button
                type="button"
                onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 font-black text-slate-700 text-lg flex items-center justify-center cursor-pointer select-none transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Presets Cepat */}
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Preset Tambah Cepat:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[5, 10, 25, 50].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setQty(val)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          {/* Keterangan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Keterangan / Sumber Tambahan (Opsional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Keterangan restok (misal: Kiriman Supplier / Restok Toko)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#c62828] bg-white text-slate-800"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
            >
              Keluar / Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Tambah Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Boxes,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Repeat,
  ClipboardCheck,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { store } from '../store';
import { PosProduct, StockMovement, StockOpnameRecord } from '../types';
import { formatRupiah, formatNumber } from '../utils/format';
import { ProductImage } from './ProductImage';

interface InventoryModuleProps {
  onOpenRestockModal: (product: PosProduct, suggestedQty?: number) => void;
  onOpenCreateNota?: (product?: PosProduct, suggestedQty?: number) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  onOpenRestockModal,
  onOpenCreateNota,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'katalog' | 'masuk' | 'keluar' | 'restok' | 'transfer' | 'opname' | 'mutasi'>('katalog');
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<PosProduct | null>(null);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    sku: '',
    stock: 0,
    minStock: 0,
    price: 0,
    priceProject: 0,
    hppPrice: 0,
    rackLocation: ''
  });

  // Form States for Stock In / Out
  const [stockInOutForm, setStockInOutForm] = useState({
    productId: '',
    qty: 1,
    referenceNo: '',
    sourceLocation: 'Gudang Utama',
    targetLocation: 'Kios Bandung',
    notes: ''
  });

  // Transfer Form State
  const [transferForm, setTransferForm] = useState({
    productId: '',
    qty: 1,
    sourceLocation: 'Gudang Utama Roll A',
    targetLocation: 'Kios Retail Etalase K-01',
    notes: 'Pemindahan display toko'
  });

  // Stock Opname Form State
  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  const [opnameWarehouse, setOpnameWarehouse] = useState('Gudang Utama Bandung');
  const [opnameCounts, setOpnameCounts] = useState<{ [productId: string]: number }>({});
  const [opnameNotes, setOpnameNotes] = useState<{ [productId: string]: string }>({});

  const products = store.getProducts();
  const smartRestockItems = store.getSmartRestockRecommendations();
  const movements = store.getStockMovements();
  const opnames = store.getStockOpnames();

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  });

  // Edit & Delete Handlers for Product
  const handleOpenEditProduct = (p: PosProduct) => {
    setEditingProduct(p);
    setEditProductForm({
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      minStock: p.minStock,
      price: p.price,
      priceProject: p.priceProject || p.price,
      hppPrice: p.hppPrice,
      rackLocation: p.rackLocation || ''
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    store.updateProduct(editingProduct.id, {
      name: editProductForm.name,
      sku: editProductForm.sku,
      stock: Number(editProductForm.stock) || 0,
      minStock: Number(editProductForm.minStock) || 0,
      price: Number(editProductForm.price) || 0,
      priceProject: Number(editProductForm.priceProject) || 0,
      hppPrice: Number(editProductForm.hppPrice) || 0,
      rackLocation: editProductForm.rackLocation
    });
    setIsEditProductModalOpen(false);
    setEditingProduct(null);
    onNotify?.(`Data dan stok barang ${editProductForm.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteProduct = (p: PosProduct) => {
    if (confirm(`HAPUS BARANG DARI INVENTARIS?\n\nNama: ${p.name}\nSKU: ${p.sku}\nStok Saat Ini: ${p.stock} ${p.unit}\n\nBarang akan dihapus dari sistem.`)) {
      store.deleteProduct(p.id);
      onNotify?.(`Barang ${p.name} berhasil dihapus dari inventaris!`, 'success');
    }
  };

  // Handle Quick Stock In / Out
  const handleStockAdjust = (type: 'masuk' | 'keluar') => {
    if (!stockInOutForm.productId || stockInOutForm.qty <= 0) {
      onNotify?.('Pilih produk dan masukkan kuantitas yang valid!', 'error');
      return;
    }
    const delta = type === 'masuk' ? stockInOutForm.qty : -stockInOutForm.qty;
    const ref = stockInOutForm.referenceNo || `ADJ-${Date.now().toString().slice(-6)}`;
    store.adjustStock(
      stockInOutForm.productId,
      delta,
      stockInOutForm.notes || (type === 'masuk' ? 'Penambahan stok manual' : 'Pengeluaran operasional'),
      ref
    );
    const prod = products.find(p => p.id === stockInOutForm.productId);
    onNotify?.(`Stok ${prod?.name} berhasil diubah (${type === 'masuk' ? '+' : '-'}${stockInOutForm.qty} ${prod?.unit})`, 'success');
    setStockInOutForm({ ...stockInOutForm, qty: 1, referenceNo: '', notes: '' });
  };

  // Handle Transfer
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.productId || transferForm.qty <= 0) return;
    const prod = products.find(p => p.id === transferForm.productId);
    if (!prod || prod.stock < transferForm.qty) {
      onNotify?.(`Stok tidak mencukupi untuk transfer! Sisa stok: ${prod?.stock || 0}`, 'error');
      return;
    }
    store.transferStock(
      transferForm.productId,
      transferForm.qty,
      transferForm.sourceLocation,
      transferForm.targetLocation,
      transferForm.notes
    );
    onNotify?.(`Transfer ${transferForm.qty} ${prod.unit} ${prod.name} sukses dicatat.`, 'success');
    setTransferForm({ ...transferForm, qty: 1, notes: '' });
  };

  // Handle Start Opname
  const handleOpenOpname = () => {
    const counts: { [id: string]: number } = {};
    products.forEach(p => {
      counts[p.id] = p.stock; // Default ke sistem stok awal
    });
    setOpnameCounts(counts);
    setIsOpnameModalOpen(true);
  };

  // Handle Save Opname
  const handleSaveOpname = () => {
    const items = products.map(p => {
      const physicalQty = opnameCounts[p.id] !== undefined ? opnameCounts[p.id] : p.stock;
      const differenceQty = physicalQty - p.stock;
      const totalDiffAmount = differenceQty * p.hppPrice;
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        systemQty: p.stock,
        physicalQty,
        differenceQty,
        hppPrice: p.hppPrice,
        totalDiffAmount,
        notes: opnameNotes[p.id] || (differenceQty === 0 ? 'Sesuai' : 'Penyesuaian Fisik')
      };
    });

    const totalDiffAmount = items.reduce((sum, it) => sum + it.totalDiffAmount, 0);

    store.postStockOpname({
      warehouse: opnameWarehouse,
      auditor: store.getCurrentUser().name,
      items,
      totalDifferenceAmount: totalDiffAmount
    });

    setIsOpnameModalOpen(false);
    onNotify?.('Stock Opname berhasil diposting dan saldo stok diperbarui!', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Boxes className="w-4 h-4" />
            <span>MODUL 3: INVENTORY & MANAJEMEN STOK</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Kontrol Stok & Pergudangan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola barang masuk, pengeluaran stok, rekomendasi restok cerdas, transfer antar lokasi, dan stock opname fisik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenOpname}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <ClipboardCheck className="w-4 h-4 text-emerald-400" />
            <span>+ Mulai Stock Opname</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('katalog')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'katalog' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Status Stok ({products.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('restok')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'restok' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Restok Cerdas ({smartRestockItems.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('masuk')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'masuk' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          <span>Stok Masuk</span>
        </button>
        <button
          onClick={() => setActiveTab('keluar')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'keluar' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-rose-600" />
          <span>Stok Keluar</span>
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'transfer' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Transfer Stok</span>
        </button>
        <button
          onClick={() => setActiveTab('opname')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'opname' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Riwayat Opname ({opnames.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('mutasi')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'mutasi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Kartu Mutasi ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: STATUS STOK KATALOG */}
      {activeTab === 'katalog' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, Nama Barang, Rak..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Valuasi Aset Stok: <span className="font-bold text-slate-900">{formatRupiah(store.getOverallKPI().totalAsetStok)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">SKU & Barang</th>
                  <th className="py-3 px-3 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-3 text-center">Batas Minimum</th>
                  <th className="py-3 px-3">Lokasi Rak</th>
                  <th className="py-3 px-3 text-right">Nilai Aset (HPP)</th>
                  <th className="py-3 px-3 text-center">Status Restok</th>
                  <th className="py-3 px-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map(p => {
                  const isLow = p.stock <= p.minStock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={p.imageUrl}
                            alt={p.name}
                            category={p.category}
                            size="sm"
                          />
                          <div>
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{p.sku} • {p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className={`text-sm font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.stock}
                        </span>{' '}
                        <span className="text-slate-500 text-[11px]">{p.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {p.minStock} {p.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.rackLocation || 'Gudang Utama'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {formatRupiah(p.stock * p.hppPrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.urgency === 'critical' ? 'bg-rose-100 text-rose-700' :
                          p.urgency === 'warning' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {p.urgency === 'critical' ? 'Kritis' : p.urgency === 'warning' ? 'Perhatian' : 'Optimal'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenRestockModal(p, p.recommendedReorderQty)}
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px] shadow-xs transition"
                            title="Restok Barang"
                          >
                            + Restok
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1 text-slate-700 hover:bg-amber-100 hover:text-amber-900 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Edit Data & Stok Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition cursor-pointer"
                            title="Hapus Barang dari Inventaris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RESTOK CERDAS REKOMENDASI */}
      {activeTab === 'restok' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Rekomendasi Cerdas Pemesanan Ulang (Reorder Point)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Dihitung berdasarkan kecepatan penjualan harian, waktu tunggu supplier (lead-time), dan sisa hari stok habis.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartRestockItems.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      category={p.category}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-slate-400">{p.sku}</span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug truncate" title={p.name}>{p.name}</h4>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase ${
                    p.urgency === 'critical' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {p.urgency === 'critical' ? 'Kritis' : 'Perhatian'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200 text-center font-mono">
                  <div>
                    <span className="text-[9px] text-slate-500 block">Sisa Stok</span>
                    <span className="text-xs font-black text-rose-600">{p.stock} {p.unit}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Lead Time</span>
                    <span className="text-xs font-bold text-slate-700">{p.leadTimeDays} Hari</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">Saran Order</span>
                    <span className="text-xs font-black text-emerald-700">+{p.recommendedReorderQty}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onOpenRestockModal(p, p.recommendedReorderQty)}
                    className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition"
                  >
                    Tambah Stok Cepat
                  </button>
                  <button
                    onClick={() => onOpenCreateNota?.(p, p.recommendedReorderQty)}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
                  >
                    + Buat PO Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3 & 4: STOK MASUK / STOK KELUAR */}
      {(activeTab === 'masuk' || activeTab === 'keluar') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              activeTab === 'masuk' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              {activeTab === 'masuk' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                {activeTab === 'masuk' ? 'Pencatatan Stok Masuk' : 'Pencatatan Stok Keluar Operasional'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'masuk'
                  ? 'Catat penambahan stok manual atau penerimaan barang non-PO'
                  : 'Catat pengeluaran barang untuk sampel, proyek internal, atau barang rusak'}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih Barang *</label>
              <select
                value={stockInOutForm.productId}
                onChange={e => setStockInOutForm({ ...stockInOutForm, productId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              >
                <option value="">-- Pilih Barang --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Saat Ini: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Preview Card */}
            {stockInOutForm.productId && (() => {
              const selectedP = products.find(p => p.id === stockInOutForm.productId);
              if (!selectedP) return null;
              return (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <ProductImage
                    src={selectedP.imageUrl}
                    alt={selectedP.name}
                    category={selectedP.category}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{selectedP.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      SKU: {selectedP.sku} • Stok: <strong className="text-slate-800">{selectedP.stock} {selectedP.unit}</strong> • Rak: {selectedP.rackLocation || 'Gudang Utama'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kuantitas Unit *</label>
                <input
                  type="number"
                  min="1"
                  value={stockInOutForm.qty}
                  onChange={e => setStockInOutForm({ ...stockInOutForm, qty: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Referensi Dokumen</label>
                <input
                  type="text"
                  placeholder="Contoh: REF/SM/001"
                  value={stockInOutForm.referenceNo}
                  onChange={e => setStockInOutForm({ ...stockInOutForm, referenceNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Keterangan / Alasan Mutasi</label>
              <textarea
                rows={2}
                placeholder="Contoh: Pengambilan sampel uji proyek Gedebage atau retur dari customer"
                value={stockInOutForm.notes}
                onChange={e => setStockInOutForm({ ...stockInOutForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              onClick={() => handleStockAdjust(activeTab === 'masuk' ? 'masuk' : 'keluar')}
              className={`w-full py-2.5 rounded-xl font-black text-xs shadow-md transition ${
                activeTab === 'masuk'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {activeTab === 'masuk' ? '+ Posting Stok Masuk' : '- Posting Stok Keluar'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: TRANSFER STOK */}
      {activeTab === 'transfer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Transfer Stok Antar Lokasi / Gudang</h3>
              <p className="text-xs text-slate-500">
                Pindahkan stok fisik dari Gudang Utama ke Toko Kios, Workshop Panel, atau Lokasi Proyek.
              </p>
            </div>
          </div>

          <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilih Barang yang Dipindahkan *</label>
              <select
                required
                value={transferForm.productId}
                onChange={e => setTransferForm({ ...transferForm, productId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
              >
                <option value="">-- Pilih Barang --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Tersedia: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Product Preview Card */}
            {transferForm.productId && (() => {
              const selectedP = products.find(p => p.id === transferForm.productId);
              if (!selectedP) return null;
              return (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center gap-3">
                  <ProductImage
                    src={selectedP.imageUrl}
                    alt={selectedP.name}
                    category={selectedP.category}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">{selectedP.name}</div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      Stok Fisik Tersedia: <strong className="text-emerald-700">{selectedP.stock} {selectedP.unit}</strong> • Rak: {selectedP.rackLocation || 'Gudang'}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jumlah Unit Ditransfer *</label>
              <input
                type="number"
                min="1"
                required
                value={transferForm.qty}
                onChange={e => setTransferForm({ ...transferForm, qty: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Asal *</label>
                <input
                  type="text"
                  required
                  value={transferForm.sourceLocation}
                  onChange={e => setTransferForm({ ...transferForm, sourceLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Lokasi Tujuan *</label>
                <input
                  type="text"
                  required
                  value={transferForm.targetLocation}
                  onChange={e => setTransferForm({ ...transferForm, targetLocation: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan Pemindahan</label>
              <input
                type="text"
                placeholder="Misal: Tambah display etalase kasir depan"
                value={transferForm.notes}
                onChange={e => setTransferForm({ ...transferForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
            >
              Proses Transfer Stok
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: RIWAYAT OPNAME */}
      {activeTab === 'opname' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Catatan Stock Opname & Penyesuaian Fisik</h3>
            <span className="text-xs text-slate-500 font-semibold">{opnames.length} Dokumen Opname</span>
          </div>

          {opnames.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Belum ada stock opname yang diposting. Klik tombol "+ Mulai Stock Opname" di atas untuk memulai penghitungan fisik.
            </div>
          ) : (
            <div className="space-y-3">
              {opnames.map(opn => (
                <div key={opn.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 font-mono">{opn.opnameNumber}</span>
                      <span className="text-[11px] text-slate-500 ml-2">Lokasi: {opn.warehouse}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                      Posted / Selesai
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 flex justify-between">
                    <span>Auditor: <b>{opn.auditor}</b></span>
                    <span>Selisih Total: <b className="font-mono">{formatRupiah(opn.totalDifferenceAmount)}</b></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: KARTU MUTASI STOK */}
      {activeTab === 'mutasi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Kartu Mutasi Pergerakan Stok Real-Time</h3>
            <span className="text-xs text-slate-500 font-semibold">{movements.length} Pergerakan Tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Waktu & Tanggal</th>
                  <th className="py-3 px-3">SKU & Barang</th>
                  <th className="py-3 px-3">Tipe Mutasi</th>
                  <th className="py-3 px-3 text-center">Kuantitas</th>
                  <th className="py-3 px-3">No. Referensi</th>
                  <th className="py-3 px-3">LOT / Batch / ED</th>
                  <th className="py-3 px-3">Asal / Tujuan</th>
                  <th className="py-3 px-3">PIC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {new Date(m.date).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const prod = products.find(p => p.id === m.productId || p.sku === m.sku);
                          return (
                            <ProductImage
                              src={prod?.imageUrl}
                              alt={m.productName}
                              category={prod?.category}
                              size="xs"
                            />
                          );
                        })()}
                        <div>
                          <div className="font-bold text-slate-900">{m.productName}</div>
                          <div className="text-[10px] font-mono text-slate-400">{m.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        m.type === 'masuk' ? 'bg-emerald-100 text-emerald-800' :
                        m.type === 'keluar' ? 'bg-rose-100 text-rose-800' :
                        m.type === 'transfer' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={m.type === 'masuk' ? 'text-emerald-700' : m.type === 'keluar' ? 'text-rose-700' : 'text-slate-900'}>
                        {m.type === 'masuk' ? '+' : m.type === 'keluar' ? '-' : ''}{m.qty}
                      </span>{' '}
                      <span className="text-slate-400 font-normal">{m.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{m.referenceNo}</td>
                    <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                      <div className="font-semibold text-slate-700">{m.lotNo || m.batchNo ? `${m.lotNo || '-'} / ${m.batchNo || '-'}` : '-'}</div>
                      <div className="text-[10px] text-slate-500">{m.expiredDate ? `ED: ${m.expiredDate}` : 'ED: -'}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {m.sourceLocation} → {m.targetLocation}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-semibold">{m.pic}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: STOCK OPNAME FISIK */}
      {isOpnameModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Form Penghitungan Fisik Stock Opname</h3>
                <p className="text-xs text-slate-500">Masukkan jumlah fisik nyata hasil audit lapangan di rak gudang.</p>
              </div>
              <button onClick={() => setIsOpnameModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gudang / Lokasi Opname</label>
                  <input
                    type="text"
                    value={opnameWarehouse}
                    onChange={e => setOpnameWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Petugas Auditor</label>
                  <input
                    type="text"
                    disabled
                    value={store.getCurrentUser().name}
                    className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-600 font-bold"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-600 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-3 text-center">Stok Sistem</th>
                      <th className="py-2.5 px-3 text-center">Stok Fisik Nyata</th>
                      <th className="py-2.5 px-3 text-center">Selisih</th>
                      <th className="py-2.5 px-3 text-right">Nilai Selisih HPP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => {
                      const physical = opnameCounts[p.id] !== undefined ? opnameCounts[p.id] : p.stock;
                      const diff = physical - p.stock;
                      const diffAmount = diff * p.hppPrice;
                      return (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <ProductImage
                                src={p.imageUrl}
                                alt={p.name}
                                category={p.category}
                                size="xs"
                              />
                              <div>
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                            {p.stock} {p.unit}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              value={physical}
                              onChange={e => setOpnameCounts({ ...opnameCounts, [p.id]: parseInt(e.target.value) || 0 })}
                              className="w-20 px-2 py-1 text-center border rounded-lg font-mono font-bold"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span className={diff < 0 ? 'text-rose-600' : diff > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            {formatRupiah(diffAmount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsOpnameModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveOpname}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
                >
                  Posting & Sesuaikan Stok Sistem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA & STOK BARANG */}
      {isEditProductModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Edit Data &amp; Stok Barang ({editingProduct.sku})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsEditProductModalOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang *</label>
                <input
                  type="text"
                  required
                  value={editProductForm.name}
                  onChange={e => setEditProductForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kode SKU / Barcode</label>
                  <input
                    type="text"
                    required
                    value={editProductForm.sku}
                    onChange={e => setEditProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Rak Gudang</label>
                  <input
                    type="text"
                    value={editProductForm.rackLocation}
                    onChange={e => setEditProductForm(prev => ({ ...prev, rackLocation: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Stok Fisik Saat Ini ({editingProduct.unit}) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProductForm.stock}
                    onChange={e => setEditProductForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl font-mono text-base font-black text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-amber-900 block mb-1">Batas Minimum Stok *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProductForm.minStock}
                    onChange={e => setEditProductForm(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-amber-300 rounded-xl font-mono text-base font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">HPP (Modal)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProductForm.hppPrice}
                    onChange={e => setEditProductForm(prev => ({ ...prev, hppPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1.5 border rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Toko</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProductForm.price}
                    onChange={e => setEditProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1.5 border rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Kontraktor</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editProductForm.priceProject}
                    onChange={e => setEditProductForm(prev => ({ ...prev, priceProject: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1.5 border rounded-xl font-mono font-bold text-blue-700"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsEditProductModalOpen(false);
                  }}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow cursor-pointer"
                >
                  Simpan Perubahan Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

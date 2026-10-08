import React, { useState } from 'react';
import { Plus, Printer, Trash2, Tag, Percent, Layers, Sparkles, Building, X } from 'lucide-react';
import { store } from '../store';
import { SPHQuotation, SPHItem } from '../types';
import { formatRupiah, formatDate } from '../utils/format';
import { SphPreviewModal } from './SphPreviewModal';

interface SphModuleProps {
  onPrintSph: (sph: SPHQuotation) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SphModule: React.FC<SphModuleProps> = ({ onPrintSph, onNotify }) => {
  const [showModal, setShowModal] = useState(false);
  const [previewSph, setPreviewSph] = useState<SPHQuotation | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const customers = store.getCustomers();
  const products = store.getProducts();

  // 5 OPSI SPH BARU SESUAI INSTRUKSI GAMBAR:
  // 1. Rekanan
  // 2. Nama proyek
  // 4. Barang yg ditawarkan
  // 5. Harga (harga toko / harga kontraktor)
  // 6. Ada opsi PPN / NON PPN
  const [isManualCustomer, setIsManualCustomer] = useState(false);
  const [customer, setCustomer] = useState(customers[0]?.name || '');
  const [customerPhone, setCustomerPhone] = useState(customers[0]?.phone || '');
  const [project, setProject] = useState('');
  const [priceTier, setPriceTier] = useState<'harga_toko' | 'harga_kontraktor'>('harga_kontraktor');
  const [isPpn, setIsPpn] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [items, setItems] = useState<SPHItem[]>([
    {
      id: '1',
      productId: products[0]?.id || '',
      name: products[0]?.name || 'Panel Box Distribusi & Komponen Listrik',
      qty: 1,
      unit: products[0]?.unit || 'Set',
      priceType: 'kontraktor',
      unitPrice: products[0]?.priceProject || products[0]?.price || 1500000,
      subtotal: products[0]?.priceProject || products[0]?.price || 1500000
    }
  ]);

  const sphList = store.getSPHList();

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: '',
        name: '',
        qty: 1,
        unit: 'Pcs',
        priceType: priceTier === 'harga_kontraktor' ? 'kontraktor' : 'toko',
        unitPrice: 0,
        subtotal: 0
      }
    ]);
  };

  const handleAddPanelPreset = (name: string, unit: string, priceToko: number, priceKontraktor: number) => {
    const unitPrice = priceTier === 'harga_kontraktor' ? priceKontraktor : priceToko;
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        productId: '',
        name,
        qty: 1,
        unit,
        priceType: priceTier === 'harga_kontraktor' ? 'kontraktor' : 'toko',
        unitPrice,
        subtotal: unitPrice
      }
    ]);
  };

  const handlePriceTierChange = (newTier: 'harga_toko' | 'harga_kontraktor') => {
    setPriceTier(newTier);
    const updated = items.map(it => {
      if (it.productId) {
        const prod = products.find(p => p.id === it.productId);
        if (prod) {
          const newPrice = newTier === 'harga_kontraktor'
            ? (prod.priceProject || prod.priceWholesale || Math.round(prod.price * 0.9))
            : prod.price;
          return {
            ...it,
            priceType: newTier === 'harga_kontraktor' ? ('kontraktor' as const) : ('toko' as const),
            unitPrice: newPrice,
            subtotal: it.qty * newPrice
          };
        }
      }
      return it;
    });
    setItems(updated);
  };

  const handleUpdateItem = (index: number, field: keyof SPHItem, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;

    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        updated[index].name = prod.name;
        updated[index].unit = prod.unit;
        const tierPrice = priceTier === 'harga_kontraktor'
          ? (prod.priceProject || prod.priceWholesale || Math.round(prod.price * 0.9))
          : prod.price;
        updated[index].unitPrice = tierPrice;
        updated[index].priceType = priceTier === 'harga_kontraktor' ? 'kontraktor' : 'toko';
        updated[index].subtotal = updated[index].qty * tierPrice;
      }
    } else if (field === 'qty' || field === 'unitPrice') {
      updated[index].subtotal = (Number(updated[index].qty) || 0) * (Number(updated[index].unitPrice) || 0);
    }

    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.subtotal || 0), 0);
  const ppnAmount = isPpn ? Math.round(subtotal * 0.11) : 0;
  const totalAmount = subtotal + ppnAmount;

  const handleCreateSph = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || !project.trim() || items.some(it => !it.name.trim())) {
      alert('Lengkapi data Rekanan, Nama Proyek, dan Rincian Barang!');
      return;
    }

    const newSph: SPHQuotation = {
      id: 'sph-' + Date.now(),
      code: `SPH/NJN/${new Date().getFullYear()}/${String(sphList.length + 1).padStart(4, '0')}`,
      customerName: customer,
      customerPhone,
      projectTitle: project,
      date,
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      priceTier,
      isPpn,
      ppnRate: isPpn ? 11 : 0,
      itemsSummary: items.map(it => `${it.qty} ${it.unit} ${it.name}`).join(', '),
      subtotal,
      ppnAmount,
      totalAmount,
      status: 'waiting_po',
      statusLabel: 'Menunggu PO / Disetujui',
      items,
      termsAndConditions: '1. Penawaran harga berlaku 30 hari kalender.\n2. Waktu pengiriman / fabrikasi 3-7 hari kerja setelah PO diterima.\n3. Pembayaran via Transfer Rekening Resmi Toko Nirwana Jaya Nugraha.'
    };

    store.addSPH(newSph);
    setShowModal(false);
    setPreviewSph(newSph);
    setIsPreviewOpen(true);
    setProject('');
    setItems([{
      id: '1',
      productId: '',
      name: '',
      qty: 1,
      unit: 'Pcs',
      priceType: priceTier === 'harga_kontraktor' ? 'kontraktor' : 'toko',
      unitPrice: 0,
      subtotal: 0
    }]);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <span>TOKO NIRWANA JAYA NUGRAHA</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Surat Penawaran Harga (SPH Proyek Panel)</h2>
          <p className="text-xs text-slate-500">
            Penerbitan proposal harga resmi pengadaan alat listrik, material panel listrik, & instalasi tender B2B/B2G.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          type="button"
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4 font-black" />
          <span>+ Buat SPH Baru</span>
        </button>
      </div>

      {/* Tabel SPH */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Daftar Arsip SPH Diterbitkan ({sphList.length})
          </h3>
        </div>

        {sphList.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Belum ada SPH yang diterbitkan. Klik tombol "+ Buat SPH Baru" di atas untuk membuat penawaran harga.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No. SPH</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Rekanan / Klien</th>
                  <th className="py-3 px-4">Nama Proyek</th>
                  <th className="py-3 px-4 text-center">Tarif</th>
                  <th className="py-3 px-4 text-center">Pajak</th>
                  <th className="py-3 px-4 text-right">Nilai Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sphList.map(sph => (
                  <tr key={sph.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{sph.code}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{formatDate(sph.date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{sph.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{sph.projectTitle}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        {sph.priceTier === 'harga_kontraktor' ? 'Kontraktor' : 'Toko'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        sph.isPpn !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sph.isPpn !== false ? 'PPN 11%' : 'NON PPN'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(sph.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          sph.status === 'converted_invoice'
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : sph.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : sph.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                          {sph.statusLabel}
                        </span>
                        {sph.status === 'waiting_po' && (
                          <>
                            <div className="text-[10px] text-slate-500 font-medium">
                              Menunggu: <b className="text-slate-800">Rudi Ruhdiana (Owner)</b> &amp; Rekanan
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  store.updateSPHStatus(sph.id, 'approved', 'Disetujui Owner (Rudi Ruhdiana) - Siap PO');
                                  onNotify?.(`SPH ${sph.code} berhasil disetujui resmi oleh Owner Rudi Ruhdiana!`, 'success');
                                }}
                                className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition shadow-xs cursor-pointer"
                                title="Setujui SPH ini"
                              >
                                ✓ Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Tolak atau batalkan SPH ${sph.code}?`)) {
                                    store.updateSPHStatus(sph.id, 'rejected', 'Ditolak / Dibatalkan');
                                    onNotify?.(`SPH ${sph.code} ditandai Ditolak / Dibatalkan`, 'error');
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition cursor-pointer"
                                title="Tolak SPH"
                              >
                                ✕ Tolak
                              </button>
                            </div>
                          </>
                        )}
                        {sph.status === 'approved' && (
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            Disahkan Owner • Siap PO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewSph(sph);
                            setIsPreviewOpen(true);
                          }}
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-slate-900 font-bold text-xs inline-flex items-center gap-1 transition cursor-pointer shadow-sm"
                          title="Pratinjau, Download PDF & Cetak Sesuai Ukuran"
                        >
                          <span>Pratinjau &amp; PDF</span>
                        </button>
                        <button
                          onClick={() => onPrintSph(sph)}
                          type="button"
                          className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                          title="Cetak Cepat"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`HAPUS SURAT PENAWARAN HARGA (SPH)?\n\nNomor: ${sph.code}\nRekanan: ${sph.customerName}\nProyek: ${sph.projectTitle}\nTotal: ${formatRupiah(sph.totalAmount)}\n\nDokumen akan dihapus permanen dan dicatat di Log Aktivitas Pengawasan.`)) {
                              store.deleteSPH(sph.id);
                              onNotify?.(`Dokumen SPH ${sph.code} berhasil dihapus permanen!`, 'success');
                            }
                          }}
                          type="button"
                          className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                          title="Hapus Dokumen SPH"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL BUAT SPH LENGKAP DENGAN 5 OPSI */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Buat Surat Penawaran Harga (SPH) Baru
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  TOKO NIRWANA JAYA NUGRAHA • Kebutuhan Panel Listrik & Komponen
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSph} className="space-y-4">
              {/* 1. REKANAN & 2. NAMA PROYEK */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>1. Data Rekanan & 2. Nama Proyek</span>
                  </span>
                  <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isManualCustomer}
                      onChange={e => setIsManualCustomer(e.target.checked)}
                      className="rounded text-amber-500"
                    />
                    <span>Ketik Rekanan Baru (Manual)</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">1. Rekanan / Klien *</label>
                    {isManualCustomer ? (
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PT. Adhi Rekayasa Panel / CV. Surya Mandiri"
                        value={customer}
                        onChange={e => setCustomer(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                      />
                    ) : (
                      <select
                        value={customer}
                        onChange={e => {
                          const cust = customers.find(c => c.name === e.target.value);
                          setCustomer(e.target.value);
                          if (cust?.phone) setCustomerPhone(cust.phone);
                        }}
                        className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.name}>{c.name} ({c.type.toUpperCase()})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Kontak / No. Telepon Rekanan</label>
                    <input
                      type="text"
                      placeholder="0812-xxxx-xxxx"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">2. Nama Proyek / Pengadaan Panel Listrik *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan & Fabrikasi Panel LVMDP Gedung B"
                    value={project}
                    onChange={e => setProject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  />
                </div>
              </div>

              {/* 5. HARGA (TOKO / KONTRAKTOR) & 6. OPSI PPN / NON PPN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>5. Kategori Harga Penawaran</span>
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase">
                      {priceTier === 'harga_kontraktor' ? 'Harga Kontraktor' : 'Harga Toko'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handlePriceTierChange('harga_toko')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        priceTier === 'harga_toko' ? 'bg-white border-amber-500 font-black shadow-sm text-amber-950' : 'bg-white/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold">Harga Toko</span>
                      <span className="text-[10px] text-slate-400">Tarif Standar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePriceTierChange('harga_kontraktor')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        priceTier === 'harga_kontraktor' ? 'bg-amber-500 border-amber-600 font-black shadow-sm text-slate-950' : 'bg-white/60 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold">Harga Kontraktor</span>
                      <span className="text-[10px] text-slate-900">Tarif Proyek</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      <span>6. Opsi PPN / NON PPN</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isPpn ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPpn ? 'PPN 11%' : 'NON PPN'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPpn(false)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        !isPpn ? 'bg-slate-900 border-slate-900 font-black text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold">NON PPN</span>
                      <span className="text-[10px] text-slate-300">Tanpa PPN (0%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPpn(true)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center transition cursor-pointer ${
                        isPpn ? 'bg-emerald-600 border-emerald-700 font-black text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className="font-bold">PPN 11%</span>
                      <span className="text-[10px] text-emerald-100">Faktur Pajak</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 4. BARANG YANG DITAWARKAN */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-500" />
                    <span>4. Barang yang Ditawarkan (Panel & Elektrikal)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
                  >
                    + Tambah Baris Barang
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="p-2 bg-slate-100 rounded-xl flex flex-wrap gap-1.5 text-[11px]">
                  <span className="font-bold text-slate-600 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Quick Preset:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Panel Box Wall Mounting 60x80x25', 'Unit', 1250000, 1100000)}
                    className="px-2 py-0.5 bg-white rounded border hover:bg-amber-100 text-slate-700"
                  >
                    + Box 60x80
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('MCCB 3P 100A Schneider', 'Pcs', 1850000, 1650000)}
                    className="px-2 py-0.5 bg-white rounded border hover:bg-amber-100 text-slate-700"
                  >
                    + MCCB 100A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Kabel Power Supreme NYY 4x16 mm²', 'Meter', 195000, 175000)}
                    className="px-2 py-0.5 bg-white rounded border hover:bg-amber-100 text-slate-700"
                  >
                    + Kabel NYY 4x16mm²
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Busbar Copper Tembaga Murni 3x25mm (Batang 3m)', 'Batang', 420000, 380000)}
                    className="px-2 py-0.5 bg-white rounded border hover:bg-amber-100 text-slate-700"
                  >
                    + Busbar Cu 3x25
                  </button>
                </div>

                {/* Table of items */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-700 border-b">
                      <tr>
                        <th className="py-2 px-3">Uraian Barang / Panel</th>
                        <th className="py-2 px-3 w-16 text-center">Qty</th>
                        <th className="py-2 px-3 w-20">Satuan</th>
                        <th className="py-2 px-3 w-32 text-right">Harga Satuan</th>
                        <th className="py-2 px-3 w-32 text-right">Subtotal</th>
                        <th className="py-2 px-3 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={it.id}>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.name}
                              onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                              placeholder="Nama barang..."
                              required
                              className="w-full px-2 py-1 border rounded-lg font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              value={it.qty}
                              onChange={e => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 1)}
                              required
                              className="w-full px-1 py-1 border rounded-lg text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.unit}
                              onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                              placeholder="Satuan"
                              required
                              className="w-full px-1 py-1 border rounded-lg text-center"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              value={it.unitPrice}
                              onChange={e => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              required
                              className="w-full px-2 py-1 border rounded-lg text-right font-mono font-bold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {formatRupiah(it.subtotal)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={items.length <= 1}
                              className="text-slate-300 hover:text-rose-600 disabled:opacity-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={isPpn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {isPpn ? '+ PPN 11%:' : 'PPN (Non-PPN):'}
                  </span>
                  <span className={isPpn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {isPpn ? `+${formatRupiah(ppnAmount)}` : 'Rp 0'}
                  </span>
                </div>
                <div className="flex justify-between text-base font-black pt-1.5 border-t border-slate-700 text-amber-300">
                  <span>TOTAL PENAWARAN:</span>
                  <span>{formatRupiah(totalAmount)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md cursor-pointer"
                >
                  Terbitkan SPH Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SPH PREVIEW, PDF DOWNLOAD & SIZED PRINT MODAL */}
      <SphPreviewModal
        isOpen={isPreviewOpen}
        sph={previewSph}
        onClose={() => setIsPreviewOpen(false)}
        onNotify={onNotify}
      />
    </div>
  );
};

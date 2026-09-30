import React, { useState } from 'react';
import { Plus, Printer, Trash2 } from 'lucide-react';
import { store } from '../store';
import { SPHQuotation, SPHItem } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface SphModuleProps {
  onPrintSph: (sph: SPHQuotation) => void;
}

export const SphModule: React.FC<SphModuleProps> = ({ onPrintSph }) => {
  const [showModal, setShowModal] = useState(false);
  const [customer, setCustomer] = useState('');
  const [project, setProject] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<SPHItem[]>([
    { id: '1', name: 'Kabel Power Supreme NYY 4x16 mm²', qty: 100, unit: 'Meter', unitPrice: 185000, subtotal: 18500000 }
  ]);

  const sphList = store.getSPHList();

  const handleAddItemRow = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), name: '', qty: 10, unit: 'Pcs', unitPrice: 50000, subtotal: 500000 }
    ]);
  };

  const handleUpdateItem = (index: number, field: keyof SPHItem, val: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = val;
    if (field === 'qty' || field === 'unitPrice') {
      updated[index].subtotal = updated[index].qty * updated[index].unitPrice;
    }
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);

  const handleCreateSph = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !project || items.some(it => !it.name)) {
      alert('Lengkapi customer, proyek, dan rincian barang!');
      return;
    }

    const code = 'SPH-NJN/2026/09/' + Math.floor(1000 + Math.random() * 9000);
    const newSph: SPHQuotation = {
      id: 'sph-' + Date.now(),
      code,
      customerName: customer,
      projectTitle: project,
      date,
      validUntil: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      itemsSummary: items.map(it => it.name).join(', '),
      subtotal: totalAmount,
      ppnAmount: Math.round(totalAmount * 0.11),
      totalAmount: Math.round(totalAmount * 1.11),
      status: 'waiting_po',
      statusLabel: 'Menunggu PO',
      items
    };

    store.addSPH(newSph);
    setShowModal(false);
    setCustomer('');
    setProject('');
    setItems([{ id: '1', name: 'Kabel Power Supreme NYY 4x16 mm²', qty: 100, unit: 'Meter', unitPrice: 185000, subtotal: 18500000 }]);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">Surat Penawaran Harga (SPH Proyek)</h2>
          <p className="text-xs text-slate-500">
            Penerbitan proposal harga resmi pengadaan alat listrik &amp; instalasi panel tender B2B/B2G.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          type="button"
          className="px-4 py-2 rounded-xl bg-[#c62828] hover:bg-[#b71c1c] text-white font-extrabold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>+ Terbitkan SPH Baru</span>
        </button>
      </div>

      {/* Tabel SPH */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Daftar Arsip Surat Penawaran Harga ({sphList.length} Dokumen):
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">No. SPH</th>
                <th className="py-3 px-4">Customer Rekanan</th>
                <th className="py-3 px-4">Proyek / Pekerjaan</th>
                <th className="py-3 px-4">Tanggal Terbit</th>
                <th className="py-3 px-4 text-right">Nilai Penawaran</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Cetak Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sphList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada dokumen Surat Penawaran Harga (SPH). Klik tombol <strong>"+ Terbitkan SPH Baru"</strong> di atas untuk membuat dokumen penawaran harga asli.
                  </td>
                </tr>
              ) : (
                sphList.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{item.customerName}</td>
                    <td className="py-3 px-4 text-slate-700">{item.projectTitle}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                      {formatRupiah(item.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'converted_invoice' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                          Faktur Terbit
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                          Menunggu PO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintSph(item)}
                        type="button"
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak SPH</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Terbitkan SPH Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="font-black text-sm text-slate-900">Penerbitan Surat Penawaran Harga (SPH) Baru</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateSph} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Terbit:</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer / Instansi:</label>
                  <input
                    type="text"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    placeholder="Nama instansi / perusahaan pemesan..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Proyek / Pengadaan:</label>
                <input
                  type="text"
                  value={project}
                  onChange={e => setProject(e.target.value)}
                  placeholder="Nama proyek / pekerjaan instalasi..."
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              {/* Rincian Barang */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Rincian Barang / Komponen Penawaran:</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-[#c62828] font-bold hover:underline cursor-pointer"
                  >
                    + Tambah Baris Barang
                  </button>
                </div>

                {items.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      value={it.name}
                      onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                      placeholder="Nama Barang"
                      required
                      className="col-span-5 px-3 py-1.5 rounded-lg border border-slate-300 font-semibold"
                    />
                    <input
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={e => handleUpdateItem(idx, 'qty', parseFloat(e.target.value) || 1)}
                      required
                      className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-center"
                    />
                    <input
                      type="text"
                      value={it.unit}
                      onChange={e => handleUpdateItem(idx, 'unit', e.target.value)}
                      required
                      className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-300 text-center"
                    />
                    <input
                      type="number"
                      step="500"
                      value={it.unitPrice}
                      onChange={e => handleUpdateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                      className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-right"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="col-span-1 text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs font-bold">
                <span className="text-slate-600">Total Penawaran (DPP):</span>
                <span className="text-base font-black text-slate-900 font-mono">{formatRupiah(totalAmount)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs cursor-pointer"
                >
                  Keluar / Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#c62828] hover:bg-[#b71c1c] text-white font-black text-xs cursor-pointer shadow-xs"
                >
                  Terbitkan SPH
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

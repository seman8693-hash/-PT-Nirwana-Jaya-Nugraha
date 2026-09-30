import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Printer,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  User,
  Navigation,
  X
} from 'lucide-react';
import { store } from '../store';
import { DeliveryOrder, SalesInvoice } from '../types';
import { formatDate } from '../utils/format';

interface ShippingModuleProps {
  onPrintDo: (order: DeliveryOrder) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const ShippingModule: React.FC<ShippingModuleProps> = ({ onPrintDo, onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New DO Form
  const invoices = store.getInvoices();
  const customers = store.getCustomers();
  const deliveryOrders = store.getDeliveryOrders();

  const [doForm, setDoForm] = useState({
    invoiceReference: invoices[0]?.invoiceNumber || 'INV/NJN/2026/001',
    customerName: customers[0]?.name || 'PT. Wijaya Rekayasa Mandiri',
    destinationAddress: customers[0]?.address || 'Kawasan Industri Gedebage Blok D-12, Bandung',
    driverName: 'Pak Dadang (Armada NJN)',
    vehicleNumber: 'D 8841 AB (Colt Diesel)',
    expedition: 'Armada Internal NJN',
    trackingNumber: `NJN-LOG-${Date.now().toString().slice(-6)}`,
    shippingDate: new Date().toISOString().split('T')[0],
    estimatedArrival: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    items: [
      { productName: 'Kabel Supreme NYY 4x16 mm²', qty: 50, unit: 'Meter' }
    ]
  });

  const handleAddItemRow = () => {
    setDoForm({
      ...doForm,
      items: [...doForm.items, { productName: 'Box Panel Wall Mounting', qty: 2, unit: 'Unit' }]
    });
  };

  const handleRemoveItemRow = (idx: number) => {
    if (doForm.items.length <= 1) return;
    setDoForm({ ...doForm, items: doForm.items.filter((_, i) => i !== idx) });
  };

  const handleSaveDo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doForm.customerName || !doForm.destinationAddress) {
      onNotify?.('Lengkapi tujuan dan nama penerima barang!', 'error');
      return;
    }

    const newDo = store.createDeliveryOrder({
      invoiceReference: doForm.invoiceReference,
      customerName: doForm.customerName,
      destinationAddress: doForm.destinationAddress,
      driverName: doForm.driverName,
      vehicleNumber: doForm.vehicleNumber,
      expedition: doForm.expedition,
      trackingNumber: doForm.trackingNumber,
      shippingDate: doForm.shippingDate,
      estimatedArrival: doForm.estimatedArrival,
      items: doForm.items
    });

    setIsModalOpen(false);
    onNotify?.(`Surat Jalan ${newDo.doNumber} berhasil diterbitkan dan siap diantar!`, 'success');
  };

  const handleUpdateStatus = (id: string, status: 'diproses' | 'dikirim' | 'diterima') => {
    const notes = status === 'diterima' ? 'Barang telah diterima lengkap oleh PIC gudang proyek.' : undefined;
    store.updateDeliveryStatus(id, status, notes);
    onNotify?.(`Status pengiriman berhasil diperbarui ke: ${status.toUpperCase()}`, 'success');
  };

  const filteredOrders = deliveryOrders.filter(d =>
    d.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Truck className="w-4 h-4" />
            <span>MODUL 8: LOGISTIK & PENGIRIMAN (DELIVERY & LOGISTICS)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Surat Jalan (DO), Resi & Live Tracking</h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan surat jalan resmi PT Nirwana Jaya Nugraha, penugasan armada driver, dan pemantauan status penerimaan proyek.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Terbitkan Surat Jalan (DO)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Cari No. DO, No. Resi, Customer..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>
          <div className="text-xs text-slate-500 font-semibold">
            {deliveryOrders.filter(d => d.status === 'dikirim').length} Sedang Dalam Perjalanan
          </div>
        </div>

        {/* DO Cards / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
              <tr>
                <th className="py-3 px-3">Nomor DO / Surat Jalan</th>
                <th className="py-3 px-3">Customer & Alamat Tujuan</th>
                <th className="py-3 px-3">Armada & Driver</th>
                <th className="py-3 px-3">No. Resi / Tracking</th>
                <th className="py-3 px-3 text-center">Status Pengiriman</th>
                <th className="py-3 px-3 text-center">Update Status</th>
                <th className="py-3 px-3 text-center">Cetak Surat Jalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada pengiriman yang tercatat. Klik "+ Terbitkan Surat Jalan (DO)" untuk membuat surat jalan baru.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      <div>{order.doNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">Ref: {order.invoiceReference}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{order.customerName}</div>
                      <div className="text-[11px] text-slate-500 max-w-xs truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{order.destinationAddress}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <div className="font-semibold">{order.driverName}</div>
                      <div className="text-[10px] font-mono text-slate-500">{order.vehicleNumber} ({order.expedition})</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-purple-700">
                      {order.trackingNumber}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        order.status === 'diterima' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'dikirim' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {order.status === 'diterima' ? 'Telah Diterima' : order.status === 'dikirim' ? 'Dalam Perjalanan' : 'Sedang Diproses'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={order.status}
                        onChange={e => handleUpdateStatus(order.id, e.target.value as any)}
                        className="px-2 py-1 border rounded-lg text-[11px] font-bold bg-white"
                      >
                        <option value="diproses">Diproses</option>
                        <option value="dikirim">Dikirim (Jalan)</option>
                        <option value="diterima">Diterima (BAST)</option>
                      </select>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onPrintDo(order)}
                        className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: BUAT SURAT JALAN DO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Terbitkan Surat Jalan (DO) Pengiriman</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDo} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ref Faktur Invoice Terkait</label>
                  <input
                    type="text"
                    value={doForm.invoiceReference}
                    onChange={e => setDoForm({ ...doForm, invoiceReference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Customer Penerima *</label>
                  <input
                    type="text"
                    required
                    value={doForm.customerName}
                    onChange={e => setDoForm({ ...doForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Tujuan Pengiriman / Proyek *</label>
                <textarea
                  rows={2}
                  required
                  value={doForm.destinationAddress}
                  onChange={e => setDoForm({ ...doForm, destinationAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Driver / Kurir</label>
                  <input
                    type="text"
                    value={doForm.driverName}
                    onChange={e => setDoForm({ ...doForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plat Kendaraan</label>
                  <input
                    type="text"
                    value={doForm.vehicleNumber}
                    onChange={e => setDoForm({ ...doForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ekspedisi / Armada</label>
                  <input
                    type="text"
                    value={doForm.expedition}
                    onChange={e => setDoForm({ ...doForm, expedition: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Items in DO */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Daftar Barang yang Dimuat ke Kendaraan</span>
                  <button type="button" onClick={handleAddItemRow} className="text-purple-600 font-bold hover:underline">
                    + Tambah Baris
                  </button>
                </div>

                {doForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-8">
                      <input
                        type="text"
                        value={it.productName}
                        onChange={e => {
                          const updated = [...doForm.items];
                          updated[idx].productName = e.target.value;
                          setDoForm({ ...doForm, items: updated });
                        }}
                        className="w-full px-2.5 py-1.5 border rounded-lg font-semibold"
                        placeholder="Nama Barang"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={e => {
                          const updated = [...doForm.items];
                          updated[idx].qty = parseInt(e.target.value) || 1;
                          setDoForm({ ...doForm, items: updated });
                        }}
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {doForm.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveItemRow(idx)} className="text-rose-500 font-bold">✕</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 text-white font-bold rounded-xl shadow-md">
                  Terbitkan Surat Jalan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

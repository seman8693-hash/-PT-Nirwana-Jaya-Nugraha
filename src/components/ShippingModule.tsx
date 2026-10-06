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
  X,
  FileCheck2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { store } from '../store';
import { DeliveryOrder, SalesInvoice } from '../types';
import { formatDate, formatRupiah } from '../utils/format';

interface ShippingModuleProps {
  onPrintDo: (order: DeliveryOrder) => void;
  onPrintInvoice?: (inv: SalesInvoice) => void;
  onNavigate?: (tab: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const ShippingModule: React.FC<ShippingModuleProps> = ({
  onPrintDo,
  onPrintInvoice,
  onNavigate,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'do' | 'invoice-link'>('do');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateFromInvoiceModalOpen, setIsCreateFromInvoiceModalOpen] = useState(false);
  const [selectedInvoiceForDo, setSelectedInvoiceForDo] = useState<string>('');
  const [selectedInvoiceToView, setSelectedInvoiceToView] = useState<SalesInvoice | null>(null);

  const invoices = store.getInvoices();
  const customers = store.getCustomers();
  const deliveryOrders = store.getDeliveryOrders();

  // Manual DO Form State
  const [doForm, setDoForm] = useState({
    invoiceReference: invoices[0]?.invoiceNumber || '-',
    customerName: customers[0]?.name || '',
    destinationAddress: customers[0]?.address || '',
    driverName: 'Armada Pengiriman NJN',
    vehicleNumber: 'D 1234 XX',
    expedition: 'Armada Internal NJN',
    trackingNumber: `NJN-LOG-${Date.now().toString().slice(-6)}`,
    shippingDate: new Date().toISOString().split('T')[0],
    estimatedArrival: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    items: [
      { productName: '', qty: 1, unit: 'Pcs' }
    ]
  });

  const handleAddItemRow = () => {
    setDoForm({
      ...doForm,
      items: [...doForm.items, { productName: '', qty: 1, unit: 'Pcs' }]
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
    onNotify?.(`Surat Jalan ${newDo.doNumber} berhasil diterbitkan dan siap diantar armada!`, 'success');
  };

  const handleCreateDoFromSelectedInvoice = () => {
    if (!selectedInvoiceForDo) {
      onNotify?.('Pilih salah satu Faktur Invoice!', 'error');
      return;
    }

    const newDO = store.createDeliveryOrderFromInvoice(selectedInvoiceForDo);
    setIsCreateFromInvoiceModalOpen(false);
    onNotify?.(`Surat Jalan ${newDO.doNumber} berhasil diterbitkan otomatis dari Faktur ${newDO.invoiceReference}!`, 'success');
  };

  const handleUpdateStatus = (id: string, status: 'diproses' | 'dikirim' | 'diterima') => {
    const notes = status === 'diterima' ? 'Barang telah diterima lengkap oleh PIC gudang proyek.' : undefined;
    store.updateDeliveryStatus(id, status, notes);
    onNotify?.(`Status pengiriman berhasil diperbarui ke: ${status.toUpperCase()}`, 'success');
  };

  const filteredOrders = deliveryOrders.filter(d =>
    d.doNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.invoiceReference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invoicesWithoutDo = invoices.filter(inv => !inv.doReference);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Truck className="w-4 h-4" />
            <span>MODUL 8: LOGISTIK, PENGIRIMAN & SURAT JALAN (DO)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Surat Jalan (DO), Resi & Keterkaitan Invoice</h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan surat jalan resmi Toko Nirwana Jaya Nugraha, penugasan armada driver, dan pemantauan status penerimaan barang proyek.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (invoicesWithoutDo.length > 0) {
                setSelectedInvoiceForDo(invoicesWithoutDo[0].id);
              }
              setIsCreateFromInvoiceModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
            title="Tarik data otomatis dari Faktur Invoice Penjualan"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>+ Buat DO dari Invoice</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Terbitkan DO Manual</span>
          </button>
        </div>
      </div>

      {/* Official ERP Flow Banner */}
      <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px]">
              ALUR SISTEM ERP TUNGGAL
            </span>
            <span className="font-bold text-xs text-white">
              Menu Pengiriman → DO / Surat Jalan → Invoice
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Satu sumber data invoice tunggal digunakan bersama oleh Penjualan, Dashboard, Keuangan, dan Pengiriman.
          </span>
        </div>

        {/* Visual Workflow Steps */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono font-bold pt-1">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">1. SPH</span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">2. Sales Order</span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-600 text-white ring-2 ring-purple-400">
            3. DO / Surat Jalan
          </span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 ring-2 ring-amber-300">
            4. INVOICE
          </span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">5. PIUTANG</span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">6. PEMBAYARAN</span>
          <span className="text-amber-500 font-black">➔</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white">7. LUNAS</span>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('do')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'do' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Surat Jalan & Pengiriman ({deliveryOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoice-link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'invoice-link' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Keterkaitan DO & Invoice</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR DO & SURAT JALAN OPERASIONAL */}
      {activeTab === 'do' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. DO, No. Resi, Customer, Ref Faktur..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold flex items-center gap-3">
              <span>{deliveryOrders.filter(d => d.status === 'dikirim').length} Sedang Diantar Driver</span>
              <span className="text-slate-300">•</span>
              <span>{deliveryOrders.filter(d => d.status === 'diterima').length} Telah Diterima (BAST)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nomor DO / Surat Jalan</th>
                  <th className="py-3 px-3">Customer & Alamat Tujuan</th>
                  <th className="py-3 px-3">Armada & Driver</th>
                  <th className="py-3 px-3">No. Resi / Tracking</th>
                  <th className="py-3 px-3 text-center">Faktur Terkait</th>
                  <th className="py-3 px-3 text-center">Status Pengiriman</th>
                  <th className="py-3 px-3 text-center">Update Status</th>
                  <th className="py-3 px-3 text-center">Cetak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada pengiriman yang tercatat. Klik "+ Buat DO dari Invoice" atau "+ Terbitkan DO Manual" untuk membuat surat jalan baru.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map(order => {
                    const linkedInv = invoices.find(i => i.invoiceNumber === order.invoiceReference);

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          <div>{order.doNumber}</div>
                          <div className="text-[10px] text-slate-400 font-normal">Tgl: {formatDate(order.shippingDate)}</div>
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
                          {order.invoiceReference && order.invoiceReference !== '-' ? (
                            <button
                              onClick={() => {
                                if (linkedInv) setSelectedInvoiceToView(linkedInv);
                              }}
                              className="font-mono text-[10px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1 transition"
                              title="Klik untuk melihat faktur invoice terkait"
                            >
                              <span>{order.invoiceReference}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Belum Ditautkan</span>
                          )}
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
                            title="Cetak Surat Jalan Resmi"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KETERKAITAN DO & INVOICE (USER REQUIREMENT 4) */}
      {activeTab === 'invoice-link' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Hubungan Keterkaitan Pengiriman (DO) & Faktur Tagihan (Invoice)
              </h3>
              <p className="text-xs text-slate-500">
                Memastikan setiap barang yang dikirimkan memiliki nomor faktur tagihan resmi dan status pembayaran terpantau.
              </p>
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              {deliveryOrders.filter(d => d.invoiceReference && d.invoiceReference !== '-').length} Pengiriman Terhubung Faktur
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nomor Surat Jalan (DO)</th>
                  <th className="py-3 px-3">Nomor Faktur Invoice</th>
                  <th className="py-3 px-3">Customer / Rekanan</th>
                  <th className="py-3 px-3">Status Pengiriman</th>
                  <th className="py-3 px-3 text-right">Nilai Faktur</th>
                  <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                  <th className="py-3 px-3 text-center">Status Pembayaran</th>
                  <th className="py-3 px-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveryOrders.map(dOrder => {
                  const inv = invoices.find(i => i.invoiceNumber === dOrder.invoiceReference);
                  const remaining = inv ? Math.max(0, inv.totalAmount - inv.paidAmount) : 0;

                  return (
                    <tr key={dOrder.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-purple-900">
                        {dOrder.doNumber}
                        <div className="text-[10px] text-slate-400 font-normal">Armada: {dOrder.vehicleNumber}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {dOrder.invoiceReference && dOrder.invoiceReference !== '-' ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {dOrder.invoiceReference}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Belum Ada Faktur</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{dOrder.customerName}</div>
                        <div className="text-[10px] text-slate-500 max-w-xs truncate">{dOrder.destinationAddress}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          dOrder.status === 'diterima' ? 'bg-emerald-100 text-emerald-800' :
                          dOrder.status === 'dikirim' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {dOrder.status === 'diterima' ? 'Telah Diterima' : dOrder.status === 'dikirim' ? 'Dikirim' : 'Diproses'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {inv ? formatRupiah(inv.totalAmount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {inv ? (
                          <span className={remaining > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                            {formatRupiah(remaining)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {inv ? (
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            inv.status === 'overdue' ? 'bg-rose-100 text-rose-800' :
                            inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status === 'paid' ? 'Lunas' : inv.status}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv ? (
                            <button
                              onClick={() => setSelectedInvoiceToView(inv)}
                              className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-bold text-[10px] transition inline-flex items-center gap-1"
                              title="Buka rincian faktur invoice"
                            >
                              <FileCheck2 className="w-3 h-3" />
                              <span>Lihat Faktur</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const newInv = store.createInvoiceFromDeliveryOrder(dOrder.id);
                                onNotify?.(`Faktur ${newInv.invoiceNumber} berhasil diterbitkan dari DO ${dOrder.doNumber}!`, 'success');
                              }}
                              className="px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 rounded font-bold text-[10px] transition"
                            >
                              + Buat Faktur
                            </button>
                          )}
                          <button
                            onClick={() => onPrintDo(dOrder)}
                            className="p-1 text-slate-700 hover:bg-slate-200 rounded transition"
                            title="Cetak Surat Jalan"
                          >
                            <Printer className="w-3.5 h-3.5" />
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

      {/* MODAL: BUAT SURAT JALAN MANUAL */}
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
                  <select
                    value={doForm.invoiceReference}
                    onChange={e => {
                      const selectedInv = invoices.find(i => i.invoiceNumber === e.target.value);
                      setDoForm({
                        ...doForm,
                        invoiceReference: e.target.value,
                        customerName: selectedInv?.customerName || doForm.customerName,
                        destinationAddress: selectedInv?.customerAddress || doForm.destinationAddress
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  >
                    <option value="-">Tanpa Faktur (Non-Invoice)</option>
                    {invoices.map(i => (
                      <option key={i.id} value={i.invoiceNumber}>
                        {i.invoiceNumber} - {i.customerName}
                      </option>
                    ))}
                  </select>
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
                <label className="font-bold text-slate-700 block mb-1">Alamat Tujuan Pengiriman *</label>
                <textarea
                  rows={2}
                  required
                  value={doForm.destinationAddress}
                  onChange={e => setDoForm({ ...doForm, destinationAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Driver</label>
                  <input
                    type="text"
                    value={doForm.driverName}
                    onChange={e => setDoForm({ ...doForm, driverName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Polisi Kendaraan</label>
                  <input
                    type="text"
                    value={doForm.vehicleNumber}
                    onChange={e => setDoForm({ ...doForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No. Resi Tracking</label>
                  <input
                    type="text"
                    value={doForm.trackingNumber}
                    onChange={e => setDoForm({ ...doForm, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tgl Berangkat</label>
                  <input
                    type="date"
                    value={doForm.shippingDate}
                    onChange={e => setDoForm({ ...doForm, shippingDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Tiba</label>
                  <input
                    type="date"
                    value={doForm.estimatedArrival}
                    onChange={e => setDoForm({ ...doForm, estimatedArrival: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Daftar Barang yang Dikirimkan</span>
                  <button type="button" onClick={handleAddItemRow} className="text-purple-700 font-bold hover:underline">
                    + Tambah Barang
                  </button>
                </div>
                {doForm.items.map((it, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama Barang / Deskripsi"
                      value={it.productName}
                      onChange={e => {
                        const updated = [...doForm.items];
                        updated[idx].productName = e.target.value;
                        setDoForm({ ...doForm, items: updated });
                      }}
                      className="flex-1 px-2 py-1.5 border rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={e => {
                        const updated = [...doForm.items];
                        updated[idx].qty = parseInt(e.target.value) || 1;
                        setDoForm({ ...doForm, items: updated });
                      }}
                      className="w-16 px-2 py-1.5 border rounded-lg font-mono text-center"
                    />
                    <input
                      type="text"
                      placeholder="Satuan"
                      value={it.unit}
                      onChange={e => {
                        const updated = [...doForm.items];
                        updated[idx].unit = e.target.value;
                        setDoForm({ ...doForm, items: updated });
                      }}
                      className="w-20 px-2 py-1.5 border rounded-lg"
                    />
                    {doForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md">
                  Terbitkan Surat Jalan (DO)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT DO OTOMATIS DARI INVOICE */}
      {isCreateFromInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Terbitkan DO Otomatis dari Faktur Invoice
                </h3>
              </div>
              <button onClick={() => setIsCreateFromInvoiceModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500">
              Pilih faktur invoice penjualan resmi. Rincian barang, customer, dan alamat pengiriman akan ditarik secara otomatis dari data faktur yang sudah dibuat di modul Penjualan.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Faktur Invoice *</label>
                <select
                  value={selectedInvoiceForDo}
                  onChange={e => setSelectedInvoiceForDo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                >
                  <option value="">-- Pilih Faktur Penjualan --</option>
                  {invoices.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - {inv.customerName} ({formatRupiah(inv.totalAmount)}) {inv.doReference ? `[Sudah Ada DO: ${inv.doReference}]` : '[Belum Ada DO]'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoiceForDo && (
                (() => {
                  const inv = invoices.find(i => i.id === selectedInvoiceForDo);
                  if (!inv) return null;
                  return (
                    <div className="p-3 bg-amber-50 rounded-xl space-y-1.5 border border-amber-200">
                      <div>Customer: <b className="text-slate-900">{inv.customerName}</b></div>
                      <div>Proyek: <b>{inv.projectName || '-'}</b></div>
                      <div>Alamat Kirim: <span className="text-slate-600">{inv.customerAddress || 'Bandung'}</span></div>
                      <div className="pt-1 text-[11px] text-amber-900 font-semibold">
                        {inv.items.length} jenis barang akan dimasukkan otomatis ke Surat Jalan.
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCreateFromInvoiceModalOpen(false)}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleCreateDoFromSelectedInvoice}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition"
              >
                Terbitkan Surat Jalan Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL RINGKASAN INVOICE TERKAIT */}
      {selectedInvoiceToView && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Rincian Faktur: {selectedInvoiceToView.invoiceNumber}
                  </h3>
                  <div className="text-[10px] text-slate-400">Data Tunggal dari Modul Penjualan</div>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceToView(null)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <b className="text-slate-900">{selectedInvoiceToView.customerName}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proyek:</span>
                <b>{selectedInvoiceToView.projectName || '-'}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal Faktur & Jatuh Tempo:</span>
                <span className="font-mono">{formatDate(selectedInvoiceToView.date)} s/d {formatDate(selectedInvoiceToView.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Pembayaran:</span>
                <span className="font-bold uppercase text-amber-700">{selectedInvoiceToView.status}</span>
              </div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t">
                <span>Nilai Total Tagihan:</span>
                <span className="font-mono text-slate-900">{formatRupiah(selectedInvoiceToView.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-amber-700">
                <span>Sisa Belum Dibayar:</span>
                <span className="font-mono">{formatRupiah(Math.max(0, selectedInvoiceToView.totalAmount - selectedInvoiceToView.paidAmount))}</span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-800 block mb-1">Item Barang Tagihan:</span>
              <div className="divide-y border rounded-xl overflow-hidden">
                {selectedInvoiceToView.items.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex justify-between bg-white hover:bg-slate-50">
                    <div>
                      <div className="font-semibold text-slate-900">{it.description}</div>
                      <div className="text-[10px] text-slate-400">{it.qty} {it.unit} @ {formatRupiah(it.unitPrice)}</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">{formatRupiah(it.total)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              {onNavigate && (
                <button
                  onClick={() => {
                    setSelectedInvoiceToView(null);
                    onNavigate('penjualan');
                  }}
                  className="text-amber-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Buka di Menu Penjualan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="flex gap-2">
                {onPrintInvoice && (
                  <button
                    onClick={() => {
                      onPrintInvoice(selectedInvoiceToView);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Faktur</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceToView(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Printer,
  FileText,
  FileCheck2,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Building,
  User,
  X
} from 'lucide-react';
import { store } from '../store';
import { SPHQuotation, SalesOrder, SalesInvoice, SPHItem, Customer } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface SalesModuleProps {
  onPrintSph: (sph: SPHQuotation) => void;
  onPrintInvoice: (inv: SalesInvoice) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  onPrintSph,
  onPrintInvoice,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'sph' | 'so' | 'invoice' | 'piutang'>('sph');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isSphModalOpen, setIsSphModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<SalesInvoice | null>(null);
  const [payMethod, setPayMethod] = useState('Transfer Bank BCA');

  const customers = store.getCustomers();
  const products = store.getProducts();
  const sphList = store.getSPHList();
  const soList = store.getSalesOrders();
  const invoices = store.getInvoices();

  // SPH Form
  const [sphForm, setSphForm] = useState({
    customerId: customers[0]?.id || '',
    customerName: customers[0]?.name || '',
    customerPhone: customers[0]?.phone || '',
    projectTitle: '',
    validDays: 30,
    items: [
      { id: '1', name: products[0]?.name || 'Kabel Listrik NYY', qty: 50, unit: products[0]?.unit || 'Meter', unitPrice: products[0]?.price || 150000, subtotal: 7500000 }
    ],
    termsAndConditions: '1. Harga belum termasuk PPN 11% jika diterbitkan faktur pajak.\n2. Waktu pengiriman 3-5 hari kerja setelah PO diterima.\n3. Pembayaran tempo 30 hari via Rekening BCA PT Nirwana Jaya Nugraha.'
  });

  // Invoice Form
  const [invForm, setInvForm] = useState({
    customerName: '',
    customerPhone: '',
    projectName: '',
    referencePo: '',
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { id: '1', description: 'Pengadaan Kabel & Komponen Panel', qty: 1, unit: 'Paket', unitPrice: 25000000, total: 25000000 }
    ]
  });

  // Handle SPH Item actions
  const handleAddSphItem = () => {
    setSphForm({
      ...sphForm,
      items: [
        ...sphForm.items,
        {
          id: Date.now().toString(),
          name: products[0]?.name || 'Barang Baru',
          qty: 10,
          unit: products[0]?.unit || 'Pcs',
          unitPrice: products[0]?.price || 50000,
          subtotal: 500000
        }
      ]
    });
  };

  const handleUpdateSphItem = (idx: number, field: string, val: any) => {
    const updated = [...sphForm.items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === val);
      if (prod) {
        updated[idx].name = prod.name;
        updated[idx].unit = prod.unit;
        updated[idx].unitPrice = prod.price;
        updated[idx].subtotal = updated[idx].qty * prod.price;
      }
    } else if (field === 'qty') {
      updated[idx].qty = parseInt(val) || 1;
      updated[idx].subtotal = updated[idx].qty * updated[idx].unitPrice;
    } else if (field === 'unitPrice') {
      updated[idx].unitPrice = parseFloat(val) || 0;
      updated[idx].subtotal = updated[idx].qty * updated[idx].unitPrice;
    } else if (field === 'name') {
      updated[idx].name = val;
    }
    setSphForm({ ...sphForm, items: updated });
  };

  const handleRemoveSphItem = (idx: number) => {
    if (sphForm.items.length <= 1) return;
    setSphForm({ ...sphForm, items: sphForm.items.filter((_, i) => i !== idx) });
  };

  const sphSubtotal = sphForm.items.reduce((s, it) => s + it.subtotal, 0);
  const sphPpn = Math.round(sphSubtotal * 0.11);
  const sphTotal = sphSubtotal + sphPpn;

  const handleSaveSph = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sphForm.projectTitle) {
      onNotify?.('Nama Proyek / Pengadaan harus diisi!', 'error');
      return;
    }

    const newSph = store.addSPH({
      customerName: sphForm.customerName || 'Customer Proyek',
      customerPhone: sphForm.customerPhone,
      projectTitle: sphForm.projectTitle,
      date: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + sphForm.validDays * 86400000).toISOString().split('T')[0],
      itemsSummary: sphForm.items.map(it => `${it.qty} ${it.unit} ${it.name}`).join(', '),
      subtotal: sphSubtotal,
      ppnAmount: sphPpn,
      totalAmount: sphTotal,
      items: sphForm.items,
      termsAndConditions: sphForm.termsAndConditions
    });

    setIsSphModalOpen(false);
    onNotify?.(`Surat Penawaran ${newSph.code} berhasil diterbitkan!`, 'success');
  };

  // Convert SPH to SO
  const handleConvertSphToSo = (sph: SPHQuotation) => {
    if (confirm(`Konversi SPH ${sph.code} menjadi Sales Order (SO)?`)) {
      const so = store.convertSphToSalesOrder(sph.id);
      onNotify?.(`Sales Order ${so.soNumber} berhasil dibuat dari ${sph.code}!`, 'success');
      setActiveTab('so');
    }
  };

  // Convert SO to Sales Invoice
  const handleConvertSoToInvoice = (so: SalesOrder) => {
    if (confirm(`Terbitkan Faktur Invoice untuk ${so.soNumber}?`)) {
      const invoiceItems = so.items.map(it => ({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: it.name,
        qty: it.qty,
        unit: it.unit,
        unitPrice: it.unitPrice,
        total: it.subtotal
      }));

      const subtotal = invoiceItems.reduce((s, i) => s + i.total, 0);
      const taxPpn = Math.round(subtotal * 0.11);

      const newInv = store.createSalesInvoice({
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        customerName: so.customerName,
        customerPhone: so.customerPhone,
        projectName: so.notes,
        referenceSph: so.sphReference,
        referencePo: so.soNumber,
        items: invoiceItems,
        subtotal,
        discount: 0,
        taxPpn,
        totalAmount: subtotal + taxPpn,
        paidAmount: 0,
        status: 'unpaid'
      });

      so.status = 'completed';
      store.save();
      onNotify?.(`Faktur Penjualan ${newInv.invoiceNumber} berhasil diterbitkan!`, 'success');
      setActiveTab('invoice');
    }
  };

  // Pay Invoice
  const handleOpenPay = (inv: SalesInvoice) => {
    setSelectedInvoiceToPay(inv);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInvoiceToPay) return;
    store.markInvoicePaid(selectedInvoiceToPay.id, payMethod);
    setIsPayModalOpen(false);
    onNotify?.(`Pelunasan Faktur ${selectedInvoiceToPay.invoiceNumber} berhasil dicatat via ${payMethod}!`, 'success');
  };

  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid');
  const totalPiutang = unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>MODUL 6: PENJUALAN & PROYEK (SALES & BILLING)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Penawaran, Pesanan & Faktur Penjualan</h2>
          <p className="text-xs text-slate-500 mt-1">
            Siklus terpadu SPH (Surat Penawaran Harga), Sales Order (SO), Faktur Penjualan (Invoice), dan Buku Piutang Pelanggan.
          </p>
        </div>

        <button
          onClick={() => setIsSphModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Penawaran (SPH)</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('sph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'sph' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Penawaran SPH ({sphList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('so')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'so' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Order ({soList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'invoice' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Faktur Invoice ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('piutang')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'piutang' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Buku Piutang ({formatRupiah(totalPiutang)})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR SPH */}
      {activeTab === 'sph' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Daftar Surat Penawaran Harga (SPH) Resmi</h3>
            <span className="text-xs text-slate-500 font-semibold">{sphList.length} SPH Diterbitkan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nomor SPH</th>
                  <th className="py-3 px-3">Tanggal & Masa Berlaku</th>
                  <th className="py-3 px-3">Nama Rekanan / Proyek</th>
                  <th className="py-3 px-3 text-right">Nilai Total Penawaran</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sphList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Belum ada surat penawaran harga (SPH). Klik "+ Buat Penawaran (SPH)" untuk membuat penawaran resmi.
                    </td>
                  </tr>
                ) : (
                  sphList.map(sph => (
                    <tr key={sph.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{sph.code}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        <div>{formatDate(sph.date)}</div>
                        <div className="text-[10px] text-slate-400">s/d {formatDate(sph.validUntil)}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{sph.customerName}</div>
                        <div className="text-[11px] text-slate-500">{sph.projectTitle}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(sph.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          sph.status === 'converted_invoice' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {sph.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {sph.status === 'waiting_po' && (
                            <button
                              onClick={() => handleConvertSphToSo(sph)}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] transition"
                            >
                              Jadikan SO
                            </button>
                          )}
                          <button
                            onClick={() => onPrintSph(sph)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALES ORDER (SO) */}
      {activeTab === 'so' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Konfirmasi Pesanan Penjualan (Sales Order)</h3>
            <span className="text-xs text-slate-500 font-semibold">{soList.length} Sales Order</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Sales Order</th>
                  <th className="py-3 px-3">Ref SPH</th>
                  <th className="py-3 px-3">Customer & Proyek</th>
                  <th className="py-3 px-3">Target Kirim</th>
                  <th className="py-3 px-3 text-right">Nilai Pesanan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi Faktur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {soList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada Sales Order aktif. Konversi SPH yang disetujui untuk membuat SO.
                    </td>
                  </tr>
                ) : (
                  soList.map(so => (
                    <tr key={so.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{so.soNumber}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{so.sphReference || '-'}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{so.customerName}</div>
                        <div className="text-[11px] text-slate-500">{so.notes}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">{formatDate(so.deliveryDateTarget)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(so.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          so.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {so.status === 'completed' ? 'Faktur Terbit' : 'Proses Order'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {so.status !== 'completed' ? (
                          <button
                            onClick={() => handleConvertSoToInvoice(so)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                          >
                            + Terbitkan Faktur
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FAKTUR INVOICE PENJUALAN */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Daftar Faktur Penjualan Proyek (Sales Invoices)</h3>
            <span className="text-xs text-slate-500 font-semibold">{invoices.length} Faktur</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Tanggal & Tempo</th>
                  <th className="py-3 px-3">Customer / Rekanan</th>
                  <th className="py-3 px-3 text-right">Total Tagihan</th>
                  <th className="py-3 px-3 text-right">Terbayar</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada faktur penjualan proyek.
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        <div>{formatDate(inv.date)}</div>
                        <div className="text-[10px] text-slate-400">Tempo: {formatDate(inv.dueDate)}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                        <div className="text-[11px] text-slate-500">{inv.projectName || '-'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">
                        {formatRupiah(inv.paidAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.doReference ? (
                            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {inv.doReference}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const newDO = store.createDeliveryOrderFromInvoice(inv.id);
                                onNotify?.(`Surat Jalan ${newDO.doNumber} berhasil dibuat dari ${inv.invoiceNumber}!`, 'success');
                              }}
                              className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold text-[10px] transition"
                              title="Buat Surat Jalan DO"
                            >
                              + Buat DO
                            </button>
                          )}
                          {inv.status !== 'paid' && (
                            <button
                              onClick={() => handleOpenPay(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition"
                            >
                              Pelunasan
                            </button>
                          )}
                          <button
                            onClick={() => onPrintInvoice(inv)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUKU PIUTANG CUSTOMER */}
      {activeTab === 'piutang' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Buku Piutang Pelanggan & Aging</h3>
              <p className="text-xs text-slate-500">Daftar tagihan faktur proyek yang belum diselesaikan oleh pelanggan.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Piutang Berjalan:</span>
              <span className="text-xl font-black font-mono text-amber-600">{formatRupiah(totalPiutang)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Customer / Rekanan</th>
                  <th className="py-3 px-3">Tanggal Tagihan</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Nilai Tagihan</th>
                  <th className="py-3 px-3 text-right">Sisa Piutang</th>
                  <th className="py-3 px-3 text-center">Pelunasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada piutang proyek yang belum lunas.
                    </td>
                  </tr>
                ) : (
                  unpaidInvoices.map(inv => {
                    const remaining = inv.totalAmount - inv.paidAmount;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{inv.customerName}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{formatDate(inv.date)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{formatRupiah(inv.totalAmount)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">{formatRupiah(remaining)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenPay(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Catat Pelunasan
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

      {/* MODAL: BUAT SPH */}
      {isSphModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Buat Surat Penawaran Harga (SPH) Baru</h3>
              <button onClick={() => setIsSphModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSph} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Customer Rekanan *</label>
                  <select
                    value={sphForm.customerId}
                    onChange={e => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setSphForm({
                        ...sphForm,
                        customerId: e.target.value,
                        customerName: cust?.name || '',
                        customerPhone: cust?.phone || ''
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Proyek / Pengadaan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan Kabel Feeder & Panel Gedung B"
                    value={sphForm.projectTitle}
                    onChange={e => setSphForm({ ...sphForm, projectTitle: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Rincian Barang & Material SPH</span>
                  <button type="button" onClick={handleAddSphItem} className="text-blue-600 font-bold hover:underline">
                    + Tambah Baris
                  </button>
                </div>

                {sphForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        onChange={e => handleUpdateSphItem(idx, 'productId', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={e => handleUpdateSphItem(idx, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={it.unitPrice}
                        onChange={e => handleUpdateSphItem(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {sphForm.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveSphItem(idx)} className="text-rose-500 font-bold">✕</button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 text-right space-y-1">
                  <div>Subtotal: <b className="font-mono">{formatRupiah(sphSubtotal)}</b></div>
                  <div>PPN 11%: <b className="font-mono">{formatRupiah(sphPpn)}</b></div>
                  <div className="text-sm font-black text-slate-900">Total Penawaran: <b className="font-mono text-blue-700">{formatRupiah(sphTotal)}</b></div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Syarat & Ketentuan Pembayaran SPH</label>
                <textarea
                  rows={3}
                  value={sphForm.termsAndConditions}
                  onChange={e => setSphForm({ ...sphForm, termsAndConditions: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsSphModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md">
                  Terbitkan SPH Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PELUNASAN FAKTUR */}
      {isPayModalOpen && selectedInvoiceToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 pb-2 border-b">
              Penerimaan Pelunasan Faktur Penjualan
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div>No. Faktur: <b className="font-mono">{selectedInvoiceToPay.invoiceNumber}</b></div>
              <div>Customer: <b>{selectedInvoiceToPay.customerName}</b></div>
              <div>Total Tagihan: <b className="font-mono text-emerald-700">{formatRupiah(selectedInvoiceToPay.totalAmount)}</b></div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Rekening / Kanal Pembayaran</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA PT Nirwana Jaya Nugraha</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Kasir Tunai">Kas Tunai Kios</option>
                <option value="QRIS Merchant">QRIS Merchant</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md"
              >
                Konfirmasi Pelunasan Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

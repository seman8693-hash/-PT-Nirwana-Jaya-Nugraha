import React, { useState } from 'react';
import {
  ShoppingBag,
  Plus,
  Printer,
  FileCheck2,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  X
} from 'lucide-react';
import { store } from '../store';
import { PurchaseOrder, PurchaseInvoice, PosProduct, Supplier } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface PurchaseModuleProps {
  onPrintPurchase: (nota: any) => void;
  preselectedProduct?: PosProduct;
  preselectedQty?: number;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const PurchaseModule: React.FC<PurchaseModuleProps> = ({
  onPrintPurchase,
  preselectedProduct,
  preselectedQty,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'po' | 'nota' | 'hutang'>('po');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isPayDebtModalOpen, setIsPayDebtModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<PurchaseInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payBankMethod, setPayBankMethod] = useState('Bank Mandiri');

  // New PO Form
  const suppliers = store.getSuppliers();
  const products = store.getProducts();

  const [poForm, setPoForm] = useState({
    supplierId: suppliers[0]?.id || '',
    expectedDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    items: [
      {
        productId: preselectedProduct?.id || products[0]?.id || '',
        qty: preselectedQty || 10,
        unitPrice: preselectedProduct?.hppPrice || products[0]?.hppPrice || 100000
      }
    ],
    notes: 'Mohon dikirim sesuai tanggal estimasi bersama faktur resmi & surat jalan.'
  });

  const purchaseOrders = store.getPurchaseOrders();
  const purchaseInvoices = store.getPurchaseInvoices();

  // Handle PO Item Add / Remove
  const handleAddPoItem = () => {
    setPoForm({
      ...poForm,
      items: [
        ...poForm.items,
        {
          productId: products[0]?.id || '',
          qty: 10,
          unitPrice: products[0]?.hppPrice || 50000
        }
      ]
    });
  };

  const handleRemovePoItem = (index: number) => {
    setPoForm({
      ...poForm,
      items: poForm.items.filter((_, i) => i !== index)
    });
  };

  const handlePoItemChange = (index: number, field: string, value: any) => {
    const updated = [...poForm.items];
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      updated[index].productId = value;
      if (prod) {
        updated[index].unitPrice = prod.hppPrice;
      }
    } else if (field === 'qty') {
      updated[index].qty = parseInt(value) || 1;
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = parseFloat(value) || 0;
    }
    setPoForm({ ...poForm, items: updated });
  };

  const poSubtotal = poForm.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const poPpn = Math.round(poSubtotal * 0.11);
  const poGrandTotal = poSubtotal + poPpn;

  const handleSavePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === poForm.supplierId) || suppliers[0];
    const poItems = poForm.items.map(it => {
      const prod = products.find(p => p.id === it.productId);
      return {
        id: `poi-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        sku: prod?.sku || 'SKU-GEN',
        name: prod?.name || 'Barang Listrik',
        qty: it.qty,
        unit: prod?.unit || 'Pcs',
        unitPrice: it.unitPrice,
        subtotal: it.qty * it.unitPrice
      };
    });

    const newPO = store.createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      supplierPhone: sup.phone,
      date: new Date().toISOString().split('T')[0],
      expectedDate: poForm.expectedDate,
      items: poItems,
      subtotal: poSubtotal,
      taxPpn: poPpn,
      totalAmount: poGrandTotal,
      notes: poForm.notes
    });

    setIsPoModalOpen(false);
    onNotify?.(`Purchase Order ${newPO.poNumber} berhasil diterbitkan!`, 'success');
  };

  // Convert PO to Good Receipt & Nota Pembelian
  const handleReceiveGoodsFromPo = (po: PurchaseOrder) => {
    if (confirm(`Terima barang fisik dari PO ${po.poNumber} dan tambahkan ke stok sekarang?`)) {
      const newNota = store.receiveGoodsAndCreateNota({
        poReference: po.poNumber,
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        warehouse: 'Gudang Utama Cipamokolan Bandung',
        items: po.items,
        subtotal: po.subtotal,
        discount: 0,
        taxPpn: po.taxPpn,
        totalAmount: po.totalAmount,
        paidAmount: 0,
        status: 'unpaid',
        paymentMethod: 'Tempo 30 Hari',
        receivedBy: store.getCurrentUser().name
      });

      po.status = 'received';
      store.save();
      onNotify?.(`Penerimaan barang selesai! ${newNota.invoiceNumber} dicatat dan stok fisik bertambah.`, 'success');
    }
  };

  // Pay Supplier Debt
  const handleOpenPayDebt = (invoice: PurchaseInvoice) => {
    setSelectedInvoiceToPay(invoice);
    setPayAmount(invoice.totalAmount - invoice.paidAmount);
    setIsPayDebtModalOpen(true);
  };

  const handleConfirmPayDebt = () => {
    if (!selectedInvoiceToPay || payAmount <= 0) return;
    store.paySupplierDebt(selectedInvoiceToPay.id, payAmount, payBankMethod);
    setIsPayDebtModalOpen(false);
    onNotify?.(`Pelunasan hutang ${selectedInvoiceToPay.invoiceNumber} berhasil dicatat via ${payBankMethod}!`, 'success');
  };

  // Unpaid invoices for Hutang tab
  const unpaidInvoices = purchaseInvoices.filter(i => i.status === 'unpaid');
  const totalHutang = unpaidInvoices.reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <ShoppingBag className="w-4 h-4" />
            <span>MODUL 5: PEMBELIAN & PENGADAAN (PROCUREMENT)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Purchase Order & Penerimaan Barang</h2>
          <p className="text-xs text-slate-500 mt-1">
            Penerbitan PO supplier resmi, penerimaan fisik barang masuk ke stok gudang, dan pengelolaan hutang dagang.
          </p>
        </div>

        <button
          onClick={() => setIsPoModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Purchase Order (PO)</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('po')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'po' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Purchase Order ({purchaseOrders.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('nota')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'nota' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Penerimaan & Nota Pembelian ({purchaseInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('hutang')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'hutang' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Buku Hutang Supplier ({formatRupiah(totalHutang)})</span>
        </button>
      </div>

      {/* TAB 1: PURCHASE ORDER LIST */}
      {activeTab === 'po' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Daftar Purchase Order (PO) ke Supplier</h3>
            <span className="text-xs text-slate-500 font-semibold">{purchaseOrders.length} Dokumen PO</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. PO</th>
                  <th className="py-3 px-3">Tanggal Terbit</th>
                  <th className="py-3 px-3">Distributor / Supplier</th>
                  <th className="py-3 px-3">Estimasi Kedatangan</th>
                  <th className="py-3 px-3 text-right">Nilai Total PO</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada Purchase Order yang dibuat. Klik tombol "+ Buat Purchase Order (PO)" di atas.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map(po => (
                    <tr key={po.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{po.poNumber}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{formatDate(po.date)}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{po.supplierName}</div>
                        <div className="text-[10px] text-slate-500">{po.items.length} Macam Barang</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{formatDate(po.expectedDate)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(po.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          po.status === 'received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {po.status === 'received' ? 'Barang Diterima' : 'Menunggu Pengiriman'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {po.status !== 'received' && (
                            <button
                              onClick={() => handleReceiveGoodsFromPo(po)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition"
                            >
                              Terima Barang
                            </button>
                          )}
                          <button
                            onClick={() => onPrintPurchase(po)}
                            className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Cetak PO"
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

      {/* TAB 2: NOTA PEMBELIAN & PENERIMAAN BARANG */}
      {activeTab === 'nota' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Nota Pembelian & Bukti Penerimaan Barang Gudang</h3>
            <span className="text-xs text-slate-500 font-semibold">{purchaseInvoices.length} Faktur Pembelian</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Nota Beli</th>
                  <th className="py-3 px-3">Tanggal Masuk</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Ref PO</th>
                  <th className="py-3 px-3 text-right">Nilai Total</th>
                  <th className="py-3 px-3 text-right">Terbayar</th>
                  <th className="py-3 px-3 text-center">Status Pembayaran</th>
                  <th className="py-3 px-3 text-center">Cetak Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada nota pembelian yang masuk.
                    </td>
                  </tr>
                ) : (
                  purchaseInvoices.map(nota => (
                    <tr key={nota.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{nota.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{formatDate(nota.date)}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{nota.supplierName}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{nota.poReference || '-'}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(nota.totalAmount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-700">
                        {formatRupiah(nota.paidAmount)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          nota.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {nota.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onPrintPurchase(nota)}
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
      )}

      {/* TAB 3: BUKU HUTANG SUPPLIER & AGING */}
      {activeTab === 'hutang' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Buku Hutang Dagang Supplier & Jatuh Tempo</h3>
              <p className="text-xs text-slate-500">Daftar tagihan supplier yang belum dilunasi oleh PT Nirwana Jaya Nugraha.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Hutang Berjalan:</span>
              <span className="text-xl font-black font-mono text-rose-600">{formatRupiah(totalHutang)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Nota</th>
                  <th className="py-3 px-3">Distributor / Supplier</th>
                  <th className="py-3 px-3">Tanggal Nota</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Total Tagihan</th>
                  <th className="py-3 px-3 text-right">Sisa Hutang</th>
                  <th className="py-3 px-3 text-center">Aksi Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Hebat! Tidak ada hutang pembelian supplier yang tertunggak.
                    </td>
                  </tr>
                ) : (
                  unpaidInvoices.map(inv => {
                    const remaining = inv.totalAmount - inv.paidAmount;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{inv.supplierName}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{formatDate(inv.date)}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600">{formatDate(inv.dueDate)}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{formatRupiah(inv.totalAmount)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">{formatRupiah(remaining)}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleOpenPayDebt(inv)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                          >
                            Bayar Hutang
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

      {/* MODAL: BUAT PURCHASE ORDER (PO) */}
      {isPoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Buat Purchase Order (PO) Baru</h3>
                <p className="text-xs text-slate-500">Penerbitan surat pesanan resmi ke distributor pabrik.</p>
              </div>
              <button onClick={() => setIsPoModalOpen(false)} className="p-1.5 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePo} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Supplier Distributor *</label>
                  <select
                    value={poForm.supplierId}
                    onChange={e => setPoForm({ ...poForm, supplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.pic})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Tanggal Kirim</label>
                  <input
                    type="date"
                    required
                    value={poForm.expectedDate}
                    onChange={e => setPoForm({ ...poForm, expectedDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Daftar Barang yang Dipesan</span>
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    + Tambah Baris
                  </button>
                </div>

                {poForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={it.productId}
                        onChange={e => handlePoItemChange(idx, 'productId', e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={e => handlePoItemChange(idx, 'qty', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-center text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={it.unitPrice}
                        onChange={e => handlePoItemChange(idx, 'unitPrice', e.target.value)}
                        placeholder="Harga Satuan"
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-right text-xs"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {poForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePoItem(idx)}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 text-right space-y-1">
                  <div className="text-slate-600">Subtotal: <span className="font-mono font-bold">{formatRupiah(poSubtotal)}</span></div>
                  <div className="text-slate-600">PPN 11%: <span className="font-mono font-bold">{formatRupiah(poPpn)}</span></div>
                  <div className="text-sm font-black text-slate-900">Total PO: <span className="font-mono text-indigo-700">{formatRupiah(poGrandTotal)}</span></div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan untuk Supplier</label>
                <textarea
                  rows={2}
                  value={poForm.notes}
                  onChange={e => setPoForm({ ...poForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
                >
                  Terbitkan Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BAYAR HUTANG SUPPLIER */}
      {isPayDebtModalOpen && selectedInvoiceToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 pb-2 border-b">
              Pelunasan Hutang Pembelian
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div>No. Nota: <b className="font-mono">{selectedInvoiceToPay.invoiceNumber}</b></div>
              <div>Supplier: <b>{selectedInvoiceToPay.supplierName}</b></div>
              <div>Sisa Hutang: <b className="font-mono text-rose-600">{formatRupiah(selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount)}</b></div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jumlah Pembayaran (Rp) *</label>
              <input
                type="number"
                max={selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount}
                value={payAmount}
                onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-base text-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Sumber Kas / Rekening Pengirim</label>
              <select
                value={payBankMethod}
                onChange={e => setPayBankMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-semibold"
              >
                <option value="Bank BCA">Bank BCA PT Nirwana Jaya Nugraha</option>
                <option value="Bank Mandiri">Bank Mandiri Operasional</option>
                <option value="Kas Tunai">Kas Tunai Toko / Brankas</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsPayDebtModalOpen(false)}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPayDebt}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
              >
                Konfirmasi Pelunasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

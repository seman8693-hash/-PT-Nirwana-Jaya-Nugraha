import React, { useState } from 'react';
import { Printer, CheckCircle, Clock, Truck, CreditCard } from 'lucide-react';
import { store } from '../store';
import { SalesInvoice } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface InvoiceModuleProps {
  onPrintInvoice: (inv: SalesInvoice) => void;
  onPrintDo: (inv: SalesInvoice) => void;
  onOpenPayModal: (inv: SalesInvoice) => void;
}

export const InvoiceModule: React.FC<InvoiceModuleProps> = ({
  onPrintInvoice,
  onPrintDo,
  onOpenPayModal
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const invoices = store.getInvoices();

  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'paid') return inv.status === 'paid';
    if (filterStatus === 'unpaid') return inv.status === 'unpaid';
    return true;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Resi Invoice Faktur &amp; Surat Jalan Delivery Order (DO)
          </h2>
          <p className="text-xs text-slate-500">
            Penagihan faktur resmi B2B, verifikasi pelunasan (Bank, QRIS, Wallet), dan cetak surat jalan logistik pengiriman.
          </p>
        </div>

        {/* Filter status */}
        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold outline-hidden"
          >
            <option value="all">Semua Status Faktur</option>
            <option value="paid">Faktur Lunas Saja</option>
            <option value="unpaid">Faktur Belum Lunas Saja</option>
          </select>
        </div>
      </div>

      {/* Tabel Faktur */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Daftar Faktur Penjualan &amp; Surat Jalan DO ({filteredInvoices.length} Faktur):
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">No. Faktur</th>
                <th className="py-3 px-4">Customer &amp; Proyek</th>
                <th className="py-3 px-4">Tanggal / Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total Tagihan</th>
                <th className="py-3 px-4 text-center">Status Pembayaran</th>
                <th className="py-3 px-4 text-right">Aksi &amp; Cetak Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                    Belum ada faktur tagihan proyek atau surat jalan DO.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const isPaid = inv.status === 'paid';
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{inv.customerName}</div>
                        <div className="text-[10px] text-slate-500">{inv.projectName || '-'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <div>{formatDate(inv.date)}</div>
                        <div className="text-[10px] text-rose-700 font-semibold">Jatuh Tempo: {formatDate(inv.dueDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                        {formatRupiah(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                            <CheckCircle className="w-3 h-3" />
                            LUNAS ({inv.paymentMethod})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-300">
                            <Clock className="w-3 h-3" />
                            BELUM LUNAS
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => onOpenPayModal(inv)}
                            type="button"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>
                        )}
                        <button
                          onClick={() => onPrintInvoice(inv)}
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          title="Cetak Faktur Penjualan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Faktur</span>
                        </button>
                        <button
                          onClick={() => onPrintDo(inv)}
                          type="button"
                          className="px-2.5 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          title="Cetak Surat Jalan DO"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Resi DO</span>
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
    </div>
  );
};

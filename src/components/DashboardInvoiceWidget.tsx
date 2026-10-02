import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  Truck,
  ArrowRight,
  Printer,
  DollarSign,
  Plus,
  Wallet,
  ExternalLink
} from 'lucide-react';
import { store } from '../store';
import { SalesInvoice } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface DashboardInvoiceWidgetProps {
  onNavigate: (tab: string) => void;
  onPayInvoice: (invoice: SalesInvoice) => void;
  onPrintInvoice: (invoice: SalesInvoice) => void;
  onCreateDoFromInvoice: (invoice: SalesInvoice) => void;
}

export const DashboardInvoiceWidget: React.FC<DashboardInvoiceWidgetProps> = ({
  onNavigate,
  onPayInvoice,
  onPrintInvoice,
  onCreateDoFromInvoice
}) => {
  const stats = store.getInvoiceStats();
  const invoices = store.getInvoices().slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-500/30 shadow-md overflow-hidden space-y-4">
      {/* Widget Header with Gold Badge */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-amber-500/20">
            🧾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-wide text-white uppercase">
                INVOICE & TAGIHAN
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                EXECUTIVE MONITORING
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Pemantauan piutang berjalan, faktur jatuh tempo, dan pelunasan pembayaran customer secara real-time.
            </p>
          </div>
        </div>

        {/* Quick Nav Shortcuts to the other 3 locations */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          <button
            onClick={() => onNavigate('penjualan')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition"
            title="Kelola & Buat Invoice di Menu Penjualan"
          >
            <span>Penjualan → Invoice</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigate('keuangan')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 font-bold text-xs transition"
            title="Buka Piutang & Pelunasan di Keuangan"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Keuangan → Piutang</span>
          </button>
          <button
            onClick={() => onNavigate('pengiriman')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 border border-purple-500/30 font-bold text-xs transition"
            title="Buka Keterkaitan DO di Pengiriman"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Pengiriman → DO</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* STATS TILES GRID - AS PRECISELY SPECIFIED BY USER */}
        {/* 2x3 MATRIX:
            [ Total | Belum Bayar | Overdue ]
            [ Draft | Terkirim    | Lunas   ]
        */}
        <div className="bg-slate-900/5 p-1 rounded-2xl border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* ROW 1, COL 1: Total Invoice */}
            <div
              onClick={() => onNavigate('penjualan')}
              className="p-4 sm:p-5 hover:bg-white transition cursor-pointer rounded-t-xl md:rounded-tr-none md:rounded-l-xl group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Total Invoice</span>
                <span className="text-[10px] text-slate-400 font-semibold group-hover:text-amber-600 transition flex items-center gap-0.5">
                  Buka Faktur <ExternalLink className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {stats.totalCount} <span className="text-xs font-semibold text-slate-500">Faktur</span>
              </div>
              <div className="text-xs text-slate-600 mt-1 font-semibold flex items-center justify-between">
                <span>Total Nilai Tagihan:</span>
                <span className="font-mono font-bold text-slate-900">{formatRupiah(stats.totalValue)}</span>
              </div>
            </div>

            {/* ROW 1, COL 2: Belum Bayar */}
            <div
              onClick={() => onNavigate('keuangan')}
              className="p-4 sm:p-5 hover:bg-amber-50/70 transition cursor-pointer group bg-amber-50/30"
            >
              <div className="flex items-center justify-between text-amber-900 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span>Belum Bayar (Outstanding)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                </span>
                <span className="text-[10px] text-amber-700 font-semibold group-hover:underline flex items-center gap-0.5">
                  Kelola Piutang <ExternalLink className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                {formatRupiah(stats.totalOutstanding)}
              </div>
              <div className="text-xs text-amber-800 mt-1 font-semibold flex items-center justify-between">
                <span>Faktur Belum Lunas:</span>
                <span className="font-bold">{stats.unpaidCount + stats.overdueCount} Tagihan Aktif</span>
              </div>
            </div>

            {/* ROW 1, COL 3: Overdue */}
            <div
              onClick={() => onNavigate('keuangan')}
              className="p-4 sm:p-5 hover:bg-rose-50/70 transition cursor-pointer rounded-b-xl md:rounded-bl-none md:rounded-r-xl group bg-rose-50/30"
            >
              <div className="flex items-center justify-between text-rose-900 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                  <span>Invoice Overdue (Lewat Tempo)</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </span>
                <span className="text-[10px] text-rose-700 font-semibold group-hover:underline flex items-center gap-0.5">
                  Tagih Segera <ExternalLink className="w-3 h-3" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                {formatRupiah(stats.totalOverdueAmount)}
              </div>
              <div className="text-xs text-rose-800 mt-1 font-semibold flex items-center justify-between">
                <span>Melewati Jatuh Tempo:</span>
                <span className="font-bold">{stats.overdueCount} Faktur Menunggak!</span>
              </div>
            </div>
          </div>

          {/* SECOND ROW OF 2x3 MATRIX: Draft | Terkirim | Lunas */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-t border-slate-200">
            {/* ROW 2, COL 1: Draft */}
            <div
              onClick={() => onNavigate('penjualan')}
              className="p-4 sm:p-5 hover:bg-white transition cursor-pointer rounded-b-xl md:rounded-br-none md:rounded-bl-xl group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Invoice Draft</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">Draft</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
                {stats.draftCount} <span className="text-xs font-semibold text-slate-500">Draft</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Belum dikirim resmi ke customer / rekanan
              </div>
            </div>

            {/* ROW 2, COL 2: Terkirim */}
            <div
              onClick={() => onNavigate('penjualan')}
              className="p-4 sm:p-5 hover:bg-blue-50/60 transition cursor-pointer group bg-blue-50/20"
            >
              <div className="flex items-center justify-between text-blue-900 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">Invoice Terkirim</span>
                <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">Sent</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
                {stats.sentCount} <span className="text-xs font-semibold text-blue-600">Terkirim</span>
              </div>
              <div className="text-xs text-blue-700 mt-1 font-medium">
                Sudah di tangan rekanan, menunggu jadwal tempo
              </div>
            </div>

            {/* ROW 2, COL 3: Lunas */}
            <div
              onClick={() => onNavigate('keuangan')}
              className="p-4 sm:p-5 hover:bg-emerald-50/60 transition cursor-pointer rounded-b-xl md:rounded-bl-none md:rounded-br-xl group bg-emerald-50/20"
            >
              <div className="flex items-center justify-between text-emerald-900 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Invoice Lunas (Paid)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Lunas</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {stats.paidCount} <span className="text-xs font-semibold text-emerald-600">Selesai</span>
              </div>
              <div className="text-xs text-emerald-800 mt-1 font-semibold flex items-center justify-between">
                <span>Pembayaran Hari Ini:</span>
                <span className="font-mono font-bold text-emerald-700">{formatRupiah(stats.paidTodayAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* WORKFLOW CHAIN BANNER */}
        <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-amber-400 font-black">🔄 ALUR ERP:</span>
            <span className="text-slate-300 font-semibold hidden sm:inline">
              SPH ➔ Sales Order ➔ DO / Surat Jalan ➔ <b className="text-amber-400 font-bold underline">INVOICE</b> ➔ Piutang ➔ Pembayaran ➔ Lunas
            </span>
            <span className="text-slate-300 font-semibold sm:hidden">
              SPH ➔ SO ➔ DO ➔ <b>INVOICE</b> ➔ Lunas
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            *Satu sumber data invoice tunggal terhubung ke Pengiriman & Keuangan
          </span>
        </div>

        {/* LATEST INVOICES TABLE WITH DIRECT CROSS-MODULE ACTIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Faktur Penjualan Terkini & Tindakan Operasional
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                Live Data Synchronized
              </span>
            </div>
            <button
              onClick={() => onNavigate('penjualan')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              <span>Kelola Semua di Modul Penjualan ({stats.totalCount})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Faktur</th>
                  <th className="py-2.5 px-3">Customer / Rekanan</th>
                  <th className="py-2.5 px-3">Tanggal & Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Nilai Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Surat Jalan (DO)</th>
                  <th className="py-2.5 px-3 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada faktur yang dibuat. Buka menu <b>6. Penjualan</b> untuk membuat faktur baru.
                    </td>
                  </tr>
                ) : (
                  invoices.map(inv => {
                    const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{inv.customerName}</div>
                          {inv.projectName && (
                            <div className="text-[10px] text-slate-500 truncate max-w-xs">{inv.projectName}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          <div>{formatDate(inv.date)}</div>
                          <div className={`text-[10px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Tempo: {formatDate(inv.dueDate)} {isOverdue && '(LEWAT!)'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(inv.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={remaining > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-700'}>
                            {formatRupiah(remaining)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            isOverdue ? 'bg-rose-100 text-rose-800' :
                            inv.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status === 'paid' ? 'Lunas' : isOverdue ? 'Overdue' : inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {inv.doReference ? (
                            <span
                              onClick={() => onNavigate('pengiriman')}
                              className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 cursor-pointer hover:bg-purple-100 transition"
                              title="Buka detail surat jalan di Pengiriman"
                            >
                              {inv.doReference}
                            </span>
                          ) : (
                            <button
                              onClick={() => onCreateDoFromInvoice(inv)}
                              className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold text-[10px] inline-flex items-center gap-1 transition"
                              title="Terbitkan Surat Jalan DO otomatis dari invoice ini"
                            >
                              <Truck className="w-3 h-3" />
                              <span>+ Buat DO</span>
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => onPayInvoice(inv)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition"
                                title="Catat Pelunasan Pembayaran"
                              >
                                Pelunasan
                              </button>
                            )}
                            <button
                              onClick={() => onPrintInvoice(inv)}
                              className="p-1 text-slate-700 hover:bg-slate-200 rounded transition"
                              title="Cetak Faktur Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
    </div>
  );
};

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
  Plus
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
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-amber-500/20">
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
              Pemantauan piutang beredar, faktur jatuh tempo, dan pelunasan pembayaran customer secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => onNavigate('penjualan')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow transition"
          >
            <span>Kelola di Penjualan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* STATS TILES GRID - AS REQUESTED BY USER */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Tile 1: Total Invoice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Invoice</span>
            <div className="text-xl font-black text-slate-900 mt-1 font-mono">{stats.totalCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">
              Nilai: <b className="text-slate-800 font-mono">{formatRupiah(stats.totalValue)}</b>
            </div>
          </div>

          {/* Tile 2: Belum Bayar (Outstanding) */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block flex items-center justify-between">
              <span>Belum Bayar</span>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </span>
            <div className="text-xl font-black text-amber-950 mt-1 font-mono">
              {formatRupiah(stats.totalOutstanding)}
            </div>
            <div className="text-[10px] text-amber-800 font-semibold mt-0.5">
              {stats.unpaidCount + stats.overdueCount} Faktur Menunggu
            </div>
          </div>

          {/* Tile 3: Overdue / Jatuh Tempo */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-900 block flex items-center justify-between">
              <span>Overdue (Tempo)</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </span>
            <div className="text-xl font-black text-rose-700 mt-1 font-mono">
              {formatRupiah(stats.totalOverdueAmount)}
            </div>
            <div className="text-[10px] text-rose-800 font-bold mt-0.5">
              {stats.overdueCount} Faktur Lewat Tempo!
            </div>
          </div>

          {/* Tile 4: Draft */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Draft Invoice</span>
            <div className="text-xl font-black text-slate-700 mt-1 font-mono">{stats.draftCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Belum Diterbitkan</div>
          </div>

          {/* Tile 5: Terkirim */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">Terkirim ke Rekanan</span>
            <div className="text-xl font-black text-blue-900 mt-1 font-mono">{stats.sentCount}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Menunggu Tagihan</div>
          </div>

          {/* Tile 6: Lunas */}
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block">Lunas (Paid)</span>
            <div className="text-xl font-black text-emerald-700 mt-1 font-mono">{stats.paidCount}</div>
            <div className="text-[10px] text-emerald-800 font-semibold mt-0.5 truncate">
              Hari ini: <b className="font-mono">{formatRupiah(stats.paidTodayAmount)}</b>
            </div>
          </div>
        </div>

        {/* LATEST INVOICES TABLE WITH DIRECT CROSS-MODULE ACTIONS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Faktur Penjualan Terkini & Tindakan Langsung
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                Terhubung ke DO & Keuangan
              </span>
            </div>
            <button
              onClick={() => onNavigate('penjualan')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Lihat Semua Faktur ({stats.totalCount}) →
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No. Faktur</th>
                  <th className="py-2.5 px-3">Customer / Proyek</th>
                  <th className="py-2.5 px-3">Tanggal & Tempo</th>
                  <th className="py-2.5 px-3 text-right">Nilai Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">DO / Surat Jalan</th>
                  <th className="py-2.5 px-3 text-center">Tindakan Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada faktur yang dibuat. Buat faktur dari modul <b>6. Penjualan</b> atau konversi dari SO.
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
                            <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
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
                                className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition"
                              >
                                Pelunasan
                              </button>
                            )}
                            <button
                              onClick={() => onPrintInvoice(inv)}
                              className="p-1 text-slate-700 hover:bg-slate-200 rounded transition"
                              title="Cetak Faktur"
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

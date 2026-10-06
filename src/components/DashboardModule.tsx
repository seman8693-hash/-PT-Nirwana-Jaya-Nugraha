import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';
import {
  AlertTriangle,
  TrendingUp,
  Package,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Clock,
  Sparkles,
  Edit2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Truck,
  ShoppingBag,
  FileText,
  DollarSign,
  ShieldAlert,
  History,
  Building2
} from 'lucide-react';
import { store } from '../store';
import { PosProduct, MonthlySalesTrend, SalesInvoice } from '../types';
import { formatRupiah, formatNumber } from '../utils/format';
import { DashboardInvoiceWidget } from './DashboardInvoiceWidget';

interface DashboardModuleProps {
  onNavigate: (tab: string) => void;
  onOpenRestockModal: (product: PosProduct, suggestedQty?: number) => void;
  onOpenCreateNota: (product?: PosProduct, suggestedQty?: number) => void;
  onPayInvoice?: (invoice: SalesInvoice) => void;
  onPrintInvoice?: (invoice: SalesInvoice) => void;
  onCreateDoFromInvoice?: (invoice: SalesInvoice) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onNavigate,
  onOpenRestockModal,
  onOpenCreateNota,
  onPayInvoice,
  onPrintInvoice,
  onCreateDoFromInvoice
}) => {
  const [chartMode, setChartMode] = useState<'omset' | 'volume' | 'restock'>('omset');
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(store.getTargetAmount().toString());

  const products = store.getProducts();
  const kpi = store.getOverallKPI();
  const monthlyTrends = store.getMonthlyTrends();
  const targetAmount = store.getTargetAmount();
  const smartRestockItems = store.getSmartRestockRecommendations();
  const criticalItems = smartRestockItems.filter(p => p.urgency === 'critical');
  const warningItems = smartRestockItems.filter(p => p.urgency === 'warning');
  const auditLogs = store.getAuditLogs().slice(0, 8);
  const deliveryOrders = store.getDeliveryOrders();
  const unpaidInvoices = store.getInvoices().filter(i => i.status === 'unpaid');
  const unpaidPurchases = store.getPurchaseInvoices().filter(p => p.status === 'unpaid');

  const restockChartData = products.slice(0, 8).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    stokSaatIni: p.stock,
    stokMinimum: p.minStock,
    saranRestok: p.recommendedReorderQty || 0
  }));

  const lastMonthOmset = monthlyTrends[monthlyTrends.length - 1]?.totalOmset || 0;
  const prevMonthOmset = monthlyTrends[monthlyTrends.length - 2]?.totalOmset || 0;
  let growthLabel = '0% MoM';
  if (prevMonthOmset > 0) {
    const diff = ((lastMonthOmset - prevMonthOmset) / prevMonthOmset) * 100;
    growthLabel = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% MoM`;
  }

  const handleSaveTarget = () => {
    const val = parseFloat(targetInput);
    if (!isNaN(val) && val > 0) {
      store.setTargetAmount(val);
      setIsEditingTarget(false);
    }
  };

  const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((kpi.totalOmsetPenjualan / targetAmount) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner Alert (if critical items exist) */}
      {criticalItems.length > 0 && (
        <div className="bg-gradient-to-r from-rose-900/90 via-rose-800 to-rose-900 text-white p-4 rounded-2xl shadow-lg border border-rose-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-700/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-200 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-black tracking-wide flex items-center gap-2">
                PERINGATAN STOK KRITIS ({criticalItems.length} SKU Perlu Restok Segera)
              </h4>
              <p className="text-xs text-rose-200 mt-0.5">
                Stok barang telah berada di bawah batas aman minimum. Lakukan order pembelian agar penjualan kios & proyek tidak terhenti.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={() => onNavigate('inventory')}
              className="px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-950 text-white text-xs font-bold rounded-xl transition border border-rose-500/40"
            >
              Lihat di Inventory
            </button>
            <button
              onClick={() => onOpenCreateNota(criticalItems[0], criticalItems[0]?.recommendedReorderQty)}
              className="px-3.5 py-1.5 bg-white text-rose-900 hover:bg-rose-100 text-xs font-bold rounded-xl shadow-md transition"
            >
              + Order Pembelian
            </button>
          </div>
        </div>
      )}

      {/* Header & Target Overview */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Building2 className="w-4 h-4" />
            <span>SISTEM OPERASIONAL TERPADU POS & ERP</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Dashboard Eksekutif & KPI</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pantau performa penjualan riil, perputaran stok barang, hutang piutang, dan arus kas {store.getCompanySettings().companyName || 'Toko Nirwana Jaya Nugraha'}.
          </p>
        </div>

        {/* Target Omset Box */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full lg:w-96">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600">Pencapaian Target Omset</span>
            {isEditingTarget ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={targetInput}
                  onChange={e => setTargetInput(e.target.value)}
                  className="w-28 px-2 py-0.5 text-xs font-mono border rounded bg-white"
                />
                <button
                  onClick={handleSaveTarget}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingTarget(true)}
                className="text-[11px] text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
              >
                <span>Edit Target</span>
                <Edit2 className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-lg font-black text-slate-900">{formatRupiah(kpi.totalOmsetPenjualan)}</span>
            <span className="text-xs font-medium text-slate-500">Target: {formatRupiah(targetAmount)}</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-semibold">
            <span>{progressPercent}% Tercapai</span>
            <span>{growthLabel}</span>
          </div>
        </div>
      </div>

      {/* 6 MAIN KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Penjualan */}
        <div
          onClick={() => onNavigate('penjualan')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">1. Penjualan</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 leading-tight">
            {formatRupiah(kpi.totalOmsetPenjualan)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
            <span>Kios: {formatRupiah(kpi.omsetPos)}</span>
          </div>
        </div>

        {/* KPI 2: Stok / Aset */}
        <div
          onClick={() => onNavigate('inventory')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">2. Aset Stok</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 leading-tight">
            {formatRupiah(kpi.totalAsetStok)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>{products.length} SKU ({kpi.totalItemKritis} Kritis)</span>
          </div>
        </div>

        {/* KPI 3: Pembelian Supplier */}
        <div
          onClick={() => onNavigate('pembelian')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">3. Pembelian</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 leading-tight">
            {formatRupiah(kpi.totalPembelian)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Hutang: {formatRupiah(kpi.totalHutangSupplier)}</span>
          </div>
        </div>

        {/* KPI 4: Pengiriman */}
        <div
          onClick={() => onNavigate('pengiriman')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">4. Pengiriman</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-slate-900 leading-tight">
            {kpi.pengirimanBerjalan} Berjalan
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Total: {deliveryOrders.length} Dokumen DO</span>
          </div>
        </div>

        {/* KPI 5: Kas & Bank */}
        <div
          onClick={() => onNavigate('keuangan')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">5. Kas & Bank</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-teal-700 leading-tight">
            {formatRupiah(kpi.totalSaldoKasBank)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Piutang: {formatRupiah(kpi.totalPiutangCustomer)}</span>
          </div>
        </div>

        {/* KPI 6: Laba Bersih */}
        <div
          onClick={() => onNavigate('keuangan')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">6. Laba Bersih</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-emerald-600 leading-tight">
            {formatRupiah(kpi.labaBersih)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            <span>Kotor: {formatRupiah(kpi.labaKotor)}</span>
          </div>
        </div>
      </div>

      {/* PROMINENT EXECUTIVE INVOICE & TAGIHAN WIDGET */}
      <DashboardInvoiceWidget
        onNavigate={onNavigate}
        onPayInvoice={inv => onPayInvoice ? onPayInvoice(inv) : onNavigate('penjualan')}
        onPrintInvoice={inv => onPrintInvoice ? onPrintInvoice(inv) : onNavigate('penjualan')}
        onCreateDoFromInvoice={inv => onCreateDoFromInvoice ? onCreateDoFromInvoice(inv) : onNavigate('pengiriman')}
      />

      {/* Visual Chart & Recharts Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Grafik Analisis Tren & Perputaran Barang</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data dinamis dihitung otomatis dari transaksi riil yang tercatat di sistem POS & ERP.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setChartMode('omset')}
              className={`px-3 py-1.5 rounded-lg transition ${
                chartMode === 'omset' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omset Penjualan (Rp)
            </button>
            <button
              onClick={() => setChartMode('volume')}
              className={`px-3 py-1.5 rounded-lg transition ${
                chartMode === 'volume' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume Terjual (Unit)
            </button>
            <button
              onClick={() => setChartMode('restock')}
              className={`px-3 py-1.5 rounded-lg transition ${
                chartMode === 'restock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analisis Stok vs Reorder
            </button>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'omset' ? (
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickFormatter={val => `Rp ${val / 1000000}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val) || 0), '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="penjualanKios" name="Penjualan Kasir Kios" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="omsetFaktur" name="Faktur Proyek (Invoice)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : chartMode === 'volume' ? (
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="totalUnitsSold"
                  name="Total Unit / Meter Terjual"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={restockChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="stokSaatIni" name="Stok Saat Ini" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stokMinimum" name="Batas Minimum" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saranRestok" name="Rekomendasi Restok" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* DUAL SECTION: ALERTS & REAL-TIME ACTIVITY LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Operasional Alerts (Stok, Piutang, Pengiriman) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-black text-slate-900">Pusat Alert & Perhatian Sistem</h3>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="space-y-3">
            {/* Alert Stok Kritis */}
            {criticalItems.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    !
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-rose-900">
                      {criticalItems.length} Produk Mencapai Titik Kritis
                    </h5>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Contoh: {criticalItems.slice(0, 2).map(p => p.name).join(', ')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 underline shrink-0"
                >
                  Restok
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Seluruh stok barang berada dalam kuantitas aman optimal.</span>
              </div>
            )}

            {/* Alert Piutang Belum Lunas */}
            {unpaidInvoices.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    Rp
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-900">
                      {unpaidInvoices.length} Faktur Penjualan Menunggu Pelunasan
                    </h5>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Total piutang beredar: {formatRupiah(kpi.totalPiutangCustomer)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('penjualan')}
                  className="text-xs font-bold text-amber-800 hover:text-amber-900 underline shrink-0"
                >
                  Buku Piutang
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Tidak ada piutang customer yang menunggak.</span>
              </div>
            )}

            {/* Alert Pengiriman Dalam Perjalanan */}
            {deliveryOrders.filter(d => d.status === 'dikirim').length > 0 ? (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-blue-900">
                      {deliveryOrders.filter(d => d.status === 'dikirim').length} Surat Jalan / DO Dalam Pengiriman
                    </h5>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Driver sedang menuju lokasi penerima. Pastikan BAST / tanda terima telah ditandatangani.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('pengiriman')}
                  className="text-xs font-bold text-blue-800 hover:text-blue-900 underline shrink-0"
                >
                  Tracking DO
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-slate-400" />
                <span>Semua pengiriman pesanan telah diterima dengan baik.</span>
              </div>
            )}
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
              Akses Cepat Transaksi
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => onNavigate('pos')}
                className="p-2.5 bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-700 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Kasir POS</span>
              </button>
              <button
                onClick={() => onNavigate('penjualan')}
                className="p-2.5 bg-blue-500/10 hover:bg-blue-500 hover:text-white text-blue-700 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                <span>+ Buat SPH</span>
              </button>
              <button
                onClick={() => onNavigate('pembelian')}
                className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ PO Supplier</span>
              </button>
              <button
                onClick={() => onNavigate('keuangan')}
                className="p-2.5 bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-700 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1"
              >
                <Wallet className="w-4 h-4" />
                <span>Buku Kas</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-time Audit & Activity Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-slate-700" />
              <h3 className="text-base font-black text-slate-900">Aktivitas & Audit Log Operasional</h3>
            </div>
            <button
              onClick={() => onNavigate('user-akses')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700"
            >
              Lihat Semua
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada aktivitas baru tercatat.</p>
            ) : (
              auditLogs.map(log => {
                const dateObj = new Date(log.timestamp);
                const timeStr = isNaN(dateObj.getTime())
                  ? '-'
                  : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                return (
                  <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">{log.userName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                          {log.module}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 break-words">{log.details}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{timeStr}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Calendar,
  Filter,
  TrendingUp,
  ShoppingBag,
  Package,
  Wallet,
  Truck,
  FileText
} from 'lucide-react';
import { store } from '../store';
import { formatRupiah, formatDate } from '../utils/format';

interface ReportsModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ onNotify }) => {
  const [selectedReport, setSelectedReport] = useState<
    'penjualan' | 'pembelian' | 'stok' | 'keuangan' | 'piutang' | 'hutang' | 'customer' | 'supplier' | 'pengiriman' | 'sph-spk'
  >('penjualan');

  const products = store.getProducts();
  const posSales = store.getPosTransactions();
  const invoices = store.getInvoices();
  const purchases = store.getPurchaseInvoices();
  const customers = store.getCustomers();
  const suppliers = store.getSuppliers();
  const deliveryOrders = store.getDeliveryOrders();
  const cashRecords = store.getCashRecords();
  const sphList = store.getSPHList();
  const spkList = store.getSPKList();

  // Export CSV generator
  const exportCsv = (headers: string[], rows: (string | number)[][], filename: string) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify?.(`Laporan ${filename}.csv berhasil diunduh!`, 'success');
  };

  const handleExportCurrent = () => {
    if (selectedReport === 'penjualan') {
      const headers = ['No Faktur / Struk', 'Tanggal', 'Customer', 'Kategori', 'Metode Bayar', 'Total (Rp)'];
      const rows = [
        ...posSales.map(s => [s.invoiceNumber, `${s.date} ${s.time}`, s.customerName, 'Kasir Kios', s.paymentMethod, s.total]),
        ...invoices.map(i => [i.invoiceNumber, i.date, i.customerName, 'Faktur Proyek', i.paymentMethod || 'Tempo', i.totalAmount])
      ];
      exportCsv(headers, rows, 'Laporan_Penjualan_NJN');
    } else if (selectedReport === 'stok') {
      const headers = ['SKU', 'Nama Barang', 'Kategori', 'Satuan', 'Stok Fisik', 'Stok Min', 'HPP (Rp)', 'Harga Jual (Rp)', 'Total Aset (Rp)'];
      const rows = products.map(p => [p.sku, p.name, p.category, p.unit, p.stock, p.minStock, p.hppPrice, p.price, p.stock * p.hppPrice]);
      exportCsv(headers, rows, 'Laporan_Stok_Barang_NJN');
    } else if (selectedReport === 'pembelian') {
      const headers = ['No Nota', 'Tanggal', 'Supplier', 'Gudang', 'Status', 'Total (Rp)', 'Terbayar (Rp)'];
      const rows = purchases.map(p => [p.invoiceNumber, p.date, p.supplierName, p.warehouse, p.status, p.totalAmount, p.paidAmount]);
      exportCsv(headers, rows, 'Laporan_Pembelian_Supplier_NJN');
    } else if (selectedReport === 'keuangan') {
      const headers = ['Kode', 'Tanggal', 'Kategori', 'Keterangan', 'Kanal', 'Tipe', 'Nominal (Rp)'];
      const rows = cashRecords.map(c => [c.code, c.date, c.category, c.description, c.channel, c.type, c.amount]);
      exportCsv(headers, rows, 'Laporan_Buku_Kas_NJN');
    } else if (selectedReport === 'piutang') {
      const headers = ['No Faktur', 'Customer', 'Tanggal', 'Jatuh Tempo', 'Total Tagihan (Rp)', 'Sisa Piutang (Rp)'];
      const rows = invoices.filter(i => i.status === 'unpaid').map(i => [i.invoiceNumber, i.customerName, i.date, i.dueDate, i.totalAmount, i.totalAmount - i.paidAmount]);
      exportCsv(headers, rows, 'Laporan_Piutang_Customer_NJN');
    } else if (selectedReport === 'hutang') {
      const headers = ['No Nota', 'Supplier', 'Tanggal', 'Jatuh Tempo', 'Total Tagihan (Rp)', 'Sisa Hutang (Rp)'];
      const rows = purchases.filter(p => p.status === 'unpaid').map(p => [p.invoiceNumber, p.supplierName, p.date, p.dueDate, p.totalAmount, p.totalAmount - p.paidAmount]);
      exportCsv(headers, rows, 'Laporan_Hutang_Supplier_NJN');
    } else if (selectedReport === 'pengiriman') {
      const headers = ['No DO', 'Customer', 'Alamat', 'Driver', 'No Polisi', 'Ekspedisi', 'No Resi', 'Status'];
      const rows = deliveryOrders.map(d => [d.doNumber, d.customerName, d.destinationAddress, d.driverName, d.vehicleNumber, d.expedition, d.trackingNumber, d.status]);
      exportCsv(headers, rows, 'Laporan_Pengiriman_DO_NJN');
    } else {
      const headers = ['Kode Dokumen', 'Customer / Rekanan', 'Tanggal', 'Nilai (Rp)', 'Status'];
      const rows = [
        ...sphList.map(s => [s.code, s.customerName, s.date, s.totalAmount, s.statusLabel]),
        ...spkList.map(k => [k.code, k.partnerName, k.startDate, k.contractValue, k.statusLabel])
      ];
      exportCsv(headers, rows, 'Laporan_SPH_SPK_NJN');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            <span>MODUL 10: LAPORAN TERPADU & ANALISIS BISNIS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Pusat Laporan Eksekutif & Export Data</h2>
          <p className="text-xs text-slate-500 mt-1">
            Ekspor data dan cetak laporan resmi Penjualan, Pembelian, Stok, Keuangan, Piutang, Hutang, dan Logistik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrent}
            className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Select Report Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { id: 'penjualan', label: '1. Lap. Penjualan', icon: TrendingUp },
          { id: 'pembelian', label: '2. Lap. Pembelian', icon: ShoppingBag },
          { id: 'stok', label: '3. Lap. Stok & Aset', icon: Package },
          { id: 'keuangan', label: '4. Lap. Keuangan', icon: Wallet },
          { id: 'piutang', label: '5. Lap. Piutang', icon: FileText },
          { id: 'hutang', label: '6. Lap. Hutang', icon: FileText },
          { id: 'customer', label: '7. Lap. Customer', icon: FileText },
          { id: 'supplier', label: '8. Lap. Supplier', icon: FileText },
          { id: 'pengiriman', label: '9. Lap. Pengiriman', icon: Truck },
          { id: 'sph-spk', label: '10. Lap. SPH & SPK', icon: FileSpreadsheet }
        ].map(cat => {
          const Icon = cat.icon;
          const isSel = selectedReport === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedReport(cat.id as any)}
              className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                isSel
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Content Viewport */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 uppercase">
              Laporan {selectedReport.replace('-', ' & ')}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">{store.getCompanySettings().companyName || 'TOKO NIRWANA JAYA NUGRAHA'} (BANDUNG)</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Generated: {new Date().toLocaleDateString('id-ID')}
          </span>
        </div>

        {/* Dynamic Table Preview */}
        <div className="overflow-x-auto text-xs">
          {selectedReport === 'penjualan' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-y">
                <tr>
                  <th className="py-2.5 px-3">No. Transaksi</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Pelanggan</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-right">Total Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posSales.map(s => (
                  <tr key={s.id}>
                    <td className="py-2 px-3 font-mono font-bold">{s.invoiceNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{s.date}</td>
                    <td className="py-2 px-3">{s.customerName}</td>
                    <td className="py-2 px-3">Kasir Kios POS</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(s.total)}</td>
                  </tr>
                ))}
                {invoices.map(i => (
                  <tr key={i.id}>
                    <td className="py-2 px-3 font-mono font-bold">{i.invoiceNumber}</td>
                    <td className="py-2 px-3 text-slate-600">{i.date}</td>
                    <td className="py-2 px-3">{i.customerName}</td>
                    <td className="py-2 px-3">Faktur Proyek</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(i.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'stok' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-y">
                <tr>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Nama Barang</th>
                  <th className="py-2.5 px-3 text-center">Stok</th>
                  <th className="py-2.5 px-3 text-right">Harga HPP</th>
                  <th className="py-2.5 px-3 text-right">Harga Jual</th>
                  <th className="py-2.5 px-3 text-right">Valuasi Aset</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id}>
                    <td className="py-2 px-3 font-mono font-bold">{p.sku}</td>
                    <td className="py-2 px-3 font-semibold">{p.name}</td>
                    <td className="py-2 px-3 text-center font-mono">{p.stock} {p.unit}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(p.hppPrice)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{formatRupiah(p.price)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(p.stock * p.hppPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'piutang' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-y">
                <tr>
                  <th className="py-2.5 px-3">No Faktur</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Jatuh Tempo</th>
                  <th className="py-2.5 px-3 text-right">Total Tagihan</th>
                  <th className="py-2.5 px-3 text-right">Sisa Piutang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.filter(i => i.status === 'unpaid').map(i => (
                  <tr key={i.id}>
                    <td className="py-2 px-3 font-mono font-bold">{i.invoiceNumber}</td>
                    <td className="py-2 px-3 font-semibold">{i.customerName}</td>
                    <td className="py-2 px-3 font-mono text-rose-600">{i.dueDate}</td>
                    <td className="py-2 px-3 text-right font-mono">{formatRupiah(i.totalAmount)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">{formatRupiah(i.totalAmount - i.paidAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'keuangan' && (
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-y">
                <tr>
                  <th className="py-2.5 px-3">Kode</th>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-right">Kas Masuk</th>
                  <th className="py-2.5 px-3 text-right">Kas Keluar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cashRecords.map(c => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-mono font-bold">{c.code}</td>
                    <td className="py-2 px-3 text-slate-600">{c.date}</td>
                    <td className="py-2 px-3">{c.category}</td>
                    <td className="py-2 px-3 font-semibold">{c.description}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">{c.type === 'masuk' ? formatRupiah(c.amount) : '-'}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-rose-700">{c.type === 'keluar' ? formatRupiah(c.amount) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

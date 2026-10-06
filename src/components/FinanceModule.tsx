import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  FileSpreadsheet,
  PieChart,
  Activity,
  Plus,
  Search,
  CheckCircle2,
  X,
  FileCheck2,
  Clock,
  AlertTriangle,
  History,
  Printer,
  ExternalLink,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { store } from '../store';
import { CashTransaction, BankAccount, JournalEntry, SalesInvoice, InvoicePaymentRecord } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface FinanceModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
  onPrintInvoice?: (inv: SalesInvoice) => void;
  onNavigate?: (tab: string) => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  onNotify,
  onPrintInvoice,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'piutang' | 'buku-kas' | 'bank' | 'jurnal' | 'laba-rugi' | 'arus-kas'>('piutang');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashType, setCashType] = useState<'masuk' | 'keluar'>('masuk');

  // Piutang & Payment States
  const [piutangFilter, setPiutangFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<SalesInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Transfer Bank BCA');
  const [payBankId, setPayBankId] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payRefNo, setPayRefNo] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Payment History Drawer/Modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedInvoiceForHistory, setSelectedInvoiceForHistory] = useState<SalesInvoice | null>(null);

  // Form State for Buku Kas
  const bankAccounts = store.getBankAccounts();
  const [cashForm, setCashForm] = useState({
    amount: '',
    category: 'Pendapatan Proyek',
    channel: 'Transfer Bank BCA',
    bankId: bankAccounts[0]?.id || '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const kpi = store.getOverallKPI();
  const cashRecords = store.getCashRecords();
  const journals = store.getJournalEntries();
  const invoices = store.getInvoices();
  const invoiceStats = store.getInvoiceStats();

  const handleOpenCashModal = (type: 'masuk' | 'keluar') => {
    setCashType(type);
    setCashForm({
      ...cashForm,
      amount: '',
      description: '',
      category: type === 'masuk' ? 'Pendapatan Lain-lain' : 'Operasional Listrik & Kebersihan'
    });
    setIsCashModalOpen(true);
  };

  const handleSaveCash = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(cashForm.amount);
    if (isNaN(val) || val <= 0 || !cashForm.description) {
      onNotify?.('Lengkapi nominal dan keterangan transaksi kas!', 'error');
      return;
    }

    store.addCashRecord({
      description: cashForm.description,
      channel: cashForm.channel,
      category: cashForm.category,
      date: cashForm.date,
      type: cashType,
      amount: val,
      bankId: cashForm.bankId
    });

    // Catat juga ke jurnal umum
    if (cashType === 'masuk') {
      store.addJournalEntry(
        cashForm.date,
        `KM-${Date.now().toString().slice(-4)}`,
        cashForm.description,
        'Kas / Rekening Bank',
        val,
        'Pendapatan Operasional',
        val
      );
    } else {
      store.addJournalEntry(
        cashForm.date,
        `KK-${Date.now().toString().slice(-4)}`,
        cashForm.description,
        'Beban Operasional & Kantor',
        val,
        'Kas / Rekening Bank',
        val
      );
    }

    setIsCashModalOpen(false);
    onNotify?.(`Pencatatan kas ${cashType === 'masuk' ? 'masuk' : 'keluar'} sebesar ${formatRupiah(val)} sukses!`, 'success');
  };

  // Open Payment Modal for Invoice in Keuangan -> Piutang
  const handleOpenPayment = (inv: SalesInvoice) => {
    const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
    setSelectedInvoiceToPay(inv);
    setPayAmount(remaining);
    setPayMethod(bankAccounts[1]?.bankName || 'Transfer Bank BCA');
    setPayBankId(bankAccounts[1]?.id || bankAccounts[0]?.id || '');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRefNo(`BKM-${Date.now().toString().slice(-6)}`);
    setPayNotes(`Pelunasan tagihan Faktur ${inv.invoiceNumber} (${inv.customerName})`);
    setIsPayModalOpen(true);
  };

  // Submit Payment in Keuangan -> Piutang
  const handleConfirmInvoicePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToPay || payAmount <= 0) {
      onNotify?.('Masukkan jumlah nominal pembayaran yang valid!', 'error');
      return;
    }

    store.recordInvoicePayment(
      selectedInvoiceToPay.id,
      payAmount,
      payMethod,
      payBankId,
      payNotes
    );

    setIsPayModalOpen(false);
    onNotify?.(
      `Pembayaran Faktur ${selectedInvoiceToPay.invoiceNumber} senilai ${formatRupiah(payAmount)} sukses dibukukan ke Kas & Bank!`,
      'success'
    );
  };

  // View Payment History
  const handleOpenHistory = (inv: SalesInvoice) => {
    setSelectedInvoiceForHistory(inv);
    setIsHistoryModalOpen(true);
  };

  const filteredCash = cashRecords.filter(c =>
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date().toISOString().split('T')[0];

  const filteredPiutangInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.projectName && inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

    if (piutangFilter === 'unpaid') return inv.status !== 'paid';
    if (piutangFilter === 'overdue') return isOverdue;
    if (piutangFilter === 'paid') return inv.status === 'paid';
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span>MODUL 9: KEUANGAN, AKUNTANSI & BUKU KAS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Keuangan, Piutang Invoice & Arus Kas</h2>
          <p className="text-xs text-slate-500 mt-1">
            Buku piutang customer, pelunasan tagihan invoice, saldo rekening bank, arus kas masuk/keluar, dan laporan laba rugi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenCashModal('masuk')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>+ Kas Masuk</span>
          </button>
          <button
            onClick={() => handleOpenCashModal('keluar')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>- Kas Keluar</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('piutang')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'piutang' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Piutang & Invoice ({invoiceStats.unpaidCount + invoiceStats.overdueCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('buku-kas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'buku-kas' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Buku Kas Masuk / Keluar</span>
        </button>
        <button
          onClick={() => setActiveTab('bank')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'bank' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Rekening Kas & Bank ({bankAccounts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('jurnal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'jurnal' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Jurnal Umum</span>
        </button>
        <button
          onClick={() => setActiveTab('laba-rugi')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'laba-rugi' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Laporan Laba / Rugi</span>
        </button>
        <button
          onClick={() => setActiveTab('arus-kas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'arus-kas' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Laporan Arus Kas</span>
        </button>
      </div>

      {/* TAB 0: PIUTANG & INVOICE (AS REQUESTED IN LOCATION 3) */}
      {activeTab === 'piutang' && (
        <div className="space-y-4">
          {/* Executive Info Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">🧾</span>
              <div>
                <b className="text-amber-950 font-bold block text-sm">Menu Keuangan → Piutang → Invoice</b>
                <span className="text-amber-900/80">
                  Modul ini menghubungkan faktur invoice penjualan dengan pembukuan piutang, pelunasan kas/bank, sisa tagihan, dan riwayat pembayaran.
                </span>
              </div>
            </div>
            {onNavigate && (
              <button
                onClick={() => onNavigate('penjualan')}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1 shrink-0 transition"
              >
                <span>Buka Menu Penjualan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 4 Metric Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Piutang Aktif</span>
              <div className="text-xl font-black text-amber-700 font-mono mt-1">
                {formatRupiah(invoiceStats.totalOutstanding)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Dari {invoiceStats.unpaidCount + invoiceStats.overdueCount} tagihan customer
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-sm bg-rose-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block flex items-center justify-between">
                <span>Overdue (Lewat Tempo)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </span>
              <div className="text-xl font-black text-rose-600 font-mono mt-1">
                {formatRupiah(invoiceStats.totalOverdueAmount)}
              </div>
              <div className="text-[10px] text-rose-800 font-semibold mt-0.5">
                {invoiceStats.overdueCount} Faktur Menunggak
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm bg-emerald-50/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">Pelunasan Hari Ini</span>
              <div className="text-xl font-black text-emerald-600 font-mono mt-1">
                {formatRupiah(invoiceStats.paidTodayAmount)}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">
                Sudah masuk ke rekening bank
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Nilai Faktur Diterbitkan</span>
              <div className="text-xl font-black text-slate-900 font-mono mt-1">
                {formatRupiah(invoiceStats.totalValue)}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                Total {invoiceStats.totalCount} faktur penjualan
              </div>
            </div>
          </div>

          {/* Main Piutang Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari No. Faktur, Customer, Proyek..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setPiutangFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    piutangFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({invoices.length})
                </button>
                <button
                  onClick={() => setPiutangFilter('unpaid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    piutangFilter === 'unpaid'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  Belum Lunas ({invoiceStats.unpaidCount + invoiceStats.overdueCount})
                </button>
                <button
                  onClick={() => setPiutangFilter('overdue')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    piutangFilter === 'overdue'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  Overdue ({invoiceStats.overdueCount})
                </button>
                <button
                  onClick={() => setPiutangFilter('paid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    piutangFilter === 'paid'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Lunas ({invoiceStats.paidCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3">No. Faktur Invoice</th>
                    <th className="py-3 px-3">Customer / Rekanan</th>
                    <th className="py-3 px-3">Tanggal & Jatuh Tempo</th>
                    <th className="py-3 px-3 text-right">Nilai Faktur</th>
                    <th className="py-3 px-3 text-right">Sudah Dibayar</th>
                    <th className="py-3 px-3 text-right font-black">Sisa Tagihan</th>
                    <th className="py-3 px-3 text-center">Status Pembayaran</th>
                    <th className="py-3 px-3 text-center">Riwayat</th>
                    <th className="py-3 px-3 text-center">Aksi Pelunasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPiutangInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada catatan invoice dengan status terpilih.
                      </td>
                    </tr>
                  ) : (
                    filteredPiutangInvoices.map(inv => {
                      const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
                      const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            <div>{inv.invoiceNumber}</div>
                            {inv.doReference && (
                              <div className="text-[10px] text-purple-700 font-normal">DO: {inv.doReference}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900">{inv.customerName}</div>
                            <div className="text-[10px] text-slate-500">{inv.customerPhone || '-'}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                            <div>Terbit: {formatDate(inv.date)}</div>
                            <div className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600' : 'text-slate-500'}`}>
                              Tempo: {formatDate(inv.dueDate)} {isOverdue ? '• LEWAT TEMPO!' : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(inv.totalAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-emerald-700">
                            {formatRupiah(inv.paidAmount)}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-sm">
                            <span className={remaining > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-700') : 'text-emerald-700'}>
                              {formatRupiah(remaining)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                              isOverdue ? 'bg-rose-100 text-rose-800' :
                              inv.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                              inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {inv.status === 'paid' ? 'Lunas' : isOverdue ? 'Overdue' : inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => handleOpenHistory(inv)}
                              className="px-2 py-1 text-slate-700 hover:bg-slate-200 rounded-lg inline-flex items-center gap-1 text-[11px] font-semibold transition"
                              title="Lihat riwayat pembayaran faktur ini"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>{inv.paymentHistory?.length || 0} Kali</span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {inv.status !== 'paid' ? (
                                <button
                                  onClick={() => handleOpenPayment(inv)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition inline-flex items-center gap-1"
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>Catat Pembayaran</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-700 font-bold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Lunas Penuh</span>
                                </span>
                              )}
                              {onPrintInvoice && (
                                <button
                                  onClick={() => onPrintInvoice(inv)}
                                  className="p-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
                                  title="Cetak Faktur"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}
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
      )}

      {/* TAB 1: BUKU KAS MASUK / KELUAR */}
      {activeTab === 'buku-kas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari transaksi kas, keterangan, kategori..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total Saldo Likuid Kas & Bank: <b className="font-mono text-emerald-700">{formatRupiah(kpi.totalSaldoKasBank)}</b>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kode Transaksi</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Keterangan Arus Kas</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Akun / Saluran</th>
                  <th className="py-3 px-3 text-right">Debit (Masuk)</th>
                  <th className="py-3 px-3 text-right">Kredit (Keluar)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCash.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada mutasi arus kas tercatat. Klik "+ Kas Masuk" atau "- Kas Keluar" untuk mencatat transaksi operasional.
                    </td>
                  </tr>
                ) : (
                  filteredCash.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.code}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{formatDate(c.date)}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {c.description}
                        {c.referenceDocument && (
                          <span className="ml-2 font-mono text-[10px] text-slate-400">({c.referenceDocument})</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {c.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-600">{c.channel}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600">
                        {c.type === 'masuk' ? formatRupiah(c.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                        {c.type === 'keluar' ? formatRupiah(c.amount) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REKENING KAS & BANK */}
      {activeTab === 'bank' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {bankAccounts.map(b => (
            <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {b.type === 'kas_toko' ? 'KAS OPERASIONAL' : 'REKENING BANK'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  AKTIF
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{b.bankName}</h3>
                <div className="font-mono text-xs text-slate-500 mt-0.5">{b.accountNumber}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">a.n {b.holderName}</div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500 font-semibold">Saldo Tersedia:</span>
                <span className="text-lg font-black font-mono text-emerald-700">{formatRupiah(b.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: JURNAL UMUM */}
      {activeTab === 'jurnal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Buku Jurnal Umum (Debet & Kredit)</h3>
            <span className="text-xs text-slate-500 font-semibold">{journals.length} Jurnal Tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Tanggal & Ref</th>
                  <th className="py-3 px-3">Keterangan Akuntansi</th>
                  <th className="py-3 px-3">Akun Debet</th>
                  <th className="py-3 px-3">Akun Kredit</th>
                  <th className="py-3 px-3 text-right">Debet</th>
                  <th className="py-3 px-3 text-right">Kredit</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada entri jurnal umum yang tercatat otomatis dari operasional.
                    </td>
                  </tr>
                ) : (
                  journals.map(j => (
                    <tr key={j.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono">
                        <div>{formatDate(j.date)}</div>
                        <div className="text-[10px] text-slate-400 font-bold">{j.refNo}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">{j.description}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{j.debitAccount}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{j.creditAccount}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(j.debitAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatRupiah(j.creditAmount)}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          BALANCE
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LABA RUGI */}
      {activeTab === 'laba-rugi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b">
            <h3 className="text-lg font-black text-slate-900">Laporan Laba / Rugi Operasional</h3>
            <p className="text-xs text-slate-500">{store.getCompanySettings().companyName || 'TOKO NIRWANA JAYA NUGRAHA'} (Tahun Berjalan 2026)</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b">
              <span className="font-bold text-slate-800">1. Pendapatan Penjualan Retail Kios (POS)</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.omsetPos)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="font-bold text-slate-800">2. Pendapatan Faktur Penjualan Proyek (B2B)</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.omsetFakturLunas)}</span>
            </div>
            <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl font-bold">
              <span>TOTAL PENDAPATAN OPERASIONAL</span>
              <span className="font-mono text-emerald-700">{formatRupiah(kpi.totalOmsetPenjualan)}</span>
            </div>

            <div className="pt-2">
              <div className="flex justify-between py-2 border-b text-slate-700">
                <span>Harga Pokok Penjualan (HPP Beban Barang)</span>
                <span className="font-mono text-rose-600">-{formatRupiah(kpi.totalOmsetPenjualan * 0.75)}</span>
              </div>
              <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl font-bold">
                <span>LABA KOTOR (GROSS PROFIT)</span>
                <span className="font-mono text-emerald-700">{formatRupiah(kpi.labaKotor)}</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="flex justify-between py-2 border-b text-slate-700">
                <span>Beban Operasional Kantor, Listrik & Gaji</span>
                <span className="font-mono text-rose-600">-{formatRupiah(kpi.biayaOperasional)}</span>
              </div>
              <div className="flex justify-between py-3 bg-amber-50 px-3 rounded-xl font-black text-sm text-slate-900">
                <span>LABA BERSIH BERJALAN (NET PROFIT)</span>
                <span className="font-mono text-emerald-700 text-base">{formatRupiah(kpi.labaBersih)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ARUS KAS */}
      {activeTab === 'arus-kas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b">
            <h3 className="text-lg font-black text-slate-900">Laporan Arus Kas (Cash Flow)</h3>
            <p className="text-xs text-slate-500">{store.getCompanySettings().companyName || 'TOKO NIRWANA JAYA NUGRAHA'} (Tahun Berjalan 2026)</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl space-y-2 border border-emerald-100">
              <span className="font-bold text-emerald-900 block">Arus Kas Masuk (Inflow)</span>
              <div className="flex justify-between">
                <span>Penjualan Tunai / Bank Kasir POS:</span>
                <span className="font-mono font-bold">{formatRupiah(kpi.omsetPos)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelunasan Piutang Faktur Customer:</span>
                <span className="font-mono font-bold">{formatRupiah(kpi.omsetFakturLunas)}</span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl space-y-2 border border-rose-100">
              <span className="font-bold text-rose-900 block">Arus Kas Keluar (Outflow)</span>
              <div className="flex justify-between">
                <span>Pembayaran Hutang Pembelian Supplier:</span>
                <span className="font-mono font-bold text-rose-700">-{formatRupiah(kpi.totalPembelian)}</span>
              </div>
              <div className="flex justify-between">
                <span>Beban Operasional Rutin:</span>
                <span className="font-mono font-bold text-rose-700">-{formatRupiah(kpi.biayaOperasional)}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between font-bold">
              <span>SALDO KAS & BANK TERSEDIA (NET LIKUIDITAS):</span>
              <span className="font-mono text-emerald-400 text-base">{formatRupiah(kpi.totalSaldoKasBank)}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INPUT KAS MASUK / KELUAR */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                Pencatatan Kas {cashType === 'masuk' ? 'Masuk' : 'Keluar'}
              </h3>
              <button onClick={() => setIsCashModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCash} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  placeholder="0"
                  value={cashForm.amount}
                  onChange={e => setCashForm({ ...cashForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-sm font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan Transaksi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pembelian token listrik kantor / Pendapatan servis panel"
                  value={cashForm.description}
                  onChange={e => setCashForm({ ...cashForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Transaksi</label>
                <input
                  type="text"
                  value={cashForm.category}
                  onChange={e => setCashForm({ ...cashForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Akun Rekening Kas/Bank</label>
                  <select
                    value={cashForm.bankId}
                    onChange={e => {
                      const b = bankAccounts.find(x => x.id === e.target.value);
                      setCashForm({
                        ...cashForm,
                        bankId: e.target.value,
                        channel: b?.bankName || 'Kas Toko'
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={cashForm.date}
                    onChange={e => setCashForm({ ...cashForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsCashModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 text-white font-bold rounded-xl shadow-md ${
                    cashType === 'masuk' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Simpan Transaksi Kas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CATAT PELUNASAN / PEMBAYARAN FAKTUR INVOICE (KEUANGAN -> PIUTANG) */}
      {isPayModalOpen && selectedInvoiceToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">
                  Pencatatan Pembayaran & Pelunasan Piutang
                </h3>
              </div>
              <button onClick={() => setIsPayModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Nomor Faktur:</span>
                <span className="font-mono font-bold text-slate-900">{selectedInvoiceToPay.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Nama Customer:</span>
                <span className="font-bold text-slate-900">{selectedInvoiceToPay.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Nilai Tagihan:</span>
                <span className="font-mono font-bold">{formatRupiah(selectedInvoiceToPay.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Sudah Terbayar Sebelumnya:</span>
                <span className="font-mono font-bold text-emerald-700">{formatRupiah(selectedInvoiceToPay.paidAmount)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t text-sm font-black">
                <span className="text-slate-800">Sisa Tagihan Tertunggak:</span>
                <span className="font-mono text-rose-600">{formatRupiah(selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmInvoicePayment} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jumlah Dibayarkan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount}
                    value={payAmount}
                    onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-sm font-bold text-emerald-700"
                  />
                  <div className="text-[10px] text-slate-400 mt-0.5">Dapat berupa pelunasan penuh atau cicilan termin.</div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Penerimaan *</label>
                  <input
                    type="date"
                    required
                    value={payDate}
                    onChange={e => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Rekening Bank Tujuan Penerimaan *</label>
                  <select
                    value={payBankId}
                    onChange={e => {
                      const b = bankAccounts.find(x => x.id === e.target.value);
                      setPayBankId(e.target.value);
                      setPayMethod(b?.bankName || 'Transfer Bank BCA');
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.id} value={b.id}>{b.bankName} ({b.accountNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Bukti / Ref Bank</label>
                  <input
                    type="text"
                    placeholder="Contoh: BKM-88129 / Trf BCA 098"
                    value={payRefNo}
                    onChange={e => setPayRefNo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Pembayaran</label>
                <textarea
                  rows={2}
                  value={payNotes}
                  onChange={e => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Catatan pelunasan faktur..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Simpan & Bukukan ke Kas / Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT PEMBAYARAN FAKTUR */}
      {isHistoryModalOpen && selectedInvoiceForHistory && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Riwayat Pembayaran: {selectedInvoiceForHistory.invoiceNumber}
                </h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div>Customer: <b className="text-slate-900">{selectedInvoiceForHistory.customerName}</b></div>
              <div>Total Tagihan: <b className="font-mono">{formatRupiah(selectedInvoiceForHistory.totalAmount)}</b></div>
              <div>Sisa Belum Dibayar: <b className="font-mono text-rose-600">{formatRupiah(Math.max(0, selectedInvoiceForHistory.totalAmount - selectedInvoiceForHistory.paidAmount))}</b></div>
            </div>

            <div className="space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Catatan Pembayaran Masuk:</span>
              {(!selectedInvoiceForHistory.paymentHistory || selectedInvoiceForHistory.paymentHistory.length === 0) ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-xl border">
                  Belum ada catatan riwayat pembayaran untuk faktur ini.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedInvoiceForHistory.paymentHistory.map((pay, idx) => (
                    <div key={pay.id || idx} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] text-emerald-800 font-bold">{formatDate(pay.date)}</span>
                        <span className="font-mono font-bold text-emerald-700">{formatRupiah(pay.amount)}</span>
                      </div>
                      <div className="text-[11px] text-slate-700 flex justify-between">
                        <span>Metode: <b>{pay.paymentMethod}</b></span>
                        <span className="font-mono text-[10px] text-slate-500">Ref: {pay.refNo}</span>
                      </div>
                      {pay.notes && (
                        <div className="text-[10px] text-slate-500 italic">"{pay.notes}"</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

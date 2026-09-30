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
  X
} from 'lucide-react';
import { store } from '../store';
import { CashTransaction, BankAccount, JournalEntry } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface FinanceModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'buku-kas' | 'bank' | 'jurnal' | 'laba-rugi' | 'arus-kas'>('buku-kas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [cashType, setCashType] = useState<'masuk' | 'keluar'>('masuk');

  // Form State
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

  const filteredCash = cashRecords.filter(c =>
    c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Wallet className="w-4 h-4" />
            <span>MODUL 9: KEUANGAN, AKUNTANSI & BUKU KAS</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Keuangan Arus Kas & Neraca Laba Rugi</h2>
          <p className="text-xs text-slate-500 mt-1">
            Buku kas masuk/keluar, saldo rekening bank perusahaan, jurnal umum debet-kredit, laporan laba rugi, dan arus kas.
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
                  <th className="py-3 px-3">Kode Bukti</th>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Keterangan Transaksi</th>
                  <th className="py-3 px-3">Kanal / Bank</th>
                  <th className="py-3 px-3 text-right">Kas Masuk (Rp)</th>
                  <th className="py-3 px-3 text-right">Kas Keluar (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCash.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Belum ada mutasi arus kas tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredCash.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{record.code}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{formatDate(record.date)}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {record.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{record.description}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{record.channel}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {record.type === 'masuk' ? formatRupiah(record.amount) : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                        {record.type === 'keluar' ? formatRupiah(record.amount) : '-'}
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Rekening Kas Toko & Rekening Bank Perusahaan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Saldo riil di setiap rekening penampung transaksi operasional.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map(b => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{b.bankName}</span>
                  <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded font-bold">
                    {b.type === 'kas_toko' ? 'KASIR' : 'BANK'}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  {b.accountNumber} • a.n {b.holderName}
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Saldo Terkini:</span>
                  <span className="text-lg font-black font-mono text-slate-900">{formatRupiah(b.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: JURNAL UMUM */}
      {activeTab === 'jurnal' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Jurnal Umum Transaksi (Double Entry)</h3>
            <span className="text-xs text-slate-500 font-semibold">{journals.length} Jurnal</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Tanggal</th>
                  <th className="py-3 px-3">No. Ref</th>
                  <th className="py-3 px-3">Keterangan Akun</th>
                  <th className="py-3 px-3 text-right">Debet (Rp)</th>
                  <th className="py-3 px-3 text-right">Kredit (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {journals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                      Belum ada jurnal transaksi. Transaksi kasir dan pengeluaran kas akan otomatis tercatat di sini.
                    </td>
                  </tr>
                ) : (
                  journals.map(j => (
                    <React.Fragment key={j.id}>
                      <tr className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-slate-600">{j.date}</td>
                        <td className="py-2 px-3 font-bold text-slate-900">{j.refNo}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{j.debitAccount}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(j.debitAmount)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                      </tr>
                      <tr className="hover:bg-slate-50 bg-slate-50/30">
                        <td className="py-2 px-3 text-slate-400"></td>
                        <td className="py-2 px-3 text-slate-400"></td>
                        <td className="py-2 px-3 font-sans text-slate-700 pl-8">↳ {j.creditAccount}</td>
                        <td className="py-2 px-3 text-right text-slate-400">-</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">{formatRupiah(j.creditAmount)}</td>
                      </tr>
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LAPORAN LABA / RUGI */}
      {activeTab === 'laba-rugi' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Laporan Laba Rugi Operasional (P&L)</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">PT. NIRWANA JAYA NUGRAHA</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* PENDAPATAN */}
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b">
              1. PENDAPATAN OPERASIONAL
            </div>
            <div className="flex justify-between pl-4 text-slate-600">
              <span>Penjualan Kasir Kios (Retail)</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.omsetPos)}</span>
            </div>
            <div className="flex justify-between pl-4 text-slate-600">
              <span>Penjualan Faktur Proyek (Lunas)</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.omsetFakturLunas)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 bg-slate-50 p-2 rounded-lg">
              <span>TOTAL PENDAPATAN PENJUALAN:</span>
              <span className="font-mono text-emerald-700">{formatRupiah(kpi.totalOmsetPenjualan)}</span>
            </div>

            {/* HPP */}
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b pt-3">
              2. HARGA POKOK PENJUALAN (HPP)
            </div>
            <div className="flex justify-between pl-4 text-slate-600">
              <span>HPP Barang Terjual</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.totalOmsetPenjualan - kpi.labaKotor)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 bg-slate-50 p-2 rounded-lg">
              <span>LABA KOTOR (GROSS PROFIT):</span>
              <span className="font-mono text-blue-700">{formatRupiah(kpi.labaKotor)}</span>
            </div>

            {/* BIAYA OPERASIONAL */}
            <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b pt-3">
              3. BEBAN OPERASIONAL & KANTOR
            </div>
            <div className="flex justify-between pl-4 text-slate-600">
              <span>Beban Operasional, Listrik, Kebersihan & Administrasi</span>
              <span className="font-mono font-bold">{formatRupiah(kpi.biayaOperasional)}</span>
            </div>

            {/* LABA BERSIH */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between text-sm font-black mt-4">
              <span>LABA BERSIH BERJALAN (NET PROFIT):</span>
              <span className="font-mono text-amber-400 text-lg">{formatRupiah(kpi.labaBersih)}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ARUS KAS (CASH FLOW) */}
      {activeTab === 'arus-kas' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-3xl mx-auto space-y-4">
          <div className="text-center pb-4 border-b border-slate-200">
            <h3 className="text-lg font-black text-slate-900">Laporan Arus Kas (Cash Flow)</h3>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">PT. NIRWANA JAYA NUGRAHA</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-900 block text-xs">Arus Kas Masuk (Inflow)</span>
                <span className="text-[11px] text-emerald-700">Penerimaan kasir tunai, QRIS, dan pelunasan piutang customer</span>
              </div>
              <span className="text-base font-black font-mono text-emerald-700">
                {formatRupiah(cashRecords.filter(c => c.type === 'masuk').reduce((s, c) => s + c.amount, 0))}
              </span>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex justify-between items-center">
              <div>
                <span className="font-bold text-rose-900 block text-xs">Arus Kas Keluar (Outflow)</span>
                <span className="text-[11px] text-rose-700">Pembayaran supplier, biaya operasional toko, dan pembelian logistik</span>
              </div>
              <span className="text-base font-black font-mono text-rose-700">
                {formatRupiah(cashRecords.filter(c => c.type === 'keluar').reduce((s, c) => s + c.amount, 0))}
              </span>
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
              <span className="font-black text-xs uppercase tracking-wider">Saldo Likuid Akhir Kas & Bank:</span>
              <span className="text-lg font-black font-mono text-amber-400">
                {formatRupiah(kpi.totalSaldoKasBank)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KAS MASUK / KELUAR */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {cashType === 'masuk' ? 'Input Kas Masuk (+)' : 'Input Kas Keluar (-)'}
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
                  min="1"
                  placeholder="0"
                  value={cashForm.amount}
                  onChange={e => setCashForm({ ...cashForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Kategori Transaksi</label>
                <input
                  type="text"
                  required
                  value={cashForm.category}
                  onChange={e => setCashForm({ ...cashForm, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pilih Rekening Bank / Kas Toko</label>
                <select
                  value={cashForm.bankId}
                  onChange={e => {
                    const b = bankAccounts.find(bk => bk.id === e.target.value);
                    setCashForm({
                      ...cashForm,
                      bankId: e.target.value,
                      channel: b?.bankName || 'Kas Tunai'
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                >
                  {bankAccounts.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} ({b.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan Detail Transaksi *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pembayaran listrik bulanan toko kios atau penerimaan sewa genset"
                  value={cashForm.description}
                  onChange={e => setCashForm({ ...cashForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsCashModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
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
    </div>
  );
};

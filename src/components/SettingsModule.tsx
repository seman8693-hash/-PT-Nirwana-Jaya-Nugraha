import React, { useState } from 'react';
import {
  Settings,
  Building2,
  FileCode,
  Percent,
  CreditCard,
  Printer,
  Bell,
  Database,
  Download,
  Upload,
  CheckCircle2,
  RefreshCw,
  Barcode
} from 'lucide-react';
import { store } from '../store';
import { CompanySettings } from '../types';
import { NjnLogo } from './NjnLogo';

interface SettingsModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'profil' | 'nomor' | 'pajak' | 'pembayaran' | 'printer' | 'backup'>('profil');
  const [settings, setSettings] = useState<CompanySettings>(store.getCompanySettings());
  const [importJsonText, setImportJsonText] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateCompanySettings(settings);
    onNotify?.('Pengaturan perusahaan berhasil disimpan dan diperbarui!', 'success');
  };

  const handleDownloadBackup = () => {
    const jsonStr = store.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_pos_erp_njn_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify?.('File backup database operasional berhasil diexport!', 'success');
  };

  const handleImportBackup = () => {
    if (!importJsonText.trim()) return;
    if (confirm('Import data ini akan menimpa seluruh data saat ini. Lanjutkan?')) {
      const ok = store.importBackupJson(importJsonText);
      if (ok) {
        setSettings(store.getCompanySettings());
        onNotify?.('Database berhasil direstore dari backup JSON!', 'success');
        setImportJsonText('');
      } else {
        onNotify?.('Format JSON tidak valid atau struktur tidak cocok!', 'error');
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Settings className="w-4 h-4" />
            <span>MODUL 12: PENGATURAN PERUSAHAAN & SISTEM</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Konfigurasi Operasional ERP & Backup</h2>
          <p className="text-xs text-slate-500 mt-1">
            Profil resmi PT. Nirwana Jaya Nugraha, penomoran dokumen otomatis, tarif pajak PPN 11%, printer thermal kasir, dan backup database.
          </p>
        </div>

        <button
          onClick={handleDownloadBackup}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Backup JSON Database</span>
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('profil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'profil' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil & Logo</span>
        </button>
        <button
          onClick={() => setActiveTab('nomor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'nomor' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Format Nomor Dokumen</span>
        </button>
        <button
          onClick={() => setActiveTab('pajak')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pajak' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Pajak (PPN 11%)</span>
        </button>
        <button
          onClick={() => setActiveTab('pembayaran')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pembayaran' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Metode Bayar & QRIS</span>
        </button>
        <button
          onClick={() => setActiveTab('printer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'printer' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Printer Thermal & Barcode</span>
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'backup' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Restore</span>
        </button>
      </div>

      {/* TAB 1: PROFIL PERUSAHAAN & LOGO */}
      {activeTab === 'profil' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Logo Showcase Left */}
          <div className="lg:col-span-1 space-y-4">
            <NjnLogo variant="full" />
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-2">
              <span className="font-bold text-slate-800 block text-xs">Insignia Logo Resmi</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Logo <b>NJN GOLD</b> Medallion resmi PT. Nirwana Jaya Nugraha diterapkan secara otomatis pada:
              </p>
              <ul className="list-disc pl-4 text-slate-600 space-y-1 text-[11px]">
                <li>Header Navigasi Utama & Sidebar Kios</li>
                <li>Kop Surat Cetak Penawaran (SPH)</li>
                <li>Surat Perintah Kerja (SPK) Lapangan</li>
                <li>Surat Jalan (DO) & Resi Pengiriman</li>
                <li>Faktur Penjualan (Sales Invoice) Resmi</li>
                <li>Struk Kasir Thermal (58mm / 80mm)</li>
              </ul>
            </div>
          </div>

          {/* Form Settings Right */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-black text-slate-900 pb-3 border-b mb-4">
              Identitas Badan Usaha & Legalitas
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Resmi Perusahaan *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slogan / Tagline Brand</label>
                  <input
                    type="text"
                    value={settings.brandTagline}
                    onChange={e => setSettings({ ...settings, brandTagline: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NPWP Badan Usaha</label>
                  <input
                    type="text"
                    value={settings.npwp}
                    onChange={e => setSettings({ ...settings, npwp: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Induk Berusaha (NIB)</label>
                  <input
                    type="text"
                    value={settings.nib}
                    onChange={e => setSettings({ ...settings, nib: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Kantor & Gudang Pusat</label>
                <textarea
                  rows={2}
                  value={settings.address}
                  onChange={e => setSettings({ ...settings, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Resmi</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={e => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Situs Web</label>
                  <input
                    type="text"
                    value={settings.website}
                    onChange={e => setSettings({ ...settings, website: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
                >
                  Simpan Profil Perusahaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: FORMAT NOMOR DOKUMEN */}
      {activeTab === 'nomor' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-4 text-xs">
          <h3 className="text-base font-black text-slate-900 pb-3 border-b">
            Format Awalan (Prefix) Penomoran Dokumen Otomatis
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prefix Faktur Invoice</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={e => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">Contoh: {settings.invoicePrefix}/2026/0001</span>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prefix Penawaran SPH</label>
                <input
                  type="text"
                  value={settings.sphPrefix}
                  onChange={e => setSettings({ ...settings, sphPrefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
                <span className="text-[10px] text-slate-400">Contoh: {settings.sphPrefix}/2026/0001</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prefix SPK Proyek</label>
                <input
                  type="text"
                  value={settings.spkPrefix}
                  onChange={e => setSettings({ ...settings, spkPrefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prefix PO Supplier</label>
                <input
                  type="text"
                  value={settings.poPrefix}
                  onChange={e => setSettings({ ...settings, poPrefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Prefix Surat Jalan (DO)</label>
                <input
                  type="text"
                  value={settings.doPrefix}
                  onChange={e => setSettings({ ...settings, doPrefix: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
              >
                Simpan Penomoran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PAJAK (PPN 11%) */}
      {activeTab === 'pajak' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4 text-xs">
          <h3 className="text-base font-black text-slate-900 pb-3 border-b">
            Tarif Pajak Pertambahan Nilai (PPN)
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tarif Standar PPN (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={settings.ppnRate}
                onChange={e => setSettings({ ...settings, ppnRate: parseFloat(e.target.value) || 11 })}
                className="w-32 px-3 py-2 border rounded-xl font-mono font-bold text-base text-amber-600"
              />
              <span className="text-[11px] text-slate-500 block mt-1">
                Tarif resmi berlaku: <b>11%</b> (UU HPP No. 7 Tahun 2021).
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800">Catatan Penerapan Pajak:</span>
              <p className="text-slate-500 text-[11px]">
                Di kasir POS dan SPH proyek, terdapat opsi centang "Hitung PPN 11% Faktur" untuk memisahkan transaksi retail tanpa faktur dan transaksi perusahaan dengan faktur pajak resmi.
              </p>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Simpan Tarif Pajak
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: METODE PEMBAYARAN & QRIS */}
      {activeTab === 'pembayaran' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4 text-xs">
          <h3 className="text-base font-black text-slate-900 pb-3 border-b">
            Konfigurasi QRIS & Rekening Pembayaran Resmi
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">NMID QRIS Merchant Nasional</label>
              <input
                type="text"
                value={settings.qrisNmid}
                onChange={e => setSettings({ ...settings, qrisNmid: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400">ID merchant terdaftar di Bank Indonesia (ASPI QRIS)</span>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Bank Pengakuisisi QRIS</label>
              <input
                type="text"
                value={settings.qrisBank}
                onChange={e => setSettings({ ...settings, qrisBank: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Simpan Pengaturan Pembayaran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: PRINTER & BARCODE */}
      {activeTab === 'printer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-4 text-xs">
          <h3 className="text-base font-black text-slate-900 pb-3 border-b">
            Pengaturan Printer Thermal Struk & Barcode Scanner
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Lebar Kertas Printer Thermal Kasir</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  settings.thermalPaperWidth === '80mm' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="paper"
                    checked={settings.thermalPaperWidth === '80mm'}
                    onChange={() => setSettings({ ...settings, thermalPaperWidth: '80mm' })}
                  />
                  <div>
                    <span className="font-bold block">80 mm (Standard POS)</span>
                    <span className="text-[10px] text-slate-400">Epson TM-T82, Iware, Matrix Point</span>
                  </div>
                </label>
                <label className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer ${
                  settings.thermalPaperWidth === '58mm' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="paper"
                    checked={settings.thermalPaperWidth === '58mm'}
                    onChange={() => setSettings({ ...settings, thermalPaperWidth: '58mm' })}
                  />
                  <div>
                    <span className="font-bold block">58 mm (Mini Portable)</span>
                    <span className="text-[10px] text-slate-400">Bluetooth Printer Mobile</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                Simpan Printer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 6: BACKUP & RESTORE JSON */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl mx-auto space-y-6 text-xs">
          <div>
            <h3 className="text-base font-black text-slate-900">Cadangkan (Backup) & Pulihkan (Restore) Data</h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Simpan seluruh database riil (master data, transaksi kasir, SPH, SPK, jurnal, hutang piutang) ke file JSON lokal agar aman.
            </p>
          </div>

          {/* Export Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Unduh Cadangan Lengkap (.json)</span>
                <span className="text-[11px] text-slate-500">Menyimpan snapshot data operasional saat ini.</span>
              </div>
              <button
                onClick={handleDownloadBackup}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow transition"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh File Backup</span>
              </button>
            </div>
          </div>

          {/* Import Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 block text-xs">Pulihkan dari Salinan JSON</span>
            <p className="text-[11px] text-slate-500">
              Tempelkan (paste) isi teks file backup JSON di bawah ini untuk memulihkan seluruh sistem:
            </p>
            <textarea
              rows={4}
              value={importJsonText}
              onChange={e => setImportJsonText(e.target.value)}
              placeholder='Tempelkan isi file JSON backup di sini... {"products": [...], ...}'
              className="w-full p-3 font-mono text-[10px] border border-slate-200 rounded-xl bg-white focus:outline-none"
            />
            <button
              onClick={handleImportBackup}
              disabled={!importJsonText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl font-bold shadow transition"
            >
              <Upload className="w-4 h-4" />
              <span>Pulihkan / Restore Database Sekarang</span>
            </button>
          </div>

          {/* Reset / Bersihkan Database ke Nol */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
            <div>
              <span className="font-black text-rose-900 block text-xs">Kosongkan Semua Data Dummy (Mulai Nol untuk Kerja)</span>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Menghapus semua data dummy faktur, SPH, DO, penjualan kasir, hutang-piutang, kartu stok, dan master barang. Semua saldo menjadi Rp 0 bersih siap untuk input data kerja riil perusahaan Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm('YAKIN INGIN MENGHAPUS SEMUA DATA DUMMY?\n\nSemua transaksi, faktur, kasir, dan master barang akan di-nol-kan untuk memulai kerja nyata operasional.')) {
                  store.resetAllDataToZero();
                  onNotify?.('Semua data dummy telah dihapus! Database bersih ke nol siap kerja operasional.', 'success');
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Hapus Semua Dummy &amp; Jadikan Nol Bersih</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

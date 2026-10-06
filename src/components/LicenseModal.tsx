import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  Calendar,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Plus,
  Sparkles,
  Award,
  AlertTriangle,
  X,
  FileCheck,
  Check
} from 'lucide-react';
import { store } from '../store';
import { NjnLogo } from './NjnLogo';
import {
  calculateDaysRemaining,
  formatDaysRemainingText,
  generateLicenseKey
} from '../utils/licenseUtils';
import { formatDate } from '../utils/format';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({
  isOpen,
  onClose,
  onNotify
}) => {
  if (!isOpen) return null;

  const license = store.getLicenseInfo();
  const settings = store.getCompanySettings();

  const [activeSubTab, setActiveSubTab] = useState<'tambah' | 'manual' | 'otomatis' | 'sertifikat'>('tambah');
  const [customDays, setCustomDays] = useState<number>(30);
  const [manualDate, setManualDate] = useState<string>(license.validUntil || '2026-10-10');
  const [manualKey, setManualKey] = useState<string>(license.licenseKey || '');
  const [notes, setNotes] = useState<string>(license.notes || '');

  const daysRemaining = calculateDaysRemaining(license.validUntil);
  const statusInfo = formatDaysRemainingText(daysRemaining);

  const handleAddDays = (days: number, label: string) => {
    store.addLicenseDays(days, `Penambahan ${label}`);
    onNotify?.(`Masa berlaku berhasil ditambahkan +${days} hari (${label})!`, 'success');
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate) return;
    store.setLicenseExpiryDate(manualDate, notes || 'Pengaturan manual tanggal');
    if (manualKey && manualKey !== license.licenseKey) {
      store.updateLicenseInfo({ licenseKey: manualKey, notes });
    }
    onNotify?.(`Masa berlaku berhasil diperbarui manual s.d. ${formatDate(manualDate)}!`, 'success');
  };

  const handleGenerateAuto = (days: number) => {
    const updated = store.generateAutoLicense(days);
    onNotify?.(
      `Lisensi baru berhasil dibuat otomatis: ${updated.licenseKey} (+${days} hari)!`,
      'success'
    );
  };

  const handleToggleAutoRenew = () => {
    const isNowActive = store.toggleAutoRenew();
    onNotify?.(
      `Perpanjangan otomatis (Auto-Renew) sekarang ${isNowActive ? 'AKTIF' : 'NONAKTIF'}.`,
      'success'
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30">
              <NjnLogo variant="icon" size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif">
                  NJN
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  {settings.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}
                </span>
                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  RESMI
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Manajemen Lisensi & Masa Berlaku ERP
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur masa aktif sistem secara <b>Manual</b>, <b>Otomatis</b>, atau <b>Tambahkan Hari</b> kapan saja.
              </p>
            </div>
          </div>
        </div>

        {/* Current License Status Card */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Box 1: Masa Berlaku */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Masa Berlaku Sistem
              </span>
              <div className="mt-2">
                <div className="text-sm font-black text-slate-900">
                  {formatDate(license.validUntil)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  s.d. {license.validUntil}
                </div>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusInfo.text}
                </span>
              </div>
            </div>

            {/* Box 2: Serial Key & Pemilik */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-blue-500" />
                Serial Key Lisensi
              </span>
              <div className="mt-2">
                <div className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 truncate">
                  {license.licenseKey}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Owner: <b>{license.ownerName || 'Rudi Ruhdiana'}</b>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                Terverifikasi Digital NJN
              </div>
            </div>

            {/* Box 3: Perpanjangan Otomatis */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
                Auto-Renew
              </span>
              <div className="mt-2">
                <div className="text-xs font-bold text-slate-800">
                  {license.autoRenew ? 'Aktif (Otomatis)' : 'Non-Aktif (Manual)'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {license.autoRenew ? 'Sistem auto-extend saat mendekati expired' : 'Perpanjangan dilakukan mandiri'}
                </div>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleToggleAutoRenew}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                    license.autoRenew
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {license.autoRenew ? 'Matikan Auto-Renew' : 'Aktifkan Auto-Renew'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls: Tambahkan, Manual, Otomatis, Sertifikat */}
        <div className="flex border-b border-slate-200 bg-white px-5 sm:px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('tambah')}
            className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'tambah'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>1. Tambahkan Masa Aktif</span>
          </button>

          <button
            onClick={() => setActiveSubTab('manual')}
            className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'manual'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>2. Buat / Set Manual</span>
          </button>

          <button
            onClick={() => setActiveSubTab('otomatis')}
            className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'otomatis'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3. Buat Otomatis</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sertifikat')}
            className={`pb-2.5 px-3 text-xs font-bold transition whitespace-nowrap border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'sertifikat'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>4. Sertifikat Digital</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 sm:p-6 bg-white min-h-[260px]">
          {/* TAB 1: TAMBAHKAN MASA AKTIF CEPAT */}
          {activeSubTab === 'tambah' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tambahkan Masa Aktif (1-Klik Cepat)
                </h4>
                <p className="text-xs text-slate-500">
                  Pilih durasi untuk langsung menambahkan sisa hari ke masa berlaku saat ini ({license.validUntil}).
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAddDays(7, '7 Hari')}
                  className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-left cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500 group-hover:text-amber-600">Mingguan</div>
                  <div className="text-base font-black text-slate-900">+ 7 Hari</div>
                  <div className="text-[10px] text-slate-400 mt-1">Uji Coba / Grace Period</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDays(30, '1 Bulan (30 Hari)')}
                  className="p-3 rounded-2xl border-2 border-amber-300 bg-amber-50/30 hover:border-amber-500 hover:bg-amber-50 transition text-left cursor-pointer group"
                >
                  <div className="text-xs font-bold text-amber-600">Bulanan</div>
                  <div className="text-base font-black text-slate-900">+ 30 Hari</div>
                  <div className="text-[10px] text-slate-500 mt-1">Operasional 1 Bulan</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDays(90, '3 Bulan (90 Hari)')}
                  className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-left cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500 group-hover:text-amber-600">Kuartalan</div>
                  <div className="text-base font-black text-slate-900">+ 90 Hari</div>
                  <div className="text-[10px] text-slate-400 mt-1">Operasional 3 Bulan</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDays(180, '6 Bulan (180 Hari)')}
                  className="p-3 rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition text-left cursor-pointer group"
                >
                  <div className="text-xs font-bold text-slate-500 group-hover:text-amber-600">Semester</div>
                  <div className="text-base font-black text-slate-900">+ 180 Hari</div>
                  <div className="text-[10px] text-slate-400 mt-1">Operasional 6 Bulan</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddDays(365, '1 Tahun Penuh (365 Hari)')}
                  className="p-3 rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 hover:border-emerald-600 hover:bg-emerald-50 transition text-left cursor-pointer group col-span-2 sm:col-span-1"
                >
                  <div className="text-xs font-bold text-emerald-600">Tahunan</div>
                  <div className="text-base font-black text-slate-900">+ 365 Hari</div>
                  <div className="text-[10px] text-emerald-700 mt-1">Lisensi Penuh 1 Tahun</div>
                </button>
              </div>

              {/* Custom Add Days */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                <span className="text-xs font-bold text-slate-700 shrink-0">
                  Tambahkan Hari Kustom:
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={customDays}
                    onChange={e => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-xs text-slate-500 font-medium">Hari</span>
                  <button
                    type="button"
                    onClick={() => handleAddDays(customDays, `${customDays} Hari Kustom`)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow"
                  >
                    + Tambahkan Sekarang
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANUAL BUAT & SET TANGGAL */}
          {activeSubTab === 'manual' && (
            <form onSubmit={handleSaveManual} className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Pengaturan Masa Berlaku Secara Manual
                </h4>
                <p className="text-xs text-slate-500">
                  Tentukan tanggal expired secara spesifik melalui kalender atau perbarui serial lisensi kustom.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tanggal Berakhir (Masa Berlaku)
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Format: Tahun-Bulan-Tanggal (mis. 2026-10-10)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Serial Key Lisensi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={manualKey}
                    onChange={e => setManualKey(e.target.value)}
                    placeholder="mis. NJN-ERP-2026-RR-9042"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Bisa dimasukkan serial dari aktivasi manual
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Keterangan Perpanjangan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="mis. Perpanjangan operasional Toko Nirwana Jaya Nugraha"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setManualDate(license.validUntil);
                    setManualKey(license.licenseKey);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan Manual</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: OTOMATIS GENERATE */}
          {activeSubTab === 'otomatis' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Pembuatan & Perpanjangan Otomatis
                </h4>
                <p className="text-xs text-slate-500">
                  Sistem otomatis mengkalkulasi sisa hari, membuat serial nomor baru yang aman, dan mendukung perpanjangan tanpa jeda.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-700 shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900">
                      Otomatis Buat Lisensi Baru (Auto-Key Generator)
                    </h5>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Membuat kode sertifikat lisensi baru berstandar NJN atas nama <b>Rudi Ruhdiana</b> dan menambahkan durasi aktif otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAuto(30)}
                    className="px-3.5 py-2 bg-white hover:bg-amber-100 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚡ Otomatis Buat (+30 Hari)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateAuto(365)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Otomatis Buat Lisensi 1 Tahun (+365 Hari)</span>
                  </button>
                </div>
              </div>

              {/* Auto-renew Explanation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Mode Perpanjangan Otomatis (Auto-Renew)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Jika diaktifkan, sistem akan otomatis menambah +30 hari jika masa berlaku tersisa 0 hari agar operasional toko tidak terhenti.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAutoRenew}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    license.autoRenew
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {license.autoRenew ? '✓ AKTIF' : 'NON-AKTIF'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: SERTIFIKAT DIGITAL RESMI */}
          {activeSubTab === 'sertifikat' && (
            <div className="space-y-4">
              <div className="border-2 border-amber-300/80 rounded-2xl p-5 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 relative overflow-hidden shadow-inner">
                {/* Certificate Background Stamp */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full border-4 border-amber-400/20 pointer-events-none flex items-center justify-center">
                  <span className="text-[10px] font-black tracking-widest text-amber-500/30 uppercase rotate-12">
                    TOKO NIRWANA JAYA NUGRAHA
                  </span>
                </div>

                <div className="text-center pb-4 border-b border-amber-200">
                  <div className="flex justify-center mb-1">
                    <NjnLogo variant="icon" size="sm" />
                  </div>
                  <div className="text-xs font-black tracking-widest text-amber-700 uppercase">
                    SERTIFIKAT LISENSI RESMI OPERASIONAL ERP
                  </div>
                  <div className="text-base font-black text-slate-900 mt-0.5">
                    {settings.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}
                  </div>
                  <div className="text-[11px] text-slate-500 font-serif italic">
                    Distributor Alat Listrik, Panel Proyek & Kontraktor Elektrikal
                  </div>
                </div>

                <div className="py-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Nama Pemilik / Owner:</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {license.ownerName || 'Rudi Ruhdiana'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Nomor Registrasi Lisensi:</span>
                    <span className="font-mono font-bold text-amber-800 text-xs">
                      {license.licenseKey}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Status Masa Berlaku:</span>
                    <span className="font-bold text-slate-800">
                      Berlaku s.d. {formatDate(license.validUntil)} ({statusInfo.text})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Otoritas Validasi:</span>
                    <span className="font-bold text-emerald-700">
                      Terverifikasi Server Lokal Resmi (v4.0)
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-amber-200 flex items-center justify-between text-[10px] text-slate-500">
                  <span>Bandung, Jawa Barat • Indonesia</span>
                  <span>Kode Verifikasi: NJN-AUTH-{license.licenseKey.slice(-4)}</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4 text-amber-400" />
                  <span>Cetak Sertifikat Lisensi</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Masa Berlaku Aktif: <b>s.d. {license.validUntil}</b> ({statusInfo.text})
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

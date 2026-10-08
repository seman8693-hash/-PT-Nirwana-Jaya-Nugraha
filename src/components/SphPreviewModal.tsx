import React, { useState, useRef } from 'react';
import {
  Printer,
  Download,
  X,
  FileText,
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Share2,
  Send,
  Copy,
  Trash2,
  Check
} from 'lucide-react';
import { SPHQuotation } from '../types';
import { store } from '../store';
import { NjnLogo } from './NjnLogo';
import { formatRupiah, formatDate } from '../utils/format';
import { terbilang } from '../utils/terbilang';
import { downloadSphPdf, printHtmlViaIframe } from '../utils/pdfGenerator';
import type { PaperSize, PaperOrientation } from '../utils/pdfGenerator';

interface SphPreviewModalProps {
  isOpen: boolean;
  sph: SPHQuotation | null;
  onClose: () => void;
  onConvertToInvoice?: (sph: SPHQuotation) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SphPreviewModal: React.FC<SphPreviewModalProps> = ({
  isOpen,
  sph,
  onClose,
  onConvertToInvoice,
  onNotify
}) => {
  if (!isOpen || !sph) return null;

  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<PaperOrientation>('portrait');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recipientPhone, setRecipientPhone] = useState(sph?.customerPhone || '');
  const [isCopied, setIsCopied] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const company = store.getCompanySettings();

  // Generate format pesan penawaran resmi untuk WA / Share
  const generateShareMessage = () => {
    if (!sph) return '';
    const itemLines = sph.items.map((it, idx) => `${idx + 1}. ${it.name} (${it.qty} ${it.unit}) - ${formatRupiah(it.subtotal)}`).join('\n');
    return `*SURAT PENAWARAN HARGA (SPH) RESMI*\n*TOKO NIRWANA JAYA NUGRAHA*\nSpesialis Perakitan Panel Distribusi & Komponen Listrik\n───────────────────────\nKepada Yth. Bapak/Ibu: *${sph.customerName}*\nNo. SPH: *${sph.code}*\nTanggal: ${formatDate(sph.date)}\nProyek: *${sph.projectTitle}*\nMasa Berlaku: s.d. ${formatDate(sph.validUntil)}\n\n*Rincian Penawaran:*\n${itemLines}\n\nSubtotal: ${formatRupiah(sph.subtotal)}\n${sph.isPpn !== false ? `PPN (11%): ${formatRupiah(sph.ppnAmount)}\n` : ''}*TOTAL PENAWARAN: ${formatRupiah(sph.totalAmount)}*\n\n*Syarat & Ketentuan:*\n1. Penawaran berlaku 30 hari kalender.\n2. Waktu fabrikasi / pengiriman 3-7 hari kerja setelah PO resmi diterima.\n3. Pembayaran via Transfer Rekening Resmi Toko Nirwana Jaya Nugraha.\n\nTerima kasih atas kerja sama dan kepercayaannya.\nHormat Kami,\n*Rudi Ruhdiana* (Owner / Pemilik Toko)\nToko Nirwana Jaya Nugraha`;
  };

  const handleCopyShareText = () => {
    const text = generateShareMessage();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    onNotify?.('Format pesan penawaran SPH berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const phone = recipientPhone.replace(/[^0-9]/g, '');
    let formattedPhone = phone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone;
    }
    const text = encodeURIComponent(generateShareMessage());
    const waUrl = `https://wa.me/${formattedPhone}?text=${text}`;
    window.open(waUrl, '_blank');
    onNotify?.(`Membuka WhatsApp untuk mengirim SPH ke ${sph.customerName}...`, 'success');
  };

  const handleDeleteThisSph = () => {
    if (confirm(`HAPUS SPH INI SECARA PERMANEN?\n\nNomor: ${sph.code}\nRekanan: ${sph.customerName}\nTotal: ${formatRupiah(sph.totalAmount)}\n\nDokumen akan dihapus dari arsip dan dicatat di Log Aktivitas Pengawasan.`)) {
      store.deleteSPH(sph.id);
      onNotify?.(`Dokumen SPH ${sph.code} berhasil dihapus permanen!`, 'success');
      onClose();
    }
  };

  const handleApproveThisSph = () => {
    store.updateSPHStatus(sph.id, 'approved', 'Disetujui Owner (Rudi Ruhdiana) - Siap PO', 'Disetujui langsung oleh Rudi Ruhdiana via Pratinjau.');
    onNotify?.(`SPH ${sph.code} berhasil disetujui resmi oleh Owner Rudi Ruhdiana!`, 'success');
  };

  const handleRejectThisSph = () => {
    if (confirm(`Tolak atau batalkan penawaran SPH ${sph.code}?`)) {
      store.updateSPHStatus(sph.id, 'rejected', 'Ditolak / Dibatalkan', 'Dibatalkan oleh pihak toko/rekanan.');
      onNotify?.(`SPH ${sph.code} ditandai Ditolak / Dibatalkan`, 'error');
    }
  };

  // Dimensi visual sheet preview (dalam mm / pixel representation)
  const getPaperStyles = () => {
    switch (paperSize) {
      case 'A4':
        return orientation === 'portrait' ? 'w-[210mm] min-h-[297mm]' : 'w-[297mm] min-h-[210mm]';
      case 'F4':
        return orientation === 'portrait' ? 'w-[215mm] min-h-[330mm]' : 'w-[330mm] min-h-[215mm]';
      case 'Letter':
        return orientation === 'portrait' ? 'w-[216mm] min-h-[279mm]' : 'w-[279mm] min-h-[216mm]';
      case 'A5':
        return orientation === 'portrait' ? 'w-[148mm] min-h-[210mm]' : 'w-[210mm] min-h-[148mm]';
      default:
        return 'w-[210mm] min-h-[297mm]';
    }
  };

  // Fungsi Cetak Browser Sesuai Ukuran Kertas
  const handlePrint = () => {
    onNotify?.(`Menyiapkan pencetakan dokumen SPH (${paperSize})...`, 'success');

    if (documentRef.current) {
      // Print via isolated iframe to ensure 100% clean output without modal background or UI buttons
      printHtmlViaIframe(
        documentRef.current.innerHTML,
        paperSize,
        orientation,
        `SPH - ${sph.code} - ${sph.customerName}`
      );
    } else {
      // Injeksi style dynamic page size
      const existingStyle = document.getElementById('dynamic-page-size-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      let cssSize = 'A4';
      if (paperSize === 'F4') cssSize = '215mm 330mm';
      else if (paperSize === 'Letter') cssSize = 'letter';
      else if (paperSize === 'A5') cssSize = 'A5';

      const styleEl = document.createElement('style');
      styleEl.id = 'dynamic-page-size-style';
      styleEl.innerHTML = `
        @media print {
          @page {
            size: ${cssSize} ${orientation};
            margin: 10mm 12mm 12mm 12mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;
      document.head.appendChild(styleEl);
      window.print();
    }
  };

  // Fungsi Unduh Dokumen sebagai PDF
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    onNotify?.('Sedang memproses unduhan file PDF...', 'success');

    try {
      const filename = await downloadSphPdf(
        sph,
        documentRef.current,
        paperSize,
        orientation
      );
      onNotify?.(`File PDF "${filename}" berhasil diunduh ke perangkat Anda!`, 'success');
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      onNotify?.('Terjadi kesalahan saat membuat file PDF. Silakan gunakan menu Cetak (Print to PDF).', 'error');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-100 rounded-3xl max-w-5xl w-full my-auto shadow-2xl flex flex-col max-h-[96vh] overflow-hidden print:max-h-none print:shadow-none print:p-0 print:border-none print:bg-white">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-400 tracking-wider">
                  PRATINJAU RESMI SPH
                </span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full text-slate-300 font-mono">
                  {sph.code}
                </span>
              </div>
              <h4 className="text-sm font-black text-white leading-tight">
                Surat Penawaran Harga • {sph.customerName}
              </h4>
            </div>
          </div>

          {/* Action Toolbar: Paper Size, Download PDF, Print, Close */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pilihan Ukuran Kertas */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Kertas:</span>
              <select
                value={paperSize}
                onChange={e => setPaperSize(e.target.value as PaperSize)}
                className="bg-slate-900 text-white text-xs font-bold px-2 py-0.5 rounded-lg border border-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="F4">F4 / Folio (215 x 330 mm)</option>
                <option value="Letter">Letter (216 x 279 mm)</option>
                <option value="A5">A5 Ringkas (148 x 210 mm)</option>
              </select>
            </div>

            {/* Pilihan Orientasi */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                  orientation === 'portrait' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Orientasi Tegak"
              >
                Tegak (Portrait)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-2 py-1 rounded-lg font-bold text-[10px] transition cursor-pointer ${
                  orientation === 'landscape' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
                title="Orientasi Mendatar"
              >
                Mendatar
              </button>
            </div>

            {/* Tombol Unduh PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'Membuat PDF...' : 'Download PDF'}</span>
            </button>

            {/* Tombol Bagikan ke Customer (WhatsApp / Copy) */}
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer"
              title="Bagikan SPH ke Klien / Rekanan Baru"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Bagikan SPH</span>
            </button>

            {/* Tombol Cetak Sesuai Ukuran */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({paperSize})</span>
            </button>

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/80 custom-scrollbar print:p-0 print:bg-white print:overflow-visible">
          
          {/* THE OFFICIAL SPH SHEET */}
          <div
            ref={documentRef}
            className={`bg-white shadow-2xl p-8 sm:p-10 border border-slate-300 text-slate-900 rounded-lg print:shadow-none print:border-none print:p-0 print:m-0 mx-auto ${getPaperStyles()} flex flex-col justify-between`}
            style={{ boxSizing: 'border-box' }}
          >
            <div>
              {/* KOP SURAT RESMI TOKO NIRWANA JAYA NUGRAHA */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    <NjnLogo variant="icon" size="md" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black tracking-widest text-slate-900 font-serif">
                        NJN
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                        {company.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 tracking-wide mt-0.5">
                      DISTRIBUTOR ALAT LISTRIK, KABEL SUPREME, KOMPONEN MCB & FABRIKASI PANEL LISTRIK
                    </div>
                    <div className="text-[10px] text-slate-600 mt-1 leading-relaxed">
                      {company.address || 'Jl. Soekarno Hatta No. 488, Batununggal, Bandung, Jawa Barat 40266'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Telp / WhatsApp: {company.phone || '(022) 731-8921 / 0812-2200-9811'} • Email: {company.email || 'operasional@nirwanajaya.co.id'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded-lg text-right">
                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      NOMOR SURAT PENAWARAN:
                    </div>
                    <div className="font-mono font-black text-xs text-slate-900">
                      {sph.code}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5 font-medium">
                    Tanggal: <b>{formatDate(sph.date)}</b>
                  </div>
                  <div className="text-[10px] text-amber-700 font-bold">
                    Berlaku s.d. <b>{formatDate(sph.validUntil)}</b>
                  </div>
                </div>
              </div>

              {/* JUDUL DOKUMEN */}
              <div className="text-center my-4">
                <h2 className="text-base font-black tracking-widest uppercase text-slate-900 font-serif underline decoration-2 underline-offset-4">
                  SURAT PENAWARAN HARGA (SPH)
                </h2>
                <span className="text-[11px] text-slate-500 font-medium">
                  Ref No: {sph.code} / SPH / NJN / {new Date(sph.date).getFullYear()}
                </span>
              </div>

              {/* BLOK INFORMASI REKANAN & PROYEK */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-5">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Kepada Yth (Customer / Rekanan):
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    {sph.customerName}
                  </div>
                  {sph.customerAddress && (
                    <div className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                      {sph.customerAddress}
                    </div>
                  )}
                  {sph.customerPhone && (
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      Telp: {sph.customerPhone}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Informasi Proyek / Pekerjaan:
                  </span>
                  <div className="text-sm font-black text-slate-900">
                    {sph.projectTitle || 'Pengadaan Material & Elektrikal Proyek'}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-600">
                    <span>Kategori Tarif: </span>
                    <span className="font-bold text-amber-800 uppercase">
                      {sph.priceTier === 'harga_kontraktor' ? 'Harga Kontraktor / Proyek' : 'Harga Toko / Retail'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Masa Berlaku Penawaran: <b>30 Hari Kalender</b>
                  </div>
                </div>
              </div>

              {/* TABEL RINCIAN BARANG PENAWARAN */}
              <div className="border border-slate-300 rounded-xl overflow-hidden mb-5">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-800 border-b border-slate-300">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-10 border-r border-slate-300">No</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Uraian Barang & Spesifikasi Teknis</th>
                      <th className="py-2.5 px-3 text-center w-20 border-r border-slate-300">Qty</th>
                      <th className="py-2.5 px-3 text-center w-16 border-r border-slate-300">Satuan</th>
                      <th className="py-2.5 px-3 text-right w-32 border-r border-slate-300">Harga Satuan (Rp)</th>
                      <th className="py-2.5 px-3 text-right w-36">Jumlah (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sph.items.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-center text-slate-500 border-r border-slate-200 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200">
                          <div>{item.name}</div>
                          {item.priceType && (
                            <span className="text-[9px] text-slate-400 uppercase">
                              Tipe: {item.priceType}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold border-r border-slate-200">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 border-r border-slate-200">
                          {item.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700 border-r border-slate-200">
                          {formatRupiah(item.unitPrice)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* RINGKASAN FINANSIAL & TERBILANG */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-5 items-start">
                {/* Kolom Terbilang */}
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-900 block text-[10px] uppercase tracking-wider mb-1">
                    Terbilang Total Pembayaran:
                  </span>
                  <p className="font-serif italic font-bold text-slate-800">
                    "{terbilang(sph.totalAmount)}"
                  </p>
                </div>

                {/* Kolom Subtotal & Pajak */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal Barang:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatRupiah(sph.subtotal)}
                    </span>
                  </div>

                  {sph.isPpn ? (
                    <div className="flex justify-between text-emerald-800 font-semibold">
                      <span>Pajak Pertambahan Nilai (PPN {sph.ppnRate || 11}%):</span>
                      <span className="font-mono font-bold">
                        +{formatRupiah(sph.ppnAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-500">
                      <span>Pajak PPN:</span>
                      <span className="font-mono font-medium">Non-PPN (0%)</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black pt-2 border-t border-slate-300 text-slate-900">
                    <span>TOTAL PENAWARAN:</span>
                    <span className="font-mono text-amber-600 text-base">
                      {formatRupiah(sph.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SYARAT & KETENTUAN PENAWARAN */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 mb-6 space-y-1 leading-relaxed">
                <span className="font-black text-slate-800 uppercase tracking-wider block mb-1">
                  Syarat &amp; Ketentuan Penawaran:
                </span>
                <p>1. Harga tersebut di atas sudah termasuk franco pengiriman wilayah Bandung & sekitarnya.</p>
                <p>2. Masa berlaku penawaran harga ini adalah sampai dengan tanggal <b>{formatDate(sph.validUntil)}</b>.</p>
                <p>3. Pembayaran: Pembayaran tunai saat barang diterima / Transfer Bank BCA / Mandiri Rekening Resmi Toko Nirwana Jaya Nugraha.</p>
                <p>4. Barang yang telah dipesan melalui Surat Penawaran resmi ini dijamin 100% Asli, Baru, dan Bergaransi Resmi.</p>
              </div>
            </div>

            {/* KOLOM TANDA TANGAN & LEGALITAS RESMI (TANPA NAMA SALES & TANPA STEMPEL) */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-12 text-center text-xs mt-6 max-w-2xl mx-auto">
              {/* Kolom 1: Rekanan */}
              <div>
                <div className="text-slate-500 text-[11px] mb-14">
                  Disetujui Oleh (Customer / Rekanan)
                </div>
                <div className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( {sph.customerName} )
                </div>
                <div className="text-[10px] text-slate-400">Tanda Tangan</div>
              </div>

              {/* Kolom 2: Owner Rudi Ruhdiana */}
              <div>
                <div className="text-slate-500 text-[11px] mb-14">
                  Hormat Kami,<br />
                  <b>{company.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}</b>
                </div>

                <div className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  Rudi Ruhdiana
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  Owner / Pemilik Toko
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Status & Action Bar (Hidden in Print) */}
        <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-bold text-slate-700">Status Penawaran:</span>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                sph.status === 'converted_invoice'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : sph.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : sph.status === 'rejected'
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {sph.statusLabel || 'Menunggu Persetujuan PO / Rekanan'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden md:inline">
                (Otoritas: <b>Rudi Ruhdiana - Owner</b> &amp; Rekanan <b>{sph.customerName}</b>)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Approval Controls */}
            {sph.status === 'waiting_po' && (
              <>
                <button
                  type="button"
                  onClick={handleApproveThisSph}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                  title="Sahkan SPH sebagai Disetujui Owner Rudi Ruhdiana"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Setujui (Rudi Ruhdiana)</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectThisSph}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer"
                  title="Tolak Penawaran SPH"
                >
                  ✕ Tolak
                </button>
              </>
            )}

            {/* Convert to Invoice */}
            {onConvertToInvoice && sph.status !== 'converted_invoice' && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(sph);
                  onClose();
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Proses ke Faktur</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Hapus SPH Permanen */}
            <button
              type="button"
              onClick={handleDeleteThisSph}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
              title="Hapus SPH ini dari sistem"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus SPH</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>

      {/* MODAL BAGIKAN SPH KE KLIEN / REKANAN BARU */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Bagikan SPH ke Klien / Customer
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Kirim langsung penawaran resmi via WhatsApp atau salin format teks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nama Rekanan / Klien:
                </label>
                <input
                  type="text"
                  readOnly
                  value={sph.customerName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp Customer Baru / Terdaftar:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789 atau 628123456789"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Bisa dimasukkan nomor telepon rekanan baru yang belum tersimpan di kontak.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Pratinjau Format Pesan Penawaran:
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyShareText}
                    className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{isCopied ? 'Tersalin!' : 'Salin Pesan'}</span>
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={7}
                  value={generateShareMessage()}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-700 leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCopyShareText}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Teks SPH</span>
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

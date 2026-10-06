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
  ArrowRight
} from 'lucide-react';
import { SPHQuotation } from '../types';
import { store } from '../store';
import { NjnLogo } from './NjnLogo';
import { formatRupiah, formatDate } from '../utils/format';
import { terbilang } from '../utils/terbilang';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type PaperSize = 'A4' | 'F4' | 'Letter' | 'A5';
export type PaperOrientation = 'portrait' | 'landscape';

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
  const documentRef = useRef<HTMLDivElement>(null);

  const company = store.getCompanySettings();

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
  };

  // Fungsi Unduh Dokumen sebagai PDF
  const handleDownloadPdf = async () => {
    if (!documentRef.current) return;
    setIsDownloadingPdf(true);
    onNotify?.('Sedang memproses pembuatan file PDF...', 'success');

    try {
      const element = documentRef.current;
      
      // Render canvas resolusi tinggi
      const canvas = await html2canvas(element, {
        scale: 2, // 2x scale for sharp high-res text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Konfigurasi ukuran jsPDF
      let pdfFormat: any = 'a4';
      if (paperSize === 'F4') pdfFormat = [215, 330];
      else if (paperSize === 'Letter') pdfFormat = 'letter';
      else if (paperSize === 'A5') pdfFormat = 'a5';

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pdfFormat
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Halaman pertama
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Halaman berikutnya jika melebihi 1 halaman
      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const cleanCode = sph.code.replace(/[\/\\?%*:|"<>]/g, '_');
      const cleanCustomer = sph.customerName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 20);
      const filename = `SPH_${cleanCode}_${cleanCustomer}_${paperSize}.pdf`;

      pdf.save(filename);
      onNotify?.(`File PDF "${filename}" berhasil diunduh!`, 'success');
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

            {/* KOLOM TANDA TANGAN & LEGALITAS RESMI */}
            <div className="pt-4 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs mt-6">
              {/* Kolom 1: Rekanan */}
              <div>
                <div className="text-slate-500 text-[11px] mb-14">
                  Disetujui Oleh (Customer / Rekanan)
                </div>
                <div className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( {sph.customerName} )
                </div>
                <div className="text-[10px] text-slate-400">Tanda Tangan &amp; Stempel Perusahaan</div>
              </div>

              {/* Kolom 2: Bagian Sales / Estimator */}
              <div>
                <div className="text-slate-500 text-[11px] mb-14">
                  Bagian Penjualan &amp; Estimator
                </div>
                <div className="border-t border-slate-400 pt-1 font-black text-slate-900">
                  ( Fikri Ramadhan )
                </div>
                <div className="text-[10px] text-slate-400">Sales &amp; Estimator Proyek NJN</div>
              </div>

              {/* Kolom 3: Owner Rudi Ruhdiana */}
              <div className="relative">
                <div className="text-slate-500 text-[11px] mb-14">
                  Hormat Kami,<br />
                  <b>{company.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}</b>
                </div>

                {/* Stempel Digital Resmi */}
                <div className="absolute right-4 bottom-7 w-24 h-24 rounded-full border-2 border-amber-500/40 pointer-events-none flex items-center justify-center rotate-[-12deg] bg-amber-500/5">
                  <div className="text-[8px] font-black text-amber-700/60 uppercase tracking-tighter text-center leading-tight">
                    TOKO NIRWANA<br />JAYA NUGRAHA<br />★ RESMI ★
                  </div>
                </div>

                <div className="border-t border-slate-400 pt-1 font-black text-slate-900 relative z-10">
                  Rudi Ruhdiana
                </div>
                <div className="text-[10px] text-slate-500 font-semibold">
                  Owner / Pemilik Toko
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Status & Convert Action Bar (Hidden in Print) */}
        <div className="bg-white px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-bold text-slate-700">Status Penawaran:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              sph.status === 'converted_invoice'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {sph.statusLabel || 'Menunggu Persetujuan PO / Rekanan'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onConvertToInvoice && sph.status !== 'converted_invoice' && (
              <button
                type="button"
                onClick={() => {
                  onConvertToInvoice(sph);
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Proses ke Faktur / Invoice Penjualan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

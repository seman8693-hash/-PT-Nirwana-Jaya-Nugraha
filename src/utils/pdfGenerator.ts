import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { SPHQuotation } from '../types';
import { store } from '../store';
import { formatRupiah, formatDate } from './format';
import { terbilang } from './terbilang';

export type PaperSize = 'A4' | 'F4' | 'Letter' | 'A5' | 'Thermal58' | 'Thermal80';
export type PaperOrientation = 'portrait' | 'landscape';

/**
 * Map PaperSize ke nilai CSS @page size.
 * Thermal = lebar roll, tinggi auto (kertas gulung continuous).
 */
export function resolveCssPageSize(paperSize: PaperSize): string {
  if (paperSize === 'F4') return '215mm 330mm';
  if (paperSize === 'Letter') return 'letter';
  if (paperSize === 'A5') return 'A5';
  if (paperSize === 'Thermal58') return '58mm auto';
  if (paperSize === 'Thermal80') return '80mm auto';
  return 'A4';
}

/** True untuk kertas struk thermal (58mm / 80mm). */
export function isThermalSize(paperSize: PaperSize): boolean {
  return paperSize === 'Thermal58' || paperSize === 'Thermal80';
}

/**
 * Helper to trigger a direct download of a Blob.
 * Uses <a download> which works reliably across all browsers and iframes.
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}

/**
 * Vector PDF Generator (Pure jsPDF text/table)
 * Guaranteed to NEVER fail, doesn't depend on DOM canvas or font rendering,
 * ultra-sharp vector PDF output.
 */
export function generateDirectVectorSphPdf(
  sph: SPHQuotation,
  paperSize: PaperSize = 'A4',
  orientation: PaperOrientation = 'portrait'
): jsPDF {
  const company = store.getCompanySettings();

  let pdfFormat: any = 'a4';
  if (paperSize === 'F4') pdfFormat = [215, 330];
  else if (paperSize === 'Letter') pdfFormat = 'letter';
  else if (paperSize === 'A5') pdfFormat = 'a5';

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pdfFormat
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  let y = margin;

  // Header Box / Brand Kop
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 24, 'F');

  // NJN Gold Monogram Box
  doc.setFillColor(212, 167, 71); // Gold
  doc.roundedRect(margin + 3, y + 3, 18, 18, 2, 2, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NJN', margin + 12, y + 14, { align: 'center' });

  // Company Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyName || 'TOKO NIRWANA JAYA NUGRAHA', margin + 25, y + 8);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('Distributor Alat Listrik, Kabel Supreme, MCB & Fabrikasi Panel Listrik', margin + 25, y + 13);
  doc.text(`${company.address || 'Jl. Soekarno Hatta No. 488 Bandung'} | Telp: ${company.phone || '(022) 731-8921'}`, margin + 25, y + 18);

  // Right side of Kop: SPH Code Badge
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(pageWidth - margin - 48, y + 4, 45, 16, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setTextColor(212, 167, 71);
  doc.setFont('helvetica', 'bold');
  doc.text('NOMOR PENAWARAN (SPH)', pageWidth - margin - 25.5, y + 9, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(sph.code, pageWidth - margin - 25.5, y + 16, { align: 'center' });

  y += 28;

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('SURAT PENAWARAN HARGA (SPH)', pageWidth / 2, y, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Ref No: ${sph.code} / SPH / NJN / ${new Date(sph.date).getFullYear()}`, pageWidth / 2, y + 4.5, { align: 'center' });

  y += 8;

  // Customer & Project Info Boxes
  const boxWidth = (contentWidth - 4) / 2;
  const infoBoxHeight = 22;

  // Left Box: Customer
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, infoBoxHeight, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('KEPADA YTH (CUSTOMER / REKANAN):', margin + 3, y + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(sph.customerName, margin + 3, y + 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const addr = sph.customerAddress || 'Bandung, Jawa Barat';
  doc.text(addr.substring(0, 42), margin + 3, y + 14.5);
  doc.text(`Telp/WA: ${sph.customerPhone || '-'}`, margin + 3, y + 18.5);

  // Right Box: Project & Valid Dates
  doc.roundedRect(margin + boxWidth + 4, y, boxWidth, infoBoxHeight, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INFORMASI PROYEK & KETENTUAN:', margin + boxWidth + 7, y + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text((sph.projectTitle || 'Pengadaan Material Listrik').substring(0, 36), margin + boxWidth + 7, y + 10);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const tierText = sph.priceTier === 'harga_kontraktor' ? 'Tarif: Harga Kontraktor (Proyek)' : 'Tarif: Harga Toko (Retail)';
  doc.text(tierText, margin + boxWidth + 7, y + 14.5);
  doc.text(`Tanggal: ${formatDate(sph.date)} | Berlaku: ${formatDate(sph.validUntil)}`, margin + boxWidth + 7, y + 18.5);

  y += infoBoxHeight + 5;

  // Items Table Header
  const colX = {
    no: margin,
    desc: margin + 9,
    qty: margin + contentWidth - 75,
    unit: margin + contentWidth - 58,
    price: margin + contentWidth - 30,
    total: margin + contentWidth
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, y, contentWidth, 7, 'S');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('No', colX.no + 4.5, y + 4.8, { align: 'center' });
  doc.text('Uraian Barang & Spesifikasi Teknis', colX.desc + 2, y + 4.8);
  doc.text('Qty', colX.qty + 7.5, y + 4.8, { align: 'center' });
  doc.text('Satuan', colX.unit + 7, y + 4.8, { align: 'center' });
  doc.text('Harga Satuan (Rp)', colX.price - 2, y + 4.8, { align: 'right' });
  doc.text('Jumlah (Rp)', colX.total - 3, y + 4.8, { align: 'right' });

  y += 7;

  // Table Body Rows
  sph.items.forEach((it, idx) => {
    // Check if new page is needed
    if (y > pageHeight - 65) {
      doc.addPage();
      y = margin;
    }

    const rowHeight = 7.5;
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, 250, 252);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowHeight, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    doc.text(String(idx + 1), colX.no + 4.5, y + 5, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const itemName = it.name.length > 48 ? it.name.substring(0, 46) + '...' : it.name;
    doc.text(itemName, colX.desc + 2, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(String(it.qty), colX.qty + 7.5, y + 5, { align: 'center' });
    doc.text(it.unit || 'Pcs', colX.unit + 7, y + 5, { align: 'center' });
    doc.text(formatRupiah(it.unitPrice), colX.price - 2, y + 5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatRupiah(it.subtotal), colX.total - 3, y + 5, { align: 'right' });

    y += rowHeight;
  });

  y += 4;

  // Check room for summary & signatures
  if (y > pageHeight - 55) {
    doc.addPage();
    y = margin;
  }

  // Summary Totals Box (Right Side) & Terbilang (Left Side)
  const sumWidth = 72;
  const terbilangWidth = contentWidth - sumWidth - 4;

  // Terbilang Box
  doc.setFillColor(254, 252, 232); // amber-50
  doc.setDrawColor(254, 240, 138); // amber-200
  doc.roundedRect(margin, y, terbilangWidth, 23, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('TERBILANG TOTAL PEMBAYARAN:', margin + 3, y + 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bolditalic');
  doc.setTextColor(30, 41, 59);
  const terbilangText = `"${terbilang(sph.totalAmount)}"`;
  const splitTerbilang = doc.splitTextToSize(terbilangText, terbilangWidth - 6);
  doc.text(splitTerbilang, margin + 3, y + 10);

  // Totals Box (Right)
  const sumX = margin + terbilangWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(sumX, y, sumWidth, 23, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal Barang:', sumX + 3, y + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(sph.subtotal), sumX + sumWidth - 3, y + 5.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const ppnLabel = sph.isPpn !== false ? `PPN (${sph.ppnRate || 11}%):` : 'PPN (Non-PPN):';
  doc.text(ppnLabel, sumX + 3, y + 11.5);
  doc.setFont('helvetica', 'bold');
  if (sph.isPpn !== false) {
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setTextColor(71, 85, 105);
  }
  doc.text(sph.isPpn !== false ? `+${formatRupiah(sph.ppnAmount)}` : 'Rp 0', sumX + sumWidth - 3, y + 11.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.line(sumX + 3, y + 14.5, sumX + sumWidth - 3, y + 14.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL SPH:', sumX + 3, y + 19.5);
  doc.setTextColor(180, 83, 9);
  doc.text(formatRupiah(sph.totalAmount), sumX + sumWidth - 3, y + 19.5, { align: 'right' });

  y += 27;

  // Syarat & Ketentuan ringkas
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('SYARAT & KETENTUAN PENAWARAN:', margin + 3, y + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text('1. Harga franco Bandung & sekitarnya. | 2. Penawaran berlaku s.d. tanggal jatuh tempo yang tertera.', margin + 3, y + 7.5);
  doc.text('3. Pembayaran via Transfer Rekening Resmi Toko Nirwana Jaya Nugraha. | 4. Seluruh barang 100% Baru & Bergaransi.', margin + 3, y + 10.5);

  y += 17;

  // 2 Kolom Tanda Tangan Resmi (Customer & Toko - Tanpa Nama Sales & Tanpa Stempel)
  const sigColWidth = contentWidth / 2;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  
  // Col 1: Customer
  doc.text('Disetujui Oleh (Customer / Rekanan):', margin + sigColWidth / 2, y, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${sph.customerName} )`, margin + sigColWidth / 2, y + 18, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Tanda Tangan', margin + sigColWidth / 2, y + 21.5, { align: 'center' });

  // Col 2: Owner Rudi Ruhdiana
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Hormat Kami, TOKO NIRWANA JAYA NUGRAHA:', margin + sigColWidth + sigColWidth / 2, y, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Rudi Ruhdiana', margin + sigColWidth + sigColWidth / 2, y + 18, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Owner / Pemilik Toko', margin + sigColWidth + sigColWidth / 2, y + 21.5, { align: 'center' });

  return doc;
}

/**
 * Download SPH PDF with dual-mode fallback:
 * Mode 1: html2canvas snapshot of the stylized preview element
 * Mode 2: pure jsPDF vector generation (never fails)
 */
export async function downloadSphPdf(
  sph: SPHQuotation,
  element: HTMLElement | null,
  paperSize: PaperSize = 'A4',
  orientation: PaperOrientation = 'portrait'
): Promise<string> {
  const cleanCode = sph.code.replace(/[\/\\?%*:|"<>]/g, '_');
  const cleanCustomer = sph.customerName.replace(/[\/\\?%*:|"<>]/g, '_').substring(0, 20);
  const filename = `SPH_${cleanCode}_${cleanCustomer}_${paperSize}.pdf`;

  // Try Canvas-based snapshot first if element exists
  if (element) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      let pdfFormat: any = 'a4';
      if (paperSize === 'F4') pdfFormat = [215, 330];
      else if (paperSize === 'Letter') pdfFormat = 'letter';
      else if (paperSize === 'A5') pdfFormat = 'a5';

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: pdfFormat
      });

      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 5) {
        position = heightLeft - imgHeight;
        doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      // Convert to blob and trigger real download
      const blob = doc.output('blob');
      triggerBlobDownload(blob, filename);
      return filename;
    } catch (e) {
      console.warn('Canvas PDF snapshot failed, falling back to pure vector PDF:', e);
    }
  }

// Fallback: Pure jsPDF Vector (100% reliable)
  const vectorDoc = generateDirectVectorSphPdf(sph, paperSize, orientation);
  const blob = vectorDoc.output('blob');
  triggerBlobDownload(blob, filename);
  return filename;
}

/**
 * Print document via a hidden, dedicated printing iframe.
 * Avoids any parent window layout/modal clipping issues.
 */
export function printHtmlViaIframe(
  contentHtml: string,
  paperSize: PaperSize = 'A4',
  orientation: PaperOrientation = 'portrait',
  title = 'Dokumen SPH'
): void {
  // Remove any previous print iframe
  const existingIframe = document.getElementById('njn-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  const cssSize = resolveCssPageSize(paperSize);
  const isThermal = isThermalSize(paperSize);
  const pageMargin = isThermal ? '0 2mm' : '10mm 12mm 12mm 12mm';
  const bodyFontSize = isThermal ? '9pt' : '11pt';

  const iframe = document.createElement('iframe');
  iframe.id = 'njn-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>
        @page {
          size: ${cssSize} ${orientation};
          margin: ${pageMargin};
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          font-size: ${bodyFontSize};
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        .print-hidden, [data-print-hidden="true"] {
          display: none !important;
        }
        /* Struk thermal: paksa pas lebar kertas, hilangkan padding/border preview */
        .thermal-receipt-sheet {
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
        }
        .thermal-receipt-sheet .truncate {
          white-space: normal !important;
          word-break: break-word;
        }
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-white text-slate-900">
      ${isThermal ? `<div class="thermal-receipt-sheet">${contentHtml}</div>` : contentHtml}
    </body>
    </html>
  `);
  doc.close();

  // Wait for Tailwind / fonts to apply then trigger print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      window.print();
    }
  }, 400);
}

/**
 * Print document via a hidden, dedicated printing iframe.
 * Avoids any parent window layout/modal clipping issues.
 * Fixed version with proper page constraint and overflow handling.
 */
export function printHtmlViaIframeFixed(
  contentHtml: string,
  paperSize: PaperSize = 'A4',
  orientation: PaperOrientation = 'portrait',
  title = 'Dokumen SPH'
): void {
  // Remove any previous print iframe
  const existingIframe = document.getElementById('njn-print-iframe');
  if (existingIframe) {
    existingIframe.remove();
  }

  let cssSize = resolveCssPageSize(paperSize);
  const isThermal = isThermalSize(paperSize);

  const iframe = document.createElement('iframe');
  iframe.id = 'njn-print-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.background = '#ffffff';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 100);
    return;
  }

  // Build print styles with overflow handling
  const printStyles = `
    @page {
      size: ${cssSize} ${orientation};
      margin: ${isThermal ? '0 2mm' : '10mm 12mm 12mm 12mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      font-size: ${isThermal ? '9pt' : '11pt'};
    }
    .print-container {
      width: 100%;
      height: ${isThermal ? 'auto' : '100vh'};
      overflow: ${isThermal ? 'visible' : 'hidden'};
      page-break-inside: ${isThermal ? 'auto' : 'avoid'};
    }
    .print-container table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .print-container th,
    .print-container td {
      word-wrap: break-word;
      overflow-wrap: break-word;
      padding: 3px 4px;
      font-size: 9pt;
    }
    .print-container th {
      font-weight: 600;
      background-color: #f3f4f6;
      text-align: left;
      padding: 4px 6px;
      border: 1px solid #d1d5db;
    }
    .print-container tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .print-container img {
      max-width: 100%;
      height: auto;
    }
    .print-hidden, [data-print-hidden="true"] {
      display: none !important;
    }
    @media print {
      @page {
        size: ${cssSize} ${orientation};
        margin: ${isThermal ? '0 2mm' : '10mm 12mm 12mm 12mm'};
      }
      .print-hidden {
        display: none !important;
      }
    }
    /* Struk thermal: paksa pas lebar kertas, hilangkan padding/border preview */
    .thermal-receipt-sheet {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }
    .thermal-receipt-sheet .truncate {
      white-space: normal !important;
      word-break: break-word;
    }
  `;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        ${printStyles}
      </style>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-white text-slate-900">
      <div class="${isThermal ? 'print-container thermal-receipt-sheet' : 'print-container'}">
        ${contentHtml}
      </div>
    </body>
    </html>
  `);
  doc.close();

  // Wait for fonts and layout to apply, then trigger print
  setTimeout(() => {
    try {
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        // Hide body during print setup
        iframeDoc.body.style.visibility = 'hidden';
        const checkVisible = setInterval(() => {
          const body = iframeDoc.body;
          if (body && body.style.visibility !== 'visible') {
            body.style.visibility = 'visible';
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            clearInterval(checkVisible);
          }
        }, 50);
      }
    } catch {
      window.print();
    }
  }, 800);

  // Cleanup after print
  setTimeout(() => {
    document.body.removeChild(iframe);
  }, 5000);
}

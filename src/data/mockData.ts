import {
  PosProduct,
  Customer,
  Supplier,
  UnitMaster,
  BankAccount,
  CompanySettings,
  MonthlySalesTrend,
  SalesInvoice,
  DeliveryOrder,
  SPHQuotation,
  SalesOrder
} from '../types';
import { calculateSmartRestockMetrics } from '../utils/format';

/**
 * KATALOG MASTER PRODUK ASLI OPERASIONAL
 * PT. NIRWANA JAYA NUGRAHA (Distributor Resmi Alat Listrik, Kabel & Panel - Bandung)
 */
const rawProducts = [
  {
    id: 'prod-1',
    sku: 'KBL-NYY-4X16',
    barcode: '89901234001',
    name: 'Kabel Supreme NYY 4x16 mm² (Tembaga)',
    category: 'Kabel Power',
    brand: 'Supreme Cable',
    unit: 'Meter',
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80',
    stock: 45,
    minStock: 50,
    hppPrice: 155000,
    price: 185000,
    priceWholesale: 175000,
    priceProject: 168000,
    rackLocation: 'Gudang Roll A-01',
    specification: 'SNI 04-6629.4 Cu/PVC/PVC 0.6/1kV Tembaga Murni 100%',
    monthlyAvgSales: 150,
    leadTimeDays: 7
  },
  {
    id: 'prod-2',
    sku: 'KBL-NYM-3X2.5',
    barcode: '89901234002',
    name: 'Kabel Supreme NYM 3x2.5 mm² Putih',
    category: 'Kabel Instalasi',
    brand: 'Supreme Cable',
    unit: 'Roll (50m)',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400&auto=format&fit=crop&q=80',
    stock: 12,
    minStock: 15,
    hppPrice: 560000,
    price: 680000,
    priceWholesale: 640000,
    priceProject: 615000,
    rackLocation: 'Rak Display B-03',
    specification: 'Kabel Tunggal 3 Inti SNI/SPLN untuk Instalasi Rumah & Ruko',
    monthlyAvgSales: 20,
    leadTimeDays: 5
  },
  {
    id: 'prod-3',
    sku: 'MCB-SCH-1P-16A',
    barcode: '89901234003',
    name: 'MCB Schneider Domae 1P 16A 4.5kA',
    category: 'Komponen MCB',
    brand: 'Schneider Electric',
    unit: 'Pcs',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
    stock: 25,
    minStock: 30,
    hppPrice: 42000,
    price: 58000,
    priceWholesale: 52000,
    priceProject: 48000,
    rackLocation: 'Etalase Kios K-02',
    specification: 'Kurva C Standar PLN Rumah & Komersil 3500VA',
    monthlyAvgSales: 50,
    leadTimeDays: 4
  },
  {
    id: 'prod-4',
    sku: 'MCB-SCH-3P-63A',
    barcode: '89901234004',
    name: 'MCB Schneider Acti9 3P 63A 10kA',
    category: 'Komponen MCB',
    brand: 'Schneider Electric',
    unit: 'Pcs',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80',
    stock: 18,
    minStock: 10,
    hppPrice: 390000,
    price: 495000,
    priceWholesale: 460000,
    priceProject: 435000,
    rackLocation: 'Rak Komponen Industri C-01',
    specification: 'Kapasitas Pemutus 10kA Cocok untuk Panel SDP Industri',
    monthlyAvgSales: 12,
    leadTimeDays: 7
  },
  {
    id: 'prod-5',
    sku: 'KBL-NYFGBY-4X25',
    barcode: '89901234005',
    name: 'Kabel Tanam Armor Supreme NYFGbY 4x25 mm²',
    category: 'Kabel Power',
    brand: 'Supreme Cable',
    unit: 'Meter',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&auto=format&fit=crop&q=80',
    stock: 35,
    minStock: 40,
    hppPrice: 295000,
    price: 365000,
    priceWholesale: 340000,
    priceProject: 325000,
    rackLocation: 'Gudang Belakang Roll B-02',
    specification: 'Armor Plat Baja Pelindung Tanam Langsung Bawah Tanah',
    monthlyAvgSales: 80,
    leadTimeDays: 10
  },
  {
    id: 'prod-6',
    sku: 'PNL-WALL-80X60',
    barcode: '89901234006',
    name: 'Box Panel Wall Mounting Outdoor 80x60x25 IP65',
    category: 'Box Panel Proyek',
    brand: 'NJN Local Manufacturing',
    unit: 'Unit',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=400&auto=format&fit=crop&q=80',
    stock: 8,
    minStock: 5,
    hppPrice: 1050000,
    price: 1450000,
    priceWholesale: 1350000,
    priceProject: 1250000,
    rackLocation: 'Area Perakitan Workshop',
    specification: 'Ketebalan Plat 1.5mm Powder Coating RAL 7032 Kedap Air & Debu',
    monthlyAvgSales: 6,
    leadTimeDays: 6
  },
  {
    id: 'prod-7',
    sku: 'MCCB-SCH-3P-100A',
    barcode: '89901234007',
    name: 'MCCB Schneider Compact NSX100F 3P 100A 36kA',
    category: 'Pemutus Daya Utama',
    brand: 'Schneider Electric',
    unit: 'Unit',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&auto=format&fit=crop&q=80',
    stock: 4,
    minStock: 5,
    hppPrice: 2150000,
    price: 2750000,
    priceWholesale: 2550000,
    priceProject: 2400000,
    rackLocation: 'Rak Komponen Industri C-02',
    specification: 'Thermal Magnetic TMD trip unit untuk proteksi genset & panel LVMDP',
    monthlyAvgSales: 4,
    leadTimeDays: 14
  },
  {
    id: 'prod-8',
    sku: 'PPA-CONDUIT-20MM',
    barcode: '89901234008',
    name: 'Pipa Conduit PVC High Impact 20mm (EGA)',
    category: 'Aksesoris Jalur Kabel',
    brand: 'EGA Conduit',
    unit: 'Batang (3m)',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
    stock: 140,
    minStock: 100,
    hppPrice: 14500,
    price: 19500,
    priceWholesale: 17500,
    priceProject: 16000,
    rackLocation: 'Rak Pipa Gudang D',
    specification: 'Tahan api, lentur dapat ditekuk dengan bending spring tanpa pecah',
    monthlyAvgSales: 200,
    leadTimeDays: 3
  }
];

export const INITIAL_PRODUCTS: PosProduct[] = rawProducts.map(p => ({
  ...p,
  ...calculateSmartRestockMetrics(p.stock, p.monthlyAvgSales, p.leadTimeDays)
}));

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    code: 'CUST-001',
    name: 'PT. Wijaya Rekayasa Mandiri',
    company: 'PT. Wijaya Rekayasa Mandiri',
    phone: '081223344550',
    email: 'procurement@wijayarekayasa.co.id',
    address: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    type: 'kontraktor',
    creditLimit: 150000000,
    currentReceivable: 8675000,
    notes: 'Kontraktor ME Proyek Gedung & Pabrik'
  },
  {
    id: 'cust-2',
    code: 'CUST-002',
    name: 'CV. Sumber Makmur Teknik',
    company: 'CV. Sumber Makmur Teknik',
    phone: '081399887766',
    email: 'admin@sumbermakmur.com',
    address: 'Jl. Ahmad Yani No. 120, Cimahi',
    type: 'grosir',
    creditLimit: 50000000,
    currentReceivable: 8214000,
    notes: 'Toko Listrik Cabang Pembelian Grosir'
  },
  {
    id: 'cust-3',
    code: 'CUST-003',
    name: 'Walk-in Customer (Pelanggan Kios Retail)',
    phone: '-',
    address: 'Bandung & Sekitarnya',
    type: 'retail',
    creditLimit: 0,
    currentReceivable: 0,
    notes: 'Transaksi Tunai / QRIS Langsung Kasir'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    code: 'SUP-001',
    name: 'PT. Supreme Cable Manufacturing & Commerce Tbk',
    pic: 'Ir. Hendra Gunawan',
    phone: '021-6196188',
    email: 'sales-distributor@sucaco.com',
    address: 'Jl. Daan Mogot Km 16, Jakarta Barat',
    bankName: 'Bank BCA KCU Daan Mogot',
    bankAccount: '054-3091-889',
    bankHolder: 'PT Supreme Cable Mfg',
    currentPayable: 0
  },
  {
    id: 'sup-2',
    code: 'SUP-002',
    name: 'PT. Schneider Electric Distribution Indonesia',
    pic: 'Rudi Hartono (Distributor Rep)',
    phone: '021-7504406',
    email: 'id-order@schneider-electric.com',
    address: 'Cilandak Commercial Estate, Jakarta Selatan',
    bankName: 'Bank Mandiri Cabang Cilandak',
    bankAccount: '127-00-9821-445',
    bankHolder: 'Schneider Electric Dist Indo',
    currentPayable: 0
  },
  {
    id: 'sup-3',
    code: 'SUP-003',
    name: 'CV. Logam Panel Presisi',
    pic: 'Bambang Supriyadi',
    phone: '022-7561234',
    email: 'logampanel@gmail.com',
    address: 'Kawasan Bengkel Industri Moh. Toha, Bandung',
    bankName: 'Bank BCA KCP Moh Toha',
    bankAccount: '283-098-7711',
    bankHolder: 'CV Logam Panel Presisi',
    currentPayable: 0
  }
];

export const INITIAL_UNITS: UnitMaster[] = [
  { id: 'u-1', code: 'MTR', name: 'Meter' },
  { id: 'u-2', code: 'PCS', name: 'Pcs' },
  { id: 'u-3', code: 'ROL', name: 'Roll (50m)' },
  { id: 'u-4', code: 'BOX', name: 'Box' },
  { id: 'u-5', code: 'BTG', name: 'Batang (3m)' },
  { id: 'u-6', code: 'UNT', name: 'Unit' },
  { id: 'u-7', code: 'SET', name: 'Set' }
];

export const INITIAL_BANKS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Kas Tunai Kasir Toko',
    accountNumber: 'KASIR-01',
    holderName: 'Kasir PT Nirwana Jaya Nugraha',
    balance: 5000000,
    type: 'kas_toko'
  },
  {
    id: 'bank-2',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '810-098-9921',
    holderName: 'PT NIRWANA JAYA NUGRAHA',
    balance: 85000000,
    type: 'bank'
  },
  {
    id: 'bank-3',
    bankName: 'Bank Mandiri Operasional',
    accountNumber: '131-00-4491-008',
    holderName: 'PT NIRWANA JAYA NUGRAHA',
    balance: 42500000,
    type: 'bank'
  }
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'PT. NIRWANA JAYA NUGRAHA',
  brandTagline: 'Distributor Alat Listrik, Panel Proyek & Kontraktor Elektrikal',
  npwp: '01.345.678.9-421.000',
  nib: '9120003418902',
  address: 'Jl. Soekarno Hatta No. 488, Batununggal, Bandung, Jawa Barat 40266',
  phone: '(022) 731-8921 / 0812-2200-9811',
  email: 'operasional@nirwanajaya.co.id',
  website: 'www.nirwanajaya.co.id',
  invoicePrefix: 'INV/NJN',
  sphPrefix: 'SPH/NJN',
  spkPrefix: 'SPK/NJN',
  poPrefix: 'PO/NJN',
  doPrefix: 'DO/NJN',
  ppnRate: 11,
  thermalPaperWidth: '80mm',
  qrisNmid: 'ID1020038891021',
  qrisBank: 'BCA QRIS MERCHANT'
};

/**
 * Menghasilkan data tren bulanan secara dinamis dari catatan penjualan kasir & faktur asli
 */
export function generateRealMonthlyTrends(
  posSales: { date: string; total: number; items?: { qty: number }[] }[],
  invoices: { date: string; totalAmount: number; status: string; items?: { qty: number }[] }[]
): MonthlySalesTrend[] {
  const months = ['Apr 2026', 'Mei 2026', 'Jun 2026', 'Jul 2026', 'Agu 2026', 'Sep 2026'];
  const monthMap: { [key: string]: { kios: number; faktur: number; units: number } } = {};

  months.forEach(m => {
    monthMap[m] = { kios: 0, faktur: 0, units: 0 };
  });

  // Iterasi transaksi kasir POS
  posSales.forEach(sale => {
    if (!sale.date) return;
    const d = new Date(sale.date);
    if (isNaN(d.getTime())) return;
    const mIndex = d.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const key = `${monthNames[mIndex]} ${d.getFullYear()}`;
    if (monthMap[key]) {
      monthMap[key].kios += sale.total || 0;
      if (sale.items) {
        sale.items.forEach(it => {
          monthMap[key].units += it.qty || 1;
        });
      }
    }
  });

  // Iterasi faktur invoice penjualan
  invoices.forEach(inv => {
    if (!inv.date || inv.status !== 'paid') return;
    const d = new Date(inv.date);
    if (isNaN(d.getTime())) return;
    const mIndex = d.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const key = `${monthNames[mIndex]} ${d.getFullYear()}`;
    if (monthMap[key]) {
      monthMap[key].faktur += inv.totalAmount || 0;
      if (inv.items) {
        inv.items.forEach(it => {
          monthMap[key].units += it.qty || 1;
        });
      }
    }
  });

  return months.map(month => {
    const entry = monthMap[month] || { kios: 0, faktur: 0, units: 0 };
    return {
      month,
      penjualanKios: entry.kios,
      omsetFaktur: entry.faktur,
      totalOmset: entry.kios + entry.faktur,
      totalUnitsSold: entry.units
    };
  });
}

/**
 * INITIAL SPH QUOTATIONS (Alur Tahap 1)
 */
export const INITIAL_SPH: SPHQuotation[] = [
  {
    id: 'sph-1',
    code: 'SPH/NJN/2026/0001',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    customerPhone: '081223344550',
    projectTitle: 'Pengadaan Kabel NYY 4x16 & Panel Workshop B Gedebage',
    date: '2026-09-01',
    validUntil: '2026-10-01',
    itemsSummary: 'Kabel Supreme NYY 4x16 mm² (80m) + Box Panel Wall Mounting 60x80x25cm (2 unit)',
    subtotal: 17500000,
    ppnAmount: 1925000,
    totalAmount: 19425000,
    status: 'converted_invoice',
    statusLabel: 'Dikonversi ke SO / Invoice',
    items: [
      { id: '1', name: 'Kabel Supreme NYY 4x16 mm² (Tembaga)', qty: 80, unit: 'Meter', unitPrice: 185000, subtotal: 14800000 },
      { id: '2', name: 'Box Panel Wall Mounting 60x80x25cm Top/Bottom Gland', qty: 2, unit: 'Unit', unitPrice: 1350000, subtotal: 2700000 }
    ],
    termsAndConditions: '1. Harga resmi franco Bandung, siap kirim armada internal NJN.\n2. Waktu pengiriman 2-3 hari kerja setelah konfirmasi PO.\n3. Pembayaran tempo 30 hari via Transfer BCA.'
  },
  {
    id: 'sph-2',
    code: 'SPH/NJN/2026/0002',
    customerName: 'CV. Sumber Makmur Teknik',
    customerPhone: '081399887766',
    projectTitle: 'Pengadaan MCB 3 Phase & Conduit Listrik Pabrik Farmasi Cimahi',
    date: '2026-09-18',
    validUntil: '2026-10-18',
    itemsSummary: 'Schneider MCB 3 Phase Domae 63A (15 pcs) + Pipa Conduit 20mm EGA (60 btg)',
    subtotal: 6825000,
    ppnAmount: 750750,
    totalAmount: 7575750,
    status: 'converted_invoice',
    statusLabel: 'Dikonversi ke SO / Invoice',
    items: [
      { id: '1', name: 'Schneider MCB 3 Phase Domae 63A 4.5kA', qty: 15, unit: 'Pcs', unitPrice: 385000, subtotal: 5775000 },
      { id: '2', name: 'Pipa Conduit PVC High Impact 20mm (EGA)', qty: 60, unit: 'Batang (3m)', unitPrice: 17500, subtotal: 1050000 }
    ],
    termsAndConditions: '1. Pembayaran tempo 30 hari via transfer Bank.\n2. Garansi Schneider resmi 1 tahun.'
  }
];

/**
 * INITIAL SALES ORDERS (Alur Tahap 2)
 */
export const INITIAL_SALES_ORDERS: SalesOrder[] = [
  {
    id: 'so-1',
    soNumber: 'SO/NJN/2026/0001',
    sphReference: 'SPH/NJN/2026/0001',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    customerPhone: '081223344550',
    orderDate: '2026-09-04',
    deliveryDateTarget: '2026-09-09',
    totalAmount: 19075000,
    status: 'completed',
    notes: 'Proyek Workshop B Gedebage - PO No. WRM-092',
    items: [
      { id: '1', name: 'Kabel Supreme NYY 4x16 mm²', qty: 80, unit: 'Meter', unitPrice: 185000, subtotal: 14800000 },
      { id: '2', name: 'Box Panel Wall Mounting 60x80x25cm', qty: 2, unit: 'Unit', unitPrice: 1350000, subtotal: 2700000 }
    ]
  },
  {
    id: 'so-2',
    soNumber: 'SO/NJN/2026/0002',
    sphReference: 'SPH/NJN/2026/0002',
    customerName: 'CV. Sumber Makmur Teknik',
    customerPhone: '081399887766',
    orderDate: '2026-09-20',
    deliveryDateTarget: '2026-09-25',
    totalAmount: 7437000,
    status: 'in_progress',
    notes: 'Pengadaan MCB 3 Phase Proyek Pabrik Farmasi Cimahi',
    items: [
      { id: '1', name: 'Schneider MCB 3 Phase Domae 63A', qty: 15, unit: 'Pcs', unitPrice: 385000, subtotal: 5775000 },
      { id: '2', name: 'Pipa Conduit PVC High Impact 20mm (EGA)', qty: 60, unit: 'Batang (3m)', unitPrice: 17500, subtotal: 1050000 }
    ]
  }
];

/**
 * INITIAL SALES INVOICES (Sumber Data Tunggal untuk 4 Tempat: Penjualan, Dashboard, Keuangan, Pengiriman)
 */
export const INITIAL_INVOICES: SalesInvoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV/NJN/2026/0001',
    date: '2026-09-05',
    dueDate: '2026-09-25', // Overdue!
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    customerPhone: '081223344550',
    customerAddress: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    projectName: 'Proyek Instalasi Listrik Workshop B Gedebage',
    referenceSph: 'SPH/NJN/2026/0001',
    referenceSo: 'SO/NJN/2026/0001',
    referencePo: 'PO-WRM-092',
    doReference: 'DO/NJN/2026/0001',
    items: [
      { id: '1', description: 'Kabel Supreme NYY 4x16 mm²', qty: 80, unit: 'Meter', unitPrice: 185000, total: 14800000 },
      { id: '2', description: 'Box Panel Wall Mounting 60x80x25cm', qty: 2, unit: 'Unit', unitPrice: 1350000, total: 2700000 }
    ],
    subtotal: 17500000,
    discount: 0,
    ppnRate: 11,
    taxPpn: 1925000, // Manual PPN
    pphType: 'PPh 23 Jasa (2%)',
    pphRate: 2,
    taxPph: 350000, // Manual PPh
    totalAmount: 19075000,
    paidAmount: 10400000,
    status: 'overdue',
    paymentMethod: 'Transfer Bank BCA',
    paymentDate: '2026-09-10',
    paymentHistory: [
      {
        id: 'pay-1',
        date: '2026-09-10',
        amount: 10400000,
        paymentMethod: 'Transfer Bank BCA',
        bankAccount: 'Bank Central Asia (BCA)',
        refNo: 'BKM-88120',
        notes: 'Uang muka termin 1 (50%)'
      }
    ],
    notes: 'Sisa termin 2 jatuh tempo saat serah terima barang (25 Sep 2026).'
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV/NJN/2026/0002',
    date: '2026-09-22',
    dueDate: '2026-10-22',
    customerName: 'CV. Sumber Makmur Teknik',
    customerPhone: '081399887766',
    customerAddress: 'Jl. Ahmad Yani No. 120, Cimahi',
    projectName: 'Pengadaan MCB 3 Phase Proyek Pabrik Farmasi Cimahi',
    referenceSph: 'SPH/NJN/2026/0002',
    referenceSo: 'SO/NJN/2026/0002',
    doReference: 'DO/NJN/2026/0002',
    items: [
      { id: '1', description: 'Schneider MCB 3 Phase Domae 63A', qty: 15, unit: 'Pcs', unitPrice: 385000, total: 5775000 },
      { id: '2', description: 'Pipa Conduit PVC High Impact 20mm (EGA)', qty: 60, unit: 'Batang (3m)', unitPrice: 17500, total: 1050000 }
    ],
    subtotal: 6825000,
    discount: 125000,
    ppnRate: 11,
    taxPpn: 737000,
    pphType: 'none',
    pphRate: 0,
    taxPph: 0,
    totalAmount: 7437000,
    paidAmount: 0,
    status: 'unpaid',
    notes: 'Termin pembayaran 30 hari kalender via transfer Rekening BCA NJN.'
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV/NJN/2026/0003',
    date: '2026-09-15',
    dueDate: '2026-09-30',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    customerPhone: '081223344550',
    customerAddress: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    projectName: 'Pengadaan Kabel NYM & NYY Gedung Operasional',
    doReference: 'DO/NJN/2026/0003',
    items: [
      { id: '1', description: 'Kabel Supreme NYM 3x2.5 mm² (50m Roll)', qty: 10, unit: 'Roll (50m)', unitPrice: 625000, total: 6250000 }
    ],
    subtotal: 6250000,
    discount: 0,
    ppnRate: 11,
    taxPpn: 687500,
    pphType: 'none',
    pphRate: 0,
    taxPph: 0,
    totalAmount: 6937500,
    paidAmount: 6937500,
    status: 'paid',
    paymentDate: '2026-09-28',
    paymentMethod: 'Transfer Bank Mandiri',
    paymentHistory: [
      {
        id: 'pay-2',
        date: '2026-09-28',
        amount: 6937500,
        paymentMethod: 'Transfer Bank Mandiri',
        bankAccount: 'Bank Mandiri Operasional',
        refNo: 'MDR-99214',
        notes: 'Pelunasan faktur 100%'
      }
    ],
    notes: 'Faktur telah dilunasi penuh via Bank Mandiri.'
  },
  {
    id: 'inv-4',
    invoiceNumber: 'INV/NJN/2026/0004',
    date: '2026-09-28',
    dueDate: '2026-10-28',
    customerName: 'CV. Sumber Makmur Teknik',
    customerPhone: '081399887766',
    customerAddress: 'Jl. Ahmad Yani No. 120, Cimahi',
    projectName: 'Pengadaan Aksesoris Jalur Kabel Listrik Tahap 2',
    items: [
      { id: '1', description: 'Pipa Conduit PVC High Impact 20mm (EGA)', qty: 40, unit: 'Batang (3m)', unitPrice: 17500, total: 700000 }
    ],
    subtotal: 700000,
    discount: 0,
    ppnRate: 11,
    taxPpn: 77000,
    pphType: 'none',
    pphRate: 0,
    taxPph: 0,
    totalAmount: 777000,
    paidAmount: 0,
    status: 'sent',
    notes: 'Faktur fisik telah dikirim via ekspedisi internal ke kantor Cimahi.'
  },
  {
    id: 'inv-5',
    invoiceNumber: 'INV/NJN/2026/0005',
    date: '2026-09-30',
    dueDate: '2026-10-30',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    customerPhone: '081223344550',
    customerAddress: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    projectName: 'Draft Tagihan Tambahan Material MCB & Aksesoris',
    items: [
      { id: '1', description: 'Schneider MCB 1 Phase Domae 16A', qty: 20, unit: 'Pcs', unitPrice: 58000, total: 1160000 }
    ],
    subtotal: 1160000,
    discount: 0,
    ppnRate: 11,
    taxPpn: 127600,
    pphType: 'PPh 23 Jasa (2%)',
    pphRate: 2,
    taxPph: 23200,
    totalAmount: 1264400,
    paidAmount: 0,
    status: 'draft',
    notes: 'Draft internal menunggu verifikasi Berita Acara Pekerjaan.'
  }
];

/**
 * INITIAL DELIVERY ORDERS (DO / Surat Jalan terkait Faktur & Pengiriman)
 */
export const INITIAL_DELIVERY_ORDERS: DeliveryOrder[] = [
  {
    id: 'do-1',
    doNumber: 'DO/NJN/2026/0001',
    invoiceReference: 'INV/NJN/2026/0001',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    destinationAddress: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    driverName: 'Pak Dadang (Armada NJN)',
    vehicleNumber: 'D 8841 AB (Colt Diesel)',
    expedition: 'Armada Internal NJN',
    trackingNumber: 'NJN-LOG-881290',
    shippingDate: '2026-09-08',
    estimatedArrival: '2026-09-09',
    items: [
      { productName: 'Kabel Supreme NYY 4x16 mm²', qty: 80, unit: 'Meter' },
      { productName: 'Box Panel Wall Mounting 60x80x25cm', qty: 2, unit: 'Unit' }
    ],
    status: 'diterima',
    receivedDate: '2026-09-09',
    recipientNotes: 'Diterima lengkap oleh Pak Budi (Gudang Proyek WRM) dalam kondisi baik.'
  },
  {
    id: 'do-2',
    doNumber: 'DO/NJN/2026/0002',
    invoiceReference: 'INV/NJN/2026/0002',
    customerName: 'CV. Sumber Makmur Teknik',
    destinationAddress: 'Jl. Ahmad Yani No. 120, Cimahi',
    driverName: 'Asep Saepudin',
    vehicleNumber: 'D 8102 YZ (Grand Max Pick Up)',
    expedition: 'Armada Internal NJN',
    trackingNumber: 'NJN-LOG-992104',
    shippingDate: '2026-09-24',
    estimatedArrival: '2026-09-25',
    items: [
      { productName: 'Schneider MCB 3 Phase Domae 63A', qty: 15, unit: 'Pcs' },
      { productName: 'Pipa Conduit PVC High Impact 20mm (EGA)', qty: 60, unit: 'Batang (3m)' }
    ],
    status: 'dikirim'
  },
  {
    id: 'do-3',
    doNumber: 'DO/NJN/2026/0003',
    invoiceReference: 'INV/NJN/2026/0003',
    customerName: 'PT. Wijaya Rekayasa Mandiri',
    destinationAddress: 'Kawasan Industri Gedebage Blok D-12, Bandung',
    driverName: 'Pak Dadang (Armada NJN)',
    vehicleNumber: 'D 8841 AB (Colt Diesel)',
    expedition: 'Armada Internal NJN',
    trackingNumber: 'NJN-LOG-773412',
    shippingDate: '2026-09-16',
    estimatedArrival: '2026-09-17',
    items: [
      { productName: 'Kabel Supreme NYM 3x2.5 mm² (50m Roll)', qty: 10, unit: 'Roll (50m)' }
    ],
    status: 'diterima',
    receivedDate: '2026-09-17',
    recipientNotes: 'Diterima utuh tanpa cacat.'
  }
];

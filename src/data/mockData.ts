import {
  PosProduct,
  Customer,
  Supplier,
  UnitMaster,
  BankAccount,
  CompanySettings,
  MonthlySalesTrend
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
    currentReceivable: 0,
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
    currentReceivable: 0,
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

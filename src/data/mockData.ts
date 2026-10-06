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

/**
 * DATABASE KOSONG SIAP KERJA OPERASIONAL ASLI
 * TOKO NIRWANA JAYA NUGRAHA
 * Semua data dummy transaksi, faktur, DO, mutasi, kas, dan master barang di-nol-kan.
 */

export const INITIAL_PRODUCTS: PosProduct[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_UNITS: UnitMaster[] = [
  { id: 'unit-1', name: 'Meter', code: 'M' },
  { id: 'unit-2', name: 'Roll (50m)', code: 'ROLL' },
  { id: 'unit-3', name: 'Pcs', code: 'PCS' },
  { id: 'unit-4', name: 'Batang (3m)', code: 'BTG' },
  { id: 'unit-5', name: 'Unit', code: 'UNIT' },
  { id: 'unit-6', name: 'Set', code: 'SET' },
  { id: 'unit-7', name: 'Box', code: 'BOX' },
  { id: 'unit-8', name: 'Kg', code: 'KG' }
];

export const INITIAL_BANKS: BankAccount[] = [
  {
    id: 'bank-1',
    bankName: 'Kas Tunai Kasir Kios',
    accountNumber: 'KAS-KASIR-01',
    holderName: 'Kasir Toko Nirwana Jaya Nugraha',
    balance: 0,
    type: 'kas_toko'
  },
  {
    id: 'bank-2',
    bankName: 'Bank BCA Giro Operasional',
    accountNumber: '008-882-9901',
    holderName: 'TOKO NIRWANA JAYA NUGRAHA',
    balance: 0,
    type: 'bank'
  },
  {
    id: 'bank-3',
    bankName: 'Bank Mandiri Rekening Penerimaan',
    accountNumber: '131-00-4491-008',
    holderName: 'TOKO NIRWANA JAYA NUGRAHA',
    balance: 0,
    type: 'bank'
  }
];

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: 'TOKO NIRWANA JAYA NUGRAHA',
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
 * Menghasilkan data tren bulanan secara dinamis dari catatan transaksi nyata
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
 * DOKUMEN AWAL KOSONG SIAP OPERASIONAL KERJA NYATA
 */
export const INITIAL_SPH: SPHQuotation[] = [];
export const INITIAL_SALES_ORDERS: SalesOrder[] = [];
export const INITIAL_INVOICES: SalesInvoice[] = [];
export const INITIAL_DELIVERY_ORDERS: DeliveryOrder[] = [];

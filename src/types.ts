export type UrgencyLevel = 'critical' | 'warning' | 'optimal' | 'surplus';

// 1. MASTER DATA: PRODUK / BARANG
export interface PosProduct {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  brand?: string;
  unit: string;
  stock: number;
  minStock: number;
  hppPrice: number;        // Harga Modal Pokok (HPP)
  price: number;           // Harga Jual Standar / Retail
  priceWholesale?: number; // Harga Grosir / Toko
  priceProject?: number;   // Harga Kontraktor / Proyek
  rackLocation?: string;
  specification?: string;
  // Metrik Cerdas Restok
  monthlyAvgSales: number;
  dailyAvgSales: number;
  leadTimeDays: number;
  estimatedDaysLeft: number;
  recommendedReorderQty: number;
  urgency: UrgencyLevel;
}

// 2. MASTER DATA: CUSTOMER
export interface Customer {
  id: string;
  code: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address: string;
  type: 'retail' | 'kontraktor' | 'grosir';
  creditLimit: number;
  currentReceivable: number;
  notes?: string;
}

// 2. MASTER DATA: SUPPLIER
export interface Supplier {
  id: string;
  code: string;
  name: string;
  pic: string;
  phone: string;
  email?: string;
  address: string;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  currentPayable: number;
}

// 2. MASTER DATA: SATUAN
export interface UnitMaster {
  id: string;
  code: string;
  name: string;
}

// 3. INVENTORY: MUTASI & OPNAME
export interface StockMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'masuk' | 'keluar' | 'transfer' | 'opname';
  qty: number;
  unit: string;
  referenceNo: string;
  sourceLocation: string;
  targetLocation: string;
  notes: string;
  pic: string;
}

export interface StockOpnameItem {
  productId: string;
  sku: string;
  name: string;
  systemQty: number;
  physicalQty: number;
  differenceQty: number;
  hppPrice: number;
  totalDiffAmount: number;
  notes: string;
}

export interface StockOpnameRecord {
  id: string;
  opnameNumber: string;
  date: string;
  warehouse: string;
  auditor: string;
  items: StockOpnameItem[];
  totalDifferenceAmount: number;
  status: 'draft' | 'posted';
}

// 4. KASIR / POS
export interface PosCartItem {
  product: PosProduct;
  qty: number;
  discountPercent?: number;
  discountNominal?: number;
  customPrice?: number;
}

export interface PosTransaction {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  cashierName: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    sku: string;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discountTotal: number;
  taxPpn: number;
  total: number;
  paymentMethod: 'tunai' | 'qris' | 'transfer' | 'tempo';
  amountPaid: number;
  change: number;
  status: 'selesai' | 'dibatalkan';
  paymentChannel?: string;
  notes?: string;
}

// 5. PEMBELIAN: PO & NOTA
export interface PurchaseItem {
  id: string;
  sku: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  supplierPhone?: string;
  date: string;
  expectedDate: string;
  items: PurchaseItem[];
  subtotal: number;
  taxPpn: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'received' | 'cancelled';
  notes?: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  poReference?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate: string;
  warehouse: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  taxPpn: number;
  totalAmount: number;
  paidAmount: number;
  status: 'paid' | 'unpaid';
  paymentMethod: string;
  receivedBy: string;
}

// 6. PENJUALAN: SPH, SO, INVOICE
export interface SPHItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
}

export interface SPHQuotation {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  projectTitle: string;
  date: string;
  validUntil: string;
  itemsSummary: string;
  subtotal: number;
  ppnAmount: number;
  totalAmount: number;
  status: 'waiting_po' | 'converted_invoice' | 'cancelled';
  statusLabel: string;
  items: SPHItem[];
  termsAndConditions?: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  sphReference?: string;
  customerName: string;
  customerPhone?: string;
  orderDate: string;
  deliveryDateTarget: string;
  items: SPHItem[];
  totalAmount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface SalesInvoiceItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  projectName?: string;
  referenceSph?: string;
  referencePo?: string;
  items: SalesInvoiceItem[];
  subtotal: number;
  discount: number;
  taxPpn: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue';
  paymentMethod?: string;
  paymentDate?: string;
  doReference?: string;
}

export interface InvoiceStats {
  totalCount: number;
  draftCount: number;
  sentCount: number;
  unpaidCount: number;
  overdueCount: number;
  paidCount: number;
  totalValue: number;
  totalOutstanding: number;
  totalOverdueAmount: number;
  paidTodayAmount: number;
}

// 7. SPK / OPERASIONAL
export interface PKSContract {
  id: string;
  code: string;
  partnerName: string;
  picName: string;
  partnerType: string;
  scope: string;
  contractValue: number;
  realizedAmount: number;
  startDate: string;
  endDate: string;
  duration: string;
  paymentTerm: string;
  discountTier: string;
  status: 'active' | 'completed' | 'pending';
  statusLabel: string;
  workChecklist?: {
    taskName: string;
    completed: boolean;
  }[];
}

// 8. PENGIRIMAN: DO & SURAT JALAN
export interface DeliveryOrder {
  id: string;
  doNumber: string;
  invoiceReference: string;
  customerName: string;
  destinationAddress: string;
  driverName: string;
  vehicleNumber: string;
  expedition: string;
  trackingNumber: string;
  shippingDate: string;
  estimatedArrival: string;
  items: {
    productName: string;
    qty: number;
    unit: string;
  }[];
  status: 'diproses' | 'dikirim' | 'diterima';
  recipientNotes?: string;
  receivedDate?: string;
}

// 9. KEUANGAN: KAS, BANK, JURNAL
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  balance: number;
  type: 'kas_toko' | 'bank';
}

export interface CashTransaction {
  id: string;
  code: string;
  description: string;
  channel: string;
  category: string;
  date: string;
  type: 'masuk' | 'keluar';
  amount: number;
  bankId?: string;
  referenceDocument?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  refNo: string;
  description: string;
  debitAccount: string;
  debitAmount: number;
  creditAccount: string;
  creditAmount: number;
}

// 11. USER & HAK AKSES
export interface AppUser {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'kasir' | 'gudang' | 'keuangan' | 'sales';
  pin?: string;
  active: boolean;
  lastLogin?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  details: string;
}

// 12. PENGATURAN PERUSAHAAN
export interface CompanySettings {
  companyName: string;
  brandTagline: string;
  npwp: string;
  nib: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  invoicePrefix: string;
  sphPrefix: string;
  spkPrefix: string;
  poPrefix: string;
  doPrefix: string;
  ppnRate: number; // e.g. 11
  thermalPaperWidth: '58mm' | '80mm';
  qrisNmid: string;
  qrisBank: string;
}

export interface MonthlySalesTrend {
  month: string;
  omsetFaktur: number;
  penjualanKios: number;
  totalOmset: number;
  totalUnitsSold: number;
}

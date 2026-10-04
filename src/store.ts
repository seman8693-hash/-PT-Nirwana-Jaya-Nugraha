import {
  PosProduct,
  Customer,
  Supplier,
  UnitMaster,
  StockMovement,
  StockOpnameRecord,
  PosTransaction,
  PurchaseOrder,
  PurchaseInvoice,
  SPHQuotation,
  SalesOrder,
  SalesInvoice,
  PKSContract,
  DeliveryOrder,
  BankAccount,
  CashTransaction,
  JournalEntry,
  AppUser,
  AuditLog,
  CompanySettings,
  MonthlySalesTrend
} from './types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_UNITS,
  INITIAL_BANKS,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_SPH,
  INITIAL_SALES_ORDERS,
  INITIAL_INVOICES,
  INITIAL_DELIVERY_ORDERS,
  generateRealMonthlyTrends
} from './data/mockData';
import { calculateSmartRestockMetrics } from './utils/format';
import { markDirty, flush } from './api/sync';

const STORAGE_KEY = 'njn_pos_erp_clean_work_v4';

/** Koleksi yang ikut dikirim ke D1. */
const SYNCED_COLLECTIONS = [
  'products', 'customers', 'suppliers', 'units', 'stockMovements', 'stockOpnames',
  'posTransactions', 'purchaseOrders', 'purchaseInvoices', 'sphQuotations',
  'salesOrders', 'salesInvoices', 'spkContracts', 'deliveryOrders',
  'bankAccounts', 'cashRecords', 'journalEntries', 'companySettings',
] as const;

/** Sinkronisasi hanya aktif setelah login berhasil. */
let syncEnabled = false;

/** Hash string sederhana (FNV-1a 32-bit) untuk sidik jari koleksi. */
function hash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36) + ':' + input.length;
}

export interface AppState {
  products: PosProduct[];
  customers: Customer[];
  suppliers: Supplier[];
  units: UnitMaster[];
  stockMovements: StockMovement[];
  stockOpnames: StockOpnameRecord[];
  posTransactions: PosTransaction[];
  purchaseOrders: PurchaseOrder[];
  purchaseInvoices: PurchaseInvoice[];
  sphQuotations: SPHQuotation[];
  salesOrders: SalesOrder[];
  salesInvoices: SalesInvoice[];
  spkContracts: PKSContract[];
  deliveryOrders: DeliveryOrder[];
  bankAccounts: BankAccount[];
  cashRecords: CashTransaction[];
  journalEntries: JournalEntry[];
  users: AppUser[];
  auditLogs: AuditLog[];
  companySettings: CompanySettings;
  targetAmount: number;
  currentUser: AppUser;
}

const DEFAULT_USERS: AppUser[] = [
  { id: 'usr-1', username: 'direktur', name: 'H. Asep Supriatna, S.T.', role: 'owner', active: true },
  { id: 'usr-2', username: 'kasir1', name: 'Siti Rahmawati', role: 'kasir', active: true },
  { id: 'usr-3', username: 'gudang1', name: 'Dedi Kurniawan', role: 'gudang', active: true },
  { id: 'usr-4', username: 'keuangan1', name: 'Rina Marlina, S.E.', role: 'keuangan', active: true },
  { id: 'usr-5', username: 'sales1', name: 'Fikri Ramadhan', role: 'sales', active: true }
];

class Store {
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.loadInitialState();
  }

  private loadInitialState(): AppState {
    try {
      // Clear legacy dummy storage keys
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.removeItem('njn_pos_erp_operational_v3');
        localStorage.removeItem('njn_pos_erp_operational_v2');
        localStorage.removeItem('njn_pos_erp_operational_v1');
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          products: Array.isArray(parsed.products)
            ? parsed.products.map((p: PosProduct) => ({
                ...p,
                imageUrl: p.imageUrl || '',
                ...calculateSmartRestockMetrics(p.stock || 0, p.monthlyAvgSales || 20, p.leadTimeDays || 7)
              }))
            : [],
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : [],
          units: (Array.isArray(parsed.units) && parsed.units.length > 0) ? parsed.units : JSON.parse(JSON.stringify(INITIAL_UNITS)),
          stockMovements: Array.isArray(parsed.stockMovements) ? parsed.stockMovements : [],
          stockOpnames: Array.isArray(parsed.stockOpnames) ? parsed.stockOpnames : [],
          posTransactions: Array.isArray(parsed.posTransactions) ? parsed.posTransactions : [],
          purchaseOrders: Array.isArray(parsed.purchaseOrders) ? parsed.purchaseOrders : [],
          purchaseInvoices: Array.isArray(parsed.purchaseInvoices) ? parsed.purchaseInvoices : [],
          sphQuotations: Array.isArray(parsed.sphQuotations) ? parsed.sphQuotations : [],
          salesOrders: Array.isArray(parsed.salesOrders) ? parsed.salesOrders : [],
          salesInvoices: Array.isArray(parsed.salesInvoices) ? parsed.salesInvoices : [],
          spkContracts: Array.isArray(parsed.spkContracts) ? parsed.spkContracts : [],
          deliveryOrders: Array.isArray(parsed.deliveryOrders) ? parsed.deliveryOrders : [],
          bankAccounts: (Array.isArray(parsed.bankAccounts) && parsed.bankAccounts.length > 0) ? parsed.bankAccounts : JSON.parse(JSON.stringify(INITIAL_BANKS)),
          cashRecords: Array.isArray(parsed.cashRecords) ? parsed.cashRecords : [],
          journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
          users: (Array.isArray(parsed.users) && parsed.users.length > 0) ? parsed.users : DEFAULT_USERS,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [
            {
              id: 'log-init',
              timestamp: new Date().toISOString(),
              userName: 'System Admin',
              userRole: 'owner',
              action: 'DATABASE_BERSIH_DIMULAI',
              module: 'Core ERP',
              details: 'Sistem POS + ERP PT Nirwana Jaya Nugraha siap digunakan secara operasional kerja bersih tanpa dummy data.'
            }
          ],
          companySettings: parsed.companySettings || INITIAL_COMPANY_SETTINGS,
          targetAmount: typeof parsed.targetAmount === 'number' ? parsed.targetAmount : 0,
          currentUser: parsed.currentUser || DEFAULT_USERS[0]
        };
      }
    } catch (e) {
      console.error('Gagal membaca database lokal, inisialisasi database bersih:', e);
    }

    return {
      products: [],
      customers: [],
      suppliers: [],
      units: JSON.parse(JSON.stringify(INITIAL_UNITS)),
      stockMovements: [],
      stockOpnames: [],
      posTransactions: [],
      purchaseOrders: [],
      purchaseInvoices: [],
      sphQuotations: [],
      salesOrders: [],
      salesInvoices: [],
      spkContracts: [],
      deliveryOrders: [],
      bankAccounts: JSON.parse(JSON.stringify(INITIAL_BANKS)),
      cashRecords: [],
      journalEntries: [],
      users: DEFAULT_USERS,
      auditLogs: [
        {
          id: 'log-init',
          timestamp: new Date().toISOString(),
          userName: 'System Admin',
          userRole: 'owner',
          action: 'DATABASE_BERSIH_DIMULAI',
          module: 'Core ERP',
          details: 'Sistem POS + ERP PT Nirwana Jaya Nugraha siap digunakan secara operasional kerja bersih tanpa dummy data.'
        }
      ],
      companySettings: INITIAL_COMPANY_SETTINGS,
      targetAmount: 0,
      currentUser: DEFAULT_USERS[0]
    };
  }

  /**
   * Reset seluruh database ke nol tanpa dummy data
   */
  public resetAllDataToZero(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('njn_pos_erp_operational_v3');
      localStorage.removeItem('njn_pos_erp_operational_v2');
      localStorage.removeItem('njn_pos_erp_operational_v1');
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }

    this.state = {
      products: [],
      customers: [],
      suppliers: [],
      units: JSON.parse(JSON.stringify(INITIAL_UNITS)),
      stockMovements: [],
      stockOpnames: [],
      posTransactions: [],
      purchaseOrders: [],
      purchaseInvoices: [],
      sphQuotations: [],
      salesOrders: [],
      salesInvoices: [],
      spkContracts: [],
      deliveryOrders: [],
      bankAccounts: JSON.parse(JSON.stringify(INITIAL_BANKS)),
      cashRecords: [],
      journalEntries: [],
      users: DEFAULT_USERS,
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userName: this.state?.currentUser?.name || 'Owner',
          userRole: this.state?.currentUser?.role || 'owner',
          action: 'RESET_DATABASE_BERSIH',
          module: 'Sistem',
          details: 'Semua data dummy telah dihapus. Seluruh saldo di-nol-kan untuk operasional kerja nyata.'
        }
      ],
      companySettings: INITIAL_COMPANY_SETTINGS,
      targetAmount: 0,
      currentUser: this.state?.currentUser || DEFAULT_USERS[0]
    };

    this.save();
  }

  public save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      this.notifyListeners();
    } catch (e) {
      console.error('Gagal menyimpan state:', e);
    }
    // Kirim ke D1 di latar belakang (debounce di sync.ts).
    this.scheduleSync();
  }

  private scheduleSync(): void {
    // Deteksi perubahan otomatis lewat sidik jari tiap koleksi, sehingga
    // semua method mutasi ikut tersinkron tanpa perlu dioleh satu per satu.
    const changed: string[] = [];

    for (const key of SYNCED_COLLECTIONS) {
      const signature = hash(JSON.stringify((this.state as any)[key] ?? null));
      if (this.fingerprints[key] !== signature) {
        this.fingerprints[key] = signature;
        changed.push(key);
      }
    }

    if (changed.length === 0) return;
    if (!syncEnabled) return;

    for (const name of changed) markDirty(name);
    void flush(this.state);
  }

  /** Sidik jari terakhir tiap koleksi. */
  private fingerprints: Record<string, string> = {};

  /** Aktifkan setelah login berhasil; sebelum itu hanya localStorage. */
  public setSyncEnabled(on: boolean): void {
    syncEnabled = on;
    this.fingerprints = {};
    this.scheduleSync(); // kirim seluruh state sebagai seed saat pertama aktif
  }

  /** Gabungkan data dari server ke state lokal. */
  public hydrateState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial } as AppState;
    this.save();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn());
  }

  // AUDIT LOG
  public addAuditLog(module: string, action: string, details: string): void {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: this.state.currentUser.name,
      userRole: this.state.currentUser.role,
      module,
      action,
      details
    };
    this.state.auditLogs = [log, ...this.state.auditLogs].slice(0, 500);
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  // USER & AUTH
  public getUsers(): AppUser[] {
    return this.state.users;
  }

  public getCurrentUser(): AppUser {
    return this.state.currentUser;
  }

  public setCurrentUser(user: AppUser): void {
    this.state.currentUser = user;
    this.addAuditLog('User & Akses', 'GANTI_PENGGUNA', `Pengguna aktif beralih ke: ${user.name} (${user.role.toUpperCase()})`);
    this.save();
  }

  public addUser(user: Omit<AppUser, 'id'>): void {
    const newUser: AppUser = {
      ...user,
      id: `usr-${Date.now()}`
    };
    this.state.users.push(newUser);
    this.addAuditLog('User & Akses', 'TAMBAH_USER', `Menambahkan pengguna baru: ${user.name} sebagai ${user.role}`);
    this.save();
  }

  // 1. DASHBOARD & KPIS
  public getTargetAmount(): number {
    return this.state.targetAmount;
  }

  public setTargetAmount(amount: number): void {
    this.state.targetAmount = amount;
    this.addAuditLog('Dashboard', 'UBAH_TARGET', `Target omset disesuaikan menjadi Rp ${amount.toLocaleString('id-ID')}`);
    this.save();
  }

  public getMonthlyTrends(): MonthlySalesTrend[] {
    return generateRealMonthlyTrends(
      this.state.posTransactions.map(p => ({
        date: p.date,
        total: p.total,
        items: p.items.map(i => ({ qty: i.qty }))
      })),
      this.state.salesInvoices.map(inv => ({
        date: inv.date,
        totalAmount: inv.totalAmount,
        status: inv.status,
        items: inv.items.map(i => ({ qty: i.qty }))
      }))
    );
  }

  public getOverallKPI() {
    // Omset Penjualan (POS + Faktur Lunas)
    const omsetPos = this.state.posTransactions.reduce((acc, t) => acc + (t.status === 'selesai' ? t.total : 0), 0);
    const omsetFakturLunas = this.state.salesInvoices.reduce((acc, inv) => acc + (inv.status === 'paid' ? inv.totalAmount : 0), 0);
    const totalOmsetPenjualan = omsetPos + omsetFakturLunas;

    // Nilai Aset Stok (Stock * HPP)
    const totalAsetStok = this.state.products.reduce((acc, p) => acc + (p.stock * p.hppPrice), 0);
    const totalItemKritis = this.state.products.filter(p => p.stock <= p.minStock).length;

    // Pembelian Supplier
    const totalPembelian = this.state.purchaseInvoices.reduce((acc, p) => acc + p.totalAmount, 0);

    // Hutang & Piutang
    const totalPiutangCustomer = this.state.salesInvoices.filter(i => i.status === 'unpaid').reduce((acc, i) => acc + (i.totalAmount - i.paidAmount), 0);
    const totalHutangSupplier = this.state.purchaseInvoices.filter(p => p.status === 'unpaid').reduce((acc, p) => acc + (p.totalAmount - p.paidAmount), 0);

    // Kas & Bank
    const totalSaldoKasBank = this.state.bankAccounts.reduce((acc, b) => acc + b.balance, 0);

    // Pengiriman
    const pengirimanBerjalan = this.state.deliveryOrders.filter(d => d.status === 'dikirim' || d.status === 'diproses').length;

    // HPP Terjual
    let hppPenjualan = 0;
    this.state.posTransactions.forEach(t => {
      if (t.status === 'selesai') {
        t.items.forEach(it => {
          const prod = this.state.products.find(p => p.id === it.productId);
          hppPenjualan += (prod ? prod.hppPrice : (it.unitPrice * 0.8)) * it.qty;
        });
      }
    });

    const labaKotor = totalOmsetPenjualan - hppPenjualan;
    const biayaOperasional = this.state.cashRecords.filter(c => c.type === 'keluar' && c.category !== 'Pembelian Stok').reduce((acc, c) => acc + c.amount, 0);
    const labaBersih = labaKotor - biayaOperasional;

    return {
      totalOmsetPenjualan,
      omsetPos,
      omsetFakturLunas,
      totalAsetStok,
      totalItemKritis,
      totalPembelian,
      totalPiutangCustomer,
      totalHutangSupplier,
      totalSaldoKasBank,
      pengirimanBerjalan,
      labaKotor,
      biayaOperasional,
      labaBersih
    };
  }

  public getSmartRestockRecommendations(): PosProduct[] {
    return this.state.products
      .filter(p => p.urgency === 'critical' || p.urgency === 'warning')
      .sort((a, b) => a.estimatedDaysLeft - b.estimatedDaysLeft);
  }

  public getFinancialSummary() {
    const kpi = this.getOverallKPI();
    return {
      saldoKas: kpi.totalSaldoKasBank,
      totalMasuk: kpi.totalOmsetPenjualan,
      totalKeluar: kpi.totalPembelian + kpi.biayaOperasional,
      piutang: kpi.totalPiutangCustomer,
      labaBersih: kpi.labaBersih
    };
  }

  // 2. MASTER DATA: PRODUK
  public getProducts(): PosProduct[] {
    return this.state.products;
  }

  public getProductById(id: string): PosProduct | undefined {
    return this.state.products.find(p => p.id === id);
  }

  public addProduct(productData: Omit<PosProduct, 'id' | 'estimatedDaysLeft' | 'recommendedReorderQty' | 'urgency' | 'dailyAvgSales'>): void {
    const metrics = calculateSmartRestockMetrics(
      productData.stock,
      productData.monthlyAvgSales || 20,
      productData.leadTimeDays || 7
    );
    const newProduct: PosProduct = {
      ...productData,
      id: `prod-${Date.now()}`,
      ...metrics
    };
    this.state.products.unshift(newProduct);
    this.recordStockMovement({
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'masuk',
      qty: newProduct.stock,
      unit: newProduct.unit,
      referenceNo: 'INIT-MASTER',
      sourceLocation: 'Input Master Awal',
      targetLocation: newProduct.rackLocation || 'Gudang Utama',
      notes: 'Pencatatan master barang baru',
      pic: this.state.currentUser.name
    });
    this.addAuditLog('Master Data', 'TAMBAH_BARANG', `Menambahkan barang: ${newProduct.name} (SKU: ${newProduct.sku})`);
    this.save();
  }

  public updateProduct(id: string, updates: Partial<PosProduct>): void {
    this.state.products = this.state.products.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        return {
          ...updated,
          ...calculateSmartRestockMetrics(updated.stock, updated.monthlyAvgSales, updated.leadTimeDays)
        };
      }
      return p;
    });
    this.addAuditLog('Master Data', 'UPDATE_BARANG', `Memperbarui data produk ID: ${id}`);
    this.save();
  }

  public deleteProduct(id: string): void {
    const prod = this.state.products.find(p => p.id === id);
    this.state.products = this.state.products.filter(p => p.id !== id);
    if (prod) {
      this.addAuditLog('Master Data', 'HAPUS_BARANG', `Menghapus master barang: ${prod.name}`);
    }
    this.save();
  }

  // 2. MASTER DATA: CUSTOMER
  public getCustomers(): Customer[] {
    return this.state.customers;
  }

  public addCustomer(cust: Omit<Customer, 'id' | 'code' | 'currentReceivable'>): void {
    const code = `CUST-${String(this.state.customers.length + 1).padStart(3, '0')}`;
    const newCust: Customer = {
      ...cust,
      id: `cust-${Date.now()}`,
      code,
      currentReceivable: 0
    };
    this.state.customers.push(newCust);
    this.addAuditLog('Master Data', 'TAMBAH_CUSTOMER', `Menambahkan pelanggan: ${newCust.name} (${newCust.code})`);
    this.save();
  }

  public updateCustomer(id: string, updates: Partial<Customer>): void {
    this.state.customers = this.state.customers.map(c => c.id === id ? { ...c, ...updates } : c);
    this.save();
  }

  // 2. MASTER DATA: SUPPLIER
  public getSuppliers(): Supplier[] {
    return this.state.suppliers;
  }

  public addSupplier(sup: Omit<Supplier, 'id' | 'code' | 'currentPayable'>): void {
    const code = `SUP-${String(this.state.suppliers.length + 1).padStart(3, '0')}`;
    const newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      code,
      currentPayable: 0
    };
    this.state.suppliers.push(newSup);
    this.addAuditLog('Master Data', 'TAMBAH_SUPPLIER', `Menambahkan supplier: ${newSup.name} (${newSup.code})`);
    this.save();
  }

  // 2. MASTER DATA: SATUAN
  public getUnits(): UnitMaster[] {
    return this.state.units;
  }

  public addUnit(name: string, code: string): void {
    this.state.units.push({ id: `u-${Date.now()}`, name, code });
    this.save();
  }

  // 3. INVENTORY: MUTASI & OPNAME
  public getStockMovements(): StockMovement[] {
    return this.state.stockMovements;
  }

  public recordStockMovement(m: Omit<StockMovement, 'id' | 'date'>): void {
    const newMovement: StockMovement = {
      ...m,
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      date: new Date().toISOString()
    };
    this.state.stockMovements = [newMovement, ...this.state.stockMovements];
  }

  public adjustStock(productId: string, qtyDelta: number, reason: string, referenceNo: string = '-'): void {
    this.state.products = this.state.products.map(p => {
      if (p.id === productId) {
        const newStock = Math.max(0, p.stock + qtyDelta);
        this.recordStockMovement({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          type: qtyDelta >= 0 ? 'masuk' : 'keluar',
          qty: Math.abs(qtyDelta),
          unit: p.unit,
          referenceNo,
          sourceLocation: qtyDelta >= 0 ? 'Pemasukan / Restok' : p.rackLocation || 'Gudang',
          targetLocation: qtyDelta >= 0 ? p.rackLocation || 'Gudang' : 'Pengeluaran Stok',
          notes: reason,
          pic: this.state.currentUser.name
        });
        return {
          ...p,
          stock: newStock,
          ...calculateSmartRestockMetrics(newStock, p.monthlyAvgSales, p.leadTimeDays)
        };
      }
      return p;
    });
    this.save();
  }

  public updateProductStock(productId: string, deltaQty: number, notes: string = 'Penambahan Stok Cepat'): void {
    this.adjustStock(productId, deltaQty, notes, `RESTOCK-${Date.now().toString().slice(-4)}`);
  }

  public transferStock(productId: string, qty: number, source: string, target: string, notes: string): void {
    const prod = this.state.products.find(p => p.id === productId);
    if (!prod || prod.stock < qty) return;
    this.recordStockMovement({
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: 'transfer',
      qty,
      unit: prod.unit,
      referenceNo: `TRF-${Date.now().toString().slice(-6)}`,
      sourceLocation: source,
      targetLocation: target,
      notes,
      pic: this.state.currentUser.name
    });
    this.addAuditLog('Inventory', 'TRANSFER_STOK', `Transfer ${qty} ${prod.unit} ${prod.name} dari ${source} ke ${target}`);
    this.save();
  }

  public postStockOpname(record: Omit<StockOpnameRecord, 'id' | 'opnameNumber' | 'date' | 'status'>): void {
    const opnameNo = `OPN/${new Date().getFullYear()}/${String(this.state.stockOpnames.length + 1).padStart(4, '0')}`;
    const newRecord: StockOpnameRecord = {
      ...record,
      id: `opn-${Date.now()}`,
      opnameNumber: opnameNo,
      date: new Date().toISOString(),
      status: 'posted'
    };

    // Apply adjustments
    newRecord.items.forEach(item => {
      if (item.differenceQty !== 0) {
        this.adjustStock(item.productId, item.differenceQty, `Stock Opname: ${opnameNo}`, opnameNo);
      }
    });

    this.state.stockOpnames.unshift(newRecord);
    this.addAuditLog('Inventory', 'POST_STOCK_OPNAME', `Posting Stock Opname ${opnameNo} dengan selisih nominal Rp ${record.totalDifferenceAmount.toLocaleString('id-ID')}`);
    this.save();
  }

  public getStockOpnames(): StockOpnameRecord[] {
    return this.state.stockOpnames;
  }

  // 4. KASIR / POS
  public getPosTransactions(): PosTransaction[] {
    return this.state.posTransactions;
  }

  public recordPosSale(sale: Omit<PosTransaction, 'id' | 'invoiceNumber' | 'date' | 'time' | 'status'>): PosTransaction {
    const now = new Date();
    const invNo = `KASIR/${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}/${String(this.state.posTransactions.length + 1).padStart(4, '0')}`;
    const newSale: PosTransaction = {
      ...sale,
      id: `pos-${Date.now()}`,
      invoiceNumber: invNo,
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'selesai'
    };

    // Kurangi stok barang secara otomatis
    newSale.items.forEach(it => {
      this.adjustStock(it.productId, -it.qty, `Penjualan Kasir ${invNo}`, invNo);
    });

    // Tambah kas ke akun penerima
    if (newSale.paymentMethod === 'tunai') {
      const kasToko = this.state.bankAccounts.find(b => b.type === 'kas_toko') || this.state.bankAccounts[0];
      if (kasToko) {
        kasToko.balance += newSale.total;
      }
    } else if (newSale.paymentMethod === 'qris' || newSale.paymentMethod === 'transfer') {
      const bankBca = this.state.bankAccounts.find(b => b.bankName.includes('BCA')) || this.state.bankAccounts[1] || this.state.bankAccounts[0];
      if (bankBca) {
        bankBca.balance += newSale.total;
      }
    }

    // Catat arus kas masuk
    this.state.cashRecords.unshift({
      id: `csh-${Date.now()}`,
      code: `KM-${now.getFullYear()}-${String(this.state.cashRecords.length + 1).padStart(4, '0')}`,
      description: `Penjualan Kasir Kios ${invNo} (${newSale.customerName})`,
      channel: newSale.paymentMethod.toUpperCase(),
      category: 'Penjualan Kios',
      date: newSale.date,
      type: 'masuk',
      amount: newSale.total,
      referenceDocument: invNo
    });

    // Catat jurnal umum double entry
    this.addJournalEntry(
      newSale.date,
      invNo,
      `Penjualan Kios POS ${invNo}`,
      newSale.paymentMethod === 'tunai' ? 'Kas Tunai Toko' : 'Bank BCA',
      newSale.total,
      'Pendapatan Penjualan Retail',
      newSale.total
    );

    this.state.posTransactions.unshift(newSale);
    this.addAuditLog('Kasir POS', 'TRANSAKSI_SELESAI', `Transaksi Kasir ${invNo} senilai Rp ${newSale.total.toLocaleString('id-ID')} via ${newSale.paymentMethod.toUpperCase()}`);
    this.save();
    return newSale;
  }

  // 5. PEMBELIAN
  public getPurchaseOrders(): PurchaseOrder[] {
    return this.state.purchaseOrders;
  }

  public createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status'>): PurchaseOrder {
    const poNo = `${this.state.companySettings.poPrefix || 'PO/NJN'}/${new Date().getFullYear()}/${String(this.state.purchaseOrders.length + 1).padStart(4, '0')}`;
    const newPO: PurchaseOrder = {
      ...po,
      id: `po-${Date.now()}`,
      poNumber: poNo,
      status: 'sent'
    };
    this.state.purchaseOrders.unshift(newPO);
    this.addAuditLog('Pembelian', 'BUAT_PO', `Membuat Purchase Order ${poNo} ke ${newPO.supplierName}`);
    this.save();
    return newPO;
  }

  public getPurchaseInvoices(): PurchaseInvoice[] {
    return this.state.purchaseInvoices;
  }

  public receiveGoodsAndCreateNota(nota: Omit<PurchaseInvoice, 'id' | 'invoiceNumber'>): PurchaseInvoice {
    const invNo = `NOTA/${new Date().getFullYear()}/${String(this.state.purchaseInvoices.length + 1).padStart(4, '0')}`;
    const newNota: PurchaseInvoice = {
      ...nota,
      id: `pinv-${Date.now()}`,
      invoiceNumber: invNo
    };

    // Tambah stok fisik barang
    newNota.items.forEach(it => {
      const prod = this.state.products.find(p => p.sku === it.sku || p.name === it.name);
      if (prod) {
        this.adjustStock(prod.id, it.qty, `Penerimaan Barang ${invNo} (${newNota.supplierName})`, invNo);
      }
    });

    // Update hutang supplier jika belum lunas
    if (newNota.status === 'unpaid') {
      const sup = this.state.suppliers.find(s => s.id === newNota.supplierId);
      if (sup) {
        sup.currentPayable += (newNota.totalAmount - newNota.paidAmount);
      }
    } else {
      // Potong kas/bank jika langsung lunas
      const bank = this.state.bankAccounts[0];
      if (bank) {
        bank.balance -= newNota.totalAmount;
      }
      this.state.cashRecords.unshift({
        id: `csh-${Date.now()}`,
        code: `KK-${new Date().getFullYear()}-${String(this.state.cashRecords.length + 1).padStart(4, '0')}`,
        description: `Pembayaran Pembelian ${invNo} (${newNota.supplierName})`,
        channel: newNota.paymentMethod || 'TRANSFER',
        category: 'Pembelian Stok',
        date: newNota.date,
        type: 'keluar',
        amount: newNota.totalAmount,
        referenceDocument: invNo
      });
    }

    this.state.purchaseInvoices.unshift(newNota);
    this.addAuditLog('Pembelian', 'PENERIMAAN_BARANG', `Penerimaan Nota Pembelian ${invNo} dari ${newNota.supplierName} senilai Rp ${newNota.totalAmount.toLocaleString('id-ID')}`);
    this.save();
    return newNota;
  }

  public paySupplierDebt(invoiceId: string, amount: number, paymentMethod: string): void {
    const inv = this.state.purchaseInvoices.find(p => p.id === invoiceId);
    if (!inv) return;
    inv.paidAmount += amount;
    if (inv.paidAmount >= inv.totalAmount) {
      inv.status = 'paid';
    }

    const sup = this.state.suppliers.find(s => s.id === inv.supplierId);
    if (sup) {
      sup.currentPayable = Math.max(0, sup.currentPayable - amount);
    }

    // Potong kas / bank
    const bank = this.state.bankAccounts.find(b => b.bankName.includes(paymentMethod)) || this.state.bankAccounts[1] || this.state.bankAccounts[0];
    if (bank) {
      bank.balance -= amount;
    }

    this.state.cashRecords.unshift({
      id: `csh-${Date.now()}`,
      code: `KK-${new Date().getFullYear()}-${String(this.state.cashRecords.length + 1).padStart(4, '0')}`,
      description: `Pelunasan Hutang Pembelian ${inv.invoiceNumber} (${inv.supplierName})`,
      channel: paymentMethod,
      category: 'Pelunasan Hutang',
      date: new Date().toISOString().split('T')[0],
      type: 'keluar',
      amount,
      referenceDocument: inv.invoiceNumber
    });

    this.addAuditLog('Pembelian', 'BAYAR_HUTANG', `Pelunasan hutang ${inv.invoiceNumber} senilai Rp ${amount.toLocaleString('id-ID')}`);
    this.save();
  }

  // 6. PENJUALAN: SPH, SO, INVOICE
  public getSPHList(): SPHQuotation[] {
    return this.state.sphQuotations;
  }

  public addSPH(sphData: Omit<SPHQuotation, 'id' | 'code' | 'status' | 'statusLabel'>): SPHQuotation {
    const count = this.state.sphQuotations.length + 1;
    const code = `${this.state.companySettings.sphPrefix || 'SPH/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const newSph: SPHQuotation = {
      ...sphData,
      id: `sph-${Date.now()}`,
      code,
      status: 'waiting_po',
      statusLabel: 'Menunggu PO / Persetujuan'
    };
    this.state.sphQuotations.unshift(newSph);
    this.addAuditLog('Penjualan', 'BUAT_SPH', `Membuat Penawaran Harga ${code} untuk ${newSph.customerName}`);
    this.save();
    return newSph;
  }

  public convertSphToSalesOrder(sphId: string): SalesOrder {
    const sph = this.state.sphQuotations.find(s => s.id === sphId);
    if (!sph) throw new Error('SPH tidak ditemukan');
    sph.status = 'converted_invoice';
    sph.statusLabel = 'Dikonversi ke SO / Invoice';

    const soNo = `SO/NJN/${new Date().getFullYear()}/${String(this.state.salesOrders.length + 1).padStart(4, '0')}`;
    const newSO: SalesOrder = {
      id: `so-${Date.now()}`,
      soNumber: soNo,
      sphReference: sph.code,
      customerName: sph.customerName,
      customerPhone: sph.customerPhone,
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDateTarget: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: sph.items,
      totalAmount: sph.totalAmount,
      status: 'in_progress',
      notes: sph.projectTitle
    };

    this.state.salesOrders.unshift(newSO);
    this.addAuditLog('Penjualan', 'KONVERSI_SO', `SPH ${sph.code} dikonversi menjadi Sales Order ${soNo}`);
    this.save();
    return newSO;
  }

  public getSalesOrders(): SalesOrder[] {
    return this.state.salesOrders;
  }

  public getInvoices(): SalesInvoice[] {
    return this.state.salesInvoices;
  }

  public createSalesInvoice(inv: Omit<SalesInvoice, 'id' | 'invoiceNumber'>): SalesInvoice {
    const count = this.state.salesInvoices.length + 1;
    const invNo = `${this.state.companySettings.invoicePrefix || 'INV/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const newInvoice: SalesInvoice = {
      ...inv,
      id: `inv-${Date.now()}`,
      invoiceNumber: invNo
    };

    // Update piutang customer jika belum lunas
    if (newInvoice.status === 'unpaid') {
      const cust = this.state.customers.find(c => c.name.toLowerCase() === newInvoice.customerName.toLowerCase());
      if (cust) {
        cust.currentReceivable += (newInvoice.totalAmount - newInvoice.paidAmount);
      }
    } else {
      // Jika lunas langsung
      const bank = this.state.bankAccounts.find(b => b.bankName.includes('BCA')) || this.state.bankAccounts[0];
      if (bank) {
        bank.balance += newInvoice.totalAmount;
      }
    }

    this.state.salesInvoices.unshift(newInvoice);
    this.addAuditLog('Penjualan', 'BUAT_INVOICE', `Membuat Faktur Penjualan ${invNo} untuk ${newInvoice.customerName} senilai Rp ${newInvoice.totalAmount.toLocaleString('id-ID')}`);
    this.save();
    return newInvoice;
  }

  public markInvoicePaid(id: string, method: string = 'Transfer Bank BCA'): void {
    const inv = this.state.salesInvoices.find(i => i.id === id);
    if (!inv) return;
    const remaining = inv.totalAmount - inv.paidAmount;
    inv.paidAmount = inv.totalAmount;
    inv.status = 'paid';
    inv.paymentMethod = method;
    inv.paymentDate = new Date().toISOString().split('T')[0];

    // Potong piutang customer
    const cust = this.state.customers.find(c => c.name.toLowerCase() === inv.customerName.toLowerCase());
    if (cust) {
      cust.currentReceivable = Math.max(0, cust.currentReceivable - remaining);
    }

    // Tambah kas/bank
    const bank = this.state.bankAccounts.find(b => b.bankName.includes('BCA')) || this.state.bankAccounts[0];
    if (bank) {
      bank.balance += remaining;
    }

    // Arus kas masuk
    this.state.cashRecords.unshift({
      id: `csh-${Date.now()}`,
      code: `KM-${new Date().getFullYear()}-${String(this.state.cashRecords.length + 1).padStart(4, '0')}`,
      description: `Pelunasan Faktur ${inv.invoiceNumber} (${inv.customerName})`,
      channel: method,
      category: 'Pelunasan Faktur Proyek',
      date: inv.paymentDate,
      type: 'masuk',
      amount: remaining,
      referenceDocument: inv.invoiceNumber
    });

    this.addAuditLog('Penjualan', 'LUNAS_INVOICE', `Pelunasan Faktur ${inv.invoiceNumber} senilai Rp ${remaining.toLocaleString('id-ID')}`);
    this.save();
  }

  public updateInvoiceStatus(id: string, status: 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue'): void {
    const inv = this.state.salesInvoices.find(i => i.id === id);
    if (!inv) return;
    inv.status = status;
    this.addAuditLog('Penjualan', 'UPDATE_STATUS_INVOICE', `Status Faktur ${inv.invoiceNumber} diubah ke ${status.toUpperCase()}`);
    this.save();
  }

  public getInvoiceStats(): {
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
  } {
    const today = new Date().toISOString().split('T')[0];
    const invoices = this.state.salesInvoices;

    let draftCount = 0;
    let sentCount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;
    let paidCount = 0;
    let totalValue = 0;
    let totalOutstanding = 0;
    let totalOverdueAmount = 0;
    let paidTodayAmount = 0;

    invoices.forEach(inv => {
      totalValue += inv.totalAmount || 0;
      const remaining = Math.max(0, (inv.totalAmount || 0) - (inv.paidAmount || 0));
      const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

      if (inv.status === 'paid') {
        paidCount++;
        if (inv.paymentDate === today) {
          paidTodayAmount += inv.totalAmount || 0;
        }
      } else if (inv.status === 'draft') {
        draftCount++;
      } else {
        if (isOverdue) {
          overdueCount++;
          totalOverdueAmount += remaining;
        } else if (inv.status === 'sent') {
          sentCount++;
        } else {
          unpaidCount++;
        }
        totalOutstanding += remaining;
      }
    });

    return {
      totalCount: invoices.length,
      draftCount,
      sentCount,
      unpaidCount,
      overdueCount,
      paidCount,
      totalValue,
      totalOutstanding,
      totalOverdueAmount,
      paidTodayAmount
    };
  }

  public createDeliveryOrderFromInvoice(invoiceId: string): DeliveryOrder {
    const inv = this.state.salesInvoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error('Invoice tidak ditemukan');

    const count = this.state.deliveryOrders.length + 1;
    const doNo = `${this.state.companySettings.doPrefix || 'DO/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const cust = this.state.customers.find(c => c.name.toLowerCase() === inv.customerName.toLowerCase());

    const newDO: DeliveryOrder = {
      id: `do-${Date.now()}`,
      doNumber: doNo,
      invoiceReference: inv.invoiceNumber,
      customerName: inv.customerName,
      destinationAddress: inv.customerAddress || cust?.address || 'Bandung & Sekitarnya',
      driverName: 'Pak Dadang (Armada NJN)',
      vehicleNumber: 'D 8841 AB (Colt Diesel)',
      expedition: 'Armada Internal NJN',
      trackingNumber: `NJN-LOG-${Date.now().toString().slice(-6)}`,
      shippingDate: new Date().toISOString().split('T')[0],
      estimatedArrival: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      items: inv.items.map(it => ({
        productName: it.description,
        qty: it.qty,
        unit: it.unit
      })),
      status: 'dikirim'
    };

    inv.doReference = doNo;
    this.state.deliveryOrders.unshift(newDO);
    this.addAuditLog('Logistik DO', 'BUAT_DO_DARI_INVOICE', `Surat Jalan ${doNo} diterbitkan otomatis dari Faktur ${inv.invoiceNumber}`);
    this.save();
    return newDO;
  }

  public updateSalesInvoice(id: string, updates: Partial<SalesInvoice>): SalesInvoice | undefined {
    const inv = this.state.salesInvoices.find(i => i.id === id);
    if (!inv) return undefined;
    const oldOutstanding = inv.status !== 'paid' ? (inv.totalAmount - inv.paidAmount) : 0;
    Object.assign(inv, updates);

    // Recalculate customer receivable
    if (inv.status !== 'paid') {
      const newOutstanding = inv.totalAmount - inv.paidAmount;
      const diff = newOutstanding - oldOutstanding;
      const cust = this.state.customers.find(c => c.name.toLowerCase() === inv.customerName.toLowerCase());
      if (cust && diff !== 0) {
        cust.currentReceivable = Math.max(0, cust.currentReceivable + diff);
      }
    }

    this.addAuditLog('Penjualan', 'UPDATE_INVOICE', `Faktur Penjualan ${inv.invoiceNumber} diperbarui`);
    this.save();
    return inv;
  }

  public recordInvoicePayment(invoiceId: string, amount: number, method: string, bankId?: string, notes?: string): void {
    const inv = this.state.salesInvoices.find(i => i.id === invoiceId);
    if (!inv || amount <= 0) return;

    const remaining = inv.totalAmount - inv.paidAmount;
    const actualPay = Math.min(amount, remaining);
    inv.paidAmount += actualPay;
    inv.paymentDate = new Date().toISOString().split('T')[0];
    inv.paymentMethod = method;

    const paymentRecord = {
      id: `pay-${Date.now()}`,
      date: inv.paymentDate,
      amount: actualPay,
      paymentMethod: method,
      bankAccount: method,
      refNo: `BKM-${Date.now().toString().slice(-6)}`,
      notes: notes || 'Pembayaran Tagihan Faktur'
    };

    if (!inv.paymentHistory) inv.paymentHistory = [];
    inv.paymentHistory.push(paymentRecord);

    if (inv.paidAmount >= inv.totalAmount) {
      inv.status = 'paid';
    }

    // Potong piutang customer
    const cust = this.state.customers.find(c => c.name.toLowerCase() === inv.customerName.toLowerCase());
    if (cust) {
      cust.currentReceivable = Math.max(0, cust.currentReceivable - actualPay);
    }

    // Tambah kas/bank
    const bank = this.state.bankAccounts.find(b => b.id === bankId || b.bankName.includes(method)) || this.state.bankAccounts[0];
    if (bank) {
      bank.balance += actualPay;
    }

    // Catat arus kas masuk
    this.state.cashRecords.unshift({
      id: `csh-${Date.now()}`,
      code: `KM-${new Date().getFullYear()}-${String(this.state.cashRecords.length + 1).padStart(4, '0')}`,
      description: `Pembayaran Faktur ${inv.invoiceNumber} (${inv.customerName})`,
      channel: method,
      category: 'Pelunasan Faktur Proyek',
      date: inv.paymentDate,
      type: 'masuk',
      amount: actualPay,
      referenceDocument: inv.invoiceNumber
    });

    // Jurnal umum double entry
    this.addJournalEntry(
      inv.paymentDate,
      inv.invoiceNumber,
      `Penerimaan Piutang ${inv.invoiceNumber} (${inv.customerName})`,
      bank?.bankName || 'Bank BCA',
      actualPay,
      'Piutang Usaha Customer',
      actualPay
    );

    this.addAuditLog('Keuangan Piutang', 'BAYAR_FAKTUR', `Penerimaan pembayaran Faktur ${inv.invoiceNumber} senilai Rp ${actualPay.toLocaleString('id-ID')} (${inv.paidAmount >= inv.totalAmount ? 'LUNAS' : 'SEBAGIAN'})`);
    this.save();
  }

  public createDeliveryOrderFromSalesOrder(soId: string): DeliveryOrder {
    const so = this.state.salesOrders.find(s => s.id === soId);
    if (!so) throw new Error('Sales Order tidak ditemukan');

    const count = this.state.deliveryOrders.length + 1;
    const doNo = `${this.state.companySettings.doPrefix || 'DO/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const cust = this.state.customers.find(c => c.name.toLowerCase() === so.customerName.toLowerCase());

    const newDO: DeliveryOrder = {
      id: `do-${Date.now()}`,
      doNumber: doNo,
      invoiceReference: '-',
      customerName: so.customerName,
      destinationAddress: cust?.address || 'Bandung & Sekitarnya',
      driverName: 'Pak Dadang (Armada NJN)',
      vehicleNumber: 'D 8841 AB (Colt Diesel)',
      expedition: 'Armada Internal NJN',
      trackingNumber: `NJN-LOG-${Date.now().toString().slice(-6)}`,
      shippingDate: new Date().toISOString().split('T')[0],
      estimatedArrival: so.deliveryDateTarget,
      items: so.items.map(it => ({
        productName: it.name,
        qty: it.qty,
        unit: it.unit
      })),
      status: 'dikirim'
    };

    this.state.deliveryOrders.unshift(newDO);
    this.addAuditLog('Logistik DO', 'BUAT_DO_DARI_SO', `Surat Jalan ${doNo} diterbitkan dari Sales Order ${so.soNumber}`);
    this.save();
    return newDO;
  }

  public createInvoiceFromDeliveryOrder(doId: string): SalesInvoice {
    const dOrder = this.state.deliveryOrders.find(d => d.id === doId);
    if (!dOrder) throw new Error('DO tidak ditemukan');

    const count = this.state.salesInvoices.length + 1;
    const invNo = `${this.state.companySettings.invoicePrefix || 'INV/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const cust = this.state.customers.find(c => c.name.toLowerCase() === dOrder.customerName.toLowerCase());

    const invoiceItems = dOrder.items.map(it => {
      const prod = this.state.products.find(p => p.name.toLowerCase() === it.productName.toLowerCase());
      const price = prod?.price || 100000;
      return {
        id: `inv-item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: it.productName,
        qty: it.qty,
        unit: it.unit,
        unitPrice: price,
        total: it.qty * price
      };
    });

    const subtotal = invoiceItems.reduce((acc, i) => acc + i.total, 0);
    const taxPpn = Math.round(subtotal * 0.11);
    const totalAmount = subtotal + taxPpn;

    const newInvoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invNo,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      customerName: dOrder.customerName,
      customerAddress: dOrder.destinationAddress,
      doReference: dOrder.doNumber,
      items: invoiceItems,
      subtotal,
      discount: 0,
      ppnRate: 11,
      taxPpn,
      pphType: 'none',
      pphRate: 0,
      taxPph: 0,
      totalAmount,
      paidAmount: 0,
      status: 'unpaid'
    };

    dOrder.invoiceReference = invNo;
    if (cust) {
      cust.currentReceivable += totalAmount;
    }

    this.state.salesInvoices.unshift(newInvoice);
    this.addAuditLog('Penjualan', 'BUAT_INVOICE_DARI_DO', `Faktur ${invNo} diterbitkan berdasarkan Surat Jalan ${dOrder.doNumber}`);
    this.save();
    return newInvoice;
  }

  // 7. SPK / OPERASIONAL
  public getSPKList(): PKSContract[] {
    return this.state.spkContracts;
  }

  public addSPK(spkData: Omit<PKSContract, 'id' | 'code' | 'status' | 'statusLabel'>): PKSContract {
    const count = this.state.spkContracts.length + 1;
    const code = `${this.state.companySettings.spkPrefix || 'SPK/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const newSpk: PKSContract = {
      ...spkData,
      id: `spk-${Date.now()}`,
      code,
      status: 'active',
      statusLabel: 'Sedang Berjalan',
      workChecklist: [
        { taskName: 'Survey Lokasi & Pengukuran Jalur', completed: true },
        { taskName: 'Fabrikasi Box Panel & Wiring Komponen', completed: false },
        { taskName: 'Penarikan Kabel Power Feeder', completed: false },
        { taskName: 'Testing & Commissioning Beban', completed: false },
        { taskName: 'Serah Terima Dokumen BAST', completed: false }
      ]
    };
    this.state.spkContracts.unshift(newSpk);
    this.addAuditLog('SPK Operasional', 'BUAT_SPK', `Penerbitan SPK Proyek ${code} - ${newSpk.partnerName} (${newSpk.scope})`);
    this.save();
    return newSpk;
  }

  public updateSpkStatus(id: string, status: 'active' | 'completed' | 'pending'): void {
    const spk = this.state.spkContracts.find(s => s.id === id);
    if (!spk) return;
    spk.status = status;
    spk.statusLabel = status === 'completed' ? 'Selesai 100%' : (status === 'active' ? 'Sedang Berjalan' : 'Tertunda / Pending');
    this.addAuditLog('SPK Operasional', 'UPDATE_SPK_STATUS', `Status SPK ${spk.code} diubah menjadi: ${spk.statusLabel}`);
    this.save();
  }

  // 8. PENGIRIMAN: DO & SURAT JALAN
  public getDeliveryOrders(): DeliveryOrder[] {
    return this.state.deliveryOrders;
  }

  public createDeliveryOrder(doData: Omit<DeliveryOrder, 'id' | 'doNumber' | 'status'>): DeliveryOrder {
    const count = this.state.deliveryOrders.length + 1;
    const doNo = `${this.state.companySettings.doPrefix || 'DO/NJN'}/${new Date().getFullYear()}/${String(count).padStart(4, '0')}`;
    const newDO: DeliveryOrder = {
      ...doData,
      id: `do-${Date.now()}`,
      doNumber: doNo,
      status: 'dikirim'
    };
    this.state.deliveryOrders.unshift(newDO);
    this.addAuditLog('Pengiriman', 'BUAT_SURAT_JALAN', `Penerbitan Surat Jalan DO ${doNo} ke ${newDO.customerName} via ${newDO.expedition}`);
    this.save();
    return newDO;
  }

  public updateDeliveryStatus(id: string, status: 'diproses' | 'dikirim' | 'diterima', recipientNotes?: string): void {
    const order = this.state.deliveryOrders.find(d => d.id === id);
    if (!order) return;
    order.status = status;
    if (recipientNotes) order.recipientNotes = recipientNotes;
    if (status === 'diterima') order.receivedDate = new Date().toISOString();
    this.addAuditLog('Pengiriman', 'UPDATE_PENGIRIMAN', `Status DO ${order.doNumber} diubah menjadi: ${status.toUpperCase()}`);
    this.save();
  }

  // 9. KEUANGAN: KAS, BANK, JURNAL
  public getBankAccounts(): BankAccount[] {
    return this.state.bankAccounts;
  }

  public getCashRecords(): CashTransaction[] {
    return this.state.cashRecords;
  }

  public addCashRecord(record: Omit<CashTransaction, 'id' | 'code'>): void {
    const prefix = record.type === 'masuk' ? 'KM' : 'KK';
    const count = this.state.cashRecords.length + 1;
    const code = `${prefix}-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const newRecord: CashTransaction = {
      ...record,
      id: `csh-${Date.now()}`,
      code
    };

    // Update saldo bank / kas
    const bank = this.state.bankAccounts.find(b => b.id === record.bankId) || this.state.bankAccounts[0];
    if (bank) {
      if (record.type === 'masuk') {
        bank.balance += record.amount;
      } else {
        bank.balance -= record.amount;
      }
    }

    this.state.cashRecords.unshift(newRecord);
    this.addAuditLog('Keuangan', record.type === 'masuk' ? 'KAS_MASUK' : 'KAS_KELUAR', `${newRecord.code}: ${record.description} sebesar Rp ${record.amount.toLocaleString('id-ID')}`);
    this.save();
  }

  public getJournalEntries(): JournalEntry[] {
    return this.state.journalEntries;
  }

  public addJournalEntry(date: string, refNo: string, description: string, debitAccount: string, debitAmount: number, creditAccount: string, creditAmount: number): void {
    const entry: JournalEntry = {
      id: `jrn-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      date,
      refNo,
      description,
      debitAccount,
      debitAmount,
      creditAccount,
      creditAmount
    };
    this.state.journalEntries.unshift(entry);
  }

  // 12. PENGATURAN & BACKUP
  public getCompanySettings(): CompanySettings {
    return this.state.companySettings;
  }

  public updateCompanySettings(settings: Partial<CompanySettings>): void {
    this.state.companySettings = { ...this.state.companySettings, ...settings };
    this.addAuditLog('Pengaturan', 'UPDATE_PROFIL', 'Memperbarui informasi profil perusahaan & dokumen');
    this.save();
  }

  public exportBackupJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && parsed.companySettings) {
        this.state = parsed;
        this.save();
        return true;
      }
    } catch (e) {
      console.error('Gagal import file backup:', e);
    }
    return false;
  }
}

export const store = new Store();

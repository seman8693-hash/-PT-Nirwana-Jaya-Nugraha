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
  MonthlySalesTrend,
  LicenseInfo
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
import {
  calculateDaysRemaining,
  addDaysToDate,
  generateLicenseKey
} from './utils/licenseUtils';

const STORAGE_KEY = 'njn_pos_erp_clean_work_v4';

export const INITIAL_LICENSE: LicenseInfo = {
  validUntil: '2026-10-10',
  licenseKey: 'NJN-ERP-2026-RR-9042',
  planType: 'Lisensi Operasional Kios & ERP Toko Resmi',
  licensedTo: 'TOKO NIRWANA JAYA NUGRAHA',
  ownerName: 'Rudi Ruhdiana',
  autoRenew: true,
  activationDate: '2026-01-01',
  lastExtendedDate: '2026-10-06',
  notes: 'Lisensi Resmi Toko Nirwana Jaya Nugraha'
};

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
  licenseInfo: LicenseInfo;
}

const DEFAULT_USERS: AppUser[] = [
  { id: 'usr-1', username: 'direktur', name: 'Rudi Ruhdiana', role: 'owner', pin: '1234', active: true },
  { id: 'usr-2', username: 'kasir1', name: 'Siti Rahmawati', role: 'kasir', pin: '1234', active: true },
  { id: 'usr-3', username: 'gudang1', name: 'Dedi Kurniawan', role: 'gudang', pin: '1234', active: true },
  { id: 'usr-4', username: 'keuangan1', name: 'Rina Marlina, S.E.', role: 'keuangan', pin: '1234', active: true },
  { id: 'usr-5', username: 'sales1', name: 'Fikri Ramadhan', role: 'sales', pin: '1234', active: true }
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
          bankAccounts: (Array.isArray(parsed.bankAccounts) && parsed.bankAccounts.length > 0)
            ? parsed.bankAccounts.map((b: any) => ({
                ...b,
                holderName: b.holderName ? b.holderName.replace(/PT\.?\s*NIRWANA JAYA NUGRAHA/gi, 'TOKO NIRWANA JAYA NUGRAHA').replace(/PT Nirwana Jaya Nugraha/gi, 'Toko Nirwana Jaya Nugraha') : b.holderName
              }))
            : JSON.parse(JSON.stringify(INITIAL_BANKS)),
          cashRecords: Array.isArray(parsed.cashRecords) ? parsed.cashRecords : [],
          journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
          users: (Array.isArray(parsed.users) && parsed.users.length > 0)
            ? parsed.users.map((u: AppUser) => {
                const isOwner = u.role === 'owner' || u.name.includes('Asep') || u.username === 'direktur' || u.username === 'owner';
                return {
                  ...u,
                  pin: u.pin || '1234',
                  name: isOwner ? 'Rudi Ruhdiana' : u.name,
                  username: isOwner ? (u.username || 'direktur') : u.username
                };
              })
            : DEFAULT_USERS,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [
            {
              id: 'log-init',
              timestamp: new Date().toISOString(),
              userName: 'System Admin',
              userRole: 'owner',
              action: 'DATABASE_BERSIH_DIMULAI',
              module: 'Core ERP',
              details: 'Sistem POS + ERP Toko Nirwana Jaya Nugraha siap digunakan secara operasional kerja bersih tanpa dummy data.'
            }
          ],
          companySettings: parsed.companySettings ? {
            ...parsed.companySettings,
            companyName: (parsed.companySettings.companyName || '').replace(/^PT\.?\s*/i, 'TOKO ').replace(/PT\.?\s*NIRWANA\s*JAYA\s*NUGRAHA/gi, 'TOKO NIRWANA JAYA NUGRAHA') || INITIAL_COMPANY_SETTINGS.companyName
          } : INITIAL_COMPANY_SETTINGS,
          targetAmount: typeof parsed.targetAmount === 'number' ? parsed.targetAmount : 0,
          currentUser: parsed.currentUser
            ? (parsed.currentUser.role === 'owner' || (parsed.currentUser.name && parsed.currentUser.name.includes('Asep'))
                ? { ...parsed.currentUser, name: 'Rudi Ruhdiana', pin: parsed.currentUser.pin || '1234' }
                : { ...parsed.currentUser, pin: parsed.currentUser.pin || '1234' })
            : DEFAULT_USERS[0],
          licenseInfo: (() => {
            const lic: LicenseInfo = parsed.licenseInfo ? {
              ...INITIAL_LICENSE,
              ...parsed.licenseInfo,
              licensedTo: (parsed.licenseInfo.licensedTo || 'TOKO NIRWANA JAYA NUGRAHA').replace(/^PT\.?\s*/i, 'TOKO ').replace(/PT\.?\s*NIRWANA\s*JAYA\s*NUGRAHA/gi, 'TOKO NIRWANA JAYA NUGRAHA'),
              ownerName: parsed.licenseInfo.ownerName && parsed.licenseInfo.ownerName.includes('Asep') ? 'Rudi Ruhdiana' : (parsed.licenseInfo.ownerName || 'Rudi Ruhdiana')
            } : JSON.parse(JSON.stringify(INITIAL_LICENSE));

            // Auto-Renew check: perpanjangan otomatis jika aktif dan hari habis
            if (lic.autoRenew && calculateDaysRemaining(lic.validUntil) <= 0) {
              lic.validUntil = addDaysToDate(lic.validUntil, 30);
              lic.lastExtendedDate = new Date().toISOString().split('T')[0];
            }
            return lic;
          })()
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
          details: 'Sistem POS + ERP Toko Nirwana Jaya Nugraha siap digunakan secara operasional kerja bersih tanpa dummy data.'
        }
      ],
      companySettings: INITIAL_COMPANY_SETTINGS,
      targetAmount: 0,
      currentUser: DEFAULT_USERS[0],
      licenseInfo: JSON.parse(JSON.stringify(INITIAL_LICENSE))
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
      currentUser: this.state?.currentUser || DEFAULT_USERS[0],
      licenseInfo: this.state?.licenseInfo || JSON.parse(JSON.stringify(INITIAL_LICENSE))
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
  }

  /** Snapshot state saat ini - dipakai lapisan sinkronisasi (api/sync.ts). */
  public getState(): AppState {
    return this.state;
  }

  /**
   * Terapkan data hasil hydrate dari server ke state lokal lalu simpan.
   * Koleksi yang tidak disebut dalam partial tetap dipertahankan.
   */
  public hydrateState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial };
    this.save();
  }

  /**
   * Sakelar auto-sync (legacy API dari LoginGate).
   * Versi ini hanya membaca data server sekali saat login (hydrate),
   * jadi sakelar ini dipertahankan sebagai no-op agar kompatibel.
   */
  public setSyncEnabled(_enabled: boolean): void {
    /* tidak ada auto-sync - flush manual lewat api/sync.ts bila diperlukan */
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => fn());
  }

  private syncEnabled: boolean = false;

  public isSyncEnabled(): boolean {
    return this.syncEnabled;
  }

  // AUDIT LOG
  public addAuditLog(
    module: string,
    action: string,
    details: string,
    extra?: {
      entityType?: string;
      entityId?: string;
      oldStatus?: string;
      newStatus?: string;
      oldValue?: string;
      newValue?: string;
      ipAddress?: string;
      device?: string;
    }
  ): void {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userName: this.state.currentUser.name,
      userRole: this.state.currentUser.role,
      module,
      action,
      details,
      entityType: extra?.entityType,
      entityId: extra?.entityId,
      oldStatus: extra?.oldStatus,
      newStatus: extra?.newStatus,
      oldValue: extra?.oldValue,
      newValue: extra?.newValue,
      ipAddress: extra?.ipAddress || '192.168.1.10 (Local ERP)',
      device: extra?.device || (typeof navigator !== 'undefined' ? `${navigator.platform} - Browser Desktop` : 'Workstation NJN')
    };
    this.state.auditLogs = [log, ...this.state.auditLogs].slice(0, 1000);
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  public clearAuditLogs(): void {
    const prevCount = this.state.auditLogs.length;
    this.state.auditLogs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userName: this.state.currentUser.name,
        userRole: this.state.currentUser.role,
        action: 'HAPUS_LOG',
        module: 'Log Aktivitas',
        details: `Membersihkan ${prevCount} catatan riwayat log audit lama oleh ${this.state.currentUser.name}`,
        entityType: 'DATABASE'
      }
    ];
    this.save();
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

  public addUser(user: Omit<AppUser, 'id'> & { pin?: string }): AppUser {
    const newUser: AppUser = {
      ...user,
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      pin: user.pin || '1234',
      active: user.active ?? true
    };
    this.state.users.push(newUser);
    this.addAuditLog('User & Akses', 'TAMBAH_USER', `Menambahkan pengguna baru: ${user.name} (${user.username}) sebagai ${user.role}`);
    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<AppUser>): void {
    const index = this.state.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.state.users[index] = { ...this.state.users[index], ...updates };
      this.addAuditLog('User & Akses', 'UBAH_USER', `Memperbarui akun pengguna: ${this.state.users[index].name}`);
      this.save();
    }
  }

  public deleteUser(id: string): void {
    if (this.state.users.length <= 1) return; // Prevent deleting last user
    const user = this.state.users.find(u => u.id === id);
    if (user) {
      this.state.users = this.state.users.filter(u => u.id !== id);
      this.addAuditLog('User & Akses', 'HAPUS_USER', `Menghapus akun: ${user.name} (${user.username})`);
      this.save();
    }
  }

  public generateAutoUser(role: AppUser['role'], customName?: string): AppUser {
    const roleLabels: Record<AppUser['role'], { prefix: string; defaultName: string }> = {
      owner: { prefix: 'direktur', defaultName: 'Rudi Ruhdiana' },
      kasir: { prefix: 'kasir', defaultName: 'Kasir Standar' },
      gudang: { prefix: 'gudang', defaultName: 'Staf Gudang' },
      keuangan: { prefix: 'keuangan', defaultName: 'Staf Keuangan' },
      sales: { prefix: 'sales', defaultName: 'Sales Eksekutif' }
    };
    const config = roleLabels[role] || { prefix: 'user', defaultName: 'Staf Operasional' };
    const randNum = Math.floor(100 + Math.random() * 900);
    const username = `${config.prefix}_${randNum}`;
    const name = customName || `${config.defaultName} #${randNum}`;
    const pin = String(Math.floor(1000 + Math.random() * 9000)); // 4 digit pin acak

    return this.addUser({
      username,
      name,
      role,
      pin,
      active: true
    });
  }

  // 13. LISENSI & MASA BERLAKU SISTEM OPERASIONAL (MANUAL, OTOMATIS & TAMBAHKAN)
  public getLicenseInfo(): LicenseInfo {
    return this.state.licenseInfo;
  }

  public updateLicenseInfo(updates: Partial<LicenseInfo>): void {
    this.state.licenseInfo = {
      ...this.state.licenseInfo,
      ...updates
    };
    this.addAuditLog('Lisensi & Sistem', 'UPDATE_LISENSI', `Pembaruan lisensi operasional Toko Nirwana Jaya Nugraha`);
    this.save();
  }

  public addLicenseDays(days: number, reason: string = 'Perpanjangan Masa Aktif'): void {
    const currentValidUntil = this.state.licenseInfo.validUntil || '2026-10-10';
    const newDate = addDaysToDate(currentValidUntil, days);
    this.state.licenseInfo = {
      ...this.state.licenseInfo,
      validUntil: newDate,
      lastExtendedDate: new Date().toISOString().split('T')[0]
    };
    this.addAuditLog(
      'Lisensi & Sistem',
      'TAMBAH_MASA_AKTIF',
      `Menambahkan masa berlaku +${days} hari (s.d. ${newDate}). Alasan: ${reason}`
    );
    this.save();
  }

  public setLicenseExpiryDate(newDate: string, reason: string = 'Pengaturan Tanggal Manual'): void {
    this.state.licenseInfo = {
      ...this.state.licenseInfo,
      validUntil: newDate,
      lastExtendedDate: new Date().toISOString().split('T')[0]
    };
    this.addAuditLog(
      'Lisensi & Sistem',
      'SET_TANGGAL_MANUAL',
      `Masa berlaku diatur manual ke: ${newDate}. Alasan: ${reason}`
    );
    this.save();
  }

  public generateAutoLicense(daysToAdd: number = 365): LicenseInfo {
    const newKey = generateLicenseKey('RR');
    const newDate = addDaysToDate(this.state.licenseInfo.validUntil || '2026-10-10', daysToAdd);
    this.state.licenseInfo = {
      ...this.state.licenseInfo,
      licenseKey: newKey,
      validUntil: newDate,
      lastExtendedDate: new Date().toISOString().split('T')[0],
      activationDate: new Date().toISOString().split('T')[0]
    };
    this.addAuditLog(
      'Lisensi & Sistem',
      'GENERATE_LISENSI_OTOMATIS',
      `Lisensi baru otomatis dibuat: ${newKey} (+${daysToAdd} hari s.d. ${newDate})`
    );
    this.save();
    return this.state.licenseInfo;
  }

  public toggleAutoRenew(): boolean {
    const current = !!this.state.licenseInfo.autoRenew;
    this.state.licenseInfo.autoRenew = !current;
    this.addAuditLog(
      'Lisensi & Sistem',
      'TOGGLE_AUTO_RENEW',
      `Perpanjangan otomatis diubah menjadi: ${!current ? 'AKTIF' : 'NONAKTIF'}`
    );
    this.save();
    return this.state.licenseInfo.autoRenew;
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

  public deleteCustomer(id: string): boolean {
    const cust = this.state.customers.find(c => c.id === id);
    if (!cust) return false;
    this.state.customers = this.state.customers.filter(c => c.id !== id);
    this.addAuditLog(
      'Master Data',
      'HAPUS_CUSTOMER',
      `Menghapus data rekanan/customer: ${cust.name} (${cust.code})`,
      {
        entityType: 'CUSTOMER',
        entityId: cust.code,
        oldValue: `${cust.name} - ${cust.code}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
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

  public deleteSupplier(id: string): boolean {
    const sup = this.state.suppliers.find(s => s.id === id);
    if (!sup) return false;
    this.state.suppliers = this.state.suppliers.filter(s => s.id !== id);
    this.addAuditLog(
      'Master Data',
      'HAPUS_SUPPLIER',
      `Menghapus data supplier: ${sup.name} (${sup.code})`,
      {
        entityType: 'SUPPLIER',
        entityId: sup.code,
        oldValue: `${sup.name} - ${sup.code}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): void {
    const idx = this.state.suppliers.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.state.suppliers[idx] = { ...this.state.suppliers[idx], ...updates };
      this.addAuditLog('Master Data', 'EDIT_SUPPLIER', `Mengubah data supplier: ${this.state.suppliers[idx].name} (${this.state.suppliers[idx].code})`);
      this.save();
    }
  }

  // 2. MASTER DATA: SATUAN
  public getUnits(): UnitMaster[] {
    return this.state.units;
  }

  public addUnit(name: string, code: string): void {
    this.state.units.push({ id: `u-${Date.now()}`, name, code });
    this.save();
  }

  public updateUnit(id: string, updates: Partial<UnitMaster>): void {
    const idx = this.state.units.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.state.units[idx] = { ...this.state.units[idx], ...updates };
      this.save();
    }
  }

  public deleteUnit(id: string): boolean {
    const unit = this.state.units.find(u => u.id === id);
    if (!unit) return false;
    this.state.units = this.state.units.filter(u => u.id !== id);
    this.save();
    return true;
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

  public deletePosTransaction(id: string): boolean {
    const sale = this.state.posTransactions.find(s => s.id === id);
    if (!sale) return false;

    // Kembalikan stok barang yang terjual
    sale.items.forEach(it => {
      this.adjustStock(it.productId, it.qty, `Pembatalan/Hapus Transaksi Kasir ${sale.invoiceNumber}`, sale.invoiceNumber);
    });

    // Hapus dari riwayat POS
    this.state.posTransactions = this.state.posTransactions.filter(s => s.id !== id);

    // Hapus catatan kas masuk terkait
    this.state.cashRecords = this.state.cashRecords.filter(c => c.referenceDocument !== sale.invoiceNumber);

    this.addAuditLog(
      'Kasir POS',
      'HAPUS_DOKUMEN',
      `Menghapus transaksi kasir ${sale.invoiceNumber} (${sale.customerName}) senilai Rp ${sale.total.toLocaleString('id-ID')}`,
      {
        entityType: 'POS_TRANSACTION',
        entityId: sale.invoiceNumber,
        oldValue: `${sale.invoiceNumber} - Rp ${sale.total}`,
        newValue: 'Dihapus & Stok Dikembalikan'
      }
    );
    this.save();
    return true;
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

  public deletePurchaseOrder(poId: string): boolean {
    const po = this.state.purchaseOrders.find(p => p.id === poId);
    if (!po) return false;
    this.state.purchaseOrders = this.state.purchaseOrders.filter(p => p.id !== poId);
    this.addAuditLog(
      'Pembelian',
      'HAPUS_DOKUMEN',
      `Menghapus Purchase Order ${po.poNumber} (${po.supplierName})`,
      {
        entityType: 'PO',
        entityId: po.poNumber,
        oldValue: `${po.poNumber} - ${po.supplierName}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updatePurchaseOrder(poId: string, updates: Partial<PurchaseOrder>): PurchaseOrder | null {
    const idx = this.state.purchaseOrders.findIndex(p => p.id === poId);
    if (idx === -1) return null;
    this.state.purchaseOrders[idx] = { ...this.state.purchaseOrders[idx], ...updates };
    this.addAuditLog('Pembelian', 'EDIT_PO', `Memperbarui Purchase Order ${this.state.purchaseOrders[idx].poNumber} (${this.state.purchaseOrders[idx].supplierName})`);
    this.save();
    return this.state.purchaseOrders[idx];
  }

  public getPurchaseInvoices(): PurchaseInvoice[] {
    return this.state.purchaseInvoices;
  }

  public deletePurchaseInvoice(id: string): boolean {
    const inv = this.state.purchaseInvoices.find(p => p.id === id);
    if (!inv) return false;
    this.state.purchaseInvoices = this.state.purchaseInvoices.filter(p => p.id !== id);
    this.addAuditLog('Pembelian', 'HAPUS_NOTA', `Menghapus Faktur/Nota Pembelian ${inv.invoiceNumber} (${inv.supplierName})`);
    this.save();
    return true;
  }

  public updatePurchaseInvoice(id: string, updates: Partial<PurchaseInvoice>): PurchaseInvoice | null {
    const idx = this.state.purchaseInvoices.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.state.purchaseInvoices[idx] = { ...this.state.purchaseInvoices[idx], ...updates };
    this.addAuditLog('Pembelian', 'EDIT_NOTA', `Memperbarui Nota Pembelian ${this.state.purchaseInvoices[idx].invoiceNumber}`);
    this.save();
    return this.state.purchaseInvoices[idx];
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
    this.addAuditLog('Penjualan', 'BUAT_SPH', `Membuat Penawaran Harga ${code} untuk ${newSph.customerName}`, {
      entityType: 'SPH',
      entityId: code,
      newStatus: 'Menunggu PO / Persetujuan',
      newValue: `Rp ${newSph.totalAmount.toLocaleString('id-ID')}`
    });
    this.save();
    return newSph;
  }

  public deleteSPH(sphId: string): boolean {
    const sph = this.state.sphQuotations.find(s => s.id === sphId);
    if (!sph) return false;
    this.state.sphQuotations = this.state.sphQuotations.filter(s => s.id !== sphId);
    this.addAuditLog(
      'Penjualan (SPH)',
      'HAPUS_DOKUMEN',
      `Menghapus dokumen SPH ${sph.code} (Rekanan: ${sph.customerName}, Proyek: ${sph.projectTitle}, Nilai: Rp ${sph.totalAmount.toLocaleString('id-ID')})`,
      {
        entityType: 'SPH',
        entityId: sph.code,
        oldValue: `${sph.code} - ${sph.customerName} - Rp ${sph.totalAmount.toLocaleString('id-ID')}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updateSPHStatus(
    sphId: string,
    status: 'draft' | 'waiting_po' | 'approved' | 'rejected' | 'converted_invoice',
    statusLabel?: string,
    notes?: string
  ): SPHQuotation | null {
    const sph = this.state.sphQuotations.find(s => s.id === sphId);
    if (!sph) return null;
    const oldStatusLabel = sph.statusLabel || sph.status;
    sph.status = status;
    if (statusLabel) {
      sph.statusLabel = statusLabel;
    } else {
      if (status === 'approved') sph.statusLabel = 'Disetujui Owner (Rudi Ruhdiana) - Siap PO';
      else if (status === 'rejected') sph.statusLabel = 'Ditolak / Dibatalkan';
      else if (status === 'waiting_po') sph.statusLabel = 'Menunggu PO / Persetujuan';
      else if (status === 'converted_invoice') sph.statusLabel = 'Dikonversi ke SO / Invoice';
    }
    this.addAuditLog(
      'Penjualan (SPH)',
      'PERUBAHAN_STATUS',
      `Status SPH ${sph.code} (${sph.customerName}) diubah dari [${oldStatusLabel}] menjadi [${sph.statusLabel}]. ${notes || ''}`,
      {
        entityType: 'SPH',
        entityId: sph.code,
        oldStatus: oldStatusLabel,
        newStatus: sph.statusLabel
      }
    );
    this.save();
    return sph;
  }

  public updateSPH(sphId: string, updates: Partial<SPHQuotation>): SPHQuotation | null {
    const idx = this.state.sphQuotations.findIndex(s => s.id === sphId);
    if (idx === -1) return null;
    this.state.sphQuotations[idx] = { ...this.state.sphQuotations[idx], ...updates };
    this.addAuditLog('Penjualan (SPH)', 'EDIT_SPH', `Memperbarui dokumen SPH ${this.state.sphQuotations[idx].code} (${this.state.sphQuotations[idx].customerName})`);
    this.save();
    return this.state.sphQuotations[idx];
  }

  public deleteSalesOrder(soId: string): boolean {
    const so = this.state.salesOrders.find(s => s.id === soId);
    if (!so) return false;
    this.state.salesOrders = this.state.salesOrders.filter(s => s.id !== soId);
    this.addAuditLog(
      'Penjualan (SO)',
      'HAPUS_DOKUMEN',
      `Menghapus Sales Order ${so.soNumber} (${so.customerName}) senilai Rp ${so.totalAmount.toLocaleString('id-ID')}`,
      {
        entityType: 'SO',
        entityId: so.soNumber,
        oldValue: `${so.soNumber} - ${so.customerName}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updateSalesOrder(soId: string, updates: Partial<SalesOrder>): SalesOrder | null {
    const idx = this.state.salesOrders.findIndex(s => s.id === soId);
    if (idx === -1) return null;
    this.state.salesOrders[idx] = { ...this.state.salesOrders[idx], ...updates };
    this.addAuditLog('Penjualan (SO)', 'EDIT_SO', `Memperbarui Sales Order ${this.state.salesOrders[idx].soNumber} (${this.state.salesOrders[idx].customerName})`);
    this.save();
    return this.state.salesOrders[idx];
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

  public deleteSalesInvoice(id: string): boolean {
    const inv = this.state.salesInvoices.find(i => i.id === id);
    if (!inv) return false;
    this.state.salesInvoices = this.state.salesInvoices.filter(i => i.id !== id);
    this.addAuditLog(
      'Penjualan',
      'HAPUS_DOKUMEN',
      `Menghapus Faktur Tagihan ${inv.invoiceNumber} (${inv.customerName}) senilai Rp ${inv.totalAmount.toLocaleString('id-ID')}`,
      {
        entityType: 'FAKTUR',
        entityId: inv.invoiceNumber,
        oldValue: `${inv.invoiceNumber} - ${inv.customerName}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
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

  public deleteSPK(id: string): boolean {
    const spk = this.state.spkContracts.find(s => s.id === id);
    if (!spk) return false;
    this.state.spkContracts = this.state.spkContracts.filter(s => s.id !== id);
    this.addAuditLog(
      'SPK Operasional',
      'HAPUS_DOKUMEN',
      `Menghapus SPK Proyek ${spk.code} (${spk.partnerName})`,
      {
        entityType: 'SPK',
        entityId: spk.code,
        oldValue: `${spk.code} - ${spk.partnerName}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updateSPK(id: string, updates: Partial<PKSContract>): PKSContract | null {
    const idx = this.state.spkContracts.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.state.spkContracts[idx] = { ...this.state.spkContracts[idx], ...updates };
    this.addAuditLog('SPK Operasional', 'EDIT_SPK', `Memperbarui dokumen SPK ${this.state.spkContracts[idx].code} (${this.state.spkContracts[idx].partnerName})`);
    this.save();
    return this.state.spkContracts[idx];
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

  public deleteDeliveryOrder(id: string): boolean {
    const d = this.state.deliveryOrders.find(item => item.id === id);
    if (!d) return false;
    this.state.deliveryOrders = this.state.deliveryOrders.filter(item => item.id !== id);
    this.addAuditLog(
      'Pengiriman',
      'HAPUS_DOKUMEN',
      `Menghapus Surat Jalan / DO ${d.doNumber} (${d.customerName})`,
      {
        entityType: 'DO',
        entityId: d.doNumber,
        oldValue: `${d.doNumber} - ${d.customerName}`,
        newValue: 'Dihapus Permanen'
      }
    );
    this.save();
    return true;
  }

  public updateDeliveryOrder(id: string, updates: Partial<DeliveryOrder>): DeliveryOrder | null {
    const idx = this.state.deliveryOrders.findIndex(d => d.id === id);
    if (idx === -1) return null;
    this.state.deliveryOrders[idx] = { ...this.state.deliveryOrders[idx], ...updates };
    this.addAuditLog('Pengiriman', 'EDIT_DO', `Memperbarui Surat Jalan / DO ${this.state.deliveryOrders[idx].doNumber} (${this.state.deliveryOrders[idx].customerName})`);
    this.save();
    return this.state.deliveryOrders[idx];
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

  public updateBankAccount(id: string, updates: Partial<BankAccount>): void {
    const idx = this.state.bankAccounts.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.state.bankAccounts[idx] = { ...this.state.bankAccounts[idx], ...updates };
      this.save();
    }
  }

  public deleteBankAccount(id: string): boolean {
    const b = this.state.bankAccounts.find(item => item.id === id);
    if (!b) return false;
    this.state.bankAccounts = this.state.bankAccounts.filter(item => item.id !== id);
    this.save();
    return true;
  }

  public getCashRecords(): CashTransaction[] {
    return this.state.cashRecords;
  }

  public deleteCashRecord(id: string): boolean {
    const rec = this.state.cashRecords.find(c => c.id === id);
    if (!rec) return false;
    this.state.cashRecords = this.state.cashRecords.filter(c => c.id !== id);
    this.addAuditLog('Keuangan', 'HAPUS_KAS', `Menghapus transaksi arus kas ${rec.code}: ${rec.description}`);
    this.save();
    return true;
  }

  public updateCashRecord(id: string, updates: Partial<CashTransaction>): void {
    const idx = this.state.cashRecords.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.state.cashRecords[idx] = { ...this.state.cashRecords[idx], ...updates };
      this.addAuditLog('Keuangan', 'EDIT_KAS', `Memperbarui transaksi arus kas ${this.state.cashRecords[idx].code}`);
      this.save();
    }
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

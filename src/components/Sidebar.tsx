import React from 'react';
import {
  LayoutDashboard,
  Database,
  Boxes,
  ShoppingCart,
  ShoppingBag,
  TrendingUp,
  Wrench,
  Truck,
  Wallet,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  X,
  LogOut,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { store } from '../store';
import { NjnLogo } from './NjnLogo';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onLogout
}) => {
  const kpi = store.getOverallKPI();
  const currentUser = store.getCurrentUser();
  const settings = store.getCompanySettings();

  const menuItems = [
    {
      id: 'dashboard',
      num: '1',
      label: 'Dashboard',
      sublabel: 'KPI & Analisis',
      icon: LayoutDashboard,
      badge: kpi.totalItemKritis > 0 ? `${kpi.totalItemKritis} Alert` : undefined,
      badgeColor: 'bg-rose-500 text-white animate-pulse'
    },
    {
      id: 'master-data',
      num: '2',
      label: 'Master Data',
      sublabel: 'Barang, Customer, Supplier',
      icon: Database,
      badge: `${store.getProducts().length} SKU`,
      badgeColor: 'bg-slate-700 text-slate-300'
    },
    {
      id: 'inventory',
      num: '3',
      label: 'Inventory / Stok',
      sublabel: 'Mutasi, Restok & Opname',
      icon: Boxes,
      badge: kpi.totalItemKritis > 0 ? `${kpi.totalItemKritis} Restok` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300'
    },
    {
      id: 'pos',
      num: '4',
      label: 'Kasir / POS',
      sublabel: 'Transaksi, Barcode & Struk',
      icon: ShoppingCart,
      badge: 'Kasir',
      badgeColor: 'bg-emerald-500/20 text-emerald-300'
    },
    {
      id: 'pembelian',
      num: '5',
      label: 'Pembelian',
      sublabel: 'PO, Penerimaan & Hutang',
      icon: ShoppingBag,
      badge: store.getPurchaseOrders().length > 0 ? `${store.getPurchaseOrders().length} PO` : undefined,
      badgeColor: 'bg-indigo-500/20 text-indigo-300'
    },
    {
      id: 'penjualan',
      num: '6',
      label: 'Penjualan',
      sublabel: 'SPH, SO, Invoice & Piutang',
      icon: TrendingUp,
      badge: store.getSPHList().length > 0 ? `${store.getSPHList().length} SPH` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300'
    },
    {
      id: 'spk',
      num: '7',
      label: 'SPK / Operasional',
      sublabel: 'Pekerjaan, PIC & Jadwal',
      icon: Wrench,
      badge: store.getSPKList().length > 0 ? `${store.getSPKList().length} SPK` : undefined,
      badgeColor: 'bg-cyan-500/20 text-cyan-300'
    },
    {
      id: 'pengiriman',
      num: '8',
      label: 'Pengiriman',
      sublabel: 'DO, Surat Jalan & Tracking',
      icon: Truck,
      badge: kpi.pengirimanBerjalan > 0 ? `${kpi.pengirimanBerjalan} Jalan` : undefined,
      badgeColor: 'bg-purple-500/20 text-purple-300'
    },
    {
      id: 'keuangan',
      num: '9',
      label: 'Keuangan',
      sublabel: 'Kas, Bank, Jurnal & Laba Rugi',
      icon: Wallet,
      badge: 'Buku Kas',
      badgeColor: 'bg-teal-500/20 text-teal-300'
    },
    {
      id: 'laporan',
      num: '10',
      label: 'Laporan',
      sublabel: 'Penjualan, Stok, Arus Kas',
      icon: FileSpreadsheet,
      badge: 'Export',
      badgeColor: 'bg-slate-700 text-slate-300'
    },
    {
      id: 'user-akses',
      num: '11',
      label: 'User & Hak Akses',
      sublabel: 'Role, Permission, Audit Log',
      icon: ShieldCheck,
      badge: currentUser.role.toUpperCase(),
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
    },
    {
      id: 'pengaturan',
      num: '12',
      label: 'Pengaturan',
      sublabel: 'Profil, Pajak, Printer & Backup',
      icon: Settings,
      badge: 'Sistem',
      badgeColor: 'bg-slate-800 text-slate-400'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 bg-slate-900 text-slate-200 z-50 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header with Official NJN Gold Logo */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <NjnLogo variant="horizontal" size="md" />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Active Pill */}
        <div className="mx-3 mt-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-amber-400 uppercase">
              {currentUser.name.substring(0, 2)}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{currentUser.role}</p>
            </div>
          </div>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" title="Online" />
        </div>

        {/* Navigation 12 Modules */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1 custom-scrollbar">
          <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            STRUKTUR UTAMA ERP
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${
                      isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.num}
                  </div>
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <div className="truncate">
                    <div className="text-xs font-bold truncate leading-tight">{item.label}</div>
                    <div
                      className={`text-[10px] truncate leading-none mt-0.5 ${
                        isActive ? 'text-slate-900/80' : 'text-slate-400'
                      }`}
                    >
                      {item.sublabel}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1 ${
                      isActive ? 'bg-slate-950 text-amber-400' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          <div className="text-[11px] text-slate-400 px-2 flex justify-between items-center">
            <span className="truncate">{settings.companyName}</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-mono">v3.0 Real</span>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Ganti Akun / Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

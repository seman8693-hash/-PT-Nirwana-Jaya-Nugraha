import React, { useState } from 'react';
import { Menu, ShoppingCart, Plus, Bell, ShieldCheck, User, Clock } from 'lucide-react';
import { store } from '../store';
import { NjnLogo } from './NjnLogo';
import { LicenseModal } from './LicenseModal';
import { calculateDaysRemaining, formatDaysRemainingText } from '../utils/licenseUtils';

interface TopNavProps {
  onToggleMobileMenu: () => void;
  onOpenPos: () => void;
  onOpenCreateSph: () => void;
  onOpenNotifications?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileMenu,
  onOpenPos,
  onOpenCreateSph,
  onSelectTab
}) => {
  const currentUser = store.getCurrentUser();
  const kpi = store.getOverallKPI();
  const license = store.getLicenseInfo();
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  const daysRemaining = calculateDaysRemaining(license.validUntil);
  const statusInfo = formatDaysRemainingText(daysRemaining);

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 px-4 md:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-lg z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          type="button"
          className="lg:hidden p-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Official NJN Logo */}
        <div className="flex items-center gap-3">
          <NjnLogo variant="icon" size="sm" />
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif">
                NJN
              </span>
              <span className="text-[10px] font-bold text-slate-300">
                {store.getCompanySettings().companyName || 'TOKO NIRWANA JAYA NUGRAHA'}
              </span>
              <span className="inline-flex px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-500/40">
                ENTERPRISE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Distributor Kabel Supreme • Komponen MCB • Fabrikasi Panel Listrik
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* License Status Quick Pill */}
        <button
          onClick={() => setIsLicenseModalOpen(true)}
          type="button"
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          title="Kelola & Tambah Masa Berlaku (Manual / Otomatis)"
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold">
            Berlaku: s.d. {license.validUntil}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusInfo.badgeClass}`}>
            {statusInfo.text}
          </span>
        </button>

        {/* Alert indicator */}
        {kpi.totalItemKritis > 0 && (
          <button
            onClick={() => onSelectTab?.('inventory')}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold animate-pulse"
          >
            <span>{kpi.totalItemKritis} Restok Kritis</span>
          </button>
        )}

        {/* User Badge */}
        <div
          onClick={() => onSelectTab?.('user-akses')}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs cursor-pointer hover:border-slate-700"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
            {currentUser.name.substring(0, 1)}
          </div>
          <span className="font-bold text-slate-200">{currentUser.name}</span>
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-mono">
            {currentUser.role}
          </span>
        </div>

        {/* Kasir POS Quick Action */}
        <button
          onClick={onOpenPos}
          type="button"
          className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shadow-md transition inline-flex items-center gap-1.5"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Kasir POS</span>
        </button>

        {/* Buat SPH Quick Action */}
        <button
          onClick={onOpenCreateSph}
          type="button"
          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md cursor-pointer transition inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ Buat SPH</span>
          <span className="sm:hidden">+ SPH</span>
        </button>
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
    </header>
  );
};


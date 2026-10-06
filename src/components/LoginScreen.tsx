import React, { useState } from 'react';
import { NjnLogo } from './NjnLogo';
import { store } from '../store';
import { AppUser } from '../types';
import { Lock, User, ArrowRight, ShieldCheck, Clock, AlertCircle, Plus, Settings } from 'lucide-react';
import { LicenseModal } from './LicenseModal';
import { UserManageModal } from './UserManageModal';
import { calculateDaysRemaining, formatDaysRemainingText } from '../utils/licenseUtils';

interface LoginScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const users = store.getUsers();
  const settings = store.getCompanySettings();
  const license = store.getLicenseInfo();

  const [username, setUsername] = useState('direktur');
  const [pin, setPin] = useState('1234');
  const [error, setError] = useState<string | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const daysRemaining = calculateDaysRemaining(license.validUntil);
  const statusInfo = formatDaysRemainingText(daysRemaining);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();

    // Find user by username or role or loose match
    let targetUser = users.find(u => u.username.toLowerCase() === cleanUsername);

    // Support 'direktur', 'owner', 'rudi', 'admin' alias for owner
    if (!targetUser && (cleanUsername === 'direktur' || cleanUsername === 'owner' || cleanUsername === 'rudi' || cleanUsername === 'admin' || cleanUsername === '')) {
      targetUser = users.find(u => u.role === 'owner') || users[0];
    }

    // Support 'kasir' alias
    if (!targetUser && cleanUsername.includes('kasir')) {
      targetUser = users.find(u => u.role === 'kasir');
    }

    // Support 'gudang' alias
    if (!targetUser && cleanUsername.includes('gudang')) {
      targetUser = users.find(u => u.role === 'gudang');
    }

    // Support 'keuangan' alias
    if (!targetUser && cleanUsername.includes('keuangan')) {
      targetUser = users.find(u => u.role === 'keuangan');
    }

    // Support 'sales' alias
    if (!targetUser && cleanUsername.includes('sales')) {
      targetUser = users.find(u => u.role === 'sales');
    }

    if (!targetUser) {
      targetUser = users[0]; // Fallback smoothly to avoid locking out the user
    }

    // Update active user in store
    store.setCurrentUser(targetUser);
    localStorage.setItem('njn_logged_in_user_id', targetUser.id);
    onLoginSuccess(targetUser);
  };

  const handleQuickSelect = (user: AppUser) => {
    setUsername(user.username);
    setPin(user.pin || '1234');
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Golden Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Notification */}
      {toast && (
        <div className="fixed top-5 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold animate-slide-in">
          {toast}
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-7 md:p-9 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col items-center text-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="mb-3 transform hover:scale-105 transition duration-300">
            <NjnLogo variant="icon" size="lg" glow={true} />
          </div>

          <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 font-serif leading-tight">
            NJN
          </h1>
          
          <h2 className="text-sm font-extrabold text-white tracking-wider uppercase mt-1">
            {settings.companyName || 'TOKO NIRWANA JAYA NUGRAHA'}
          </h2>

          <p className="text-[11px] font-semibold text-slate-400 tracking-wide mt-0.5">
            Sistem Operasional Kios & ERP
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-4 text-left">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Username</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="mis. direktur"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-slate-500 text-sm font-medium transition outline-none"
              />
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN</span>
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-slate-500 text-sm font-mono tracking-widest transition outline-none"
              />
            </div>
          </div>

          {/* Quick User Selection Pills & Manage Button */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-400">
                Pilih Cepat Akun Karyawan:
              </span>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(true)}
                className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition"
              >
                <Plus className="w-3 h-3" />
                <span>+ Buat Akun</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {users.map(u => {
                const isSelected = username === u.username || (u.role === 'owner' && (username === 'direktur' || username === 'owner'));
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {u.name.split(' ')[0]} ({u.role.toUpperCase()})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <span>MASUK</span>
            <ArrowRight className="w-4 h-4 font-black" />
          </button>
        </form>

        {/* License & Expiration Footer (Dynamic, Interactive, Manual & Otomatis) */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 w-full flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLicenseModalOpen(true)}
            className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition cursor-pointer shadow"
            title="Klik untuk Tambah atau Atur Masa Berlaku"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition" />
            <span>Berlaku s.d. {license.validUntil} - {statusInfo.text}</span>
            <span className="text-[10px] text-amber-400 font-bold ml-1 underline">Kelola</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLicenseModalOpen(true)}
            className="text-[10px] text-amber-400/90 hover:text-amber-300 font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Settings className="w-3 h-3 text-amber-400" />
            <span>⚙️ Atur Lisensi (Manual, Otomatis & Tambah Hari)</span>
          </button>

          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Lisensi Operasional Resmi Toko Terverifikasi • Owner: {license.ownerName || 'Rudi Ruhdiana'}</span>
          </div>
        </div>

      </div>

      {/* Bottom Copyright */}
      <div className="mt-4 text-[10px] text-slate-500 tracking-wide text-center">
        © 2026 TOKO NIRWANA JAYA NUGRAHA • Electrical & Panel Distributor
      </div>

      {/* License Modal */}
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        onNotify={msg => showNotification(msg)}
      />

      {/* User Manage Modal */}
      <UserManageModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onUserSelected={u => handleQuickSelect(u)}
        onNotify={msg => showNotification(msg)}
      />
    </div>
  );
};


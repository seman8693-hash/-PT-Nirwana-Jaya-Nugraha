import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Sparkles,
  KeyRound,
  Shield,
  Trash2,
  CheckCircle2,
  X,
  UserCheck
} from 'lucide-react';
import { store } from '../store';
import { AppUser } from '../types';

interface UserManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelected?: (user: AppUser) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const UserManageModal: React.FC<UserManageModalProps> = ({
  isOpen,
  onClose,
  onUserSelected,
  onNotify
}) => {
  if (!isOpen) return null;

  const users = store.getUsers();

  const [activeTab, setActiveTab] = useState<'manual' | 'otomatis' | 'list'>('manual');
  
  // Manual form
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppUser['role']>('kasir');
  const [pin, setPin] = useState('1234');

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) return;

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Check if username already exists
    const exists = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      onNotify?.(`Username "${cleanUsername}" sudah digunakan! Silakan gunakan username lain.`, 'error');
      return;
    }

    const newUser = store.addUser({
      username: cleanUsername,
      name: name.trim(),
      role,
      pin: pin.trim() || '1234',
      active: true
    });

    onNotify?.(`Pengguna "${newUser.name}" (@${newUser.username}) berhasil ditambahkan!`, 'success');
    setUsername('');
    setName('');
    setPin('1234');
    setActiveTab('list');

    if (onUserSelected) {
      onUserSelected(newUser);
    }
  };

  const handleAutoCreate = (selectedRole: AppUser['role'], customLabel?: string) => {
    const newUser = store.generateAutoUser(selectedRole, customLabel);
    onNotify?.(`Akun otomatis dibuat: ${newUser.name} (Username: ${newUser.username}, PIN: ${newUser.pin})!`, 'success');
    setActiveTab('list');
    if (onUserSelected) {
      onUserSelected(newUser);
    }
  };

  const handleDeleteUser = (id: string, userName: string) => {
    if (users.length <= 1) {
      onNotify?.('Tidak dapat menghapus user terakhir dalam sistem!', 'error');
      return;
    }
    if (confirm(`Yakin ingin menghapus akun ${userName}?`)) {
      store.deleteUser(id);
      onNotify?.(`Akun ${userName} berhasil dihapus.`, 'success');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-auto">
        
        {/* Header Ribbon */}
        <div className="bg-slate-950 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Kelola & Tambah Akun Pengguna
              </h3>
              <p className="text-[11px] text-slate-400">
                Bisa <b>Manual Buat</b>, <b>Otomatis Generate</b>, dan <b>Tambahkan Pengguna Baru</b> ke sistem.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-amber-500 text-amber-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>1. Manual Buat User</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('otomatis')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'otomatis'
                ? 'border-amber-500 text-amber-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Otomatis Buat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-600 bg-white rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>3. Daftar Akun ({users.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 bg-white min-h-[250px]">
          {/* TAB 1: MANUAL BUAT */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualCreate} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username (Login ID)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="mis. direktur / kasir2"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Gunakan huruf kecil tanpa spasi
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="mis. Rudi Ruhdiana / Budi"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role / Wewenang
                  </label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as AppUser['role'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    <option value="owner">Owner / Direktur (Akses Penuh)</option>
                    <option value="kasir">Kasir Toko (POS & Kas)</option>
                    <option value="gudang">Gudang (Stok & DO)</option>
                    <option value="keuangan">Keuangan (Akuntansi & Faktur)</option>
                    <option value="sales">Sales (SPH, SPK & Penawaran)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Keamanan (4 Digit)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="1234"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Tambahkan Pengguna Baru</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: OTOMATIS GENERATE */}
          {activeTab === 'otomatis' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-black text-slate-900">
                  Generate Akun Cepat & Otomatis (1-Klik)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Sistem akan otomatis menentukan username, nomor staf, dan PIN 4-digit acak yang langsung aktif.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAutoCreate('kasir', 'Kasir Tambahan')}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-black text-slate-900 group-hover:text-amber-700">
                    ⚡ Buat Akun Kasir Otomatis
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Role: Kasir • Wewenang POS Kios & Kas Harian
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoCreate('gudang', 'Staf Gudang Logistik')}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-black text-slate-900 group-hover:text-amber-700">
                    ⚡ Buat Akun Gudang Otomatis
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Role: Gudang • Wewenang Stok Barang & Surat Jalan
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoCreate('keuangan', 'Staf Keuangan & Pajak')}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-black text-slate-900 group-hover:text-amber-700">
                    ⚡ Buat Akun Keuangan Otomatis
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Role: Keuangan • Wewenang Faktur, Hutang & Jurnal
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAutoCreate('sales', 'Sales Lapangan NJN')}
                  className="p-3 rounded-2xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 text-left transition cursor-pointer group"
                >
                  <div className="text-xs font-black text-slate-900 group-hover:text-amber-700">
                    ⚡ Buat Akun Sales Otomatis
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Role: Sales • Wewenang Penawaran SPH & Pelanggan
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR AKUN */}
          {activeTab === 'list' && (
            <div className="space-y-2">
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.name.substring(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">@{u.username}</span>
                          <span>•</span>
                          <span className="uppercase font-bold text-amber-600">{u.role}</span>
                          <span>•</span>
                          <span className="font-mono">PIN: {u.pin || '1234'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onUserSelected && (
                        <button
                          type="button"
                          onClick={() => {
                            onUserSelected(u);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition cursor-pointer"
                        >
                          Pilih Login
                        </button>
                      )}
                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Total {users.length} akun aktif dalam sistem Toko Nirwana Jaya Nugraha
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

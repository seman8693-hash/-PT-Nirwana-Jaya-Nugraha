import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  History,
  Plus,
  CheckCircle2,
  XCircle,
  UserCheck,
  Search,
  Filter,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { store } from '../store';
import { AppUser, AuditLog } from '../types';

interface UserAccessModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const UserAccessModule: React.FC<UserAccessModuleProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'audit'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // New user form
  const [userForm, setUserForm] = useState({
    name: '',
    username: '',
    role: 'kasir' as 'owner' | 'kasir' | 'gudang' | 'keuangan' | 'sales',
    pin: '1234',
    active: true
  });

  // Edit user state
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    username: '',
    role: 'kasir' as 'owner' | 'kasir' | 'gudang' | 'keuangan' | 'sales',
    pin: '',
    active: true
  });

  const users = store.getUsers();
  const currentUser = store.getCurrentUser();
  const auditLogs = store.getAuditLogs();

  const handleSwitchUser = (user: AppUser) => {
    store.setCurrentUser(user);
    onNotify?.(`Berhasil beralih pengguna ke: ${user.name} (${user.role.toUpperCase()})`, 'success');
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.name || !userForm.username) return;

    store.addUser(userForm);
    setIsAddUserOpen(false);
    setUserForm({ name: '', username: '', role: 'kasir', pin: '1234', active: true });
    onNotify?.(`Pengguna baru ${userForm.name} berhasil dibuat!`, 'success');
  };

  const handleOpenEditUser = (u: AppUser) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name,
      username: u.username,
      role: u.role,
      pin: u.pin || '1234',
      active: u.active
    });
    setIsEditUserOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editUserForm.name.trim() || !editUserForm.username.trim()) {
      onNotify?.('Nama dan username tidak boleh kosong!', 'error');
      return;
    }
    store.updateUser(editingUser.id, {
      name: editUserForm.name.trim(),
      username: editUserForm.username.trim().toLowerCase().replace(/\s+/g, ''),
      role: editUserForm.role,
      pin: editUserForm.pin,
      active: editUserForm.active
    });
    setIsEditUserOpen(false);
    setEditingUser(null);
    onNotify?.(`Akun pengguna ${editUserForm.name} berhasil diperbarui!`, 'success');
  };

  const handleDeleteUser = (u: AppUser) => {
    if (u.id === currentUser.id) {
      onNotify?.('Tidak dapat menghapus akun yang sedang Anda gunakan saat ini!', 'error');
      return;
    }
    if (users.length <= 1) {
      onNotify?.('Minimal harus ada 1 pengguna aktif dalam sistem!', 'error');
      return;
    }
    if (confirm(`HAPUS AKUN PENGGUNA?\n\nNama: ${u.name}\nUsername: @${u.username}\nRole: ${u.role.toUpperCase()}\n\nAkun akan dihapus secara permanen.`)) {
      store.deleteUser(u.id);
      onNotify?.(`Akun pengguna ${u.name} berhasil dihapus!`, 'success');
    }
  };

  const filteredLogs = auditLogs.filter(log =>
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MODUL 11: USER & HAK AKSES SISTEM</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Pengguna, Role & Audit Trail</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengaturan hak akses staf, peran pengguna (Owner, Kasir, Gudang, Keuangan, Sales), dan log audit aktivitas operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah User Manual</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'users' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Daftar Pengguna ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'roles' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Matriks Hak Akses (Permissions)</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'audit' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log Aktivitas ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS LIST */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Daftar Akun Karyawan & Staff Aktif</h3>
            <span className="text-xs text-slate-500 font-semibold">
              Sedang Aktif: <b className="text-emerald-700">{currentUser.name} ({currentUser.role.toUpperCase()})</b>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nama Karyawan</th>
                  <th className="py-3 px-3">Username Login</th>
                  <th className="py-3 px-3">Role / Jabatan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi Beralih Akun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                              AKUN AKTIF
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">@{u.username}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'kasir' ? 'bg-amber-100 text-amber-800' :
                          u.role === 'gudang' ? 'bg-cyan-100 text-cyan-800' :
                          u.role === 'keuangan' ? 'bg-teal-100 text-teal-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aktif</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleSwitchUser(u)}
                            disabled={isCurrent}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                              isCurrent
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                            }`}
                          >
                            {isCurrent ? 'Aktif' : 'Ganti'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditUser(u)}
                            className="p-1 text-slate-700 hover:bg-amber-100 hover:text-amber-900 rounded-lg border border-slate-200 transition cursor-pointer"
                            title="Edit Akun Karyawan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent || users.length <= 1}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                            title="Hapus Akun Karyawan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ROLES & PERMISSIONS MATRIX */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Matriks Hak Akses & Kewenangan Fitur</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pembagian wewenang operasional berdasarkan jabatan staf Toko Nirwana Jaya Nugraha.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 font-bold uppercase text-[10px] text-slate-600 border-b">
                <tr>
                  <th className="py-3 px-3">Modul Sistem ERP</th>
                  <th className="py-3 px-3 text-center text-purple-700">Owner / Direktur</th>
                  <th className="py-3 px-3 text-center text-amber-700">Kasir Toko</th>
                  <th className="py-3 px-3 text-center text-cyan-700">Admin Gudang</th>
                  <th className="py-3 px-3 text-center text-teal-700">Keuangan</th>
                  <th className="py-3 px-3 text-center text-blue-700">Sales Proyek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-center">
                {[
                  { mod: '1. Dashboard KPI & Omset', owner: true, kasir: true, gudang: true, keu: true, sales: true },
                  { mod: '2. Master Data (Harga & Supplier)', owner: true, kasir: false, gudang: true, keu: true, sales: false },
                  { mod: '3. Inventory (Opname & Mutasi)', owner: true, kasir: false, gudang: true, keu: false, sales: false },
                  { mod: '4. Kasir / POS & Cetak Struk', owner: true, kasir: true, gudang: false, keu: false, sales: false },
                  { mod: '5. Pembelian & Penerimaan Barang', owner: true, kasir: false, gudang: true, keu: true, sales: false },
                  { mod: '6. Penjualan & Pembuatan SPH/Invoice', owner: true, kasir: false, gudang: false, keu: true, sales: true },
                  { mod: '7. SPK Operasional Lapangan', owner: true, kasir: false, gudang: true, keu: false, sales: true },
                  { mod: '8. Pengiriman DO & Surat Jalan', owner: true, kasir: false, gudang: true, keu: false, sales: true },
                  { mod: '9. Keuangan Buku Kas & Jurnal', owner: true, kasir: false, gudang: false, keu: true, sales: false },
                  { mod: '10. Laporan Bisnis & Export Data', owner: true, kasir: false, gudang: false, keu: true, sales: false },
                  { mod: '11. User & Hak Akses', owner: true, kasir: false, gudang: false, keu: false, sales: false },
                  { mod: '12. Pengaturan Perusahaan & Backup', owner: true, kasir: false, gudang: false, keu: false, sales: false }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900">{row.mod}</td>
                    <td className="py-2.5 px-3">{row.owner ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}</td>
                    <td className="py-2.5 px-3">{row.kasir ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}</td>
                    <td className="py-2.5 px-3">{row.gudang ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}</td>
                    <td className="py-2.5 px-3">{row.keu ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}</td>
                    <td className="py-2.5 px-3">{row.sales ? <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" /> : <XCircle className="w-4 h-4 text-slate-300 inline" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari log nama staf, modul, aktivitas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {filteredLogs.length} Aktivitas Log Tercatat
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Waktu Kejadian</th>
                  <th className="py-3 px-3">Pengguna & Role</th>
                  <th className="py-3 px-3">Modul Terkait</th>
                  <th className="py-3 px-3">Aksi / Peristiwa</th>
                  <th className="py-3 px-3">Rincian Dokumen & Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('id-ID')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 uppercase font-mono">{log.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {log.module}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 text-[11px]">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-md break-words">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Tambah Akun Karyawan Baru</h3>
              <button onClick={() => setIsAddUserOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ahmad Fauzi"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  placeholder="ahmad_fauzi"
                  value={userForm.username}
                  onChange={e => setUserForm({ ...userForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Peran</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold"
                >
                  <option value="kasir">Kasir Toko (Point of Sale)</option>
                  <option value="gudang">Admin Gudang & Logistik</option>
                  <option value="keuangan">Staff Keuangan & Akuntansi</option>
                  <option value="sales">Sales & Estimator Proyek</option>
                  <option value="owner">Owner / Direktur Utama</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Keamanan (4 Digit) *</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="1234"
                  value={userForm.pin}
                  onChange={e => setUserForm({ ...userForm, pin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono tracking-widest font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT USER */}
      {isEditUserOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  Edit Pengguna (@{editingUser.username})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setIsEditUserOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Karyawan *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.name}
                  onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={editUserForm.username}
                  onChange={e => setEditUserForm({ ...editUserForm, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-3 py-2 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Role / Peran</label>
                <select
                  value={editUserForm.role}
                  onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl font-semibold bg-white"
                >
                  <option value="kasir">Kasir Toko (Point of Sale)</option>
                  <option value="gudang">Admin Gudang & Logistik</option>
                  <option value="keuangan">Staff Keuangan & Akuntansi</option>
                  <option value="sales">Sales & Estimator Proyek</option>
                  <option value="owner">Owner / Direktur Utama</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">PIN Keamanan (4-6 Digit)</label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={editUserForm.pin}
                  onChange={e => setEditUserForm({ ...editUserForm, pin: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono tracking-widest font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setIsEditUserOpen(false);
                  }}
                  className="px-4 py-2 border rounded-xl font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow cursor-pointer"
                >
                  Simpan Perubahan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

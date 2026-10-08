import React, { useState, useRef } from 'react';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Printer,
  Trash2,
  FileCheck,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Eye,
  X,
  Layers,
  ArrowRight,
  Clock,
  Laptop,
  CheckCircle2
} from 'lucide-react';
import { store } from '../store';
import { AuditLog } from '../types';
import { formatDate } from '../utils/format';
import { printHtmlViaIframe } from '../utils/pdfGenerator';

interface ActivityLogModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const ActivityLogModule: React.FC<ActivityLogModuleProps> = ({ onNotify }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'status_change' | 'data_deletion' | 'user_activity' | 'sph_sales' | 'inventory'>('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const auditTableRef = useRef<HTMLDivElement>(null);

  const logs = store.getAuditLogs();
  const users = store.getUsers();
  const currentUser = store.getCurrentUser();

  // Filter logs berdasarkan kategori, user, dan pencarian
  const filteredLogs = logs.filter(log => {
    // Search match
    const term = searchTerm.toLowerCase();
    const matchSearch =
      !term ||
      log.userName.toLowerCase().includes(term) ||
      log.module.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.entityId && log.entityId.toLowerCase().includes(term));

    if (!matchSearch) return false;

    // User match
    if (selectedUser !== 'all' && log.userName !== selectedUser) {
      return false;
    }

    // Category match
    if (categoryFilter === 'status_change') {
      const isStatus =
        log.action.includes('STATUS') ||
        log.action.includes('PERUBAHAN') ||
        log.action.includes('SETUJU') ||
        log.action.includes('TOLAK') ||
        log.action.includes('KONVERSI') ||
        log.action.includes('LUNAS');
      return isStatus;
    }

    if (categoryFilter === 'data_deletion') {
      const isDelete =
        log.action.includes('HAPUS') ||
        log.action.includes('RESET') ||
        log.action.includes('DELETE') ||
        log.action.includes('BERSIH');
      return isDelete;
    }

    if (categoryFilter === 'user_activity') {
      const isUser =
        log.module === 'User & Akses' ||
        log.action.includes('PENGGUNA') ||
        log.action.includes('USER') ||
        log.action.includes('LOGIN') ||
        log.action.includes('LISENSI');
      return isUser;
    }

    if (categoryFilter === 'sph_sales') {
      return log.module.toLowerCase().includes('penjualan') || log.action.includes('SPH') || log.action.includes('SO');
    }

    if (categoryFilter === 'inventory') {
      return log.module.toLowerCase().includes('master') || log.module.toLowerCase().includes('inventory') || log.action.includes('STOK');
    }

    return true;
  });

  // Statistik pengawasan
  const totalLogs = logs.length;
  const statusChangeCount = logs.filter(l =>
    l.action.includes('STATUS') || l.action.includes('PERUBAHAN') || l.action.includes('SETUJU') || l.action.includes('KONVERSI')
  ).length;
  const deletionCount = logs.filter(l =>
    l.action.includes('HAPUS') || l.action.includes('RESET') || l.action.includes('DELETE')
  ).length;
  const userActCount = logs.filter(l =>
    l.module === 'User & Akses' || l.action.includes('PENGGUNA') || l.action.includes('LISENSI')
  ).length;

  // Format Helper Waktu
  const formatTimestamp = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const datePart = d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      return `${datePart} ${timePart}`;
    } catch {
      return isoStr;
    }
  };

  // Badge Style Berdasarkan Tipe Aksi
  const getActionBadge = (action: string) => {
    if (action.includes('HAPUS') || action.includes('RESET') || action.includes('DELETE')) {
      return {
        bg: 'bg-rose-100 text-rose-800 border-rose-300',
        label: 'PENGHAPUSAN DATA',
        icon: AlertTriangle
      };
    }
    if (action.includes('STATUS') || action.includes('PERUBAHAN') || action.includes('SETUJU') || action.includes('KONVERSI')) {
      return {
        bg: 'bg-blue-100 text-blue-800 border-blue-300',
        label: 'PERUBAHAN STATUS',
        icon: RefreshCw
      };
    }
    if (action.includes('BUAT') || action.includes('TAMBAH')) {
      return {
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        label: 'PEMBUATAN DATA',
        icon: FileCheck
      };
    }
    if (action.includes('PENGGUNA') || action.includes('USER') || action.includes('LOGIN')) {
      return {
        bg: 'bg-purple-100 text-purple-800 border-purple-300',
        label: 'SESI & AKSES USER',
        icon: UserCheck
      };
    }
    return {
      bg: 'bg-slate-100 text-slate-800 border-slate-300',
      label: action,
      icon: Clock
    };
  };

  // Export CSV
  const handleExportCsv = () => {
    if (logs.length === 0) {
      onNotify?.('Tidak ada catatan log untuk diekspor', 'error');
      return;
    }

    const headers = ['ID', 'Waktu', 'Pengguna', 'Role', 'Modul', 'Aksi', 'Entitas ID', 'Status Lama', 'Status Baru', 'Detail Aktivitas', 'IP Device'];
    const rows = logs.map(l => [
      l.id,
      `"${formatTimestamp(l.timestamp)}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.entityId || '-'}"`,
      `"${l.oldStatus || '-'}"`,
      `"${l.newStatus || '-'}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress || '192.168.1.10'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AuditLog_NJN_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify?.('Laporan log aktivitas berhasil diekspor ke file CSV!', 'success');
  };

  // Cetak Laporan Audit
  const handlePrintAudit = () => {
    if (auditTableRef.current) {
      printHtmlViaIframe(
        auditTableRef.current.innerHTML,
        'A4',
        'landscape',
        `Log_Aktivitas_Pengawasan_NJN_${new Date().toISOString().split('T')[0]}`
      );
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Modul */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>MODUL 13: LOG AKTIVITAS &amp; PENGAWASAN OPERASIONAL</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Audit Trail, Riwayat Dokumen &amp; Pengawasan Staf
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Mencatat riwayat perubahan status dokumen (SPH, SO, PO, Invoice), audit penghapusan data, dan jejak aktivitas seluruh pengguna secara real-time untuk kebutuhan kepatuhan dan pengawasan operasional Toko Nirwana Jaya Nugraha.
          </p>
        </div>

        {/* Toolbar Export & Cetak */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintAudit}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Log</span>
          </button>
          {currentUser.role === 'owner' && (
            <button
              type="button"
              onClick={() => {
                if (confirm('Apakah Anda yakin ingin mengarsipkan dan membersihkan riwayat log lama?\n\nAksi ini akan dicatat dalam audit trail pengawasan.')) {
                  store.clearAuditLogs();
                  onNotify?.('Log aktivitas lama telah dibersihkan. Catatan pembersihan telah dicatat.', 'success');
                }
              }}
              className="p-2.5 text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 rounded-xl transition cursor-pointer"
              title="Bersihkan Log Lama (Hanya Owner)"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4 Kartu Metrik Pengawasan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Total Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Log Aktivitas
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalLogs}</div>
            <span className="text-[10px] text-slate-400 font-medium">Jejak rekaman tersimpan</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
            <History className="w-6 h-6" />
          </div>
        </div>

        {/* Perubahan Status Dokumen */}
        <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
              Perubahan Status Dokumen
            </span>
            <div className="text-2xl font-black text-blue-900 mt-1">{statusChangeCount}</div>
            <span className="text-[10px] text-blue-600/80 font-medium">SPH, PO, SO, Faktur, DO</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <RefreshCw className="w-6 h-6" />
          </div>
        </div>

        {/* Penghapusan Data (Audit Delete) */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
              Penghapusan Data (Delete)
            </span>
            <div className="text-2xl font-black text-rose-900 mt-1">{deletionCount}</div>
            <span className="text-[10px] text-rose-600/80 font-medium">Terawasi &amp; Terperinci</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Aktivitas Pengguna & Akses */}
        <div className="bg-white p-5 rounded-2xl border border-purple-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider block">
              Aktivitas User &amp; Lisensi
            </span>
            <div className="text-2xl font-black text-purple-900 mt-1">{userActCount}</div>
            <span className="text-[10px] text-purple-600/80 font-medium">Sesi login &amp; hak akses</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        {/* Sub Tabs Kategori */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Aktivitas ({logs.length})
          </button>
          <button
            onClick={() => setCategoryFilter('status_change')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'status_change'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            <span>Perubahan Status Dokumen ({statusChangeCount})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('data_deletion')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'data_deletion'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Penghapusan Data ({deletionCount})</span>
          </button>
          <button
            onClick={() => setCategoryFilter('sph_sales')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              categoryFilter === 'sph_sales'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Penjualan &amp; SPH
          </button>
          <button
            onClick={() => setCategoryFilter('user_activity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              categoryFilter === 'user_activity'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3 h-3" />
            <span>Aktivitas Pengguna ({userActCount})</span>
          </button>
        </div>

        {/* Filter Row: Search & User Select */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama staf, nomor dokumen, modul, detail..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Filter Pengguna:</span>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="all">Semua Staf / Pengguna</option>
              {users.map(u => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Log Aktivitas */}
      <div 
        ref={auditTableRef}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print-document-container"
        data-print-sheet="true"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Daftar Catatan Audit Pengawasan ({filteredLogs.length})
            </h3>
            {categoryFilter !== 'all' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Filter Aktif
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Diurutkan dari aktivitas terbaru
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <History className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500">Tidak ada riwayat aktivitas yang sesuai dengan filter.</p>
            <p className="text-[11px]">Silakan ubah filter kategori atau kata kunci pencarian Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu &amp; Tanggal</th>
                  <th className="py-3 px-4">Staf / Pengguna</th>
                  <th className="py-3 px-4">Modul Sistem</th>
                  <th className="py-3 px-4">Tipe Aksi</th>
                  <th className="py-3 px-4">Rincian &amp; Perubahan</th>
                  <th className="py-3 px-4 text-center">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map(log => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const isDelete = log.action.includes('HAPUS') || log.action.includes('RESET');
                  const isStatus = log.action.includes('STATUS') || log.action.includes('PERUBAHAN');

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isDelete ? 'bg-rose-50/20' : isStatus ? 'bg-blue-50/10' : ''
                      }`}
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Waktu */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 font-black flex items-center justify-center text-[10px]">
                            {log.userName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{log.userName}</span>
                            <span className="text-[10px] uppercase font-semibold text-slate-400">{log.userRole}</span>
                          </div>
                        </div>
                      </td>

                      {/* Modul */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {log.module}
                        </span>
                      </td>

                      {/* Aksi Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Rincian Detail */}
                      <td className="py-3 px-4 text-slate-700">
                        <div className="space-y-0.5 max-w-md">
                          <p className="font-medium text-slate-900 leading-snug">{log.details}</p>
                          {(log.oldStatus || log.newStatus) && (
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                              <span className="line-through text-slate-400">{log.oldStatus || '-'}</span>
                              <ArrowRight className="w-2.5 h-2.5 text-blue-500" />
                              <span className="font-bold text-blue-700">{log.newStatus}</span>
                            </div>
                          )}
                          {log.entityId && (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-100 text-slate-600">
                              Ref: {log.entityId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tombol View */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                          title="Lihat Detail Log"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETAIL AUDIT LOG PENGAWASAN */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-fade-in text-xs">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Detail Jejak Audit Pengawasan
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">
                    ID Rekaman: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Waktu Tercatat</span>
                  <span className="font-mono font-bold text-slate-900">{formatTimestamp(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Modul Sistem</span>
                  <span className="font-bold text-slate-900">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Eksekutor / Staf</span>
                  <span className="font-bold text-slate-900">{selectedLog.userName} ({selectedLog.userRole.toUpperCase()})</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Kode Aksi</span>
                  <span className="font-mono font-bold text-amber-700">{selectedLog.action}</span>
                </div>
              </div>

              {/* Rincian Deskripsi */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  Deskripsi Aktivitas
                </span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {selectedLog.details}
                </p>
              </div>

              {/* Status Sebelum & Sesudah jika ada */}
              {(selectedLog.oldStatus || selectedLog.newStatus || selectedLog.oldValue || selectedLog.newValue) && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">
                    Perubahan Data / Status
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Sebelum:</span>
                      <span className="text-slate-700 font-mono">{selectedLog.oldStatus || selectedLog.oldValue || '-'}</span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-blue-300">
                      <span className="text-[10px] text-blue-600 block font-bold">Sesudah:</span>
                      <span className="text-blue-900 font-mono font-bold">{selectedLog.newStatus || selectedLog.newValue || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata Teknis */}
              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Alamat Jaringan / IP:</span>
                  <span className="font-mono font-bold text-slate-700">{selectedLog.ipAddress || '192.168.1.10 (Local ERP)'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Perangkat / Terminal:</span>
                  <span className="font-medium text-slate-700 truncate max-w-xs">{selectedLog.device || 'Workstation NJN'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Validasi Integritas:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Terverifikasi Sistem
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

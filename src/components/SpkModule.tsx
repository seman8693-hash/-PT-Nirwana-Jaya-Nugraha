import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Printer,
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  X
} from 'lucide-react';
import { store } from '../store';
import { PKSContract } from '../types';
import { formatRupiah, formatDate } from '../utils/format';

interface SpkModuleProps {
  onPrintSpk: (spk: PKSContract) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SpkModule: React.FC<SpkModuleProps> = ({ onPrintSpk, onNotify }) => {
  const [showModal, setShowModal] = useState(false);
  const [partner, setPartner] = useState('');
  const [pic, setPic] = useState('H. Dedi Irawan, S.T. (Project Manager)');
  const [scope, setScope] = useState('');
  const [amount, setAmount] = useState('75000000');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [partnerType, setPartnerType] = useState('Kontraktor Mekanikal Elektrikal');

  const spkList = store.getSPKList();
  const customers = store.getCustomers();

  const handleCreateSpk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partner || !scope || !amount) {
      onNotify?.('Lengkapi mitra, lingkup pekerjaan, dan nilai kontrak!', 'error');
      return;
    }

    const newSpk = store.addSPK({
      partnerName: partner,
      picName: pic,
      partnerType,
      scope,
      contractValue: parseFloat(amount) || 0,
      realizedAmount: 0,
      startDate,
      endDate,
      duration: '30 Hari Kalender',
      paymentTerm: 'Termin 3 Tahap (DP 30%, Progres 50%, BAST 20%)',
      discountTier: 'Mitra Rekanan Khusus'
    });

    setShowModal(false);
    setPartner('');
    setScope('');
    onNotify?.(`SPK Proyek ${newSpk.code} berhasil diterbitkan!`, 'success');
  };

  const handleToggleTask = (spk: PKSContract, taskIdx: number) => {
    if (!spk.workChecklist) return;
    spk.workChecklist[taskIdx].completed = !spk.workChecklist[taskIdx].completed;
    const allDone = spk.workChecklist.every(t => t.completed);
    if (allDone) {
      spk.status = 'completed';
      spk.statusLabel = 'Selesai 100%';
    } else {
      spk.status = 'active';
      spk.statusLabel = 'Sedang Berjalan';
    }
    store.save();
    onNotify?.('Status checklist tugas SPK berhasil diperbarui.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Wrench className="w-4 h-4" />
            <span>MODUL 7: SPK & OPERASIONAL LAPANGAN</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Surat Perintah Kerja (SPK) & Proyek</h2>
          <p className="text-xs text-slate-500 mt-1">
            Penugasan teknisi lapangan, instalasi kabel, perakitan panel LVMDP, jadwal timeline, dan monitoring BAST.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Terbitkan SPK Baru</span>
        </button>
      </div>

      {/* SPK List Card */}
      <div className="space-y-4">
        {spkList.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center text-slate-400 text-xs">
            Belum ada Surat Perintah Kerja (SPK) yang aktif. Klik "+ Terbitkan SPK Baru" di atas.
          </div>
        ) : (
          spkList.map(spk => {
            const completedCount = spk.workChecklist?.filter(t => t.completed).length || 0;
            const totalTasks = spk.workChecklist?.length || 1;
            const progress = Math.round((completedCount / totalTasks) * 100);

            return (
              <div key={spk.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-sm">{spk.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        spk.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                      }`}>
                        {spk.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{spk.partnerName}</h3>
                    <p className="text-xs text-slate-500">{spk.scope}</p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onPrintSpk(spk)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Dokumen SPK</span>
                    </button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">PIC Teknisi / Lapangan</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{spk.picName}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Jadwal Pelaksanaan</span>
                    <span className="font-mono text-slate-800 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-600" />
                      <span>{formatDate(spk.startDate)} - {formatDate(spk.endDate)}</span>
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Nilai Kontrak SPK</span>
                    <span className="font-mono font-black text-slate-900 block mt-0.5">
                      {formatRupiah(spk.contractValue)}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-bold block">Progres Pekerjaan</span>
                    <div className="flex items-center justify-between font-mono font-bold text-slate-800 mt-0.5">
                      <span>{progress}%</span>
                      <span className="text-[10px] text-slate-500">{completedCount}/{totalTasks} Task</span>
                    </div>
                  </div>
                </div>

                {/* Task Checklist */}
                {spk.workChecklist && (
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                      Checklist Tahapan & Rincian Pekerjaan
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {spk.workChecklist.map((task, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50"
                        >
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => handleToggleTask(spk, idx)}
                            className="rounded text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className={`text-xs ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 font-semibold'}`}>
                            {task.taskName}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL TERBITKAN SPK */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Penerbitan Surat Perintah Kerja (SPK) Baru</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpk} className="space-y-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Mitra / Klien Penerima SPK *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Wijaya Karya Rekind"
                  value={partner}
                  onChange={e => setPartner(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lingkup & Spesifikasi Pekerjaan *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Pemasangan Trafo 630kVA dan Penarikan Kabel Feeder NYFGBY 4x95 mm² Gedung C"
                  value={scope}
                  onChange={e => setScope(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIC Teknisi Lapangan</label>
                  <input
                    type="text"
                    value={pic}
                    onChange={e => setPic(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nilai Kontrak SPK (Rp) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Mulai Pekerjaan</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Target Selesai (BAST)</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl shadow-md"
                >
                  Terbitkan SPK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { KeyRound, Loader2, ShieldAlert, CheckCircle2, X, Eye, EyeOff } from 'lucide-react';
import { api, ApiError } from '../api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Dipakai mode reset PIN user lain (khusus owner). */
  targetUser?: { id: string; username: string; name: string } | null;
}

const pinClass =
  'w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm tracking-[0.3em]';

export const PinModal: React.FC<Props> = ({ open, onClose, targetUser }) => {
  const isReset = Boolean(targetUser);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const reset = () => {
    setOldPin(''); setNewPin(''); setConfirmPin('');
    setError(null); setSuccess(null); setShow(false); setBusy(false);
  };

  const close = () => { reset(); onClose(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isReset) {
      if (!/^\d{4,8}$/.test(oldPin)) return setError('PIN lama harus 4-8 digit.');
      if (oldPin === newPin) return setError('PIN baru harus berbeda dari PIN lama.');
    }
    if (!/^\d{4,8}$/.test(newPin)) return setError('PIN baru harus 4-8 digit.');
    if (newPin !== confirmPin) return setError('Konfirmasi PIN tidak cocok.');
    if (/^(\d)\1+$/.test(newPin)) return setError('PIN tidak boleh semua angka sama.');

    setBusy(true);
    try {
      const res = isReset && targetUser
        ? await api.resetPin(targetUser.id, newPin)
        : await api.changePin(oldPin, newPin);
      setSuccess(res.message ?? 'PIN berhasil diubah.');
      setNewPin(''); setConfirmPin(''); setOldPin('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah PIN.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-amber-400">
          <div className="flex items-center gap-2">
            <KeyRound size={18} />
            <h3 className="font-black text-sm">
              {isReset ? 'Reset PIN' : 'Ganti PIN'}
            </h3>
          </div>
          <button onClick={close} className="hover:text-white transition" aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {isReset && targetUser && (
            <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <span className="font-bold text-slate-800">{targetUser.name}</span>
              <span className="text-slate-500"> ({targetUser.username})</span>
            </div>
          )}

          {!isReset && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN Lama</label>
              <input type={show ? 'text' : 'password'} value={oldPin} inputMode="numeric"
                onChange={e => setOldPin(e.target.value)} className={pinClass} placeholder="••••" />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN Baru</label>
            <input type={show ? 'text' : 'password'} value={newPin} inputMode="numeric"
              onChange={e => setNewPin(e.target.value)} className={pinClass} placeholder="4-8 digit" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ulangi PIN Baru</label>
            <input type={show ? 'text' : 'password'} value={confirmPin} inputMode="numeric"
              onChange={e => setConfirmPin(e.target.value)} className={pinClass} placeholder="••••" />
          </div>

          <button type="button" onClick={() => setShow(s => !s)}
            className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            {show ? <EyeOff size={12} /> : <Eye size={12} />}
            {show ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
          </button>

          {error && (
            <div className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              <ShieldAlert size={14} className="shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" /><span>{success}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={close}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-50">
              Batal
            </button>
            <button type="submit" disabled={busy || Boolean(success)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 text-amber-400 text-xs font-black hover:bg-slate-800 disabled:opacity-60">
              {busy ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              {busy ? 'Menyimpan...' : 'Simpan PIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinModal;
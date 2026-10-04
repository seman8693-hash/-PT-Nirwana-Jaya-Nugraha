import React, { useCallback, useEffect, useState } from 'react';
import { LogIn, ShieldAlert, RefreshCw, CheckCircle2, WifiOff, Loader2 } from 'lucide-react';
import { api, ApiError, isLoggedIn, setToken } from '../api/client';
import type { SessionUser } from '../api/client';
import { hydrate, onSyncStatus } from '../api/sync';
import type { SyncStatus } from '../api/sync';
import { store } from '../store';

/** Banner status sinkronisasi, muncul di pojok kanan atas. */
const SyncBadge: React.FC<{ status: SyncStatus }> = ({ status }) => {
  if (status === 'idle') return null;
  const map: Record<string, { text: string; cls: string; icon: React.ReactNode }> = {
    syncing: { text: 'Menyimpan ke server...', cls: 'bg-amber-500/20 text-amber-700 border-amber-300', icon: <RefreshCw size={14} className="animate-spin" /> },
    error: { text: 'Gagal menyimpan - akan dicoba lagi', cls: 'bg-rose-500/20 text-rose-700 border-rose-300', icon: <ShieldAlert size={14} /> },
    offline: { text: 'Offline - data tersimpan lokal', cls: 'bg-slate-500/20 text-slate-700 border-slate-300', icon: <WifiOff size={14} /> },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div className={`fixed top-3 right-3 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold shadow-lg ${s.cls}`}>
      {s.icon}<span>{s.text}</span>
    </div>
  );
};

export const LoginGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [notice, setNotice] = useState<string | null>(null);

  // Cek sesi yang sudah tersimpan saat aplikasi dibuka.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isLoggedIn()) { setReady(true); return; }
      try {
        const res = await api.me();
        if (cancelled) return;
        setUser(res.user);
        await hydrate(p => store.hydrateState(p), store.getState());
        store.setSyncEnabled(true);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => onSyncStatus(setSyncStatus), []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pin) {
      setError('Username dan PIN wajib diisi.');
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const res = await api.login(username.trim(), pin);
      setUser(res.user);

      const local = store.getState();
      const { seeded } = await hydrate(p => store.hydrateState(p), local);
      store.setSyncEnabled(true);

      setNotice(seeded
        ? 'Server masih kosong - data contoh dari perangkat ini diunggah ke database.'
        : 'Data dimuat dari database server.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Gagal masuk. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }, [username, pin]);
if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="animate-spin text-amber-600" size={36} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-amber-400 font-black text-xl mb-3">
              NJN
            </div>
            <h1 className="text-lg font-black text-slate-900">PT. Nirwana Jaya Nugraha</h1>
            <p className="text-xs text-slate-500 mt-1">Sistem Operasional Kios &amp; ERP</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                placeholder="mis. direktur"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value)}
                inputMode="numeric"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm tracking-[0.3em]"
                placeholder="••••"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-slate-900 text-amber-400 font-black text-sm hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {busy ? 'Memproses...' : 'MASUK'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Data disimpan di database Cloudflare D1, bukan hanya di browser.
              PIN awal: <span className="font-mono font-bold">direktur/1234</span>,
              <span className="font-mono font-bold"> kasir1/1111</span>.
              Segera ganti lewat menu User Access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SyncBadge status={syncStatus} />
      {notice && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-lg">
          <CheckCircle2 size={14} />{notice}
        </div>
      )}
      {children}
    </>
  );
};

export default LoginGate;
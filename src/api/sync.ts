/**
 * Lapisan sinkronisasi localStorage <-> D1.
 *
 * Prinsip: localStorage tetap jadi sumber render (agar 24 komponen tidak
 * perlu di-rewrite dan UI tetap instan), sedangkan D1 jadi sumber kebenaran.
 * - hydrate(): ambil data server saat app start.
 * - markDirty(): tandai koleksi berubah, kirim tertunda (debounce).
 */

import { api, ApiError, isLoggedIn } from './client';
import type { SessionUser } from './client';
import type { AppState } from '../store';

/** Pemetaan key state -> path resource di API. */
export const COLLECTION_MAP: Array<[keyof AppState, string]> = [
  ['products', 'products'],
  ['customers', 'customers'],
  ['suppliers', 'suppliers'],
  ['units', 'units'],
  ['stockMovements', 'stock-movements'],
  ['stockOpnames', 'stock-opnames'],
  ['posTransactions', 'pos-transactions'],
  ['purchaseOrders', 'purchase-orders'],
  ['purchaseInvoices', 'purchase-invoices'],
  ['sphQuotations', 'sph-quotations'],
  ['salesOrders', 'sales-orders'],
  ['salesInvoices', 'sales-invoices'],
  ['spkContracts', 'spk-contracts'],
  ['deliveryOrders', 'delivery-orders'],
  ['bankAccounts', 'bank-accounts'],
  ['cashRecords', 'cash-transactions'],
  ['journalEntries', 'journal-entries'],
];

/**
 * Koleksi yang TIDAK ikut write-behind.
 * - users      : dikelola lewat API agar PIN tetap ter-hash di server.
 * - auditLogs  : tumbuh terus; cukup dibaca, tidak perlu ditulis balik
 *                karena server sudah mencatatnya saat pos/checkout.
 */
export const READ_ONLY_COLLECTIONS = new Set<string>(['users', 'auditLogs']);

const DEBOUNCE_MS = 1200;

let timer: ReturnType<typeof setTimeout> | null = null;
const dirty = new Set<string>();
let onStatus: ((s: SyncStatus) => void) | null = null;

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

export function onSyncStatus(cb: (s: SyncStatus) => void): void {
  onStatus = cb;
}

function setStatus(s: SyncStatus): void {
  if (onStatus) onStatus(s);
}

/** Tandai koleksi berubah; pengiriman dikirim dengan jeda agar tidak spam. */
export function markDirty(collection: string): void {
  if (READ_ONLY_COLLECTIONS.has(collection)) return;
  dirty.add(collection);
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => { void flush(); }, DEBOUNCE_MS);
}

/** State terakhir yang diketahui - dipakai timer debounce. */
let lastState: AppState | null = null;

/** Kirim semua koleksi yang ditandai berubah. */
export async function flush(state?: AppState): Promise<void> {
  if (state) lastState = state;
  if (dirty.size === 0) return;
  if (!lastState || !isLoggedIn()) return;

  const snapshot = lastState;
  const batch = [...dirty];
  dirty.clear();

  setStatus('syncing');
  try {
    for (const key of batch) {
      const entry = COLLECTION_MAP.find(([k]) => k === key);
      const rows = (snapshot as any)[key];

      // company_settings adalah baris tunggal (id = 'default'), bukan array.
      if (key === 'companySettings') {
        if (rows && typeof rows === 'object') {
          await api.update('company-settings', 'default', rows);
        }
        continue;
      }

      if (!entry || !Array.isArray(rows)) continue;

      for (const row of rows) {
        if (!row?.id) continue;
        // 'upsert' sederhana: coba create, bila bentrok unique lalu update.
        try {
          await api.create(entry[1], row);
        } catch (e) {
          if (e instanceof ApiError && e.status === 409) {
            await api.update(entry[1], row.id, row);
          } else {
            throw e;
          }
        }
      }
    }
    setStatus('idle');
  } catch (e) {
    // Kembalikan ke dirty agar dicoba lagi pada saving berikutnya.
    for (const k of batch) dirty.add(k);
    setStatus(isLoggedIn() ? 'error' : 'offline');
  }
}

/**
 * Ambil seluruh data dari server dan gabungkan ke state lokal.
 * Koleksi yang masih kosong di server diisi dari data lokal (seed awal).
 */
export async function hydrate(
  apply: (partial: Partial<AppState>) => void,
  localState: AppState
): Promise<{ seeded: boolean }> {
  if (!isLoggedIn()) throw new ApiError('Belum login', 401);

  const partial: Record<string, unknown> = {};
  let serverHasData = false;

  for (const [key, path] of COLLECTION_MAP) {
    try {
      const res = await api.list(path, { limit: 1000 });
      if (res.count > 0) serverHasData = true;
      partial[key] = res.count > 0 ? res.data : (localState as any)[key];
    } catch {
      partial[key] = (localState as any)[key];
    }
  }

  // company_settingsadalah singleton (baris 'id' = 'default').
  try {
    const settings = await api.list('company-settings', { limit: 1 });
    if (settings.count > 0) partial.companySettings = settings.data[0];
  } catch {
    // biarkan yang lokal
  }

  // Pengguna & audit tetap dibaca dari server bila ada.
  try {
    const users = await api.list('users', { limit: 200 });
    if (users.count > 0) partial.users = users.data;
  } catch { /* biarkan lokal */ }

  apply(partial as Partial<AppState>);

  // Seed: server masih kosong -> unggah data lokal sekali ini.
  if (!serverHasData) {
    await seedServer(localState);
    return { seeded: true };
  }
  return { seeded: false };
}

/** Unggah seluruh state lokal ke server (dipakai saat pertama kali pakai). */
export async function seedServer(state: AppState): Promise<void> {
  setStatus('syncing');
  try {
    for (const [key, path] of COLLECTION_MAP) {
      const rows = (state as any)[key];
      if (!Array.isArray(rows)) continue;
      for (const row of rows) {
        if (!row?.id) continue;
        try { await api.create(path, row); } catch { /* duplikat, lewati */ }
      }
    }

    const settings = (state as any).companySettings;
    if (settings) {
      try {
        await api.update('company-settings', 'default', settings);
      } catch {
        try { await api.create('company-settings', { ...settings, id: 'default' }); } catch { /* ok */ }
      }
    }
    setStatus('idle');
  } catch {
    setStatus('error');
  }
}
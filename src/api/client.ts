/**
 * Klien API untuk Worker NJN.
 *
 * Menyimpan token sesi di localStorage danhandled refresh. Semua kegagalan
 * jaringan dilempar sebagai ApiError supaya UI bisa menampilkan pesan.
 */

const TOKEN_KEY = 'njn_session_token';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage penuh / diblokir - abaikan */ }
}

export function isLoggedIn(): boolean {
  return getToken() !== null;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true } = opts;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet.', 0);
  }

  const text = await res.text();
  let payload: any = {};
  if (text) {
    try { payload = JSON.parse(text); } catch { /* bukan JSON */ }
  }

  if (res.status === 401) {
    // Sesi tidak berlaku lagi - paksa login ulang.
    setToken(null);
    throw new ApiError('Sesi berakhir. Silakan login kembali.', 401);
  }

  if (!res.ok) {
    throw new ApiError(payload?.error ?? `Gagal memuat data (${res.status})`, res.status);
  }

  return payload as T;
}

/* ------------------------------------------------------------------ *
 * Konversi snake_case <-> camelCase
 * ------------------------------------------------------------------ */

const snakeToCamel = (key: string): string =>
  key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

const camelToSnake = (key: string): string =>
  key.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`);

/** Ubah seluruh key objek secara rekursif (untuk payload & response). */
export function convertKeys<T = any>(value: any, fn: (k: string) => string): T {
  if (Array.isArray(value)) return value.map(v => convertKeys(v, fn)) as unknown as T;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[fn(k)] = convertKeys(v, fn);
    return out as T;
  }
  return value as T;
}

export const toCamel = <T = any>(v: any): T => convertKeys<T>(v, snakeToCamel);
export const toSnake = <T = any>(v: any): T => convertKeys<T>(v, camelToSnake);

/* ------------------------------------------------------------------ *
 * Endpoint
 * ------------------------------------------------------------------ */

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export const api = {
  health: () => request<{ ok: boolean }>('/health', { auth: false }),

  login: (username: string, pin: string) =>
    request<{ ok: boolean; token: string; user: SessionUser }>('/auth/login', {
      method: 'POST', body: { username, pin }, auth: false,
    }),

  me: () => request<{ ok: boolean; user: SessionUser }>('/auth/me'),

  list: <T = any>(resource: string, params?: { q?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset) qs.set('offset', String(params.offset));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{ ok: boolean; data: any[]; count: number }>(`/${resource}${suffix}`)
      .then(r => ({ ...r, data: toCamel<T[]>(r.data) }));
  },

  create: <T = any>(resource: string, payload: Record<string, unknown>) =>
    request<{ ok: boolean; data: T }>(`/${resource}`, {
      method: 'POST', body: toSnake(payload),
    }).then(r => ({ ...r, data: toCamel<T>(r.data) })),

  update: <T = any>(resource: string, id: string, payload: Record<string, unknown>) =>
    request<{ ok: boolean; data: T }>(`/${resource}/${encodeURIComponent(id)}`, {
      method: 'PUT', body: toSnake(payload),
    }).then(r => ({ ...r, data: toCamel<T>(r.data) })),

  remove: (resource: string, id: string) =>
    request<{ ok: boolean }>(`/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  checkout: (transaction: Record<string, unknown>, items: Array<Record<string, unknown>>) =>
    request<{ ok: boolean; id: string }>('/pos/checkout', {
      method: 'POST',
      body: { transaction: toSnake(transaction), items: toSnake(items) },
    }),
};
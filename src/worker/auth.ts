/**
 * Autentikasi & Otorisasi Worker.
 *
 * Sesi memakai token bertanda tangan HMAC-SHA256 (Web Crypto), bukan
 * penyimpanan server-side, sehingga tetap stateless dan tahan restarts.
 * PIN pengguna tidak pernah disimpan plaintext - hanya SHA-256(pin + salt).
 */

export type Role = 'owner' | 'kasir' | 'gudang' | 'keuangan' | 'sales';

export interface Session {
  sub: string; // user id
  username: string;
  name: string;
  role: Role;
  exp: number; // epoch ms
}

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  SESSION_SECRET: string;
}

/** Masa berlaku sesi: 12 jam. */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const enc = new TextEncoder();

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/** Verifikasi PIN secara timing-safe: hash PIN dengan salt yang disimpan. */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${pin}`));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Perbandingan string resistant timing attack. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPin(pin: string, salt: string, expectedHash: string): Promise<boolean> {
  const actual = await hashPin(pin, salt);
  return timingSafeEqual(actual, expectedHash);
}

export async function createToken(
  secret: string,
  payload: Omit<Session, 'exp'>
): Promise<string> {
  const session: Session = { ...payload, exp: Date.now() + SESSION_TTL_MS };
  const body = b64urlEncode(enc.encode(JSON.stringify(session)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body));
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifyToken(secret: string, token: string): Promise<Session | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  let expectedSig: string;
  try {
    const key = await hmacKey(secret);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(parts[0]));
    expectedSig = b64urlEncode(sigBuf);
  } catch {
    return null;
  }

  if (!timingSafeEqual(expectedSig, parts[1])) return null;

  try {
    const session = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0]))) as Session;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

/** Ambil token dari header Authorization: Bearer <token>. */
export function extractToken(req: Request): string | null {
  const header = req.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

/**
 * Matriks izin per role.
 * Asterisk = semua collection milik modul tersebut.
 */
export type Permission =
  | 'products:write' | 'customers:write' | 'suppliers:write'
  | 'pos:write' | 'purchase:write' | 'sales:write' | 'shipping:write'
  | 'finance:write' | 'spk:write' | 'users:write' | 'settings:write'
  | 'audit:write';

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  owner: new Set<Permission>([
    'products:write', 'customers:write', 'suppliers:write', 'pos:write',
    'purchase:write', 'sales:write', 'shipping:write', 'finance:write',
    'spk:write', 'users:write', 'settings:write', 'audit:write',
  ]),
  kasir: new Set<Permission>(['pos:write', 'customers:write', 'products:write', 'audit:write']),
  gudang: new Set<Permission>(['products:write', 'suppliers:write', 'purchase:write', 'audit:write']),
  keuangan: new Set<Permission>(['finance:write', 'sales:write', 'audit:write']),
  sales: new Set<Permission>(['sales:write', 'shipping:write', 'customers:write', 'spk:write', 'audit:write']),
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}
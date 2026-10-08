/**
 * PT Nirwana Jaya Nugraha - Worker API + Static Assets.
 *
 * Semua endpoint diawali /api. Sisanya dilayani dari binding ASSETS (SPA).
 * Tulis selalu memakai transaksi D1 (batch) agar header + line item atomik.
 */

import { can, createToken, extractToken, hashPin, verifyToken, verifyPin } from './auth';
import type { Env, Session } from './auth';
import { CHILD_KEY, RESOURCE_BY_PATH } from './resources';
import type { ResourceSpec } from './resources';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const fail = (message: string, status: number) => json({ ok: false, error: message }, status);

const nowIso = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Body JSON tidak valid');
  }
}

/* ------------------------------------------------------------------ *
 * Bootstrap: seed pengguna awal & pengaturan saat DB masih kosong
 * ------------------------------------------------------------------ */

async function bootstrap(env: Env): Promise<void> {
  const userCount = await env.DB.prepare('SELECT COUNT(*) AS n FROM app_users').first<{ n: number }>();
  if (userCount && userCount.n > 0) return;

  // PIN awal. Ganti setelah login pertama (menu User Access).
  const seed = [
    { id: 'usr-1', username: 'direktur', name: 'H. Asep Supriatna, S.T.', role: 'owner', pin: '1234' },
    { id: 'usr-2', username: 'kasir1', name: 'Siti Rahmawati', role: 'kasir', pin: '1111' },
    { id: 'usr-3', username: 'gudang1', name: 'Dedi Kurniawan', role: 'gudang', pin: '2222' },
    { id: 'usr-4', username: 'keuangan1', name: 'Rina Marlina, S.E.', role: 'keuangan', pin: '3333' },
    { id: 'usr-5', username: 'sales1', name: 'Fikri Ramadhan', role: 'sales', pin: '4444' },
  ];

  const stmts: D1PreparedStatement[] = [];

  for (const u of seed) {
    const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    stmts.push(env.DB.prepare(
      `INSERT OR REPLACE INTO app_users
       (id, username, name, role, pin_hash, pin_salt, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(u.id, u.username, u.name, u.role, await hashPin(u.pin, salt), salt, nowIso(), nowIso()));
  }

  stmts.push(env.DB.prepare(
    `INSERT OR IGNORE INTO company_settings
     (id, company_name, brand_tagline, invoice_prefix, sph_prefix, spk_prefix,
      po_prefix, do_prefix, ppn_rate, thermal_paper_width, updated_at)
     VALUES ('default', ?, ?, 'INV/NJN', 'SPH/NJN', 'SPK/NJN', 'PO/NJN', 'DO/NJN', 11, '80mm', ?)`
  ).bind('TOKO NIRWANA JAYA NUGRAHA', 'Sistem Operasional Kios & ERP', nowIso()));

  await env.DB.batch(stmts);
}

/* ------------------------------------------------------------------ *
 * Autentikasi
 * ------------------------------------------------------------------ */

async function handleLogin(env: Env, req: Request) {
  const body = await readJson(req);
  const username = String(body.username ?? '').trim();
  const pin = String(body.pin ?? '');

  if (!username || !pin) return fail('username dan pin wajib diisi', 400);

  const user = await env.DB.prepare(
    'SELECT id, username, name, role, pin_hash, pin_salt, active FROM app_users WHERE username = ?'
  ).bind(username).first<{
    id: string; username: string; name: string; role: string;
    pin_hash: string | null; pin_salt: string | null; active: number;
  }>();

  // Pesan sengaja sama agar tidak membocorkan username yang terdaftar.
  if (!user || !user.pin_hash || !user.pin_salt || user.active !== 1) {
    return fail('username atau PIN salah', 401);
  }

  const ok = await verifyPin(pin, user.pin_salt, user.pin_hash);
  if (!ok) return fail('username atau PIN salah', 401);

  const token = await createToken(env.SESSION_SECRET, {
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role as Session['role'],
  });

  await env.DB.prepare(
    'UPDATE app_users SET last_login = ?, updated_at = ? WHERE id = ?'
  ).bind(nowIso(), nowIso(), user.id).run();

  return json({
    ok: true,
    token,
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
}

async function requireSession(env: Env, req: Request): Promise<Session | Response> {
  const token = extractToken(req);
  if (!token) return fail('Authorization: Bearer <token> diperlukan', 401);
  const session = await verifyToken(env.SESSION_SECRET, token);
  if (!session) return fail('Sesi tidak valid atau kedaluwarsa', 401);
  return session;
}
/* ------------------------------------------------------------------ *
 * Endpoint transaksi POS (atomic: stok + jurnal + audit)
 * ------------------------------------------------------------------ */

async function handlePosCheckout(env: Env, req: Request, session: Session) {
  if (!can(session.role, 'pos:write')) return fail('Akses ditolak', 403);

  const body = await readJson(req);
  const txn = body.transaction as Record<string, unknown> | undefined;
  const items = body.items as Array<Record<string, unknown>> | undefined;

  if (!txn?.id || !Array.isArray(items) || items.length === 0) {
    return fail('transaction.id dan items[] wajib ada', 400);
  }

  // Pre-flight: UPDATE ber-guard diam-diam tidak kena baris bila stok kurang,
  // sehingga header tetap tersimpan dan inventaris jadi korup.
  // Karena itu stok dicek lebih dulu di sini; bila kurang, transaksi batal total.
  const requested = new Map<string, number>();
  for (const it of items) {
    const pid = String(it.product_id ?? '');
    if (!pid) continue;
    requested.set(pid, (requested.get(pid) ?? 0) + Number(it.qty ?? 0));
  }

  if (requested.size > 0) {
    const ids = [...requested.keys()];
    const placeholders = ids.map(() => '?').join(',');
    const { results } = await env.DB.prepare(
      `SELECT id, name, stock FROM products WHERE id IN (${placeholders})`
    ).bind(...(ids as never[])).all<{ id: string; name: string; stock: number }>();

    const stockMap = new Map((results ?? []).map(r => [r.id, r]));
    const problems: string[] = [];

    for (const [pid, qty] of requested) {
      const row = stockMap.get(pid);
      if (!row) {
        problems.push(`Produk ${pid} tidak ditemukan`);
      } else if (row.stock < qty) {
        problems.push(`Stok ${row.name} tidak cukup (tersisa ${row.stock}, diminta ${qty})`);
      }
    }

    if (problems.length) {
      return fail(problems.join('. ') + '. Transaksi dibatalkan.', 409);
    }
  }

  const stmts: D1PreparedStatement[] = [];

  stmts.push(env.DB.prepare(
    `INSERT INTO pos_transactions
     (id, invoice_number, date, time, cashier_name, cashier_id, customer_name,
      customer_phone, customer_id, subtotal, discount_total, tax_ppn, total,
      payment_method, amount_paid, change, status, payment_channel, notes,
      created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    txn.id, txn.invoice_number, txn.date, txn.time ?? '', txn.cashier_name ?? session.name,
    txn.cashier_id ?? session.sub, txn.customer_name ?? '', txn.customer_phone ?? null,
    txn.customer_id ?? null, txn.subtotal ?? 0, txn.discount_total ?? 0,
    txn.tax_ppn ?? 0, txn.total ?? 0, txn.payment_method ?? 'tunai',
    txn.amount_paid ?? 0, txn.change ?? 0, 'selesai',
    txn.payment_channel ?? null, txn.notes ?? null, nowIso(), nowIso()
  ));

  for (const it of items) {
    const productId = String(it.product_id ?? '');
    const qty = Number(it.qty ?? 0);

    stmts.push(env.DB.prepare(
      `INSERT INTO pos_transaction_items
       (id, txn_id, product_id, sku, name, qty, unit, unit_price, subtotal, hpp_price)
       VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(
      String(it.id ?? crypto.randomUUID()), txn.id, productId || null,
      it.sku ?? '', it.name ?? '', qty, it.unit ?? '', it.unit_price ?? 0,
      it.subtotal ?? 0, it.hpp_price ?? 0
    ));

    // Stok tidak boleh minus; dicek & dikurangi di server agar konsisten antar kasir.
    if (productId) {
      stmts.push(env.DB.prepare(
        `UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?`
      ).bind(qty, nowIso(), productId, qty));

      stmts.push(env.DB.prepare(
        `INSERT INTO stock_movements
         (id, date, product_id, product_name, sku, type, qty, unit, reference_no,
          source_location, target_location, notes, pic, created_at)
         VALUES (?,?,?,?,?,'keluar',?,?,?,'Gudang Utama','Konsumen',?,?,?)`
      ).bind(
        `mov-${crypto.randomUUID()}`, String(txn.date ?? ''), productId,
        it.name ?? '', it.sku ?? '', qty, it.unit ?? '',
        String(txn.invoice_number ?? ''), 'Penualan kiosk', txn.cashier_name ?? session.name,
        nowIso()
      ));
    }
  }

  const total = Number(txn.total ?? 0);
  if (total > 0) {
    stmts.push(env.DB.prepare(
      `INSERT INTO journal_entries
       (id, date, ref_no, description, debit_account, debit_amount,
        credit_account, credit_amount, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(
      `jrn-${crypto.randomUUID()}`, String(txn.date ?? ''),
      String(txn.invoice_number ?? ''), `Penjualan kiosk ${txn.invoice_number ?? ''}`,
      'Kas & Bank', total, 'Pendapatan Penjualan', total, nowIso()
    ));
  }

  stmts.push(env.DB.prepare(
    `INSERT INTO audit_logs
     (id, timestamp, user_name, user_id, user_role, action, module, details, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(
    `aud-${crypto.randomUUID()}`, nowIso(), session.name, session.sub, session.role,
    'POS_CHECKOUT', 'Kasir', `Transaksi ${txn.invoice_number ?? ''} totaling ${total}`, nowIso()
  ));

  try {
    await env.DB.batch(stmts);
  } catch (e) {
    const msg = String((e as Error)?.message ?? e);
    if (/constraint|UPDATE products/i.test(msg)) {
      return fail('Stok tidak mencukupi atau data tidak valid. Transaksi dibatalkan.', 409);
    }
    return fail('Gagal menyimpan transaksi', 500);
  }

  return json({ ok: true, id: txn.id }, 201);
}

/** PIN harus 4-8 digit. */
function isValidPin(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4,8}$/.test(pin);
}

/**
 * Pengguna mengganti PIN-nya sendiri.
 * Wajib menyertakan PIN lama agar sesi yang dibajak tidak bisa langsung mencuri akun.
 */
async function handleChangePin(env: Env, req: Request, session: Session) {
  const body = await readJson(req);
  const oldPin = String(body.oldPin ?? '');
  const newPin = String(body.newPin ?? '');

  if (!isValidPin(oldPin)) return fail('PIN lama harus 4-8 digit', 400);
  if (!isValidPin(newPin)) return fail('PIN baru harus 4-8 digit', 400);
  if (oldPin === newPin) return fail('PIN baru harus berbeda dari PIN lama', 400);

  const user = await env.DB.prepare(
    'SELECT pin_hash, pin_salt FROM app_users WHERE id = ? AND active = 1'
  ).bind(session.sub).first<{ pin_hash: string | null; pin_salt: string | null }>();

  if (!user?.pin_hash || !user.pin_salt) {
    return fail('Akun ini belum memiliki PIN', 409);
  }

  const ok = await verifyPin(oldPin, user.pin_salt, user.pin_hash);
  if (!ok) return fail('PIN lama salah', 401);

  const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  await env.DB.prepare(
    'UPDATE app_users SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = ?'
  ).bind(await hashPin(newPin, salt), salt, nowIso(), session.sub).run();

  await env.DB.prepare(
    `INSERT INTO audit_logs
     (id, timestamp, user_name, user_id, user_role, action, module, details, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(
    `aud-${crypto.randomUUID()}`, nowIso(), session.name, session.sub, session.role,
    'CHANGE_PIN', 'Keamanan', `${session.username} mengganti PIN-nya sendiri`, nowIso()
  ).run();

  return json({ ok: true, message: 'PIN berhasil diganti. Gunakan PIN baru saat login berikutnya.' });
}

/** Owner me-reset PIN user lain (untuk yang lupa). */
async function handleResetPin(env: Env, req: Request, session: Session, targetId: string) {
  if (!can(session.role, 'users:write')) {
    return fail('Hanya pemilik (owner) yang dapat me-reset PIN user lain', 403);
  }

  const body = await readJson(req);
  const newPin = String(body.newPin ?? '');
  if (!isValidPin(newPin)) return fail('PIN baru harus 4-8 digit', 400);

  const target = await env.DB.prepare('SELECT username, name FROM app_users WHERE id = ?')
    .bind(targetId).first<{ username: string; name: string }>();
  if (!target) return fail('User tidak ditemukan', 404);

  const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const info = await env.DB.prepare(
    'UPDATE app_users SET pin_hash = ?, pin_salt = ?, updated_at = ? WHERE id = ?'
  ).bind(await hashPin(newPin, salt), salt, nowIso(), targetId).run();

  if (!info.meta?.changes) return fail('Gagal mengubah PIN', 500);

  await env.DB.prepare(
    `INSERT INTO audit_logs
     (id, timestamp, user_name, user_id, user_role, action, module, details, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(
    `aud-${crypto.randomUUID()}`, nowIso(), session.name, session.sub, session.role,
    'RESET_PIN', 'Keamanan',
    `Reset PIN ${target.username} (${target.name}) oleh ${session.username}`, nowIso()
  ).run();

  return json({ ok: true, message: `PIN ${target.username} berhasil di-reset.` });
}

/**
 * Cek lisensi. Setelah tanggal berakhir, tidak ada lagi yang bisa login
 * dan seluruh akses API ditolak.
 *
 * Perbandingan dilakukan per hari (YYYY-MM-DD dihitung di UTC) supaya
 * aplikasi tetap bisa dipakai sampai penghujung hari terakhir.
 */
async function getLicense(env: Env): Promise<{ expiresAt: string; expired: boolean; daysLeft: number }> {
  const row = await env.DB.prepare(
    'SELECT expires_at FROM license_config WHERE id = ?'
  ).bind('main').first<{ expires_at: string }>();

  const expiresAt = row?.expires_at ?? '1970-01-01';

  // Kedaluwarsa mulai 00:00 UTC hari SESUDAH tanggal berakhir.
  const deadline = new Date(`${expiresAt}T00:00:00Z`).getTime();
  const expired = Date.now() >= deadline;

  const daysLeft = Math.ceil((deadline - Date.now()) / 86_400_000);

  return { expiresAt, expired, daysLeft, };
}

/** Dipanggil owner untuk memperpanjang, tanpa perlu sesi login. */
async function handleLicenseExtend(env: Env, req: Request) {
  const body = await readJson(req);
  const username = String(body.username ?? '').trim();
  const pin = String(body.pin ?? '');
  const newExpiresAt = String(body.expiresAt ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiresAt)) {
    return fail('Format tanggal harus YYYY-MM-DD', 400);
  }

  const user = await env.DB.prepare(
    'SELECT id, role, pin_hash, pin_salt, active FROM app_users WHERE username = ?'
  ).bind(username).first<{
    id: string; role: string; pin_hash: string | null; pin_salt: string | null; active: number;
  }>();

  // Verifikasi kredensial owner tanpa membuka sesi baru.
  if (!user || user.active !== 1 || user.role !== 'owner') {
    return fail('Hanya akun owner yang dapat memperpanjang lisensi', 403);
  }
  if (!user.pin_hash || !user.pin_salt) return fail('Akun owner belum memiliki PIN', 409);
  if (!(await verifyPin(pin, user.pin_salt, user.pin_hash))) {
    return fail('PIN salah', 401);
  }

  await env.DB.prepare(
    'UPDATE license_config SET expires_at = ?, updated_at = ? WHERE id = ?'
  ).bind(newExpiresAt, nowIso(), 'main').run();

  await env.DB.prepare(
    `INSERT INTO audit_logs
     (id, timestamp, user_name, user_id, user_role, action, module, details, created_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(
    `aud-${crypto.randomUUID()}`, nowIso(), username, user.id, 'owner',
    'EXTEND_LICENSE', 'Lisensi',
    `Lisensi diperpanjang sampai ${newExpiresAt} oleh ${username}`, nowIso()
  ).run();

  return json({ ok: true, expiresAt: newExpiresAt, message: `Lisensi aktif sampai ${newExpiresAt}.` });
}

const LICENSE_BLOCK_MESSAGE =
  'Masa penggunaan aplikasi telah berakhir. Silakan hubungi pemilik untuk perpanjangan lisensi.';

/* ------------------------------------------------------------------ *
 * Router
 * ------------------------------------------------------------------ */

async function handleApi(env: Env, req: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');

  if (path === 'health') return json({ ok: true, service: 'njn-pos-api' });

  // Status lisensi - publik, supaya layar login bisa menampilkannya.
  if (path === 'license' && req.method === 'GET') {
    const lic = await getLicense(env);
    return json({ ok: true, expiresAt: lic.expiresAt, daysLeft: lic.daysLeft, expired: lic.expired });
  }

  // Perpanjangan oleh owner (butuh kredensial, tidak membuka sesi).
  if (path === 'license/extend' && req.method === 'POST') {
    return handleLicenseExtend(env, req);
  }

  // Gerbang lisensi: setelah masa penggunaan berakhir, semua akses ditolak.
  const license = await getLicense(env);
  if (license.expired) {
    return json({
      ok: false,
      error: LICENSE_BLOCK_MESSAGE,
      code: 'LICENSE_EXPIRED',
      expiresAt: license.expiresAt,
    }, 403);
  }

  if (path === 'auth/login' && req.method === 'POST') return handleLogin(env, req);

  const session = await requireSession(env, req);
  if (session instanceof Response) return session;

  if (path === 'auth/me') {
    return json({
      ok: true,
      user: { id: session.sub, username: session.username, name: session.name, role: session.role },
    });
  }

  if (path === 'pos/checkout' && req.method === 'POST') {
    return handlePosCheckout(env, req, session);
  }

  // Ganti PIN sendiri.
  if (path === 'auth/change-pin' && req.method === 'POST') {
    return handleChangePin(env, req, session);
  }

  // Owner me-reset PIN user lain: /api/users/:id/reset-pin
  const resetMatch = path.match(/^users\/([^/]+)\/reset-pin$/);
  if (resetMatch && req.method === 'POST') {
    return handleResetPin(env, req, session, resetMatch[1]);
  }

  const [collection, id] = path.split('/');
  const spec = RESOURCE_BY_PATH.get(collection);
  if (!spec) return fail(`Endpoint tidak dikenal: /api/${collection}`, 404);

  // Semua user login boleh baca.
  if (req.method === 'GET' && !id) return listResource(env, spec, url);
  if (req.method === 'GET' && id) {
    const found = await env.DB.prepare(`SELECT * FROM ${spec.table} WHERE ${spec.pk} = ?`)
      .bind(id).first();
    if (!found) return fail('Data tidak ditemukan', 404);
    return json({ ok: true, data: found });
  }

  if (spec.perm && !can(session.role, spec.perm)) {
    return fail('Akses ditolak untuk peran ini', 403);
  }

  if (req.method === 'POST' && !id) return createResource(env, spec, req);
  if (req.method === 'PUT' && id) return updateResource(env, spec, id, req);
  if (req.method === 'DELETE' && id) return deleteResource(env, spec, id);

  return fail('Metode tidak didukung', 405);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    try {
      if (url.pathname.startsWith('/api')) {
        await bootstrap(env);
        const res = await handleApi(env, req, url);
        for (const [k, v] of Object.entries(corsHeaders())) res.headers.set(k, v);
        return res;
      }
      // Aset statis / SPA fallback.
      return env.ASSETS.fetch(req);
    } catch (e) {
      return new Response(
        JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders() } }
      );
    }
  },
};

/* ------------------------------------------------------------------ *
 * CRUD generik
 * ------------------------------------------------------------------ */

/** work_checklist disimpan sebagai TEXT JSON. */
function normalizeValue(col: string, value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (col === 'work_checklist' && typeof value !== 'string') {
    return JSON.stringify(value ?? []);
  }
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

/** Ambil hanya kolom yang ada di whitelist, dengan konversi tipe dasar. */
function pickColumns(spec: ResourceSpec, body: Record<string, unknown>) {
  const names: string[] = [];
  const values: unknown[] = [];
  for (const col of spec.columns) {
    if (col === 'created_at' || col === 'updated_at') continue;
    if (!(col in body)) continue;
    names.push(col);
    values.push(normalizeValue(col, body[col]));
  }
  return { names, values };
}

async function listResource(env: Env, spec: ResourceSpec, url: URL) {
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 200) || 200, 1000);
  const offset = Math.max(Number(url.searchParams.get('offset') ?? 0) || 0, 0);
  const search = (url.searchParams.get('q') ?? '').trim();

  let sql = `SELECT * FROM ${spec.table}`;
  const binds: unknown[] = [];

  if (search) {
    const cols = spec.columns.filter(c => /name|code|sku|number|title/i.test(c));
    if (cols.length) {
      sql += ` WHERE (${cols.map(c => `${c} LIKE ?`).join(' OR ')})`;
      binds.push(...cols.map(() => `%${search}%`));
    }
  }

  if (spec.orderBy && spec.columns.includes(spec.orderBy)) {
    sql += ` ORDER BY ${spec.orderBy} ${spec.orderDir ?? 'DESC'}`;
  }
  sql += ' LIMIT ? OFFSET ?';
  binds.push(limit, offset);

  const { results } = await env.DB.prepare(sql).bind(...(binds as never[])).all();
  return json({ ok: true, data: results ?? [], count: results?.length ?? 0 });
}

async function createResource(env: Env, spec: ResourceSpec, req: Request) {
  const body = await readJson(req);
  if (!body.id) return fail('Field id wajib ada', 400);

  const childKey = CHILD_KEY[spec.path];
  const children = childKey ? body[childKey] as Array<Record<string, unknown>> | undefined : undefined;

  const { names, values } = pickColumns(spec, body);
  if (!names.includes('id')) { names.push('id'); values.push(body.id); }
  names.push('created_at', 'updated_at');
  values.push(nowIso(), nowIso());

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO ${spec.table} (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`
    ).bind(...(values as never[])),
  ];

  if (spec.children && Array.isArray(children)) {
    const c = spec.children;
    for (const child of children) {
      const cNames: string[] = [];
      const cValues: unknown[] = [];
      for (const [dbCol, jsonKey] of c.columns) {
        const key = jsonKey ?? dbCol;
        if (!(key in child)) continue;
        cNames.push(dbCol);
        cValues.push(normalizeValue(dbCol, child[key]));
      }
      if (!cNames.includes('id')) {
        cNames.unshift('id');
        cValues.unshift(String(child.id ?? crypto.randomUUID()));
      }
      cNames.push(c.fk);
      cValues.push(String(body.id));
      stmts.push(env.DB.prepare(
        `INSERT INTO ${c.table} (${cNames.join(', ')}) VALUES (${cNames.map(() => '?').join(', ')})`
      ).bind(...(cValues as never[])));
    }
  }

  // Header + semua line item dalam satu batch = atomik.
  await env.DB.batch(stmts);
  const saved = await env.DB.prepare(`SELECT * FROM ${spec.table} WHERE id = ?`).bind(body.id).first();
  return json({ ok: true, data: saved }, 201);
}

async function updateResource(env: Env, spec: ResourceSpec, id: string, req: Request) {
  const body = await readJson(req);
  const { names, values } = pickColumns(spec, body);

  const setParts: string[] = [];
  const binds: unknown[] = [];
  for (let i = 0; i < names.length; i++) {
    if (names[i] === spec.pk || names[i] === 'created_at') continue;
    setParts.push(`${names[i]} = ?`);
    binds.push(values[i]);
  }
  if (!setParts.length) return fail('Tidak ada kolom untuk diperbarui', 400);

  setParts.push('updated_at = ?');
  binds.push(nowIso(), id);

  await env.DB.prepare(
    `UPDATE ${spec.table} SET ${setParts.join(', ')} WHERE ${spec.pk} = ?`
  ).bind(...(binds as never[])).run();

  const saved = await env.DB.prepare(`SELECT * FROM ${spec.table} WHERE ${spec.pk} = ?`).bind(id).first();
  if (!saved) return fail('Data tidak ditemukan', 404);
  return json({ ok: true, data: saved });
}

async function deleteResource(env: Env, spec: ResourceSpec, id: string) {
  const info = await env.DB.prepare(`DELETE FROM ${spec.table} WHERE ${spec.pk} = ?`).bind(id).run();
  if (!info.meta?.changes) return fail('Data tidak ditemukan', 404);
  return json({ ok: true, deleted: id });
}
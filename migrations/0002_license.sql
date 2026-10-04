-- ============================================================
-- Migrasi 0002: Konfigurasi lisensi aplikasi
-- Sengaja TIDAK didaftarkan di registry resource API supaya tidak
-- bisa diubah lewat CRUD umum. Hanya lewat endpoint /api/license/*.
-- ============================================================

CREATE TABLE license_config (
  id          TEXT PRIMARY KEY DEFAULT 'main',
  expires_at  TEXT NOT NULL,
  -- Tanggal berakhir penggunaan aplikasi (format YYYY-MM-DD, UTC).
  issued_to   TEXT NOT NULL DEFAULT '',
  notes       TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO license_config (id, expires_at, issued_to, notes)
VALUES ('main', '2026-10-10', 'Developer', 'Lisensi penggunaan aplikasi, berakhir 10 Oktober 2026');
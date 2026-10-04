CREATE TABLE units (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE suppliers (
  id             TEXT PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  pic            TEXT NOT NULL DEFAULT '',
  phone          TEXT NOT NULL DEFAULT '',
  email          TEXT,
  address        TEXT NOT NULL DEFAULT '',
  bank_name      TEXT NOT NULL DEFAULT '',
  bank_account   TEXT NOT NULL DEFAULT '',
  bank_holder    TEXT NOT NULL DEFAULT '',
  current_payable REAL NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_suppliers_name ON suppliers(name);

CREATE TABLE customers (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  name               TEXT NOT NULL,
  company            TEXT,
  phone              TEXT NOT NULL DEFAULT '',
  email              TEXT,
  address            TEXT NOT NULL DEFAULT '',
  type               TEXT NOT NULL DEFAULT 'retail'
                       CHECK (type IN ('retail','kontraktor','grosir')),
  credit_limit       REAL NOT NULL DEFAULT 0,
  current_receivable REAL NOT NULL DEFAULT 0,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_customers_name ON customers(name);

CREATE INDEX idx_customers_type ON customers(type);

CREATE TABLE products (
  id                     TEXT PRIMARY KEY,
  sku                    TEXT NOT NULL UNIQUE,
  barcode                TEXT,
  name                   TEXT NOT NULL,
  category               TEXT NOT NULL DEFAULT '',
  brand                  TEXT,
  unit                   TEXT NOT NULL DEFAULT '',
  image_url              TEXT,
  stock                  REAL NOT NULL DEFAULT 0,
  min_stock              REAL NOT NULL DEFAULT 0,
  hpp_price              REAL NOT NULL DEFAULT 0,
  price                  REAL NOT NULL DEFAULT 0,
  price_wholesale        REAL,
  price_project          REAL,
  rack_location          TEXT,
  specification          TEXT,
  monthly_avg_sales      REAL NOT NULL DEFAULT 0,
  daily_avg_sales        REAL NOT NULL DEFAULT 0,
  lead_time_days         REAL NOT NULL DEFAULT 7,
  estimated_days_left    REAL NOT NULL DEFAULT 0,
  recommended_reorder_qty REAL NOT NULL DEFAULT 0,
  urgency                TEXT NOT NULL DEFAULT 'optimal'
                           CHECK (urgency IN ('critical','warning','optimal','surplus')),
  created_at             TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_products_name ON products(name);

CREATE INDEX idx_products_category ON products(category);

CREATE INDEX idx_products_urgency ON products(urgency);

CREATE INDEX idx_products_barcode ON products(barcode);

CREATE TABLE bank_accounts (
  id             TEXT PRIMARY KEY,
  bank_name      TEXT NOT NULL,
  account_number TEXT NOT NULL DEFAULT '',
  holder_name    TEXT NOT NULL DEFAULT '',
  balance        REAL NOT NULL DEFAULT 0,
  type           TEXT NOT NULL DEFAULT 'bank'
                   CHECK (type IN ('kas_toko','bank')),
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE app_users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'kasir'
                  CHECK (role IN ('owner','kasir','gudang','keuangan','sales')),
  pin_hash      TEXT,
  pin_salt      TEXT,
  active        INTEGER NOT NULL DEFAULT 1,
  last_login    TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE company_settings (
  id                    TEXT PRIMARY KEY DEFAULT 'default',
  company_name          TEXT NOT NULL DEFAULT '',
  brand_tagline         TEXT NOT NULL DEFAULT '',
  npwp                  TEXT NOT NULL DEFAULT '',
  nib                   TEXT NOT NULL DEFAULT '',
  address               TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL DEFAULT '',
  email                 TEXT NOT NULL DEFAULT '',
  website               TEXT NOT NULL DEFAULT '',
  invoice_prefix        TEXT NOT NULL DEFAULT '',
  sph_prefix            TEXT NOT NULL DEFAULT '',
  spk_prefix            TEXT NOT NULL DEFAULT '',
  po_prefix             TEXT NOT NULL DEFAULT '',
  do_prefix             TEXT NOT NULL DEFAULT '',
  ppn_rate              REAL NOT NULL DEFAULT 11,
  thermal_paper_width   TEXT NOT NULL DEFAULT '80mm'
                          CHECK (thermal_paper_width IN ('58mm','80mm')),
  qris_nmid             TEXT NOT NULL DEFAULT '',
  qris_bank             TEXT NOT NULL DEFAULT '',
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pos_transactions (
  id                 TEXT PRIMARY KEY,
  invoice_number     TEXT NOT NULL UNIQUE,
  date               TEXT NOT NULL,
  time               TEXT NOT NULL DEFAULT '',
  cashier_name       TEXT NOT NULL DEFAULT '',
  cashier_id         TEXT,
  customer_name      TEXT NOT NULL DEFAULT '',
  customer_phone     TEXT,
  customer_id        TEXT,
  subtotal           REAL NOT NULL DEFAULT 0,
  discount_total     REAL NOT NULL DEFAULT 0,
  tax_ppn            REAL NOT NULL DEFAULT 0,
  total              REAL NOT NULL DEFAULT 0,
  payment_method     TEXT NOT NULL DEFAULT 'tunai'
                       CHECK (payment_method IN ('tunai','qris','transfer','tempo')),
  amount_paid        REAL NOT NULL DEFAULT 0,
  change             REAL NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'selesai'
                       CHECK (status IN ('selesai','dibatalkan')),
  payment_channel    TEXT,
  notes              TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pos_date ON pos_transactions(date);

CREATE INDEX idx_pos_cashier ON pos_transactions(cashier_id);

CREATE INDEX idx_pos_status ON pos_transactions(status);

CREATE TABLE pos_transaction_items (
  id          TEXT PRIMARY KEY,
  txn_id      TEXT NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  sku         TEXT NOT NULL DEFAULT '',
  name        TEXT NOT NULL,
  qty         REAL NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT '',
  unit_price  REAL NOT NULL DEFAULT 0,
  subtotal    REAL NOT NULL DEFAULT 0,
  hpp_price   REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_pos_items_txn ON pos_transaction_items(txn_id);

CREATE INDEX idx_pos_items_product ON pos_transaction_items(product_id);

CREATE TABLE purchase_orders (
  id             TEXT PRIMARY KEY,
  po_number      TEXT NOT NULL UNIQUE,
  supplier_id    TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name  TEXT NOT NULL DEFAULT '',
  supplier_phone TEXT,
  date           TEXT NOT NULL,
  expected_date  TEXT NOT NULL DEFAULT '',
  subtotal       REAL NOT NULL DEFAULT 0,
  tax_ppn        REAL NOT NULL DEFAULT 0,
  total_amount   REAL NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','sent','received','cancelled')),
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_po_date ON purchase_orders(date);

CREATE INDEX idx_po_status ON purchase_orders(status);

CREATE TABLE purchase_order_items (
  id         TEXT PRIMARY KEY,
  po_id      TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  sku        TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL,
  qty        REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  unit_price REAL NOT NULL DEFAULT 0,
  subtotal   REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_po_items_po ON purchase_order_items(po_id);

CREATE TABLE purchase_invoices (
  id             TEXT PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  po_reference   TEXT,
  supplier_id    TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
  supplier_name  TEXT NOT NULL DEFAULT '',
  date           TEXT NOT NULL,
  due_date       TEXT NOT NULL DEFAULT '',
  warehouse      TEXT NOT NULL DEFAULT '',
  subtotal       REAL NOT NULL DEFAULT 0,
  discount       REAL NOT NULL DEFAULT 0,
  tax_ppn        REAL NOT NULL DEFAULT 0,
  total_amount   REAL NOT NULL DEFAULT 0,
  paid_amount    REAL NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'unpaid'
                   CHECK (status IN ('paid','unpaid')),
  payment_method TEXT NOT NULL DEFAULT '',
  received_by    TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_pinv_date ON purchase_invoices(date);

CREATE INDEX idx_pinv_status ON purchase_invoices(status);

CREATE TABLE purchase_invoice_items (
  id         TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  sku        TEXT NOT NULL DEFAULT '',
  name       TEXT NOT NULL,
  qty        REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  unit_price REAL NOT NULL DEFAULT 0,
  subtotal   REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_pinv_items_inv ON purchase_invoice_items(invoice_id);

CREATE TABLE sph_quotations (
  id                   TEXT PRIMARY KEY,
  code                 TEXT NOT NULL UNIQUE,
  customer_id          TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name        TEXT NOT NULL DEFAULT '',
  customer_phone       TEXT,
  project_title        TEXT NOT NULL DEFAULT '',
  date                 TEXT NOT NULL,
  valid_until          TEXT NOT NULL DEFAULT '',
  items_summary        TEXT NOT NULL DEFAULT '',
  subtotal             REAL NOT NULL DEFAULT 0,
  ppn_amount           REAL NOT NULL DEFAULT 0,
  total_amount         REAL NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'waiting_po'
                         CHECK (status IN ('waiting_po','converted_invoice','cancelled')),
  status_label         TEXT NOT NULL DEFAULT '',
  terms_and_conditions TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sph_date ON sph_quotations(date);

CREATE TABLE sph_items (
  id         TEXT PRIMARY KEY,
  sph_id     TEXT NOT NULL REFERENCES sph_quotations(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  qty        REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  unit_price REAL NOT NULL DEFAULT 0,
  subtotal   REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_sph_items_sph ON sph_items(sph_id);

CREATE TABLE sales_orders (
  id                   TEXT PRIMARY KEY,
  so_number            TEXT NOT NULL UNIQUE,
  sph_reference        TEXT,
  customer_id          TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name        TEXT NOT NULL DEFAULT '',
  customer_phone       TEXT,
  order_date           TEXT NOT NULL,
  delivery_date_target TEXT NOT NULL DEFAULT '',
  total_amount         REAL NOT NULL DEFAULT 0,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes                TEXT,
  created_at           TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_so_date ON sales_orders(order_date);

CREATE INDEX idx_so_status ON sales_orders(status);

CREATE TABLE sales_order_items (
  id         TEXT PRIMARY KEY,
  so_id      TEXT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  qty        REAL NOT NULL DEFAULT 0,
  unit       TEXT NOT NULL DEFAULT '',
  unit_price REAL NOT NULL DEFAULT 0,
subtotal   REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_so_items_so ON sales_order_items(so_id);

CREATE TABLE sales_invoices (
  id                TEXT PRIMARY KEY,
  invoice_number    TEXT NOT NULL UNIQUE,
  date              TEXT NOT NULL,
  due_date          TEXT NOT NULL DEFAULT '',
  customer_id       TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name     TEXT NOT NULL DEFAULT '',
  customer_phone    TEXT,
  customer_address  TEXT,
  project_name      TEXT,
  reference_sph     TEXT,
  reference_po      TEXT,
  reference_so      TEXT,
  do_reference      TEXT,
  subtotal          REAL NOT NULL DEFAULT 0,
  discount          REAL NOT NULL DEFAULT 0,
  ppn_rate          REAL NOT NULL DEFAULT 11,
  tax_ppn           REAL NOT NULL DEFAULT 0,
  pph_type          TEXT NOT NULL DEFAULT 'none',
  pph_rate          REAL NOT NULL DEFAULT 0,
  tax_pph           REAL NOT NULL DEFAULT 0,
  total_amount      REAL NOT NULL DEFAULT 0,
  paid_amount       REAL NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'unpaid'
                      CHECK (status IN ('draft','sent','unpaid','paid','overdue')),
  payment_method    TEXT,
  payment_date      TEXT,
  notes             TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sinv_date ON sales_invoices(date);

CREATE INDEX idx_sinv_status ON sales_invoices(status);

CREATE INDEX idx_sinv_customer ON sales_invoices(customer_id);

CREATE TABLE sales_invoice_items (
  id          TEXT PRIMARY KEY,
  invoice_id  TEXT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id  TEXT REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  qty         REAL NOT NULL DEFAULT 0,
  unit        TEXT NOT NULL DEFAULT '',
  unit_price  REAL NOT NULL DEFAULT 0,
  total       REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_sinv_items_inv ON sales_invoice_items(invoice_id);

CREATE TABLE invoice_payments (
  id             TEXT PRIMARY KEY,
  invoice_id     TEXT NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  date           TEXT NOT NULL,
  amount         REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT '',
  bank_account   TEXT NOT NULL DEFAULT '',
  ref_no         TEXT NOT NULL DEFAULT '',
  notes          TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_inv_pay_invoice ON invoice_payments(invoice_id);

CREATE TABLE delivery_orders (
  id                  TEXT PRIMARY KEY,
  do_number           TEXT NOT NULL UNIQUE,
  invoice_reference   TEXT NOT NULL DEFAULT '',
  customer_id         TEXT REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       TEXT NOT NULL DEFAULT '',
  destination_address TEXT NOT NULL DEFAULT '',
  driver_name         TEXT NOT NULL DEFAULT '',
  vehicle_number      TEXT NOT NULL DEFAULT '',
  expedition          TEXT NOT NULL DEFAULT '',
  tracking_number     TEXT NOT NULL DEFAULT '',
  shipping_date       TEXT NOT NULL DEFAULT '',
  estimated_arrival   TEXT NOT NULL DEFAULT '',
  status              TEXT NOT NULL DEFAULT 'diproses'
                        CHECK (status IN ('diproses','dikirim','diterima')),
  recipient_notes     TEXT,
  received_date       TEXT,
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_do_date ON delivery_orders(shipping_date);

CREATE INDEX idx_do_status ON delivery_orders(status);

CREATE TABLE delivery_order_items (
  id           TEXT PRIMARY KEY,
  do_id        TEXT NOT NULL REFERENCES delivery_orders(id) ON DELETE CASCADE,
  product_id   TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  qty          REAL NOT NULL DEFAULT 0,
  unit         TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_do_items_do ON delivery_order_items(do_id);

CREATE TABLE stock_movements (
  id               TEXT PRIMARY KEY,
  date             TEXT NOT NULL,
  product_id       TEXT REFERENCES products(id) ON DELETE SET NULL,
  product_name     TEXT NOT NULL DEFAULT '',
  sku              TEXT NOT NULL DEFAULT '',
  type             TEXT NOT NULL
                     CHECK (type IN ('masuk','keluar','transfer','opname')),
  qty              REAL NOT NULL DEFAULT 0,
  unit             TEXT NOT NULL DEFAULT '',
  reference_no     TEXT NOT NULL DEFAULT '',
  source_location  TEXT NOT NULL DEFAULT '',
  target_location  TEXT NOT NULL DEFAULT '',
  notes            TEXT NOT NULL DEFAULT '',
  pic              TEXT NOT NULL DEFAULT '',
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_stockmov_date ON stock_movements(date);

CREATE INDEX idx_stockmov_product ON stock_movements(product_id);

CREATE INDEX idx_stockmov_type ON stock_movements(type);

CREATE TABLE stock_opnames (
  id                    TEXT PRIMARY KEY,
  opname_number         TEXT NOT NULL UNIQUE,
  date                  TEXT NOT NULL,
  warehouse             TEXT NOT NULL DEFAULT '',
  auditor               TEXT NOT NULL DEFAULT '',
  total_difference_amount REAL NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','posted')),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_opname_date ON stock_opnames(date);

CREATE TABLE stock_opname_items (
  id                  TEXT PRIMARY KEY,
  opname_id           TEXT NOT NULL REFERENCES stock_opnames(id) ON DELETE CASCADE,
  product_id          TEXT REFERENCES products(id) ON DELETE SET NULL,
  sku                 TEXT NOT NULL DEFAULT '',
  name                TEXT NOT NULL,
  system_qty          REAL NOT NULL DEFAULT 0,
  physical_qty        REAL NOT NULL DEFAULT 0,
  difference_qty      REAL NOT NULL DEFAULT 0,
  hpp_price           REAL NOT NULL DEFAULT 0,
  total_diff_amount   REAL NOT NULL DEFAULT 0,
  notes               TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_opname_items_opname ON stock_opname_items(opname_id);

CREATE TABLE spk_contracts (
  id              TEXT PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,
  partner_name    TEXT NOT NULL DEFAULT '',
  pic_name        TEXT NOT NULL DEFAULT '',
  partner_type    TEXT NOT NULL DEFAULT '',
  scope           TEXT NOT NULL DEFAULT '',
  contract_value  REAL NOT NULL DEFAULT 0,
  realized_amount REAL NOT NULL DEFAULT 0,
  start_date      TEXT NOT NULL DEFAULT '',
  end_date        TEXT NOT NULL DEFAULT '',
  duration        TEXT NOT NULL DEFAULT '',
  payment_term    TEXT NOT NULL DEFAULT '',
  discount_tier   TEXT NOT NULL DEFAULT '',
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','completed','pending')),
  status_label    TEXT NOT NULL DEFAULT '',
  work_checklist  TEXT NOT NULL DEFAULT '[]',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_spk_status ON spk_contracts(status);

CREATE TABLE cash_transactions (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  description        TEXT NOT NULL DEFAULT '',
  channel            TEXT NOT NULL DEFAULT '',
  category           TEXT NOT NULL DEFAULT '',
  date               TEXT NOT NULL,
  type               TEXT NOT NULL CHECK (type IN ('masuk','keluar')),
  amount             REAL NOT NULL DEFAULT 0,
  bank_id            TEXT REFERENCES bank_accounts(id) ON DELETE SET NULL,
  reference_document TEXT,
  created_at         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_cash_date ON cash_transactions(date);

CREATE INDEX idx_cash_type ON cash_transactions(type);

CREATE TABLE journal_entries (
  id             TEXT PRIMARY KEY,
  date           TEXT NOT NULL,
  ref_no         TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL DEFAULT '',
  debit_account  TEXT NOT NULL DEFAULT '',
  debit_amount   REAL NOT NULL DEFAULT 0,
  credit_account TEXT NOT NULL DEFAULT '',
  credit_amount  REAL NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_journal_date ON journal_entries(date);

CREATE TABLE audit_logs (
  id          TEXT PRIMARY KEY,
  timestamp   TEXT NOT NULL,
  user_name   TEXT NOT NULL DEFAULT '',
  user_id     TEXT,
  user_role   TEXT NOT NULL DEFAULT '',
  action      TEXT NOT NULL DEFAULT '',
  module      TEXT NOT NULL DEFAULT '',
  details     TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_audit_ts ON audit_logs(timestamp);

CREATE INDEX idx_audit_module ON audit_logs(module);

/**
 * Registry resource API.
 *
 * Whitelist tabel yang boleh diakses lewat HTTP - tidak ada nama tabel
 * yang datang mentah dari request, sehingga tidak ada permukaan SQL injection.
 */

import type { Permission } from './auth';

export interface ChildSpec {
  table: string;
  fk: string;
  columns: Array<[string, string?]>; // [nama kolom di DB, kolom JSON opsional]
}

export interface ResourceSpec {
  /** Prefix route, mis. 'products' -> /api/products */
  path: string;
  table: string;
  /** Izin yang dibutuhkan untuk menulis. Null = semua user login boleh tulis. */
  perm: Permission | null;
  /** Primary key. */
  pk: string;
  /** Kolom yang boleh ditulis (whitelist kolom). */
  columns: string[];
  /** Child table untuk line item. */
  children?: ChildSpec;
  /** Urutan default saat list. */
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

/** Kolom generik yang berlaku untuk hampir semua tabel. */
const BASE = ['id', 'created_at', 'updated_at'];

export const RESOURCES: ResourceSpec[] = [
  {
    path: 'products', table: 'products', perm: 'products:write', pk: 'id',
    orderBy: 'name', orderDir: 'ASC',
    columns: [...BASE, 'sku', 'barcode', 'name', 'category', 'brand', 'unit',
      'image_url', 'stock', 'min_stock', 'hpp_price', 'price', 'price_wholesale',
      'price_project', 'rack_location', 'specification', 'monthly_avg_sales',
      'daily_avg_sales', 'lead_time_days', 'estimated_days_left',
      'recommended_reorder_qty', 'urgency'],
  },
  {
    path: 'customers', table: 'customers', perm: 'customers:write', pk: 'id',
    orderBy: 'name', orderDir: 'ASC',
    columns: [...BASE, 'code', 'name', 'company', 'phone', 'email', 'address',
      'type', 'credit_limit', 'current_receivable', 'notes'],
  },
  {
    path: 'suppliers', table: 'suppliers', perm: 'suppliers:write', pk: 'id',
    orderBy: 'name', orderDir: 'ASC',
    columns: [...BASE, 'code', 'name', 'pic', 'phone', 'email', 'address',
      'bank_name', 'bank_account', 'bank_holder', 'current_payable'],
  },
  {
    path: 'units', table: 'units', perm: null, pk: 'id',
    orderBy: 'name', orderDir: 'ASC',
    columns: [...BASE, 'code', 'name'],
  },
  {
    path: 'bank-accounts', table: 'bank_accounts', perm: 'finance:write', pk: 'id',
    orderBy: 'bank_name', orderDir: 'ASC',
    columns: [...BASE, 'bank_name', 'account_number', 'holder_name', 'balance', 'type'],
  },
  {
    path: 'users', table: 'app_users', perm: 'users:write', pk: 'id',
    orderBy: 'name', orderDir: 'ASC',
    // pin_hash / pin_salt sengaja TIDAK bisa ditulis lewat CRUD umum -
    // PIN hanya berubah lewat /api/auth/change-pin dan /api/users/:id/reset-pin.
    columns: [...BASE, 'username', 'name', 'role', 'active', 'last_login'],
  },
  {
    path: 'stock-movements', table: 'stock_movements', perm: 'products:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'date', 'product_id', 'product_name', 'sku', 'type', 'qty',
      'unit', 'reference_no', 'source_location', 'target_location', 'notes', 'pic'],
  },
  {
    path: 'stock-opnames', table: 'stock_opnames', perm: 'products:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'opname_number', 'date', 'warehouse', 'auditor',
      'total_difference_amount', 'status'],
    children: {
      table: 'stock_opname_items', fk: 'opname_id',
      columns: [['id', 'id'], ['product_id'], ['sku'], ['name'], ['system_qty'],
        ['physical_qty'], ['difference_qty'], ['hpp_price'], ['total_diff_amount'], ['notes']],
    },
  },
  {
    path: 'pos-transactions', table: 'pos_transactions', perm: 'pos:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'invoice_number', 'date', 'time', 'cashier_name', 'cashier_id',
      'customer_name', 'customer_phone', 'customer_id', 'subtotal', 'discount_total',
      'tax_ppn', 'total', 'payment_method', 'amount_paid', 'change', 'status',
      'payment_channel', 'notes'],
    children: {
      table: 'pos_transaction_items', fk: 'txn_id',
      columns: [['id', 'id'], ['product_id'], ['sku'], ['name'], ['qty'], ['unit'],
        ['unit_price'], ['subtotal'], ['hpp_price']],
    },
  },
  {
    path: 'purchase-orders', table: 'purchase_orders', perm: 'purchase:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'po_number', 'supplier_id', 'supplier_name', 'supplier_phone',
      'date', 'expected_date', 'subtotal', 'tax_ppn', 'total_amount', 'status', 'notes'],
    children: {
      table: 'purchase_order_items', fk: 'po_id',
      columns: [['id', 'id'], ['product_id'], ['sku'], ['name'], ['qty'], ['unit'],
        ['unit_price'], ['subtotal']],
    },
  },
  {
    path: 'purchase-invoices', table: 'purchase_invoices', perm: 'purchase:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'invoice_number', 'po_reference', 'supplier_id', 'supplier_name',
      'date', 'due_date', 'warehouse', 'subtotal', 'discount', 'tax_ppn',
      'total_amount', 'paid_amount', 'status', 'payment_method', 'received_by'],
    children: {
      table: 'purchase_invoice_items', fk: 'invoice_id',
      columns: [['id', 'id'], ['product_id'], ['sku'], ['name'], ['qty'], ['unit'],
        ['unit_price'], ['subtotal']],
    },
  },
];

RESOURCES.push(
  {
    path: 'sph-quotations', table: 'sph_quotations', perm: 'sales:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'code', 'customer_id', 'customer_name', 'customer_phone',
      'project_title', 'date', 'valid_until', 'items_summary', 'subtotal',
      'ppn_amount', 'total_amount', 'status', 'status_label', 'terms_and_conditions'],
    children: {
      table: 'sph_items', fk: 'sph_id',
      columns: [['id', 'id'], ['product_id'], ['name'], ['qty'], ['unit'],
        ['unit_price'], ['subtotal']],
    },
  },
  {
    path: 'sales-orders', table: 'sales_orders', perm: 'sales:write', pk: 'id',
    orderBy: 'order_date', orderDir: 'DESC',
    columns: [...BASE, 'so_number', 'sph_reference', 'customer_id', 'customer_name',
      'customer_phone', 'order_date', 'delivery_date_target', 'total_amount',
      'status', 'notes'],
    children: {
      table: 'sales_order_items', fk: 'so_id',
      columns: [['id', 'id'], ['product_id'], ['name'], ['qty'], ['unit'],
        ['unit_price'], ['subtotal']],
    },
  },
  {
    path: 'sales-invoices', table: 'sales_invoices', perm: 'sales:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'invoice_number', 'date', 'due_date', 'customer_id',
      'customer_name', 'customer_phone', 'customer_address', 'project_name',
      'reference_sph', 'reference_po', 'reference_so', 'do_reference', 'subtotal',
      'discount', 'ppn_rate', 'tax_ppn', 'pph_type', 'pph_rate', 'tax_pph',
      'total_amount', 'paid_amount', 'status', 'payment_method', 'payment_date', 'notes'],
    children: {
      table: 'sales_invoice_items', fk: 'invoice_id',
      columns: [['id', 'id'], ['product_id'], ['description'], ['qty'], ['unit'],
        ['unit_price'], ['total']],
    },
  },
  {
    path: 'invoice-payments', table: 'invoice_payments', perm: 'finance:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'invoice_id', 'date', 'amount', 'payment_method',
      'bank_account', 'ref_no', 'notes'],
  },
  {
    path: 'delivery-orders', table: 'delivery_orders', perm: 'shipping:write', pk: 'id',
    orderBy: 'shipping_date', orderDir: 'DESC',
    columns: [...BASE, 'do_number', 'invoice_reference', 'customer_id', 'customer_name',
      'destination_address', 'driver_name', 'vehicle_number', 'expedition',
      'tracking_number', 'shipping_date', 'estimated_arrival', 'status',
      'recipient_notes', 'received_date'],
    children: {
      table: 'delivery_order_items', fk: 'do_id',
      columns: [['id', 'id'], ['product_id'], ['product_name'], ['qty'], ['unit']],
    },
  },
  {
    path: 'spk-contracts', table: 'spk_contracts', perm: 'spk:write', pk: 'id',
    orderBy: 'start_date', orderDir: 'DESC',
    columns: [...BASE, 'code', 'partner_name', 'pic_name', 'partner_type', 'scope',
      'contract_value', 'realized_amount', 'start_date', 'end_date', 'duration',
      'payment_term', 'discount_tier', 'status', 'status_label', 'work_checklist'],
  },
  {
    path: 'cash-transactions', table: 'cash_transactions', perm: 'finance:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'code', 'description', 'channel', 'category', 'date',
      'type', 'amount', 'bank_id', 'reference_document'],
  },
  {
    path: 'journal-entries', table: 'journal_entries', perm: 'finance:write', pk: 'id',
    orderBy: 'date', orderDir: 'DESC',
    columns: [...BASE, 'date', 'ref_no', 'description', 'debit_account',
      'debit_amount', 'credit_account', 'credit_amount'],
  },
  {
    path: 'audit-logs', table: 'audit_logs', perm: 'audit:write', pk: 'id',
    orderBy: 'timestamp', orderDir: 'DESC',
    columns: [...BASE, 'timestamp', 'user_name', 'user_id', 'user_role',
      'action', 'module', 'details'],
  },
  {
    path: 'company-settings', table: 'company_settings', perm: 'settings:write', pk: 'id',
    columns: [...BASE, 'company_name', 'brand_tagline', 'npwp', 'nib', 'address',
      'phone', 'email', 'website', 'invoice_prefix', 'sph_prefix', 'spk_prefix',
      'po_prefix', 'do_prefix', 'ppn_rate', 'thermal_paper_width',
      'qris_nmid', 'qris_bank'],
  },
);

export const RESOURCE_BY_PATH = new Map(RESOURCES.map(r => [r.path, r]));

/** Nama key child item pada payload JSON. */
export const CHILD_KEY: Record<string, string> = {
  'pos-transactions': 'items',
  'purchase-orders': 'items',
  'purchase-invoices': 'items',
  'sph-quotations': 'items',
  'sales-orders': 'items',
  'sales-invoices': 'items',
  'delivery-orders': 'items',
  'stock-opnames': 'items',
};
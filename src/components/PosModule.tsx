import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  ArrowRight,
  Printer,
  Barcode,
  Search,
  Percent,
  CheckCircle2,
  History,
  QrCode,
  CreditCard,
  Banknote,
  Send,
  User,
  Clock,
  X
} from 'lucide-react';
import { store } from '../store';
import { PosProduct, PosCartItem, PosTransaction } from '../types';
import { formatRupiah, formatNumber } from '../utils/format';
import { ProductImage } from './ProductImage';

interface PosModuleProps {
  onOpenQrisModal: (total: number, onConfirm: () => void) => void;
  onOpenReceipt: (data: any) => void;
  onNavigate: (tab: string) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const PosModule: React.FC<PosModuleProps> = ({
  onOpenQrisModal,
  onOpenReceipt,
  onNavigate,
  onNotify
}) => {
  const [activeView, setActiveView] = useState<'kasir' | 'riwayat'>('kasir');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [qty, setQty] = useState(1);
  const [tier, setTier] = useState<'retail' | 'contractor' | 'project'>('retail');
  const [customerName, setCustomerName] = useState('Pelanggan Walk-In');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [payMethod, setPayMethod] = useState<'tunai' | 'qris' | 'transfer' | 'tempo'>('tunai');
  const [cashReceived, setCashReceived] = useState('');
  const [discountNominal, setDiscountNominal] = useState(0);
  const [isTaxIncluded, setIsTaxIncluded] = useState(false);
  const [searchTermHistory, setSearchTermHistory] = useState('');

  const products = store.getProducts();
  const customers = store.getCustomers();
  const selectedProduct = products.find(p => p.id === selectedProductId);
  const posHistory = store.getPosTransactions();

  // Instant Barcode Scan handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const found = products.find(p =>
      (p.barcode && p.barcode.toLowerCase() === query) ||
      p.sku.toLowerCase() === query ||
      p.name.toLowerCase().includes(query)
    );

    if (found) {
      if (found.stock <= 0) {
        onNotify?.(`Stok barang ${found.name} habis (0 ${found.unit})!`, 'error');
        setBarcodeInput('');
        return;
      }
      addToCartWithProduct(found, 1);
      onNotify?.(`+1 ${found.name} dimasukkan ke keranjang`, 'success');
      setBarcodeInput('');
    } else {
      onNotify?.(`Barang dengan barcode/SKU "${barcodeInput}" tidak ditemukan!`, 'error');
    }
  };

  const addToCartWithProduct = (product: PosProduct, amount: number) => {
    let unitPrice = product.price;
    if (tier === 'contractor') unitPrice = product.priceProject || Math.round(product.price * 0.9);
    if (tier === 'project') unitPrice = product.priceWholesale || Math.round(product.price * 0.95);

    const existingIndex = cart.findIndex(it => it.product.id === product.id);
    if (existingIndex >= 0) {
      const currentInCart = cart[existingIndex].qty;
      if (currentInCart + amount > product.stock) {
        onNotify?.(`Stok tidak mencukupi! Sisa stok ready: ${product.stock} ${product.unit}`, 'error');
        return;
      }
      const updated = [...cart];
      updated[existingIndex].qty += amount;
      setCart(updated);
    } else {
      setCart([...cart, { product, qty: amount, customPrice: unitPrice }]);
    }
  };

  const handleAddToCart = () => {
    if (!selectedProduct) {
      onNotify?.('Pilih produk terlebih dahulu!', 'error');
      return;
    }
    if (qty <= 0) return;
    addToCartWithProduct(selectedProduct, qty);
    setQty(1);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.qty + delta;
          if (newQty <= 0) return null;
          if (newQty > item.product.stock) {
            onNotify?.(`Maksimal stok tercapai (${item.product.stock} ${item.product.unit})!`, 'error');
            return item;
          }
          return { ...item, qty: newQty };
        }
        return item;
      }).filter(Boolean) as PosCartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter(it => it.product.id !== productId));
  };

  // Subtotal calculations
  const rawSubtotal = cart.reduce((sum, it) => {
    const price = it.customPrice !== undefined ? it.customPrice : it.product.price;
    return sum + (price * it.qty);
  }, 0);

  const subtotalAfterDiscount = Math.max(0, rawSubtotal - discountNominal);
  const taxPpn = isTaxIncluded ? Math.round(subtotalAfterDiscount * 0.11) : 0;
  const grandTotal = subtotalAfterDiscount + taxPpn;

  const cashVal = parseFloat(cashReceived) || 0;
  const changeVal = Math.max(0, cashVal - grandTotal);

  // Complete Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      onNotify?.('Keranjang belanja masih kosong!', 'error');
      return;
    }

    if (payMethod === 'tunai' && cashVal < grandTotal) {
      onNotify?.('Jumlah uang tunai yang diterima kurang dari total belanja!', 'error');
      return;
    }

    const saleItems = cart.map(it => {
      const price = it.customPrice !== undefined ? it.customPrice : it.product.price;
      return {
        productId: it.product.id,
        sku: it.product.sku,
        name: it.product.name,
        qty: it.qty,
        unit: it.product.unit,
        unitPrice: price,
        subtotal: price * it.qty
      };
    });

    const newSale = store.recordPosSale({
      cashierName: store.getCurrentUser().name,
      customerName,
      customerPhone,
      items: saleItems,
      subtotal: rawSubtotal,
      discountTotal: discountNominal,
      taxPpn,
      total: grandTotal,
      paymentMethod: payMethod,
      amountPaid: payMethod === 'tunai' ? cashVal : grandTotal,
      change: payMethod === 'tunai' ? changeVal : 0
    });

    onNotify?.(`Transaksi ${newSale.invoiceNumber} berhasil diselesaikan!`, 'success');

    // Trigger Print Receipt preview
    onOpenReceipt({
      invoiceNumber: newSale.invoiceNumber,
      date: newSale.date,
      time: newSale.time,
      cashierName: newSale.cashierName,
      customerName: newSale.customerName,
      customerPhone: newSale.customerPhone,
      items: newSale.items,
      subtotal: newSale.subtotal,
      discount: newSale.discountTotal,
      taxPpn: newSale.taxPpn,
      total: newSale.total,
      paymentMethod: newSale.paymentMethod,
      amountPaid: newSale.amountPaid,
      change: newSale.change
    });

    // Reset Form
    setCart([]);
    setCashReceived('');
    setDiscountNominal(0);
    setCustomerName('Pelanggan Walk-In');
    setCustomerPhone('');
  };

  const filteredHistory = posHistory.filter(h =>
    h.invoiceNumber.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
    h.customerName.toLowerCase().includes(searchTermHistory.toLowerCase()) ||
    h.cashierName.toLowerCase().includes(searchTermHistory.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>MODUL 4: KASIR KIOS (POINT OF SALE)</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Mesin Kasir Cepat & Struk</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan transaksi retail & proyek, scan barcode, diskon multi-tier, pembayaran tunai/QRIS, dan cetak struk thermal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('kasir')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'kasir' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir Aktif</span>
          </button>
          <button
            onClick={() => setActiveView('riwayat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeView === 'riwayat' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Transaksi ({posHistory.length})</span>
          </button>
        </div>
      </div>

      {activeView === 'kasir' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: BARCODE SCANNER, CATALOG SELECTOR & CUSTOMER INFO */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barcode Search Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Barcode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={e => setBarcodeInput(e.target.value)}
                    placeholder="Scan Barcode atau ketik SKU / Nama barang lalu tekan Enter..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  + Masukkan
                </button>
              </form>
            </div>

            {/* Manual Product Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600">Pilih Barang dari Master</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pilih Produk</label>
                  <select
                    value={selectedProductId}
                    onChange={e => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="">-- Pilih Barang --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stok: {p.stock} {p.unit}) - {formatRupiah(p.price)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tier Harga</label>
                  <select
                    value={tier}
                    onChange={e => setTier(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="retail">Harga Retail Normal (Kios)</option>
                    <option value="project">Harga Toko / Grosir (-5%)</option>
                    <option value="contractor">Harga Kontraktor Proyek (-10%)</option>
                  </select>
                </div>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{selectedProduct.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Stok: {selectedProduct.stock} {selectedProduct.unit} • Lokasi: {selectedProduct.rackLocation || 'Gudang'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Harga Satuan</div>
                    <div className="font-black font-mono text-emerald-700 text-sm">
                      {formatRupiah(
                        tier === 'contractor' ? (selectedProduct.priceProject || Math.round(selectedProduct.price * 0.9)) :
                        tier === 'project' ? (selectedProduct.priceWholesale || Math.round(selectedProduct.price * 0.95)) :
                        selectedProduct.price
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={e => setQty(parseInt(e.target.value) || 1)}
                    className="w-14 text-center text-xs font-bold border-none focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(qty + 1)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah ke Keranjang</span>
                </button>
              </div>
            </div>

            {/* Customer Info Box */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
              <span className="font-black text-slate-800 uppercase text-[10px] block">Informasi Pembeli / Customer</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">Nama Customer</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Pelanggan Walk-In"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">No WhatsApp / HP (Kirim Struk)</label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CART, PAYMENT & RECEIPT CHECKOUT */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">Keranjang Belanja ({cart.length} Item)</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-rose-500 hover:underline font-bold"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar text-xs">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Keranjang kosong. Scan barcode atau pilih produk di sebelah kiri.
                </div>
              ) : (
                cart.map(item => {
                  const price = item.customPrice !== undefined ? item.customPrice : item.product.price;
                  return (
                    <div key={item.product.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {formatRupiah(price)} x {item.qty} {item.product.unit}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, -1)}
                          className="w-6 h-6 rounded-md bg-white border text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          -
                        </button>
                        <span className="w-7 text-center font-bold font-mono">{item.qty}</span>
                        <button
                          onClick={() => handleUpdateCartQty(item.product.id, 1)}
                          className="w-6 h-6 rounded-md bg-white border text-slate-700 font-bold flex items-center justify-center hover:bg-slate-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="font-black font-mono text-slate-900 text-right w-24">
                        {formatRupiah(price * item.qty)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Calculation & Diskon */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Barang:</span>
                <span className="font-mono font-bold">{formatRupiah(rawSubtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-500" />
                  <span>Potongan Diskon (Rp):</span>
                </span>
                <input
                  type="number"
                  min="0"
                  value={discountNominal}
                  onChange={e => setDiscountNominal(parseFloat(e.target.value) || 0)}
                  className="w-28 px-2 py-0.5 border rounded text-right font-mono"
                />
              </div>

              <div className="flex items-center justify-between text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTaxIncluded}
                    onChange={e => setIsTaxIncluded(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span>Hitung PPN 11% Faktur</span>
                </label>
                <span className="font-mono">{formatRupiah(taxPpn)}</span>
              </div>

              <div className="p-3 bg-slate-900 text-white rounded-xl flex items-baseline justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Tagihan:</span>
                <span className="text-lg font-black font-mono text-amber-400">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Metode Pembayaran */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Metode Pembayaran</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPayMethod('tunai')}
                  className={`py-2 rounded-xl font-bold border flex flex-col items-center gap-1 transition ${
                    payMethod === 'tunai' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Tunai</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPayMethod('qris');
                    onOpenQrisModal(grandTotal, () => handleCompleteSale());
                  }}
                  className={`py-2 rounded-xl font-bold border flex flex-col items-center gap-1 transition ${
                    payMethod === 'qris' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QRIS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('transfer')}
                  className={`py-2 rounded-xl font-bold border flex flex-col items-center gap-1 transition ${
                    payMethod === 'transfer' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Transfer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod('tempo')}
                  className={`py-2 rounded-xl font-bold border flex flex-col items-center gap-1 transition ${
                    payMethod === 'tempo' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Tempo</span>
                </button>
              </div>

              {/* Tunai Quick Buttons & Kembalian */}
              {payMethod === 'tunai' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Uang Diterima:</span>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={e => setCashReceived(e.target.value)}
                      placeholder="Jumlah Uang Tunai"
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl font-mono font-bold text-right"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => setCashReceived(grandTotal.toString())}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('50000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold font-mono"
                    >
                      50.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('100000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold font-mono"
                    >
                      100.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('500000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold font-mono"
                    >
                      500.000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived('1000000')}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[10px] font-bold font-mono"
                    >
                      1.000.000
                    </button>
                  </div>

                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                    <span className="font-bold text-emerald-900 text-xs">Kembalian:</span>
                    <span className="text-base font-black font-mono text-emerald-700">
                      {formatRupiah(changeVal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Selesaikan & Cetak Struk (F10)</span>
            </button>
          </div>
        </div>
      ) : (
        /* RIWAYAT TRANSAKSI KASIR */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Struk, Nama Customer..."
                value={searchTermHistory}
                onChange={e => setSearchTermHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {filteredHistory.length} Transaksi Tercatat
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Struk Kasir</th>
                  <th className="py-3 px-3">Tanggal & Waktu</th>
                  <th className="py-3 px-3">Kasir / Petugas</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-center">Items Terjual</th>
                  <th className="py-3 px-3 text-right">Total Transaksi</th>
                  <th className="py-3 px-3">Metode Bayar</th>
                  <th className="py-3 px-3 text-center">Cetak Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Belum ada riwayat transaksi kasir yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{sale.invoiceNumber}</td>
                      <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                        {sale.date} {sale.time}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{sale.cashierName}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{sale.customerName}</td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {sale.items.length} Barang
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(sale.total)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold uppercase text-[10px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenReceipt(sale)}
                          className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Struk</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

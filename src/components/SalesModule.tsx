import React, { useState } from 'react';
import {
  TrendingUp,
  Plus,
  Printer,
  FileText,
  FileCheck2,
  DollarSign,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Building,
  User,
  Truck,
  Percent,
  Calculator,
  Edit2,
  Trash2,
  Layers,
  Tag,
  Check,
  Sparkles,
  X
} from 'lucide-react';
import { store } from '../store';
import { SPHQuotation, SalesOrder, SalesInvoice, SPHItem, Customer } from '../types';
import { formatRupiah, formatDate } from '../utils/format';
import { SphPreviewModal } from './SphPreviewModal';

interface SalesModuleProps {
  onPrintSph: (sph: SPHQuotation) => void;
  onPrintInvoice: (inv: SalesInvoice) => void;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({
  onPrintSph,
  onPrintInvoice,
  onNotify
}) => {
  const [activeTab, setActiveTab] = useState<'sph' | 'so' | 'invoice' | 'piutang'>('invoice');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isSphModalOpen, setIsSphModalOpen] = useState(false);
  const [selectedPreviewSph, setSelectedPreviewSph] = useState<SPHQuotation | null>(null);
  const [isPreviewSphOpen, setIsPreviewSphOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid' | 'draft' | 'sent'>('all');
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoiceToPay, setSelectedInvoiceToPay] = useState<SalesInvoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Transfer Bank BCA');
  const [payNotes, setPayNotes] = useState('');

  const customers = store.getCustomers();
  const products = store.getProducts();
  const sphList = store.getSPHList();
  const soList = store.getSalesOrders();
  const invoices = store.getInvoices();

  // SPH Form State with 5 options:
  // 1. Rekanan (Pilih atau Ketik Baru)
  // 2. Nama Proyek
  // 3. Barang yang ditawarkan
  // 4. Harga (Harga Toko vs Harga Kontraktor)
  // 5. Opsi PPN / NON PPN
  const [isManualCustomer, setIsManualCustomer] = useState(customers.length === 0);
  const [sphForm, setSphForm] = useState({
    customerId: customers[0]?.id || '',
    customerName: customers[0]?.name || '',
    customerPhone: customers[0]?.phone || '',
    customerAddress: customers[0]?.address || '',
    projectTitle: '',
    priceTier: 'harga_kontraktor' as 'harga_toko' | 'harga_kontraktor' | 'harga_manual', // Opsi 5: Harga Toko vs Kontraktor vs Manual
    isPpn: true,                                                                        // Opsi 6: Opsi PPN vs NON PPN
    ppnRate: 11,
    validDays: 30,
    items: [
      {
        id: '1',
        productId: products[0]?.id || '',
        name: products[0]?.name || 'Panel Box Distribusi & Komponen Listrik',
        qty: 1,
        unit: products[0]?.unit || 'Set',
        priceType: 'kontraktor' as 'toko' | 'kontraktor' | 'custom',
        unitPrice: products[0]?.priceProject || products[0]?.price || 1500000,
        subtotal: products[0]?.priceProject || products[0]?.price || 1500000
      }
    ],
    termsAndConditions: '1. Penawaran harga berlaku selama 30 hari kalender sejak tanggal diterbitkan.\n2. Waktu pengiriman / fabrikasi 3-5 hari kerja setelah Surat Pesanan (PO) disetujui.\n3. Pembayaran via Transfer Bank Resmi Toko Nirwana Jaya Nugraha.'
  });

  // Tambahkan Rekanan Baru Langsung ke Database
  const handleAddNewCustomerToDatabase = () => {
    if (!sphForm.customerName.trim()) {
      onNotify?.('Silakan ketik nama rekanan terlebih dahulu!', 'error');
      return;
    }
    const newCust = {
      name: sphForm.customerName.trim(),
      phone: sphForm.customerPhone.trim() || '-',
      address: sphForm.customerAddress.trim() || 'Alamat Proyek Rekanan',
      type: 'kontraktor' as const,
      creditLimit: 50000000
    };
    store.addCustomer(newCust);
    const updated = store.getCustomers();
    const created = updated.find(c => c.name === newCust.name) || updated[updated.length - 1];
    if (created) {
      setSphForm(prev => ({
        ...prev,
        customerId: created.id,
        customerName: created.name,
        customerPhone: created.phone,
        customerAddress: created.address
      }));
    }
    setIsManualCustomer(false);
    onNotify?.(`Rekanan "${newCust.name}" berhasil ditambahkan ke database & terpilih otomatis!`, 'success');
  };

  // Tambahkan Barang Manual Langsung ke Master Stok Toko
  const handleSaveItemToProductMaster = (itemIndex: number) => {
    const item = sphForm.items[itemIndex];
    if (!item || !item.name.trim()) {
      onNotify?.('Ketik uraian nama barang terlebih dahulu!', 'error');
      return;
    }
    const priceToko = item.unitPrice || 100000;
    const priceProj = sphForm.priceTier === 'harga_kontraktor' ? item.unitPrice : Math.round(item.unitPrice * 0.9);
    const newProd = {
      name: item.name.trim(),
      sku: `PNL-${Date.now().toString().slice(-4)}`,
      category: 'Panel Listrik & Komponen',
      price: priceToko,
      priceProject: priceProj,
      priceWholesale: priceProj,
      hppPrice: Math.round(priceToko * 0.75),
      stock: 10,
      minStock: 2,
      monthlyAvgSales: 10,
      leadTimeDays: 7,
      unit: item.unit || 'Pcs',
      rackLocation: 'Gudang Panel',
      specification: 'Komponen Panel Listrik Resmi Toko Nirwana Jaya Nugraha'
    };
    store.addProduct(newProd);
    const allProds = store.getProducts();
    const createdProd = allProds.find(p => p.name === newProd.name);
    if (createdProd) {
      handleSphItemChange(itemIndex, 'productId', createdProd.id);
    }
    onNotify?.(`Barang "${newProd.name}" berhasil disimpan ke Master Stok Toko!`, 'success');
  };

  const handleSphAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      productId: '',
      name: '',
      qty: 1,
      unit: 'Pcs',
      priceType: sphForm.priceTier === 'harga_kontraktor' ? ('kontraktor' as const) : ('toko' as const),
      unitPrice: 0,
      subtotal: 0
    };
    setSphForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const handleSphRemoveItem = (index: number) => {
    if (sphForm.items.length <= 1) return;
    setSphForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleSphItemChange = (index: number, field: string, value: any) => {
    const updated = [...sphForm.items];
    const item = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        item.name = prod.name;
        item.unit = prod.unit;
        const tierPrice = sphForm.priceTier === 'harga_kontraktor'
          ? (prod.priceProject || prod.priceWholesale || Math.round(prod.price * 0.9))
          : prod.price;
        item.unitPrice = tierPrice;
        item.priceType = sphForm.priceTier === 'harga_kontraktor' ? 'kontraktor' : 'toko';
        item.subtotal = item.qty * tierPrice;
      }
    } else if (field === 'priceType') {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        if (value === 'toko') {
          item.unitPrice = prod.price;
        } else if (value === 'kontraktor') {
          item.unitPrice = prod.priceProject || prod.priceWholesale || Math.round(prod.price * 0.9);
        }
        item.subtotal = item.qty * item.unitPrice;
      }
    } else if (field === 'qty' || field === 'unitPrice') {
      item.subtotal = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
    }

    updated[index] = item;
    setSphForm(prev => ({ ...prev, items: updated }));
  };

  const handleSphPriceTierChange = (newTier: 'harga_toko' | 'harga_kontraktor' | 'harga_manual') => {
    if (newTier === 'harga_manual') {
      setSphForm(prev => ({ ...prev, priceTier: newTier }));
      return;
    }

    const updated = sphForm.items.map(it => {
      if (it.productId) {
        const prod = products.find(p => p.id === it.productId);
        if (prod) {
          const newPrice = newTier === 'harga_kontraktor'
            ? (prod.priceProject || prod.priceWholesale || Math.round(prod.price * 0.9))
            : prod.price;
          return {
            ...it,
            priceType: newTier === 'harga_kontraktor' ? ('kontraktor' as const) : ('toko' as const),
            unitPrice: newPrice,
            subtotal: it.qty * newPrice
          };
        }
      }
      return it;
    });

    setSphForm(prev => ({
      ...prev,
      priceTier: newTier,
      items: updated
    }));
  };

  // Quick Preset Add Item for Panel Listrik
  const handleAddPanelPreset = (name: string, unit: string, defaultPriceToko: number, defaultPriceKontraktor: number) => {
    const unitPrice = sphForm.priceTier === 'harga_kontraktor' ? defaultPriceKontraktor : defaultPriceToko;
    const newItem = {
      id: Date.now().toString(),
      productId: '',
      name,
      qty: 1,
      unit,
      priceType: sphForm.priceTier === 'harga_kontraktor' ? ('kontraktor' as const) : ('toko' as const),
      unitPrice,
      subtotal: unitPrice
    };
    setSphForm(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const sphSubtotal = sphForm.items.reduce((s, it) => s + (it.subtotal || 0), 0);
  const sphPpnAmount = sphForm.isPpn ? Math.round(sphSubtotal * 0.11) : 0;
  const sphTotalAmount = sphSubtotal + sphPpnAmount;

  // Invoice Form with MANUAL PPN and MANUAL PPH
  const [invForm, setInvForm] = useState({
    customerId: customers[0]?.id || '',
    customerName: customers[0]?.name || '',
    customerPhone: customers[0]?.phone || '',
    customerAddress: customers[0]?.address || '',
    projectName: '',
    referencePo: '',
    referenceSph: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    items: [
      { id: '1', description: '', qty: 1, unit: 'Pcs', unitPrice: 0, total: 0 }
    ],
    discount: 0,
    // MANUAL PPN STATE
    ppnMode: '11' as '11' | '0' | 'manual',
    ppnRate: 11,
    taxPpn: 0,
    // MANUAL PPH STATE
    pphMode: 'none' as 'none' | 'pph23' | 'pph22' | 'pph4_2' | 'manual',
    pphType: 'none',
    pphRate: 0,
    taxPph: 0,
    status: 'unpaid' as 'draft' | 'sent' | 'unpaid' | 'paid' | 'overdue',
    notes: 'Pembayaran ditransfer ke rekening bank resmi TOKO NIRWANA JAYA NUGRAHA.'
  });

  // Recalculate Invoice totals when items, discount, or manual taxes change
  const invSubtotal = invForm.items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const invAfterDiscount = Math.max(0, invSubtotal - invForm.discount);
  const invNetTotal = Math.max(0, invAfterDiscount + invForm.taxPpn - invForm.taxPph);

  // Update PPN when mode or rate changes
  const handlePpnModeChange = (mode: '11' | '0' | 'manual', customRate?: number) => {
    let rate = mode === '11' ? 11 : mode === '0' ? 0 : (customRate !== undefined ? customRate : invForm.ppnRate);
    let nominal = Math.round(invAfterDiscount * (rate / 100));
    setInvForm({
      ...invForm,
      ppnMode: mode,
      ppnRate: rate,
      taxPpn: nominal
    });
  };

  const handlePpnNominalManualChange = (nominal: number) => {
    const rate = invAfterDiscount > 0 ? Number(((nominal / invAfterDiscount) * 100).toFixed(2)) : 0;
    setInvForm({
      ...invForm,
      ppnMode: 'manual',
      ppnRate: rate,
      taxPpn: nominal
    });
  };

  // Update PPH when mode or rate changes
  const handlePphModeChange = (mode: 'none' | 'pph23' | 'pph22' | 'pph4_2' | 'manual', customRate?: number) => {
    let rate = 0;
    let type = 'none';
    if (mode === 'pph23') { rate = 2; type = 'PPh 23 Jasa (2%)'; }
    else if (mode === 'pph22') { rate = 1.5; type = 'PPh 22 Pengadaan (1.5%)'; }
    else if (mode === 'pph4_2') { rate = 0.5; type = 'PPh Final PP23 (0.5%)'; }
    else if (mode === 'manual') {
      rate = customRate !== undefined ? customRate : invForm.pphRate;
      type = 'PPh Manual / Custom';
    }

    let nominal = Math.round(invAfterDiscount * (rate / 100));
    setInvForm({
      ...invForm,
      pphMode: mode,
      pphType: type,
      pphRate: rate,
      taxPph: nominal
    });
  };

  const handlePphNominalManualChange = (nominal: number) => {
    const rate = invAfterDiscount > 0 ? Number(((nominal / invAfterDiscount) * 100).toFixed(2)) : 0;
    setInvForm({
      ...invForm,
      pphMode: 'manual',
      pphType: 'PPh Manual Khusus',
      pphRate: rate,
      taxPph: nominal
    });
  };

  // Invoice Items handlers
  const handleAddInvItem = () => {
    setInvForm({
      ...invForm,
      items: [
        ...invForm.items,
        { id: Date.now().toString(), description: 'Item Baru', qty: 1, unit: 'Pcs', unitPrice: 100000, total: 100000 }
      ]
    });
  };

  const handleUpdateInvItem = (index: number, field: string, value: any) => {
    const updated = [...invForm.items];
    if (field === 'description') updated[index].description = value;
    else if (field === 'qty') {
      updated[index].qty = parseInt(value) || 1;
      updated[index].total = updated[index].qty * updated[index].unitPrice;
    } else if (field === 'unitPrice') {
      updated[index].unitPrice = parseFloat(value) || 0;
      updated[index].total = updated[index].qty * updated[index].unitPrice;
    } else if (field === 'unit') {
      updated[index].unit = value;
    }
    setInvForm({ ...invForm, items: updated });
  };

  const handleRemoveInvItem = (index: number) => {
    if (invForm.items.length <= 1) return;
    setInvForm({ ...invForm, items: invForm.items.filter((_, i) => i !== index) });
  };

  const handleOpenCreateInvoice = () => {
    setEditingInvoice(null);
    setInvForm({
      customerId: customers[0]?.id || '',
      customerName: customers[0]?.name || '',
      customerPhone: customers[0]?.phone || '',
      customerAddress: customers[0]?.address || '',
      projectName: '',
      referencePo: '',
      referenceSph: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      items: [
        { id: '1', description: '', qty: 1, unit: 'Pcs', unitPrice: 0, total: 0 }
      ],
      discount: 0,
      ppnMode: '11',
      ppnRate: 11,
      taxPpn: 0,
      pphMode: 'none',
      pphType: 'none',
      pphRate: 0,
      taxPph: 0,
      status: 'unpaid',
      notes: 'Pembayaran ditransfer ke rekening bank resmi TOKO NIRWANA JAYA NUGRAHA.'
    });
    setIsInvoiceModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: SalesInvoice) => {
    setEditingInvoice(inv);
    let ppnMode: '11' | '0' | 'manual' = 'manual';
    if (inv.ppnRate === 11) ppnMode = '11';
    else if (inv.ppnRate === 0) ppnMode = '0';

    let pphMode: 'none' | 'pph23' | 'pph22' | 'pph4_2' | 'manual' = 'none';
    if (inv.pphType?.includes('23')) pphMode = 'pph23';
    else if (inv.pphType?.includes('22')) pphMode = 'pph22';
    else if (inv.pphType?.includes('Final') || inv.pphType?.includes('4')) pphMode = 'pph4_2';
    else if (inv.taxPph && inv.taxPph > 0) pphMode = 'manual';

    const cust = customers.find(c => c.name.toLowerCase() === inv.customerName.toLowerCase());

    setInvForm({
      customerId: cust?.id || customers[0]?.id || '',
      customerName: inv.customerName,
      customerPhone: inv.customerPhone || cust?.phone || '',
      customerAddress: inv.customerAddress || cust?.address || '',
      projectName: inv.projectName || '',
      referencePo: inv.referencePo || '',
      referenceSph: inv.referenceSph || '',
      date: inv.date,
      dueDate: inv.dueDate,
      items: inv.items.map(it => ({ ...it })),
      discount: inv.discount || 0,
      ppnMode,
      ppnRate: inv.ppnRate !== undefined ? inv.ppnRate : 11,
      taxPpn: inv.taxPpn || 0,
      pphMode,
      pphType: inv.pphType || 'none',
      pphRate: inv.pphRate || 0,
      taxPph: inv.taxPph || 0,
      status: inv.status,
      notes: inv.notes || ''
    });
    setIsInvoiceModalOpen(true);
  };

  const handleSendInvoice = (inv: SalesInvoice) => {
    store.updateInvoiceStatus(inv.id, 'sent');
    onNotify?.(`Faktur Penjualan ${inv.invoiceNumber} berhasil dikirim ke ${inv.customerName}!`, 'success');
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.customerName) {
      onNotify?.('Nama Customer harus diisi!', 'error');
      return;
    }

    if (editingInvoice) {
      store.updateSalesInvoice(editingInvoice.id, {
        date: invForm.date,
        dueDate: invForm.dueDate,
        customerName: invForm.customerName,
        customerPhone: invForm.customerPhone,
        customerAddress: invForm.customerAddress,
        projectName: invForm.projectName,
        referencePo: invForm.referencePo,
        referenceSph: invForm.referenceSph,
        items: invForm.items,
        subtotal: invSubtotal,
        discount: invForm.discount,
        ppnRate: invForm.ppnRate,
        taxPpn: invForm.taxPpn,
        pphType: invForm.pphType,
        pphRate: invForm.pphRate,
        taxPph: invForm.taxPph,
        totalAmount: invNetTotal,
        notes: invForm.notes
      });
      setIsInvoiceModalOpen(false);
      setEditingInvoice(null);
      onNotify?.(`Faktur Penjualan ${editingInvoice.invoiceNumber} berhasil diperbarui dengan PPN/PPh disesuaikan!`, 'success');
      return;
    }

    const newInvoice = store.createSalesInvoice({
      date: invForm.date,
      dueDate: invForm.dueDate,
      customerName: invForm.customerName,
      customerPhone: invForm.customerPhone,
      customerAddress: invForm.customerAddress,
      projectName: invForm.projectName,
      referencePo: invForm.referencePo,
      referenceSph: invForm.referenceSph,
      items: invForm.items,
      subtotal: invSubtotal,
      discount: invForm.discount,
      ppnRate: invForm.ppnRate,
      taxPpn: invForm.taxPpn,
      pphType: invForm.pphType,
      pphRate: invForm.pphRate,
      taxPph: invForm.taxPph,
      totalAmount: invNetTotal,
      paidAmount: 0,
      status: invForm.status,
      notes: invForm.notes
    });

    setIsInvoiceModalOpen(false);
    onNotify?.(`Faktur Penjualan ${newInvoice.invoiceNumber} berhasil diterbitkan dengan PPN & PPh Manual!`, 'success');
  };

  // Convert SPH to SO
  const handleConvertSphToSo = (sph: SPHQuotation) => {
    if (confirm(`Konversi SPH ${sph.code} menjadi Sales Order (SO)?`)) {
      const so = store.convertSphToSalesOrder(sph.id);
      onNotify?.(`Sales Order ${so.soNumber} berhasil dibuat dari ${sph.code}!`, 'success');
      setActiveTab('so');
    }
  };

  // Convert SO to DO
  const handleConvertSoToDo = (so: SalesOrder) => {
    if (confirm(`Terbitkan Surat Jalan (DO) untuk ${so.soNumber}?`)) {
      const newDO = store.createDeliveryOrderFromSalesOrder(so.id);
      onNotify?.(`Surat Jalan ${newDO.doNumber} berhasil dibuat dari ${so.soNumber}!`, 'success');
    }
  };

  // Pay Invoice
  const handleOpenPay = (inv: SalesInvoice) => {
    setSelectedInvoiceToPay(inv);
    setPayAmount(inv.totalAmount - inv.paidAmount);
    setIsPayModalOpen(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInvoiceToPay || payAmount <= 0) return;
    store.recordInvoicePayment(selectedInvoiceToPay.id, payAmount, payMethod, undefined, payNotes);
    setIsPayModalOpen(false);
    onNotify?.(`Pelunasan Faktur ${selectedInvoiceToPay.invoiceNumber} sebesar ${formatRupiah(payAmount)} berhasil dicatat via ${payMethod}!`, 'success');
  };

  const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
  const totalPiutang = unpaidInvoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>MODUL 6: PENJUALAN & FAKTUR INVOICE</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Penjualan, Faktur Invoice & Piutang</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tempat utama membuat dan mengelola invoice resmi, kalkulasi PPN & PPh manual/otomatis, alur SPH ➔ SO ➔ DO ➔ Invoice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreateInvoice}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Invoice Baru</span>
          </button>
          <button
            onClick={() => setIsSphModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat SPH</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('invoice')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'invoice' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Faktur Invoice ({invoices.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sph')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'sph' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Penawaran SPH ({sphList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('so')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'so' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Sales Order ({soList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('piutang')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'piutang' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Buku Piutang ({formatRupiah(totalPiutang)})</span>
        </button>
      </div>

      {/* TAB 1: DAFTAR INVOICE (UTAMA) */}
      {activeTab === 'invoice' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari No. Faktur, Customer, Proyek..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {invoices.length} Faktur Penjualan Tercatat
            </div>
          </div>

          {/* Quick Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <button
              onClick={() => setInvoiceStatusFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({invoices.length})
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('unpaid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'unpaid'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              Belum Bayar ({store.getInvoiceStats().unpaidCount + store.getInvoiceStats().overdueCount})
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('overdue')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'overdue'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              Overdue ({store.getInvoiceStats().overdueCount})
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('paid')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'paid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Lunas ({store.getInvoiceStats().paidCount})
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('draft')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'draft'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Draft ({store.getInvoiceStats().draftCount})
            </button>
            <button
              onClick={() => setInvoiceStatusFilter('sent')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                invoiceStatusFilter === 'sent'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              Terkirim ({store.getInvoiceStats().sentCount})
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Tanggal & Tempo</th>
                  <th className="py-3 px-3">Customer / Rekanan</th>
                  <th className="py-3 px-3 text-right">Subtotal</th>
                  <th className="py-3 px-3 text-right">PPN / PPh</th>
                  <th className="py-3 px-3 text-right">Total Bersih</th>
                  <th className="py-3 px-3 text-right">Sisa Tagihan</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Ref DO</th>
                  <th className="py-3 px-3 text-center">Aksi Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.filter(inv => {
                  const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (inv.projectName && inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
                  if (!matchesSearch) return false;

                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

                  if (invoiceStatusFilter === 'unpaid') return inv.status === 'unpaid' || inv.status === 'sent' || isOverdue;
                  if (invoiceStatusFilter === 'overdue') return isOverdue;
                  if (invoiceStatusFilter === 'paid') return inv.status === 'paid';
                  if (invoiceStatusFilter === 'draft') return inv.status === 'draft';
                  if (invoiceStatusFilter === 'sent') return inv.status === 'sent';
                  return true;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Tidak ada faktur dengan kriteria filter terpilih. Klik "+ Buat Invoice Baru" untuk membuat faktur resmi.
                    </td>
                  </tr>
                ) : (
                  invoices.filter(inv => {
                    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (inv.projectName && inv.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
                    if (!matchesSearch) return false;

                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

                    if (invoiceStatusFilter === 'unpaid') return inv.status === 'unpaid' || inv.status === 'sent' || isOverdue;
                    if (invoiceStatusFilter === 'overdue') return isOverdue;
                    if (invoiceStatusFilter === 'paid') return inv.status === 'paid';
                    if (invoiceStatusFilter === 'draft') return inv.status === 'draft';
                    if (invoiceStatusFilter === 'sent') return inv.status === 'sent';
                    return true;
                  }).map(inv => {
                    const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
                    const today = new Date().toISOString().split('T')[0];
                    const isOverdue = inv.status !== 'paid' && inv.dueDate && inv.dueDate < today;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          <div>{formatDate(inv.date)}</div>
                          <div className={`text-[10px] ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            Tempo: {formatDate(inv.dueDate)} {isOverdue && '(OVERDUE)'}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{inv.customerName}</div>
                          <div className="text-[11px] text-slate-500">{inv.projectName || '-'}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(inv.subtotal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[11px]">
                          <div className="text-emerald-700">+PPN: {formatRupiah(inv.taxPpn || 0)}</div>
                          {inv.taxPph ? (
                            <div className="text-amber-700">-PPh: {formatRupiah(inv.taxPph)}</div>
                          ) : null}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatRupiah(inv.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={remaining > 0 ? (isOverdue ? 'text-rose-600' : 'text-amber-600') : 'text-emerald-700'}>
                            {formatRupiah(remaining)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                            isOverdue ? 'bg-rose-100 text-rose-800' :
                            inv.status === 'draft' ? 'bg-slate-100 text-slate-700' :
                            inv.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status === 'paid' ? 'Lunas' : isOverdue ? 'Overdue' : inv.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {inv.doReference ? (
                            <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                              {inv.doReference}
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                const newDO = store.createDeliveryOrderFromInvoice(inv.id);
                                onNotify?.(`Surat Jalan ${newDO.doNumber} berhasil dibuat dari Faktur ${inv.invoiceNumber}!`, 'success');
                              }}
                              className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold text-[10px] transition inline-flex items-center gap-1"
                            >
                              <Truck className="w-3 h-3" />
                              <span>+ Buat DO</span>
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEditInvoice(inv)}
                              className="p-1 text-slate-700 hover:bg-amber-100 hover:text-amber-900 rounded transition"
                              title="Edit Rincian Faktur & Pajak"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => handleSendInvoice(inv)}
                                className="p-1 text-blue-700 hover:bg-blue-100 rounded transition"
                                title="Kirim Faktur ke Customer"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {inv.status !== 'paid' && (
                              <button
                                onClick={() => handleOpenPay(inv)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition"
                              >
                                Pelunasan
                              </button>
                            )}
                            <button
                              onClick={() => onPrintInvoice(inv)}
                              className="p-1 text-slate-700 hover:bg-slate-200 rounded transition"
                              title="Cetak PDF / Dokumen KOP Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR SPH */}
      {activeTab === 'sph' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Daftar Surat Penawaran Harga (SPH) Resmi</h3>
            <span className="text-xs text-slate-500 font-semibold">{sphList.length} SPH</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nomor SPH</th>
                  <th className="py-3 px-3">Tanggal & Masa Berlaku</th>
                  <th className="py-3 px-3">Nama Rekanan / Proyek</th>
                  <th className="py-3 px-3 text-right">Nilai Total Penawaran</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Aksi Operasional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sphList.map(sph => (
                  <tr key={sph.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{sph.code}</td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      <div>{formatDate(sph.date)}</div>
                      <div className="text-[10px] text-slate-400">s/d {formatDate(sph.validUntil)}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{sph.customerName}</div>
                      <div className="text-[11px] text-slate-500">{sph.projectTitle}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(sph.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        sph.status === 'converted_invoice' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sph.statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {sph.status === 'waiting_po' && (
                          <button
                            onClick={() => handleConvertSphToSo(sph)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition cursor-pointer"
                          >
                            Jadikan SO
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPreviewSph(sph);
                            setIsPreviewSphOpen(true);
                          }}
                          className="px-2.5 py-1 text-slate-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg inline-flex items-center gap-1 text-[11px] font-bold transition cursor-pointer shadow-sm"
                          title="Pratinjau, Download PDF & Cetak Sesuai Ukuran"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pratinjau &amp; PDF</span>
                        </button>
                        <button
                          onClick={() => onPrintSph(sph)}
                          className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg inline-flex items-center gap-1 text-[11px] font-medium transition cursor-pointer"
                          title="Cetak Cepat"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SALES ORDER (SO) */}
      {activeTab === 'so' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900">Konfirmasi Pesanan Penjualan (Sales Order)</h3>
            <span className="text-xs text-slate-500 font-semibold">{soList.length} SO</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Sales Order</th>
                  <th className="py-3 px-3">Ref SPH</th>
                  <th className="py-3 px-3">Customer & Proyek</th>
                  <th className="py-3 px-3">Target Kirim</th>
                  <th className="py-3 px-3 text-right">Nilai Pesanan</th>
                  <th className="py-3 px-3 text-center">Alur Selanjutnya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {soList.map(so => (
                  <tr key={so.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{so.soNumber}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{so.sphReference || '-'}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{so.customerName}</div>
                      <div className="text-[11px] text-slate-500">{so.notes}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">{formatDate(so.deliveryDateTarget)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatRupiah(so.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleConvertSoToDo(so)}
                          className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-[10px] inline-flex items-center gap-1"
                          title="Buat Surat Jalan DO sesuai alur SO -> DO"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Buat DO</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: BUKU PIUTANG CUSTOMER */}
      {activeTab === 'piutang' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Buku Piutang Pelanggan & Tagihan Jatuh Tempo</h3>
              <p className="text-xs text-slate-500">Pantau seluruh tagihan yang belum lunas dan riwayat pembayaran.</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Piutang Outstanding:</span>
              <span className="text-xl font-black font-mono text-amber-600">{formatRupiah(totalPiutang)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">No. Faktur</th>
                  <th className="py-3 px-3">Customer / Rekanan</th>
                  <th className="py-3 px-3">Tanggal Tagihan</th>
                  <th className="py-3 px-3">Jatuh Tempo</th>
                  <th className="py-3 px-3 text-right">Nilai Tagihan</th>
                  <th className="py-3 px-3 text-right">Sisa Piutang</th>
                  <th className="py-3 px-3 text-center">Pelunasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.map(inv => {
                  const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{inv.customerName}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{formatDate(inv.date)}</td>
                      <td className="py-3 px-3 font-mono font-bold text-rose-600">{formatDate(inv.dueDate)}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">{formatRupiah(inv.totalAmount)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">{formatRupiah(remaining)}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleOpenPay(inv)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                        >
                          Catat Pelunasan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: BUAT FAKTUR INVOICE BARU DENGAN PPN & PPH MANUAL */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">
                  {editingInvoice ? `Edit Faktur Penjualan (${editingInvoice.invoiceNumber})` : 'Buat Faktur Penjualan (Invoice) Baru'}
                </h3>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoice} className="space-y-4">
              {/* Customer and General Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer / Rekanan *</label>
                  <select
                    value={invForm.customerId}
                    onChange={e => {
                      const cust = customers.find(c => c.id === e.target.value);
                      setInvForm({
                        ...invForm,
                        customerId: e.target.value,
                        customerName: cust?.name || '',
                        customerPhone: cust?.phone || '',
                        customerAddress: cust?.address || ''
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Proyek / Perihal</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengadaan Kabel Proyek Gedebage"
                    value={invForm.projectName}
                    onChange={e => setInvForm({ ...invForm, projectName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Referensi PO / SO</label>
                  <input
                    type="text"
                    placeholder="Contoh: PO-WK-2026/09"
                    value={invForm.referencePo}
                    onChange={e => setInvForm({ ...invForm, referencePo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Faktur</label>
                  <input
                    type="date"
                    required
                    value={invForm.date}
                    onChange={e => setInvForm({ ...invForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tanggal Jatuh Tempo Pembayaran</label>
                  <input
                    type="date"
                    required
                    value={invForm.dueDate}
                    onChange={e => setInvForm({ ...invForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-rose-700"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800">Daftar Barang / Jasa Tagihan</span>
                  <button type="button" onClick={handleAddInvItem} className="text-amber-700 font-bold hover:underline">
                    + Tambah Baris
                  </button>
                </div>

                {invForm.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <input
                        type="text"
                        required
                        value={it.description}
                        onChange={e => handleUpdateInvItem(idx, 'description', e.target.value)}
                        placeholder="Deskripsi barang / spesifikasi"
                        className="w-full px-2.5 py-1.5 border rounded-lg font-semibold"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={e => handleUpdateInvItem(idx, 'qty', e.target.value)}
                        placeholder="Qty"
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-center"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={it.unitPrice}
                        onChange={e => handleUpdateInvItem(idx, 'unitPrice', e.target.value)}
                        placeholder="Harga Satuan"
                        className="w-full px-2 py-1.5 border rounded-lg font-mono text-right"
                      />
                    </div>
                    <div className="col-span-1 text-center">
                      {invForm.items.length > 1 && (
                        <button type="button" onClick={() => handleRemoveInvItem(idx)} className="text-rose-500 font-bold">✕</button>
                      )}
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-700">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatRupiah(invSubtotal)}</span>
                </div>
              </div>

              {/* MANUAL PPN & MANUAL PPH SECTION (REQUESTED BY USER) */}
              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-600" />
                  <span className="font-black text-slate-900 uppercase text-xs">
                    Pengaturan Pajak Manual (PPN & PPh)
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-bold">
                    Manual Input Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* PPN MANUAL BOX */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">1. Pajak Pertambahan Nilai (PPN)</span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePpnModeChange('11')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.ppnMode === '11' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        11% Standar
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePpnModeChange('0')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.ppnMode === '0' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Non-PPN (0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePpnModeChange('manual')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.ppnMode === 'manual' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Input Manual
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Tarif PPN (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={invForm.ppnRate}
                          onChange={e => handlePpnModeChange('manual', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-emerald-700 block">Nominal PPN (Rp)</label>
                        <input
                          type="number"
                          value={invForm.taxPpn}
                          onChange={e => handlePpnNominalManualChange(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded-lg font-mono font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PPH MANUAL BOX */}
                  <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-800 block text-xs">2. Pajak Penghasilan Dipotong (PPh)</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handlePphModeChange('none')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.pphMode === 'none' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Tanpa PPh
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePphModeChange('pph23')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.pphMode === 'pph23' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        PPh 23 (2%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePphModeChange('pph22')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.pphMode === 'pph22' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        PPh 22 (1.5%)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePphModeChange('pph4_2')}
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold border ${
                          invForm.pphMode === 'pph4_2' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        Final (0.5%)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Tarif PPh (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={invForm.pphRate}
                          onChange={e => handlePphModeChange('manual', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded-lg font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-amber-700 block">Potongan PPh (Rp)</label>
                        <input
                          type="number"
                          value={invForm.taxPph}
                          onChange={e => handlePphNominalManualChange(parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border rounded-lg font-mono font-bold text-amber-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Calculation Summary */}
                <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-1 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal Barang / Jasa:</span>
                    <span>{formatRupiah(invSubtotal)}</span>
                  </div>
                  {invForm.discount > 0 && (
                    <div className="flex justify-between text-rose-400">
                      <span>Potongan Diskon:</span>
                      <span>-{formatRupiah(invForm.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-400">
                    <span>+ PPN ({invForm.ppnRate}%):</span>
                    <span>+{formatRupiah(invForm.taxPpn)}</span>
                  </div>
                  {invForm.taxPph > 0 && (
                    <div className="flex justify-between text-amber-400">
                      <span>- PPh ({invForm.pphRate}%):</span>
                      <span>-{formatRupiah(invForm.taxPph)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black pt-2 border-t border-slate-700 text-amber-300">
                    <span>TOTAL TAGIHAN BERSIH (NET RECEIVABLE):</span>
                    <span>{formatRupiah(invNetTotal)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Tambahan & Instruksi Pembayaran</label>
                <textarea
                  rows={2}
                  value={invForm.notes}
                  onChange={e => setInvForm({ ...invForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md">
                  {editingInvoice ? 'Simpan Perubahan Faktur (Update)' : 'Terbitkan Faktur Invoice Resmi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PELUNASAN / PEMBAYARAN FAKTUR */}
      {isPayModalOpen && selectedInvoiceToPay && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 pb-2 border-b">
              Penerimaan Pelunasan Faktur Penjualan
            </h3>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <div>No. Faktur: <b className="font-mono">{selectedInvoiceToPay.invoiceNumber}</b></div>
              <div>Customer: <b>{selectedInvoiceToPay.customerName}</b></div>
              <div>Total Tagihan: <b className="font-mono">{formatRupiah(selectedInvoiceToPay.totalAmount)}</b></div>
              <div>Sisa Belum Dibayar: <b className="font-mono text-rose-600">{formatRupiah(selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount)}</b></div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Jumlah yang Dibayar Sekarang (Rp) *</label>
              <input
                type="number"
                max={selectedInvoiceToPay.totalAmount - selectedInvoiceToPay.paidAmount}
                value={payAmount}
                onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold text-base text-emerald-700"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Rekening / Kanal Pembayaran</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl font-bold"
              >
                <option value="Transfer Bank BCA">Transfer Bank BCA Toko Nirwana Jaya Nugraha</option>
                <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                <option value="Kasir Tunai">Kas Tunai Kios</option>
                <option value="QRIS Merchant">QRIS Merchant</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Catatan Bukti Transfer</label>
              <input
                type="text"
                placeholder="Contoh: Transfer Mandiri ref 09819201"
                value={payNotes}
                onChange={e => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button type="button" onClick={() => setIsPayModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-md"
              >
                Konfirmasi Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT SPH BARU DENGAN 5 OPSI (REKANAN, NAMA PROYEK, BARANG, HARGA TOKO/KONTRAKTOR, PPN/NON PPN) */}
      {isSphModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar text-xs space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 leading-tight">
                    Buat Surat Penawaran Harga (SPH) Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    TOKO NIRWANA JAYA NUGRAHA • Penawaran Pengadaan Kebutuhan Panel Listrik & Komponen
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSphModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!sphForm.customerName.trim()) {
                  onNotify?.('Silakan pilih atau ketik nama Rekanan!', 'error');
                  return;
                }
                if (!sphForm.projectTitle.trim()) {
                  onNotify?.('Nama Proyek / Pengadaan harus diisi!', 'error');
                  return;
                }
                if (sphForm.items.length === 0 || sphForm.items.some(it => !it.name.trim())) {
                  onNotify?.('Lengkapi uraian barang yang ditawarkan!', 'error');
                  return;
                }

                const newSph = store.addSPH({
                  customerName: sphForm.customerName,
                  customerPhone: sphForm.customerPhone,
                  customerAddress: sphForm.customerAddress,
                  projectTitle: sphForm.projectTitle,
                  date: new Date().toISOString().split('T')[0],
                  validUntil: new Date(Date.now() + sphForm.validDays * 86400000).toISOString().split('T')[0],
                  priceTier: sphForm.priceTier,
                  isPpn: sphForm.isPpn,
                  ppnRate: sphForm.isPpn ? 11 : 0,
                  itemsSummary: sphForm.items.map(it => `${it.qty} ${it.unit} ${it.name}`).join(', '),
                  subtotal: sphSubtotal,
                  ppnAmount: sphPpnAmount,
                  totalAmount: sphTotalAmount,
                  items: sphForm.items,
                  termsAndConditions: sphForm.termsAndConditions
                });

                setIsSphModalOpen(false);
                setSelectedPreviewSph(newSph);
                setIsPreviewSphOpen(true);
                onNotify?.(`Surat Penawaran ${newSph.code} untuk ${newSph.customerName} berhasil diterbitkan! Pratinjau dokumen telah dibuka.`, 'success');
              }}
              className="space-y-5"
            >
              {/* OPSI 1: REKANAN & OPSI 2: NAMA PROYEK */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-500" />
                    <span>1. Data Rekanan & 2. Nama Proyek</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isManualCustomer}
                        onChange={e => {
                          setIsManualCustomer(e.target.checked);
                          if (e.target.checked) {
                            setSphForm(prev => ({ ...prev, customerId: '', customerName: '', customerPhone: '' }));
                          } else if (customers.length > 0) {
                            setSphForm(prev => ({
                              ...prev,
                              customerId: customers[0].id,
                              customerName: customers[0].name,
                              customerPhone: customers[0].phone || ''
                            }));
                          }
                        }}
                        className="rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span>Ketik Rekanan Baru (Manual)</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Rekanan Selector */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      1. Rekanan / Klien *
                    </label>
                    {isManualCustomer ? (
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PT. Adhi Mandiri Elektrik / CV. Prima Panel"
                        value={sphForm.customerName}
                        onChange={e => setSphForm(prev => ({ ...prev, customerName: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                      />
                    ) : (
                      <select
                        value={sphForm.customerId}
                        onChange={e => {
                          const cust = customers.find(c => c.id === e.target.value);
                          setSphForm(prev => ({
                            ...prev,
                            customerId: e.target.value,
                            customerName: cust?.name || '',
                            customerPhone: cust?.phone || '',
                            customerAddress: cust?.address || ''
                          }));
                        }}
                        className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                      >
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.type.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Telepon Rekanan */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Kontak / No. Telepon Rekanan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 0812-3456-7890"
                      value={sphForm.customerPhone}
                      onChange={e => setSphForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-xl font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Nama Proyek */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    2. Nama Proyek / Pengadaan Panel Listrik *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pengadaan & Fabrikasi Panel Listrik LVMDP Gedung B / Instalasi Elektrikal"
                    value={sphForm.projectTitle}
                    onChange={e => setSphForm(prev => ({ ...prev, projectTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl font-bold text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* OPSI 5: HARGA (HARGA TOKO / HARGA KONTRAKTOR) & OPSI 6: PPN / NON PPN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Opsi 5: Harga Toko vs Kontraktor */}
                <div className="p-3.5 rounded-2xl border border-amber-300 bg-amber-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-amber-600" />
                      <span>5. Kategori Tarif Harga Penawaran</span>
                    </label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 uppercase">
                      {sphForm.priceTier === 'harga_kontraktor' ? 'Tier Kontraktor Aktif' : 'Tier Toko Aktif'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSphPriceTierChange('harga_toko')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        sphForm.priceTier === 'harga_toko'
                          ? 'bg-white border-amber-500 shadow-md text-amber-950 font-black'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="text-sm">🏪</span>
                      <span className="font-bold text-xs">Harga Toko</span>
                      <span className="text-[10px] text-slate-500 font-normal">Tarif Standar / Retail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSphPriceTierChange('harga_kontraktor')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        sphForm.priceTier === 'harga_kontraktor'
                          ? 'bg-amber-500 border-amber-600 shadow-md text-slate-950 font-black'
                          : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="text-sm">🏗️</span>
                      <span className="font-bold text-xs">Harga Kontraktor</span>
                      <span className={`text-[10px] font-normal ${sphForm.priceTier === 'harga_kontraktor' ? 'text-slate-900' : 'text-slate-500'}`}>
                        Tarif Rekanan & Proyek
                      </span>
                    </button>
                  </div>
                </div>

                {/* Opsi 6: PPN / NON PPN */}
                <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Percent className="w-4 h-4 text-emerald-600" />
                      <span>6. Opsi Pajak (PPN / NON PPN)</span>
                    </label>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      sphForm.isPpn ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {sphForm.isPpn ? 'PPN 11% Aktif' : 'NON PPN Aktif'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSphForm(prev => ({ ...prev, isPpn: false }))}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        !sphForm.isPpn
                          ? 'bg-slate-900 border-slate-900 shadow-md text-white font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="text-sm">⚪</span>
                      <span className="font-bold text-xs">NON PPN</span>
                      <span className={`text-[10px] font-normal ${!sphForm.isPpn ? 'text-slate-300' : 'text-slate-500'}`}>
                        Tanpa PPN (0%)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSphForm(prev => ({ ...prev, isPpn: true }))}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                        sphForm.isPpn
                          ? 'bg-emerald-600 border-emerald-700 shadow-md text-white font-black'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <span className="text-sm">🟢</span>
                      <span className="font-bold text-xs">PPN 11%</span>
                      <span className={`text-[10px] font-normal ${sphForm.isPpn ? 'text-emerald-100' : 'text-slate-500'}`}>
                        Faktur Pajak Standar
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* OPSI 4: BARANG YANG DITAWARKAN */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <span>4. Barang yang Ditawarkan (Panel & Elektrikal)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Pilih dari stok master atau ketik spesifikasi custom rakitan panel. Harga terisi otomatis sesuai opsi tier tarif terpilih ({sphForm.priceTier === 'harga_kontraktor' ? 'Harga Kontraktor' : 'Harga Toko'}).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSphAddItem}
                    className="self-start sm:self-auto flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Tambah Baris Barang</span>
                  </button>
                </div>

                {/* Quick Presets Kebutuhan Panel Listrik */}
                <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Preset Panel:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Panel Box Wall Mounting 60x80x25 Powder Coating', 'Unit', 1250000, 1100000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + Box Panel 60x80x25
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('MCCB 3P 100A 36kA Schneider Electric', 'Pcs', 1850000, 1650000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + MCCB 3P 100A
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('MCB 1P 16A Schneider Domae', 'Pcs', 85000, 72000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + MCB 1P Schneider
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Kabel Power Supreme NYY 4x16 mm²', 'Meter', 195000, 175000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + Kabel NYY 4x16mm²
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Busbar Copper Tembaga Murni 3x25mm (Batang 3m)', 'Batang', 420000, 380000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + Busbar Cu 3x25mm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPanelPreset('Pilot Lamp LED 220V (Merah, Kuning, Hijau)', 'Set', 45000, 38000)}
                    className="px-2 py-0.5 bg-white hover:bg-amber-100 rounded-md border text-slate-700 font-medium"
                  >
                    + Pilot Lamp Set
                  </button>
                </div>

                {/* Dynamic Items Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3">Uraian Barang / Spesifikasi Panel</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-24">Satuan</th>
                        <th className="py-2.5 px-3 w-36 text-right">Harga Satuan (Rp)</th>
                        <th className="py-2.5 px-3 w-36 text-right">Subtotal (Rp)</th>
                        <th className="py-2.5 px-3 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sphForm.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">
                            {idx + 1}
                          </td>

                          {/* Uraian Barang */}
                          <td className="py-2.5 px-3">
                            <div className="space-y-1.5">
                              {products.length > 0 && (
                                <select
                                  value={item.productId || ''}
                                  onChange={e => handleSphItemChange(idx, 'productId', e.target.value)}
                                  className="w-full px-2 py-1 border rounded-lg text-xs bg-slate-50 text-slate-700 font-medium"
                                >
                                  <option value="">-- Pilih Barang dari Master Stok (Opsional) --</option>
                                  {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                      {p.name} (Toko: {formatRupiah(p.price)} | Kontraktor: {formatRupiah(p.priceProject || p.priceWholesale || p.price)})
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                required
                                placeholder="Ketik nama spesifikasi barang / rakitan panel..."
                                value={item.name}
                                onChange={e => handleSphItemChange(idx, 'name', e.target.value)}
                                className="w-full px-2.5 py-1.5 border rounded-lg font-bold text-slate-900 bg-white"
                              />
                            </div>
                          </td>

                          {/* Qty */}
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min={1}
                              required
                              value={item.qty}
                              onChange={e => handleSphItemChange(idx, 'qty', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-full px-2 py-1.5 border rounded-lg text-center font-mono font-bold"
                            />
                          </td>

                          {/* Satuan */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={e => handleSphItemChange(idx, 'unit', e.target.value)}
                              placeholder="Satuan"
                              className="w-full px-2 py-1.5 border rounded-lg text-center font-semibold"
                            />
                          </td>

                          {/* Harga Satuan */}
                          <td className="py-2.5 px-3 text-right">
                            <input
                              type="number"
                              min={0}
                              required
                              value={item.unitPrice}
                              onChange={e => handleSphItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 border rounded-lg text-right font-mono font-bold text-slate-900"
                            />
                            <div className="text-[10px] text-slate-400 mt-0.5 text-right">
                              {sphForm.priceTier === 'harga_kontraktor' ? 'Tarif Kontraktor' : 'Tarif Toko'}
                            </div>
                          </td>

                          {/* Subtotal */}
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {formatRupiah(item.subtotal)}
                          </td>

                          {/* Delete Item */}
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleSphRemoveItem(idx)}
                              disabled={sphForm.items.length <= 1}
                              className="p-1 text-slate-300 hover:text-rose-600 disabled:opacity-20 cursor-pointer transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RINGKASAN KALKULASI & SYARAT PENAWARAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Syarat & Ketentuan Penawaran (Tercetak di KOP Surat)
                  </label>
                  <textarea
                    rows={3}
                    value={sphForm.termsAndConditions}
                    onChange={e => setSphForm(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-xl font-mono text-[11px]"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-slate-500 font-semibold">Masa Berlaku Penawaran:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={sphForm.validDays}
                      onChange={e => setSphForm(prev => ({ ...prev, validDays: parseInt(e.target.value) || 30 }))}
                      className="w-16 px-2 py-1 border rounded-lg text-center font-bold font-mono"
                    />
                    <span className="text-slate-500">Hari Kalender</span>
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2 font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal Barang:</span>
                    <span className="font-bold">{formatRupiah(sphSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className={sphForm.isPpn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {sphForm.isPpn ? '+ PPN 11%:' : 'PPN (Non-PPN):'}
                    </span>
                    <span className={sphForm.isPpn ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {sphForm.isPpn ? `+${formatRupiah(sphPpnAmount)}` : 'Rp 0 (0%)'}
                    </span>
                  </div>

                  <div className="flex justify-between text-base font-black pt-2 border-t border-slate-700 text-amber-300">
                    <span>TOTAL PENAWARAN:</span>
                    <span>{formatRupiah(sphTotalAmount)}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span>Kategori Tarif:</span>
                    <span className="uppercase text-amber-400 font-bold">
                      {sphForm.priceTier === 'harga_kontraktor' ? 'Harga Kontraktor' : 'Harga Toko'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSphModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 font-black" />
                  <span>Terbitkan SPH Resmi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU SPH DENGAN FITUR DOWNLOAD PDF & CETAK SESUAI UKURAN */}
      <SphPreviewModal
        isOpen={isPreviewSphOpen}
        sph={selectedPreviewSph}
        onClose={() => setIsPreviewSphOpen(false)}
        onConvertToInvoice={handleConvertSphToSo}
        onNotify={onNotify}
      />
    </div>
  );
};

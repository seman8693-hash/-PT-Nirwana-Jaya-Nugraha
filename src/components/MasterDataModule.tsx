import React, { useState } from 'react';
import {
  Database,
  Package,
  Users,
  Building,
  Ruler,
  DollarSign,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  CheckCircle2,
  X,
  AlertCircle,
  LayoutGrid,
  List,
  Image as ImageIcon,
  Tag,
  PiggyBank,
  BarChart3
} from 'lucide-react';
import { store } from '../store';
import { PosProduct, Customer, Supplier, UnitMaster } from '../types';
import { formatRupiah, formatNumber } from '../utils/format';
import { ProductImage } from './ProductImage';
import { ProductImageUploader } from './ProductImageUploader';
import { categorizeProductName, normalizeCategoryName } from './CategoryManager';

interface MasterDataModuleProps {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({ onNotify }) => {
  const [activeTab, setActiveTab] = useState<'barang' | 'customer' | 'supplier' | 'satuan' | 'harga'>('barang');
  const [productViewMode, setProductViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  // Form states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    sku: '',
    barcode: '',
    name: '',
    category: 'Kabel Power',
    brand: '',
    unit: 'Meter',
    imageUrl: '',
    stock: 0,
    minStock: 10,
    hppPrice: 0,
    price: 0,
    priceWholesale: 0,
    priceProject: 0,
    rackLocation: '',
    specification: '',
    monthlyAvgSales: 20,
    leadTimeDays: 7
  });

  // NEW: Category Management State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', isActive: true });
  const [categories, setCategories] = useState<{ id: string; name: string; description: string; isActive: boolean; createdAt: string }[]>([]);
  const [searchCategory, setSearchCategory] = useState('');
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const [editingProductIdForCategory, setEditingProductIdForCategory] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    address: '',
    type: 'kontraktor' as 'retail' | 'kontraktor' | 'grosir',
    creditLimit: 0,
    notes: ''
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    pic: '',
    phone: '',
    email: '',
    address: '',
    bankName: 'Bank BCA',
    bankAccount: '',
    bankHolder: ''
  });

  const [unitForm, setUnitForm] = useState({
    name: '',
    code: ''
  });

  const products = store.getProducts();
  const customers = store.getCustomers();
  const suppliers = store.getSuppliers();
  const units = store.getUnits();

  // Filtered lists
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.pic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Product modal handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setProductForm({
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: `8990${Date.now().toString().slice(-7)}`,
      name: '',
      category: 'Kabel Power',
      brand: '',
      unit: 'Pcs',
      imageUrl: '',
      stock: 0,
      minStock: 5,
      hppPrice: 0,
      price: 0,
      priceWholesale: 0,
      priceProject: 0,
      rackLocation: 'Gudang Utama',
      specification: '',
      monthlyAvgSales: 0,
      leadTimeDays: 7
    });
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (p: PosProduct) => {
    setEditingProductId(p.id);
    setProductForm({
      sku: p.sku,
      barcode: p.barcode || '',
      name: p.name,
      category: p.category,
      brand: p.brand || '',
      unit: p.unit,
      imageUrl: p.imageUrl || '',
      stock: p.stock,
      minStock: p.minStock,
      hppPrice: p.hppPrice,
      price: p.price,
      priceWholesale: p.priceWholesale || Math.round(p.price * 0.95),
      priceProject: p.priceProject || Math.round(p.price * 0.9),
      rackLocation: p.rackLocation || '',
      specification: p.specification || '',
      monthlyAvgSales: p.monthlyAvgSales,
      leadTimeDays: p.leadTimeDays
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.sku) return;

    if (editingProductId) {
      store.updateProduct(editingProductId, productForm);
      onNotify?.(`Produk ${productForm.name} berhasil diperbarui!`, 'success');
    } else {
      store.addProduct(productForm);
      onNotify?.(`Produk baru ${productForm.name} berhasil ditambahkan!`, 'success');
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus barang: ${name}?`)) {
      store.deleteProduct(id);
      onNotify?.(`Barang ${name} telah dihapus dari master catalog.`, 'success');
    }
  };

  const handleOpenAddCustomer = () => {
    setEditingCustomerId(null);
    setCustomerForm({
      name: '',
      company: '',
      phone: '',
      email: '',
      address: '',
      type: 'kontraktor',
      creditLimit: 0,
      notes: ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleEditCustomer = (c: Customer) => {
    setEditingCustomerId(c.id);
    setCustomerForm({
      name: c.name,
      company: c.company || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      type: c.type || 'kontraktor',
      creditLimit: c.creditLimit || 0,
      notes: ''
    });
    setIsCustomerModalOpen(true);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data customer / rekanan:\n${name}?`)) {
      store.deleteCustomer(id);
      onNotify?.(`Customer ${name} berhasil dihapus dari sistem!`, 'success');
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name) return;
    if (editingCustomerId) {
      store.updateCustomer(editingCustomerId, customerForm);
      onNotify?.(`Data customer ${customerForm.name} berhasil diperbarui!`, 'success');
    } else {
      store.addCustomer(customerForm);
      onNotify?.(`Customer baru ${customerForm.name} berhasil ditambahkan!`, 'success');
    }
    setIsCustomerModalOpen(false);
  };

  const handleOpenAddSupplier = () => {
    setEditingSupplierId(null);
    setSupplierForm({
      name: '',
      pic: '',
      phone: '',
      email: '',
      address: '',
      bankName: 'Bank BCA',
      bankAccount: '',
      bankHolder: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleEditSupplier = (s: Supplier) => {
    setEditingSupplierId(s.id);
    setSupplierForm({
      name: s.name,
      pic: s.pic || '',
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      bankName: s.bankName || 'Bank BCA',
      bankAccount: s.bankAccount || '',
      bankHolder: s.bankHolder || ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data supplier distributor:\n${name}?`)) {
      store.deleteSupplier(id);
      onNotify?.(`Supplier ${name} berhasil dihapus!`, 'success');
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name) return;
    if (editingSupplierId) {
      store.updateSupplier(editingSupplierId, supplierForm);
      onNotify?.(`Data supplier ${supplierForm.name} berhasil diperbarui!`, 'success');
    } else {
      store.addSupplier(supplierForm);
      onNotify?.(`Supplier ${supplierForm.name} berhasil ditambahkan!`, 'success');
    }
    setIsSupplierModalOpen(false);
  };

  const handleOpenAddUnit = () => {
    setEditingUnitId(null);
    setUnitForm({ name: '', code: '' });
    setIsUnitModalOpen(true);
  };

  const handleEditUnit = (u: UnitMaster) => {
    setEditingUnitId(u.id);
    setUnitForm({ name: u.name, code: u.code });
    setIsUnitModalOpen(true);
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus satuan ukuran "${name}"?`)) {
      store.deleteUnit(id);
      onNotify?.(`Satuan ${name} telah dihapus!`, 'success');
    }
  };

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitForm.name || !unitForm.code) return;
    if (editingUnitId) {
      store.updateUnit(editingUnitId, unitForm);
      onNotify?.(`Satuan ${unitForm.name} berhasil diperbarui!`, 'success');
    } else {
      store.addUnit(unitForm.name, unitForm.code);
      onNotify?.(`Satuan ${unitForm.name} berhasil ditambahkan!`, 'success');
    }
    setIsUnitModalOpen(false);
  };


  // Category Management Handlers
  const loadCategories = () => {
    // Load categories from localStorage or use default categories
    const saved = localStorage.getItem('njn_categories_v1');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      const defaultCategories = [
        { id: 'cat-1', name: 'Panel Listrik', description: 'Panel listrik dan distribusi', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-2', name: 'Kabel & Kabel Listrik', description: 'Jenis-jenis kabel listrik', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-3', name: 'Komponen Listrik', description: 'Komponen listrik untuk instalasi', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-4', name: 'Jala Listrik & Instalasi', description: 'Jala listrik dan ruang instalasi', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-5', name: 'Lighting & Penerangan', description: 'Lampu dan sistem penerangan', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-6', name: 'Safety & Proteksi', description: 'Alat keselamatan listrik', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-7', name: 'AC & Kencana', description: 'System pendingin udara', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-8', name: 'Peralatan Energi', description: 'Energi terbarukan dan penyimpanan', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-9', name: 'Pool & Ketahanan', description: 'Komponen ketahanan dan listrik', isActive: true, createdAt: new Date().toISOString() },
        { id: 'cat-10', name: 'Binding & Tampilan', description: 'Binding dan tampilan listrik', isActive: false, createdAt: new Date().toISOString() }
      ];
      setCategories(defaultCategories);
      localStorage.setItem('njn_categories_v1', JSON.stringify(defaultCategories));
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      onNotify?.('Nama kategori wajib diisi!', 'error');
      return;
    }

    const normalizedName = normalizeCategoryName(categoryForm.name);
    
    // Check if category already exists
    if (categories.some(c => c.name.toLowerCase() === normalizedName.toLowerCase())) {
      onNotify?.(`Kategori "${normalizedName}" sudah ada!`, 'error');
      return;
    }

    if (editingCategoryId) {
      // Update existing category
      const updated = categories.map(c =>
        c.id === editingCategoryId
          ? { ...c, name: normalizedName, description: categoryForm.description, isActive: categoryForm.isActive }
          : c
      );
      setCategories(updated);
      localStorage.setItem('njn_categories_v1', JSON.stringify(updated));
      onNotify?.(`Kategori "${normalizedName}" diperbarui!`, 'success');
    } else {
      // Add new category
      const newCategory = {
        id: `cat-${Date.now()}`,
        name: normalizedName,
        description: categoryForm.description,
        isActive: categoryForm.isActive,
        createdAt: new Date().toISOString()
      };
      const updated = [...categories, newCategory];
      setCategories(updated);
      localStorage.setItem('njn_categories_v1', JSON.stringify(updated));
      onNotify?.(`Kategori "${normalizedName}" berhasil ditambahkan!`, 'success');
    }

    setIsCategoryModalOpen(false);
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', isActive: true });
  };

  const handleEditCategory = (cat: { id: string; name: string; description: string; isActive: boolean }) => {
    setEditingCategoryId(cat.id);
    setCategoryForm({ name: cat.name, description: cat.description, isActive: cat.isActive });
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Yakin ingin menghapus kategori ini? Produk yang menggunakan kategori ini akan dimarkir sebagai "Lainnya".')) {
      const updated = categories.filter(c => c.id !== id);
      setCategories(updated);
      localStorage.setItem('njn_categories_v1', JSON.stringify(updated));
      onNotify?.(`Kategori dihapus!`, 'success');
      if (editingCategoryId === id) {
        setIsCategoryModalOpen(false);
        setEditingCategoryId(null);
      }
    }
  };

  const handleSearchCategories = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchCategory(e.target.value);
  };

  // Auto-suggest categories based on product name
  const getSuggestedCategories = (productName: string) => {
    const suggestions = categorizeProductName(productName);
    setSuggestedCategories(suggestions);
  };

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Update product name
    setProductForm(prev => ({ ...prev, name: value }));
    // Auto-suggest categories
    if (value.length >= 3) {
      const suggestions = categorizeProductName(value);
      setSuggestedCategories(suggestions);
    } else {
      setSuggestedCategories([]);
    }
  };

  // Handle category selection with auto-suggestion
  const handleCategorySelect = (categoryName: string) => {
    setProductForm(prev => ({ ...prev, category: categoryName }));
    setSuggestedCategories([]); // Clear suggestions after selection
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 mb-1">
            <Database className="w-4 h-4" />
            <span>MODUL 2: MASTER DATA</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Manajemen Master Data Operasional</h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola katalog barang, rekanan customer, distributor supplier, master satuan, dan price-list bertingkat.
          </p>
        </div>

        {/* Category Management Button */}
        <button
          onClick={() => {
            loadCategories();
            setEditingProductIdForCategory(productViewMode === 'grid' ? (products[0]?.id || null) : null);
            setIsCategoryModalOpen(true);
          }}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl text-xs shadow-md transition"
        >
          <Tag className="w-4 h-4" />
          <span>Manajemen Kategori</span>
        </button>

        {/* Action Button depending on tab */}
        {activeTab === 'barang' && (
          <button
            onClick={handleOpenAddProduct}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Barang Baru</span>
          </button>
        )}
        {activeTab === 'customer' && (
          <button
            onClick={handleOpenAddCustomer}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Customer</span>
          </button>
        )}
        {activeTab === 'supplier' && (
          <button
            onClick={handleOpenAddSupplier}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Supplier</span>
          </button>
        )}
        {activeTab === 'satuan' && (
          <button
            onClick={handleOpenAddUnit}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Satuan</span>
          </button>
        )}
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => { setActiveTab('barang'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'barang' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Barang ({products.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('customer'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'customer' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer ({customers.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('supplier'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'supplier' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Supplier ({suppliers.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('satuan'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'satuan' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Satuan ({units.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('harga'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'harga' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Daftar Multi-Tier Harga</span>
        </button>
      </div>

      {/* TAB 1: MASTER BARANG */}
      {activeTab === 'barang' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari SKU, Nama Barang, Barcode..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <div className="text-xs text-slate-500 font-semibold hidden md:block">
                Total <span className="font-bold text-slate-900">{filteredProducts.length}</span> Produk Terdaftar
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setProductViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    productViewMode === 'table'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Tabel Lengkap"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProductViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                    productViewMode === 'grid'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Tampilan Galeri Visual Foto"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Galeri Foto</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: TABLE */}
          {productViewMode === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-3 text-center w-14">Foto</th>
                    <th className="py-3 px-3">SKU & Barcode</th>
                    <th className="py-3 px-3">Nama Barang & Brand</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3 text-center">Stok / Satuan</th>
                    <th className="py-3 px-3 text-right">Harga HPP</th>
                    <th className="py-3 px-3 text-right">Harga Jual Retail</th>
                    <th className="py-3 px-3">Lokasi Rak</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center">
                        <ProductImage
                          src={p.imageUrl}
                          alt={p.name}
                          category={p.category}
                          size="sm"
                          className="mx-auto shadow-xs"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        <div>{p.sku}</div>
                        {p.barcode && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Barcode className="w-3 h-3" />
                            <span>{p.barcode}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.brand || '-'} {p.specification ? `• ${p.specification}` : ''}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-mono font-bold ${p.stock <= p.minStock ? 'text-rose-600' : 'text-slate-900'}`}>
                          {p.stock}
                        </span>{' '}
                        <span className="text-slate-500">{p.unit}</span>
                        {p.stock <= p.minStock && (
                          <div className="text-[9px] text-rose-500 font-bold uppercase mt-0.5">Kritis (Min: {p.minStock})</div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatRupiah(p.hppPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {p.rackLocation || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditProduct(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Hapus Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* VIEW 2: VISUAL PHOTO GRID */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-1">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col group"
                >
                  <div className="relative">
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      category={p.category}
                      size="custom"
                      className="w-full h-40 rounded-none bg-slate-100"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                        {p.sku}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs ${
                        p.stock <= p.minStock ? 'bg-rose-600 text-white' : 'bg-white/95 text-slate-800'
                      }`}>
                        Stok: {p.stock} {p.unit}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{p.category}</div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2 mt-0.5" title={p.name}>
                        {p.name}
                      </h4>
                      {p.brand && <div className="text-[11px] text-slate-500 mt-0.5">{p.brand}</div>}
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500">Retail:</span>
                        <span className="font-black font-mono text-emerald-700">{formatRupiah(p.price)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[10px] text-slate-400">Modal (HPP):</span>
                        <span className="font-mono text-slate-600">{formatRupiah(p.hppPrice)}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 truncate">
                        {p.rackLocation || 'Gudang Utama'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MASTER CUSTOMER */}
      {activeTab === 'customer' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Customer, Kode, Telepon..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {filteredCustomers.length} Customer
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kode Customer</th>
                  <th className="py-3 px-3">Nama Rekanan / Perusahaan</th>
                  <th className="py-3 px-3">Tipe Rekanan</th>
                  <th className="py-3 px-3">Kontak / Telp</th>
                  <th className="py-3 px-3">Alamat</th>
                  <th className="py-3 px-3 text-right">Plafon Kredit</th>
                  <th className="py-3 px-3 text-right">Sisa Piutang Berjalan</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{c.code}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.company && <div className="text-[11px] text-slate-500">{c.company}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.type === 'kontraktor' ? 'bg-purple-100 text-purple-700' :
                        c.type === 'grosir' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{c.phone}</div>
                      {c.email && <div className="text-[10px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{c.address}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{formatRupiah(c.creditLimit)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600">{formatRupiah(c.currentReceivable)}</td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditCustomer(c)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id, c.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 3: MASTER SUPPLIER */}
      {activeTab === 'supplier' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Supplier, Kode, PIC..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Total {filteredSuppliers.length} Supplier
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kode Supplier</th>
                  <th className="py-3 px-3">Nama Distributor / Pabrik</th>
                  <th className="py-3 px-3">PIC Penanggung Jawab</th>
                  <th className="py-3 px-3">Kontak & Telepon</th>
                  <th className="py-3 px-3">Rekening Bank</th>
                  <th className="py-3 px-3 text-right">Saldo Hutang</th>
                  <th className="py-3 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.code}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">{s.address}</div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{s.pic}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      <div>{s.phone}</div>
                      {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                      <div className="font-bold text-slate-900">{s.bankName}</div>
                      <div>{s.bankAccount} a.n {s.bankHolder}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600">
                      {formatRupiah(s.currentPayable)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditSupplier(s)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* TAB 4: MASTER SATUAN */}
      {activeTab === 'satuan' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="max-w-xl">
            <h3 className="text-base font-black text-slate-900 mb-1">Daftar Satuan Ukuran Resmi</h3>
            <p className="text-xs text-slate-500 mb-4">
              Digunakan pada transaksi Kasir, SPH, Purchase Order, dan mutasi kartu stok barang.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {units.map(u => (
                <div key={u.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between group hover:border-amber-300 transition">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{u.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Kode: {u.code}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditUnit(u)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit Satuan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUnit(u.id, u.name)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Hapus Satuan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MULTI-TIER PRICE LIST */}
      {activeTab === 'harga' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Price List Multi-Tier (Retail vs Grosir vs Proyek)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Sistem kasir & SPH otomatis menerapkan tier harga sesuai profil tipe customer yang dipilih.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-3">SKU & Barang</th>
                  <th className="py-3 px-3 text-right">Harga Modal (HPP)</th>
                  <th className="py-3 px-3 text-right text-emerald-700">Tier 1: Retail Kios</th>
                  <th className="py-3 px-3 text-right text-blue-700">Tier 2: Toko / Grosir</th>
                  <th className="py-3 px-3 text-right text-purple-700">Tier 3: Kontraktor Proyek</th>
                  <th className="py-3 px-3 text-center">Margin Retail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => {
                  const marginPct = p.hppPrice > 0 ? Math.round(((p.price - p.hppPrice) / p.hppPrice) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={p.imageUrl}
                            alt={p.name}
                            category={p.category}
                            size="xs"
                          />
                          <div>
                            <div>{p.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">{p.sku} • {p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatRupiah(p.hppPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                        {formatRupiah(p.price)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                        {formatRupiah(p.priceWholesale || Math.round(p.price * 0.95))}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                        {formatRupiah(p.priceProject || Math.round(p.price * 0.9))}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          +{marginPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT BARANG */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingProductId ? 'Edit Data Master Barang' : 'Tambah Master Barang Baru'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              {/* Product Photo Upload Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <ProductImageUploader
                  value={productForm.imageUrl}
                  onChange={url => setProductForm({ ...productForm, imageUrl: url })}
                  category={productForm.category}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU Barang *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Barcode Scanner (EAN/UPC)</label>
                  <input
                    type="text"
                    value={productForm.barcode}
                    onChange={e => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="Scan atau ketik kode barcode"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Barang *</label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={handleProductNameChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold"
                    placeholder="Contoh: Kabel Supreme NYM 3x2.5 mmÂ² Putih"
                  />
                  {/* Auto-suggestion dropdown */}
                  {suggestedCategories.length > 0 && (
                    <div className="mt-1.5 max-h-24 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg z-10">
                      <ul className="py-1">
                        {suggestedCategories.map((cat, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleCategorySelect(cat)}
                            className="px-3 py-1.5 text-xs cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition flex items-center gap-2"
                          >
                            <Tag className="w-3 h-3 text-amber-500" />
                            {cat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={productForm.category}
                    onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="Kabel Power">Kabel Power</option>
                    <option value="Kabel Instalasi">Kabel Instalasi</option>
                    <option value="Komponen MCB">Komponen MCB</option>
                    <option value="Pemutus Daya Utama">Pemutus Daya Utama</option>
                    <option value="Box Panel Proyek">Box Panel Proyek</option>
                    <option value="Aksesoris Jalur Kabel">Aksesoris Jalur Kabel</option>
                    <option value="Alat Ukur Listrik">Alat Ukur Listrik</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Otomatis</label>
                  {suggestedCategories.length > 0 ? (
                    <div className="mt-1.5 max-h-24 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-lg z-10">
                      <ul className="py-1">
                        {suggestedCategories.map((cat, idx) => (
                          <li
                            key={idx}
                            onClick={() => handleCategorySelect(cat)}
                            className="px-3 py-1.5 text-xs cursor-pointer hover:bg-amber-50 hover:text-amber-700 transition flex items-center gap-2"
                          >
                            <Tag className="w-3 h-3 text-amber-500" />
                            {cat}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Ketik nama barang untuk auto-suggest kategori</span>
                  )}
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand / Merek</label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="Supreme / Schneider / EGA"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan Ukuran</label>
                  <select
                    value={productForm.unit}
                    onChange={e => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    {units.map(u => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Multi Tier */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-black text-slate-900 block text-xs">Penetapan Harga & Multi-Tier</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Harga Beli HPP (Rp)</label>
                    <input
                      type="number"
                      value={productForm.hppPrice}
                      onChange={e => setProductForm({ ...productForm, hppPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-700 block mb-1">Harga Retail Kios (Rp)</label>
                    <input
                      type="number"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-blue-700 block mb-1">Harga Grosir (Rp)</label>
                    <input
                      type="number"
                      value={productForm.priceWholesale}
                      onChange={e => setProductForm({ ...productForm, priceWholesale: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-700 block mb-1">Harga Kontraktor (Rp)</label>
                    <input
                      type="number"
                      value={productForm.priceProject}
                      onChange={e => setProductForm({ ...productForm, priceProject: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Stok & Lokasi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stok Fisik Awal</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stok Minimum (Alert)</label>
                  <input
                    type="number"
                    value={productForm.minStock}
                    onChange={e => setProductForm({ ...productForm, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Lead Time (Hari)</label>
                  <input
                    type="number"
                    value={productForm.leadTimeDays}
                    onChange={e => setProductForm({ ...productForm, leadTimeDays: parseInt(e.target.value) || 7 })}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lokasi Rak Gudang</label>
                  <input
                    type="text"
                    value={productForm.rackLocation}
                    onChange={e => setProductForm({ ...productForm, rackLocation: e.target.value })}
                    placeholder="Gudang A-01"
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Spesifikasi Teknis / Standar SNI</label>
                <textarea
                  rows={2}
                  value={productForm.specification}
                  onChange={e => setProductForm({ ...productForm, specification: e.target.value })}
                  placeholder="Spesifikasi teknis, sertifikasi SNI/SPLN, atau keterangan khusus..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Simpan Master Barang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT CUSTOMER */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingCustomerId ? 'Edit Data Customer / Rekanan' : 'Tambah Customer Baru'}
              </h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Customer / PIC *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bpk. Heru Sasongko"
                  value={customerForm.name}
                  onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Perusahaan / Toko</label>
                  <input
                    type="text"
                    placeholder="PT. / CV. / Toko"
                    value={customerForm.company}
                    onChange={e => setCustomerForm({ ...customerForm, company: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Rekanan</label>
                  <select
                    value={customerForm.type}
                    onChange={e => setCustomerForm({ ...customerForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="kontraktor">Kontraktor Proyek</option>
                    <option value="grosir">Toko Cabang / Grosir</option>
                    <option value="retail">Pelanggan Kios Retail</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No WhatsApp / HP *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812xxxx"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Plafon Kredit (Rp)</label>
                  <input
                    type="number"
                    value={customerForm.creditLimit}
                    onChange={e => setCustomerForm({ ...customerForm, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Lengkap</label>
                <textarea
                  rows={2}
                  value={customerForm.address}
                  onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md">
                  {editingCustomerId ? 'Simpan Perubahan' : 'Simpan Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT SUPPLIER */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">
                {editingSupplierId ? 'Edit Data Supplier Distributor' : 'Tambah Supplier Distributor Baru'}
              </h3>
              <button onClick={() => setIsSupplierModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSupplier} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Perusahaan Supplier *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT. Supreme Cable Manufacturing Tbk"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">PIC Penanggung Jawab</label>
                  <input
                    type="text"
                    value={supplierForm.pic}
                    onChange={e => setSupplierForm({ ...supplierForm, pic: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">No Telepon / WA *</label>
                  <input
                    type="text"
                    required
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase block">Rekening Pembayaran Supplier</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nama Bank (BCA)"
                    value={supplierForm.bankName}
                    onChange={e => setSupplierForm({ ...supplierForm, bankName: e.target.value })}
                    className="px-2 py-1.5 border rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Nomor Rekening"
                    value={supplierForm.bankAccount}
                    onChange={e => setSupplierForm({ ...supplierForm, bankAccount: e.target.value })}
                    className="px-2 py-1.5 border rounded-lg font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Atas Nama (a.n)"
                    value={supplierForm.bankHolder}
                    onChange={e => setSupplierForm({ ...supplierForm, bankHolder: e.target.value })}
                    className="px-2 py-1.5 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat Kantor / Gudang Supplier</label>
                <textarea
                  rows={2}
                  value={supplierForm.address}
                  onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsSupplierModalOpen(false)} className="px-4 py-2 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-md">
                  {editingSupplierId ? 'Simpan Perubahan' : 'Simpan Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAJEMEN KATEGORI */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900">
                  {editingCategoryId ? 'Edit Kategori' : 'Tambah Kategori'}
                </h3>
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategoryId(null);
                    setCategoryForm({ name: '', description: '', isActive: true });
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kelola kategori produk. Anda bisa membuat kategori secara manual atau menggunakan kategori otomatis berdasarkan nama produk.
              </p>
            </div>
            
            <div className="p-6 space-y-5">
              {/* Search Categories */}
              {!editingCategoryId && (
                <div>
                  <label className="font-bold text-slate-700 block mb-2">Cari Kategori</label>
                  <input
                    type="text"
                    placeholder="Cari atau filtrer kategori..."
                    value={searchCategory}
                    onChange={handleSearchCategories}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              )}
              
              {/* Category Form */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Contoh: Panel Listrik, Kabel, Komponen"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {editingCategoryId ? 'Edit nama kategori' : 'Input nama kategori baru'}
                </p>
              </div>
              
              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi</label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  rows={3}
                  placeholder="Deskripsi singkat kategori"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">Aktif</label>
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                  className="toggle-checkbox"
                />
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategoryId(null);
                  setCategoryForm({ name: '', description: '', isActive: true });
                }}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl"
              >
                {editingCategoryId ? 'Update Kategori' : 'Simpan Kategori'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* MODAL: TAMBAH / EDIT SATUAN */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="text-base font-black text-slate-900 pb-2 border-b">
              {editingUnitId ? 'Edit Satuan Ukuran' : 'Tambah Satuan Ukuran'}
            </h3>
            <form onSubmit={handleSaveUnit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Satuan (misal: Drum, Karton)</label>
                <input
                  type="text"
                  required
                  value={unitForm.name}
                  onChange={e => setUnitForm({ ...unitForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Kode Singkatan (misal: DRM, KRT)</label>
                <input
                  type="text"
                  required
                  value={unitForm.code}
                  onChange={e => setUnitForm({ ...unitForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-xl uppercase font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsUnitModalOpen(false)} className="px-3 py-1.5 border rounded-xl font-bold">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-xl">
                  {editingUnitId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

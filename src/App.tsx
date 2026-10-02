import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardModule } from './components/DashboardModule';
import { MasterDataModule } from './components/MasterDataModule';
import { InventoryModule } from './components/InventoryModule';
import { PosModule } from './components/PosModule';
import { PurchaseModule } from './components/PurchaseModule';
import { SalesModule } from './components/SalesModule';
import { SpkModule } from './components/SpkModule';
import { ShippingModule } from './components/ShippingModule';
import { FinanceModule } from './components/FinanceModule';
import { ReportsModule } from './components/ReportsModule';
import { UserAccessModule } from './components/UserAccessModule';
import { SettingsModule } from './components/SettingsModule';
import { RestockModal } from './components/RestockModal';
import { QrisModal } from './components/QrisModal';
import { NjnLogo } from './components/NjnLogo';
import { store } from './store';
import { PosProduct, SalesInvoice, SPHQuotation, PKSContract, PurchaseInvoice, DeliveryOrder } from './types';
import { formatRupiah, formatDate } from './utils/format';
import { X, Printer, CheckCircle, Building2, LogOut, Check, Users } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [, setVersion] = useState(0);

  // Modals state
  const [restockProduct, setRestockProduct] = useState<PosProduct | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);
  const [isRestockOpen, setIsRestockOpen] = useState(false);

  const [isQrisOpen, setIsQrisOpen] = useState(false);
  const [qrisAmount, setQrisAmount] = useState(0);
  const [qrisConfirmFn, setQrisConfirmFn] = useState<(() => void) | null>(null);

  const [isUserSwitchModalOpen, setIsUserSwitchModalOpen] = useState(false);

  // Print Preview Modal
  const [printData, setPrintData] = useState<{
    type: 'sph' | 'spk' | 'nota' | 'invoice' | 'do' | 'receipt';
    data: any;
  } | null>(null);

  // Preselected purchase item from Restock recommendation
  const [preselectedPurchase, setPreselectedPurchase] = useState<{
    product?: PosProduct;
    qty?: number;
  } | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      setVersion(v => v + 1);
    });
    return unsubscribe;
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenRestock = (prod: PosProduct, suggestedQty?: number) => {
    setRestockProduct(prod);
    setRestockQty(suggestedQty || prod.recommendedReorderQty || 10);
    setIsRestockOpen(true);
  };

  const handleSaveRestock = (productId: string, qty: number, notes?: string) => {
    store.updateProductStock(productId, qty, notes);
    showToast(`Stok ${restockProduct?.name || 'barang'} bertambah +${qty} unit (${notes || 'Restok Cepat'})`);
  };

  const handleOpenCreateNotaFromRestock = (product?: PosProduct, qty?: number) => {
    setPreselectedPurchase({ product, qty });
    setCurrentTab('pembelian');
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const companySettings = store.getCompanySettings();

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-slate-700 animate-slide-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sidebar (12 Structured Modules) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onLogout={() => setIsUserSwitchModalOpen(true)}
      />

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 h-full overflow-hidden">
        {/* Top Header with NJN Gold Insignia */}
        <TopNav
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenPos={() => setCurrentTab('pos')}
          onOpenCreateSph={() => setCurrentTab('penjualan')}
          onSelectTab={tab => setCurrentTab(tab)}
        />

        {/* Dynamic Module Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-100/90">
          {currentTab === 'dashboard' && (
            <DashboardModule
              onNavigate={tab => setCurrentTab(tab)}
              onOpenRestockModal={handleOpenRestock}
              onOpenCreateNota={handleOpenCreateNotaFromRestock}
              onPayInvoice={inv => {
                store.markInvoicePaid(inv.id, 'Transfer Bank BCA');
                showToast(`Faktur ${inv.invoiceNumber} (${inv.customerName}) berhasil dilunasi via Transfer Bank!`);
              }}
              onPrintInvoice={inv => {
                setPrintData({ type: 'invoice', data: inv });
              }}
              onCreateDoFromInvoice={inv => {
                const newDO = store.createDeliveryOrderFromInvoice(inv.id);
                showToast(`Surat Jalan ${newDO.doNumber} berhasil diterbitkan otomatis dari Faktur ${inv.invoiceNumber}!`);
                setPrintData({ type: 'do', data: newDO });
              }}
            />
          )}

          {currentTab === 'master-data' && (
            <MasterDataModule onNotify={showToast} />
          )}

          {currentTab === 'inventory' && (
            <InventoryModule
              onOpenRestockModal={handleOpenRestock}
              onOpenCreateNota={handleOpenCreateNotaFromRestock}
              onNotify={showToast}
            />
          )}

          {currentTab === 'pos' && (
            <PosModule
              onOpenQrisModal={(total, onConfirm) => {
                setQrisAmount(total);
                setQrisConfirmFn(() => onConfirm);
                setIsQrisOpen(true);
              }}
              onOpenReceipt={receiptData => {
                setPrintData({ type: 'receipt', data: receiptData });
              }}
              onNavigate={tab => setCurrentTab(tab)}
              onNotify={showToast}
            />
          )}

          {currentTab === 'pembelian' && (
            <PurchaseModule
              onPrintPurchase={nota => {
                setPrintData({ type: 'nota', data: nota });
              }}
              preselectedProduct={preselectedPurchase?.product}
              preselectedQty={preselectedPurchase?.qty}
              onNotify={showToast}
            />
          )}

          {currentTab === 'penjualan' && (
            <SalesModule
              onPrintSph={sph => {
                setPrintData({ type: 'sph', data: sph });
              }}
              onPrintInvoice={inv => {
                setPrintData({ type: 'invoice', data: inv });
              }}
              onNotify={showToast}
            />
          )}

          {currentTab === 'spk' && (
            <SpkModule
              onPrintSpk={spk => {
                setPrintData({ type: 'spk', data: spk });
              }}
              onNotify={showToast}
            />
          )}

          {currentTab === 'pengiriman' && (
            <ShippingModule
              onPrintDo={order => {
                setPrintData({ type: 'do', data: order });
              }}
              onPrintInvoice={inv => {
                setPrintData({ type: 'invoice', data: inv });
              }}
              onNavigate={tab => setCurrentTab(tab)}
              onNotify={showToast}
            />
          )}

          {currentTab === 'keuangan' && (
            <FinanceModule
              onNotify={showToast}
              onPrintInvoice={inv => {
                setPrintData({ type: 'invoice', data: inv });
              }}
              onNavigate={tab => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'laporan' && (
            <ReportsModule onNotify={showToast} />
          )}

          {currentTab === 'user-akses' && (
            <UserAccessModule onNotify={showToast} />
          )}

          {currentTab === 'pengaturan' && (
            <SettingsModule onNotify={showToast} />
          )}
        </main>
      </div>

      {/* QUICK RESTOCK MODAL */}
      {isRestockOpen && restockProduct && (
        <RestockModal
          isOpen={isRestockOpen}
          product={restockProduct}
          initialQty={restockQty}
          onClose={() => setIsRestockOpen(false)}
          onSave={handleSaveRestock}
        />
      )}

      {/* QRIS DYNAMIC PAYMENT MODAL */}
      {isQrisOpen && (
        <QrisModal
          isOpen={isQrisOpen}
          totalAmount={qrisAmount}
          onClose={() => setIsQrisOpen(false)}
          onConfirm={() => {
            setIsQrisOpen(false);
            if (qrisConfirmFn) qrisConfirmFn();
          }}
        />
      )}

      {/* SWITCH USER / LOGOUT MODAL */}
      {isUserSwitchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <h3 className="text-base font-black text-slate-900">Ganti Akun Pengguna Operasional</h3>
              </div>
              <button onClick={() => setIsUserSwitchModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-500">
              Pilih akun staf untuk beralih sesi login. Setiap aksi transaksi akan tercatat di log audit sesuai nama staf aktif:
            </p>

            <div className="space-y-2">
              {store.getUsers().map(user => {
                const isSelected = user.id === store.getCurrentUser().id;
                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      store.setCurrentUser(user);
                      setIsUserSwitchModalOpen(false);
                      showToast(`Sesi beralih ke: ${user.name} (${user.role.toUpperCase()})`);
                    }}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 text-slate-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-amber-400 font-black flex items-center justify-center text-xs">
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[10px] text-slate-400">@{user.username} • {user.role.toUpperCase()}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                onClick={() => setIsUserSwitchModalOpen(false)}
                className="px-4 py-2 border rounded-xl font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW MODAL FOR DOCUMENTS (SPH, SPK, NOTA, INVOICE, DO, RECEIPT) */}
      {printData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 md:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar text-xs print:max-h-none print:shadow-none print:p-0 print:border-none">
            {/* Modal Controls (Hidden in print) */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
              <span className="font-black text-slate-800 uppercase text-xs">
                Pratinjau Dokumen Cetak Resmi
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintDocument}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>
                <button
                  onClick={() => setPrintData(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* DOCUMENT PRINT BODY */}
            <div className="p-4 bg-white text-slate-900 border border-slate-200 rounded-xl print:border-none print:p-0">
              {/* PRINT TYPE 1: THERMAL RECEIPT (KASIR POS) */}
              {printData.type === 'receipt' && (
                <div className="max-w-xs mx-auto font-mono text-[11px] p-4 border border-dashed border-slate-300 rounded-lg print:border-none">
                  <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
                    <NjnLogo variant="icon" size="sm" className="mx-auto" />
                    <div className="font-bold text-xs">PT. NIRWANA JAYA NUGRAHA</div>
                    <div className="text-[9px] text-slate-500">NJN GOLD • Kios Listrik & Panel</div>
                    <div className="text-[9px] text-slate-500">Jl. Soekarno Hatta No. 488 Bandung</div>
                    <div className="text-[9px] text-slate-500">Telp: (022) 731-8921</div>
                  </div>

                  <div className="py-2 space-y-0.5 text-[10px] border-b border-dashed border-slate-400">
                    <div className="flex justify-between">
                      <span>No: {printData.data.invoiceNumber}</span>
                      <span>{printData.data.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kasir: {printData.data.cashierName}</span>
                      <span>{printData.data.time}</span>
                    </div>
                    <div>Customer: {printData.data.customerName}</div>
                  </div>

                  <div className="py-2 space-y-1.5 border-b border-dashed border-slate-400 text-[10px]">
                    {printData.data.items?.map((it: any, idx: number) => (
                      <div key={idx}>
                        <div className="font-bold truncate">{it.name}</div>
                        <div className="flex justify-between text-slate-600">
                          <span>{it.qty} {it.unit} x {formatRupiah(it.unitPrice)}</span>
                          <span className="font-bold">{formatRupiah(it.subtotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="py-2 space-y-0.5 text-[10px] border-b border-dashed border-slate-400">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatRupiah(printData.data.subtotal)}</span>
                    </div>
                    {printData.data.discount > 0 && (
                      <div className="flex justify-between text-rose-600">
                        <span>Diskon:</span>
                        <span>-{formatRupiah(printData.data.discount)}</span>
                      </div>
                    )}
                    {printData.data.taxPpn > 0 && (
                      <div className="flex justify-between">
                        <span>PPN 11%:</span>
                        <span>{formatRupiah(printData.data.taxPpn)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-300">
                      <span>TOTAL:</span>
                      <span>{formatRupiah(printData.data.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bayar ({printData.data.paymentMethod}):</span>
                      <span>{formatRupiah(printData.data.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Kembalian:</span>
                      <span>{formatRupiah(printData.data.change)}</span>
                    </div>
                  </div>

                  <div className="text-center pt-3 text-[9px] text-slate-500 space-y-0.5">
                    <div>Terima Kasih Atas Kunjungan Anda</div>
                    <div>Barang yang dibeli tidak dapat ditukar tanpa struk</div>
                    <div className="font-bold font-serif text-amber-700">NJN GOLD PREMIUM ENTERPRISE</div>
                  </div>
                </div>
              )}

              {/* PRINT TYPE 2: FORMAL A4 DOKUMEN (SPH, SPK, INVOICE, NOTA, DO) */}
              {printData.type !== 'receipt' && (
                <div className="space-y-6">
                  {/* Official KOP SURAT */}
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                    <NjnLogo variant="print" />
                    <div className="text-right">
                      <div className="font-black text-sm font-mono text-slate-900">
                        {printData.type === 'sph' && printData.data.code}
                        {printData.type === 'spk' && printData.data.code}
                        {printData.type === 'invoice' && printData.data.invoiceNumber}
                        {printData.type === 'nota' && printData.data.invoiceNumber}
                        {printData.type === 'do' && printData.data.doNumber}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Tanggal: {formatDate(printData.data.date || printData.data.shippingDate || printData.data.startDate)}
                      </div>
                    </div>
                  </div>

                  {/* Document Header Title */}
                  <div className="text-center py-2">
                    <h2 className="text-lg font-black tracking-wider uppercase underline text-slate-900 font-serif">
                      {printData.type === 'sph' && 'SURAT PENAWARAN HARGA (SPH)'}
                      {printData.type === 'spk' && 'SURAT PERINTAH KERJA (SPK)'}
                      {printData.type === 'invoice' && 'FAKTUR PENJUALAN (SALES INVOICE)'}
                      {printData.type === 'nota' && 'NOTA PENERIMAAN BARANG & PEMBELIAN'}
                      {printData.type === 'do' && 'SURAT JALAN & DELIVERY ORDER (DO)'}
                    </h2>
                  </div>

                  {/* Metadata Recipient & Project */}
                  <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-600 block text-[10px] uppercase">Kepada Yth:</span>
                      <div className="font-bold text-slate-900 text-sm">
                        {printData.data.customerName || printData.data.partnerName || printData.data.supplierName}
                      </div>
                      {printData.data.destinationAddress && (
                        <div className="text-slate-600 mt-1">{printData.data.destinationAddress}</div>
                      )}
                      {printData.data.customerPhone && (
                        <div className="text-slate-500 font-mono">{printData.data.customerPhone}</div>
                      )}
                    </div>

                    <div className="text-right">
                      {printData.data.projectTitle && (
                        <div>
                          <span className="font-bold text-slate-600 block text-[10px] uppercase">Perihal / Proyek:</span>
                          <span className="font-bold text-slate-900">{printData.data.projectTitle}</span>
                        </div>
                      )}
                      {printData.data.scope && (
                        <div>
                          <span className="font-bold text-slate-600 block text-[10px] uppercase">Lingkup Pekerjaan:</span>
                          <span className="font-bold text-slate-900">{printData.data.scope}</span>
                        </div>
                      )}
                      {printData.data.driverName && (
                        <div>
                          <span className="font-bold text-slate-600 block text-[10px] uppercase">Driver & Armada:</span>
                          <span className="font-bold text-slate-900">{printData.data.driverName} ({printData.data.vehicleNumber})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-slate-300 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold uppercase text-[10px] text-slate-700 border-b border-slate-300">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">No</th>
                          <th className="py-2.5 px-3">Uraian Barang / Spesifikasi Teknis</th>
                          <th className="py-2.5 px-3 text-center w-24">Jumlah</th>
                          {printData.type !== 'do' && (
                            <>
                              <th className="py-2.5 px-3 text-right w-32">Harga Satuan</th>
                              <th className="py-2.5 px-3 text-right w-36">Total (Rp)</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(printData.data.items || []).map((it: any, idx: number) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{it.name || it.description || it.productName}</td>
                            <td className="py-2.5 px-3 text-center font-mono font-bold">
                              {it.qty} {it.unit}
                            </td>
                            {printData.type !== 'do' && (
                              <>
                                <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                                  {formatRupiah(it.unitPrice)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                  {formatRupiah(it.subtotal || it.total || (it.qty * it.unitPrice))}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Total Section (if not DO) */}
                  {printData.type !== 'do' && printData.data.totalAmount && (
                    <div className="flex justify-end text-xs">
                      <div className="w-72 space-y-1.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        {printData.data.subtotal && (
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-mono font-bold">{formatRupiah(printData.data.subtotal)}</span>
                          </div>
                        )}
                        {printData.data.ppnAmount ? (
                          <div className="flex justify-between text-emerald-800">
                            <span>+ PPN ({printData.data.ppnRate || 11}%):</span>
                            <span className="font-mono font-bold">+{formatRupiah(printData.data.ppnAmount)}</span>
                          </div>
                        ) : printData.data.taxPpn ? (
                          <div className="flex justify-between text-emerald-800">
                            <span>+ PPN ({printData.data.ppnRate !== undefined ? printData.data.ppnRate : 11}%):</span>
                            <span className="font-mono font-bold">+{formatRupiah(printData.data.taxPpn)}</span>
                          </div>
                        ) : null}
                        {printData.data.taxPph > 0 && (
                          <div className="flex justify-between text-amber-800">
                            <span>- PPh ({printData.data.pphType || `${printData.data.pphRate}%`}):</span>
                            <span className="font-mono font-bold">-{formatRupiah(printData.data.taxPph)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-black pt-1.5 border-t border-slate-300">
                          <span>Total Tagihan:</span>
                          <span className="font-mono text-slate-900">{formatRupiah(printData.data.totalAmount)}</span>
                        </div>
                        {printData.data.paidAmount > 0 && (
                          <div className="flex justify-between text-emerald-700">
                            <span>Telah Dibayar:</span>
                            <span className="font-mono font-bold">-{formatRupiah(printData.data.paidAmount)}</span>
                          </div>
                        )}
                        {printData.data.paidAmount > 0 && (
                          <div className="flex justify-between text-xs font-bold text-rose-600 border-t border-dashed pt-1">
                            <span>Sisa Belum Dibayar:</span>
                            <span className="font-mono font-bold">{formatRupiah(Math.max(0, printData.data.totalAmount - printData.data.paidAmount))}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Signatures & Legal Terms */}
                  <div className="pt-6 grid grid-cols-3 gap-4 text-center text-xs">
                    <div>
                      <div className="text-slate-500 mb-16">Penerima / Pemesan</div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                        ( ..................................... )
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-16">Bagian Logistik / Gudang</div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                        ( ..................................... )
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-16">
                        PT. Nirwana Jaya Nugraha
                      </div>
                      <div className="border-t border-slate-400 pt-1 font-bold text-slate-900">
                        H. Asep Supriatna, S.T.
                      </div>
                      <div className="text-[10px] text-slate-500">Direktur Utama</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

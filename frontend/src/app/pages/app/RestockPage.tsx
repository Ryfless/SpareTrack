import React, { useState, useEffect, useCallback } from "react";
import { Truck, Loader2, ClipboardList, CheckCircle, XCircle, PackageCheck, Trash2, RefreshCw, Receipt, Play, RotateCcw, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Skeleton } from "../../components/shared/Skeleton";
import { BranchSelect } from "../../components/shared/BranchSelect";
import { ReceiptView } from "../../components/ReceiptView";
import { CreatePOModal } from "../../components/modals/CreatePOModal";
import { PostponeModal } from "../../components/modals/PostponeModal";
import { ConfirmApproveModal } from "../../components/modals/ConfirmApproveModal";
import { ConfirmReceiveModal } from "../../components/modals/ConfirmReceiveModal";
import { ConfirmCancelModal } from "../../components/modals/ConfirmCancelModal";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
  getRecommendations, getPurchaseOrders, getPurchaseOrderDetail,
  approvePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, generateRecommendations, postponeRecommendation,
  type RestockRecommendation, type PurchaseOrder, type PurchaseOrderDetail,
} from "../../services/restock";

type TabId = 'restock' | 'postponed' | 'po';

const TABS: { id: TabId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'restock', label: 'Rekomendasi Restock', icon: Truck },
  { id: 'postponed', label: 'Ditunda', icon: Clock },
  { id: 'po', label: 'Purchase Orders', icon: ClipboardList },
];

interface Props {
  userProfile?: { role: string; branch: string } | null;
}

export function RestockPage({ userProfile }: Props) {
  const [tab, setTab] = useState<TabId>('restock');
  const [items, setItems] = useState<RestockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [poBranchFilter, setPOBranchFilter] = useState("");
  const [recBranchFilter, setRecBranchFilter] = useState("");

  const [createPOItem, setCreatePOItem] = useState<RestockRecommendation | null>(null);
  const [postponeItem, setPostponeItem] = useState<RestockRecommendation | null>(null);

  const [receiptPO, setReceiptPO] = useState<PurchaseOrderDetail | null>(null);
  const [approvePO, setApprovePO] = useState<PurchaseOrderDetail | null>(null);
  const [approving, setApproving] = useState(false);
  const [receivePO, setReceivePO] = useState<PurchaseOrderDetail | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelPO, setCancelPO] = useState<{ id: string; po_number: string } | null>(null);

  const [poList, setPOList] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPOLoading] = useState(false);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecommendations({ branch_id: recBranchFilter || undefined });
      setItems(data);
    } catch { toast.error("Gagal memuat rekomendasi"); setItems([]); }
    setLoading(false);
  }, [recBranchFilter]);

  useEffect(() => {
    if (tab === 'restock' || tab === 'postponed') fetchRecs();
  }, [tab, fetchRecs]);

  useEffect(() => {
    if (tab === 'restock' || tab === 'postponed') fetchRecs();
  }, [recBranchFilter]);

  const fetchPOList = useCallback(async () => {
    setPOLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 50 };
      if (poBranchFilter) params.branch_id = poBranchFilter;
      const res = await getPurchaseOrders(params);
      setPOList(res.data ?? []);
    } catch {
      toast.error("Gagal memuat purchase order");
    }
    setPOLoading(false);
  }, [poBranchFilter]);

  useEffect(() => {
    if (tab === 'po') fetchPOList();
  }, [tab, fetchPOList]);

  useEffect(() => {
    if (tab === 'po') fetchPOList();
  }, [poBranchFilter]);

  useEffect(() => {
    function onRefresh() { fetchPOList(); }
    window.addEventListener('sparetrack:refresh', onRefresh);
    return () => window.removeEventListener('sparetrack:refresh', onRefresh);
  }, [fetchPOList]);

  useAutoRefresh(fetchRecs, (tab === 'restock' || tab === 'postponed') ? 30 * 1000 : null, tab === 'restock' || tab === 'postponed');
  useAutoRefresh(fetchPOList, tab === 'po' ? 30 * 1000 : null, tab === 'po');

  async function handleGenerate() {
    setGenerating(true);
    try {
      await generateRecommendations();
      const data = await getRecommendations({ branch_id: recBranchFilter || undefined });
      setItems(data);
      toast.success(`${data.length} rekomendasi berhasil digenerate`);
    } catch {
      toast.error("Gagal generate rekomendasi");
    }
    setGenerating(false);
  }

  async function handlePOCreated(poId: string) {
    try {
      const detail = await getPurchaseOrderDetail(poId);
      setReceiptPO(detail);
      await fetchPOList();
    } catch {
      toast.error("Gagal memuat detail PO");
    }
  }

  async function handleConfirmApprove() {
    if (!approvePO) return;
    setApproving(true);
    try {
      await approvePurchaseOrder(approvePO.id);
      toast.success(`PO ${approvePO.po_number} disetujui — menunggu penerimaan`);
      setApprovePO(null);
      await fetchPOList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal approve PO');
    }
    setApproving(false);
  }

  async function handleConfirmReceive() {
    if (!receivePO) return;
    setReceiving(true);
    try {
      await receivePurchaseOrder(receivePO.id);
      toast.success(`PO ${receivePO.po_number} diterima — stok ditambahkan`);
      setReceivePO(null);
      await fetchPOList();
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menerima PO');
    }
    setReceiving(false);
  }

  async function handleShowReceipt(poId: string) {
    try {
      const d = await getPurchaseOrderDetail(poId);
      setReceiptPO(d);
    } catch {
      toast.error("Gagal memuat detail PO");
    }
  }

  async function handleConfirmCancel() {
    if (!cancelPO) return;
    setCancelling(true);
    try {
      await cancelPurchaseOrder(cancelPO.id);
      toast.success('PO berhasil dibatalkan');
      setCancelPO(null);
      await fetchPOList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membatalkan PO');
    }
    setCancelling(false);
  }

  function RecommendCard({ item, onStatusChange }: { item: RestockRecommendation; onStatusChange: () => void }) {
    const priorityMap: Record<string, string> = { critical: 'high', high: 'high', medium: 'medium', low: 'low', overstock: 'overstock' };
    const isPostponed = item.status === 'postponed';
    return (
      <Card className={`overflow-hidden ${isPostponed ? 'border-amber-300 dark:border-amber-700' : ''}`}>
        {isPostponed && <div className="h-1.5 bg-amber-400 dark:bg-amber-500" />}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</div><div className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.code} · {item.branch_name}</div></div>
            <div className="flex items-center gap-1.5">
              {isPostponed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">Ditunda</span>}
              <PriorityBadge priority={priorityMap[item.urgency] || 'medium'} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className={`font-bold text-lg leading-none ${item.current_stock <= item.min_stock ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.current_stock}</div><div className="text-slate-400 mt-1">Stok Saat Ini</div></div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className="font-bold text-lg leading-none text-slate-800 dark:text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.reorder_point}</div><div className="text-slate-400 mt-1">Reorder Point</div></div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center"><div className="font-bold text-lg leading-none text-blue-700 dark:text-blue-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{item.recommended_qty}</div><div className="text-slate-400 mt-1">Rekomendasi</div></div>
          </div>
          {isPostponed && item.postpone_until && <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2.5 py-1.5 mb-2 font-medium">Ditunda hingga {new Date(item.postpone_until).toLocaleDateString('id-ID')}</div>}
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 mb-3 leading-relaxed">{isPostponed && item.postpone_reason ? item.postpone_reason : item.notes}</div>
          <div className="flex gap-2">
            {!isPostponed && (
              <>
                <button onClick={() => setCreatePOItem(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Truck size={12} />Buat PO</button>
                <button onClick={() => setPostponeItem(item)} className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all">Tunda</button>
              </>
            )}
            {isPostponed && (
              <button onClick={async () => { try { await postponeRecommendation(item.id); toast.success(`${item.name} diaktifkan kembali`); onStatusChange(); } catch { toast.error("Gagal mengubah status"); } }} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all shadow-sm"><Play size={12} />Aktifkan Kembali</button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePOModal item={createPOItem} onClose={() => setCreatePOItem(null)} onCreated={handlePOCreated} />
      <PostponeModal item={postponeItem} onClose={() => setPostponeItem(null)} onPostponed={fetchRecs} />
      <ConfirmApproveModal po={approvePO} submitting={approving} onConfirm={handleConfirmApprove} onClose={() => setApprovePO(null)} />
      <ConfirmReceiveModal po={receivePO} submitting={receiving} onConfirm={handleConfirmReceive} onClose={() => setReceivePO(null)} />
      <ConfirmCancelModal poNumber={cancelPO?.po_number || ''} submitting={cancelling} onConfirm={handleConfirmCancel} onClose={() => setCancelPO(null)} />
      {receiptPO && <ReceiptView po={receiptPO} onClose={() => setReceiptPO(null)} />}

      {/* Tab Navigation */}
      <Card className="p-1 bg-slate-50 dark:bg-slate-800/50 flex gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t.id ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
            <t.icon size={15} />{t.label}
          </button>
        ))}
      </Card>

      {/* Restock Recommendations Tab */}
      {tab === 'restock' && (
        loading ? (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i}><Skeleton className="h-6 w-48 mb-3" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(j => <Skeleton key={j} className="h-56" />)}</div></div>
            ))}
          </div>
        ) : items.filter(r => r.status === 'pending').length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <ClipboardList size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Belum Ada Rekomendasi Restock</h3>
            <p className="text-sm text-slate-400 max-w-xs mb-6">Generate rekomendasi untuk menganalisis stok dan mengetahui item yang perlu direstock</p>
            <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              {generating ? 'Menggenerasi...' : 'Generate Rekomendasi'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rekomendasi Restock</h2>
                {!loading && <span className="text-xs text-slate-400 font-mono">{items.filter(r => r.status === 'pending').length} item</span>}
              </div>
              <div className="flex items-center gap-2">
                <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
                <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm disabled:opacity-50">
                  {generating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  {generating ? 'Menggenerasi...' : 'Generate'}
                </button>
              </div>
            </div>
            {[
              { label: "Restock Urgent", items: items.filter(r => r.status === 'pending' && (r.urgency === "critical" || r.urgency === "high")), dot: "bg-red-500", pulse: true, badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
              { label: "Perlu Dipantau", items: items.filter(r => r.status === 'pending' && r.urgency === "medium"), dot: "bg-amber-500", pulse: false, badge: "bg-amber-100 text-amber-700" },
              { label: "Overstock Warning", items: items.filter(r => r.status === 'pending' && r.urgency === "overstock"), dot: "bg-purple-500", pulse: false, badge: "bg-purple-100 text-purple-700" },
            ].map(sec => (
              sec.items.length > 0 ? (
                <div key={sec.label}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${sec.dot} ${sec.pulse ? "animate-pulse" : ""}`} />
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">{sec.label}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sec.badge}`}>{sec.items.length} item</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{sec.items.map(item => <RecommendCard key={item.id} item={item} onStatusChange={fetchRecs} />)}</div>
                </div>
              ) : null
            ))}
          </div>
        )
      )}

      {/* Postponed Tab */}
      {tab === 'postponed' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(j => <Skeleton key={j} className="h-56" />)}
          </div>
        ) : items.filter(r => r.status === 'postponed').length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Clock size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Tidak Ada Restock Ditunda</h3>
            <p className="text-sm text-slate-400 max-w-xs">Rekomendasi restock yang ditunda akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Restock Ditunda</h2>
                <span className="text-xs text-slate-400 font-mono">{items.filter(r => r.status === 'postponed').length} item</span>
              </div>
              <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.filter(r => r.status === 'postponed').map(item => <RecommendCard key={item.id} item={item} onStatusChange={fetchRecs} />)}
            </div>
          </div>
        )
      )}

      {/* Purchase Orders Tab */}
      {tab === 'po' && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-500" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">Purchase Orders</h2>
              {poLoading && <Skeleton className="h-4 w-16 inline-block" />}
            </div>
            <div className="flex items-center gap-2">
              <BranchSelect value={poBranchFilter} onChange={setPOBranchFilter} role={userProfile?.role} userBranch={userProfile?.branch} />
              <RefreshCw size={11} className="text-slate-400 animate-spin" />
              <span className="text-xs text-slate-400">{poList.length} PO</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800/50">
                  {['No. PO', 'Supplier', 'Cabang', 'Status', 'Total', 'Tanggal', 'Aksi'].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {poList.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">Belum ada purchase order</td></tr>
                ) : poList.map(po => {
                  const statusBadge = po.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : po.status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : po.status === 'received' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : po.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-slate-100 text-slate-600';
                  return (
                    <tr key={po.id} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 ${po.status === 'cancelled' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{po.po_number}</td>
                      <td className="px-4 py-3 text-slate-600">{po.supplier}</td>
                      <td className="px-4 py-3 text-slate-600">{po.branch}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge}`}>{po.status === 'cancelled' ? 'Dibatalkan' : po.status}</span></td>
                      <td className="px-4 py-3 text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rp {(po.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(po.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {po.status === 'pending' && (
                            <>
                              <button onClick={async () => {
                                try {
                                  const d = await getPurchaseOrderDetail(po.id);
                                  setApprovePO(d);
                                } catch { toast.error("Gagal memuat detail PO"); }
                              }} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg transition-all">
                                <CheckCircle size={12} />Approve
                              </button>
                              <button onClick={() => setCancelPO({ id: po.id, po_number: po.po_number })}
                                className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg transition-all">
                                <Trash2 size={12} />Hapus
                              </button>
                            </>
                          )}
                          {po.status === 'approved' && (
                            <button onClick={async () => {
                              try {
                                const d = await getPurchaseOrderDetail(po.id);
                                setReceivePO(d);
                              } catch { toast.error("Gagal memuat detail PO"); }
                            }} className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 px-2.5 py-1.5 rounded-lg transition-all">
                              <PackageCheck size={12} />Terima
                            </button>
                          )}
                          {po.status === 'received' && (
                            <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12} />Diterima</span>
                          )}
                          {po.status === 'cancelled' && (
                            <span className="text-xs text-red-400 flex items-center gap-1"><XCircle size={12} />Dibatalkan</span>
                          )}
                          <button onClick={() => handleShowReceipt(po.id)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-all">
                            <Receipt size={12} />Struk
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

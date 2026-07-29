import React, { useState, useEffect, useCallback } from "react";
import { Truck, Loader2, ClipboardList, CheckCircle, XCircle, PackageCheck, PackageSearch, Trash2, RefreshCw, Receipt, Play, Clock, ArrowUpDown, Filter } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Skeleton, RecommendCardSkeleton } from "../../components/shared/Skeleton";
import { BranchSelect } from "../../components/shared/BranchSelect";
import { Tooltip } from "../../components/shared/Tooltip";
import { ReceiptView } from "../../components/ReceiptView";
import { CreatePOModal } from "../../components/modals/CreatePOModal";
import { PostponeModal } from "../../components/modals/PostponeModal";
import { ConfirmApproveModal } from "../../components/modals/ConfirmApproveModal";
import { ConfirmReceiveModal } from "../../components/modals/ConfirmReceiveModal";
import { ConfirmCancelModal } from "../../components/modals/ConfirmCancelModal";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
  getRecommendations, getPurchaseOrders, getPurchaseOrderDetail,
  approvePurchaseOrder, receivePurchaseOrder, cancelPurchaseOrder, postponeRecommendation,
  getLiveRecommendations,
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
  scrollTo?: string;
}

export function RestockPage({ userProfile, scrollTo }: Props) {
  const [tab, setTab] = useState<TabId>('restock');
  const [items, setItems] = useState<RestockRecommendation[]>([]);
  const [liveData, setLiveData] = useState<RestockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(true);
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
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("qty_desc");

  function applyFilters(data: RestockRecommendation[]) {
    let filtered = data;
    if (urgencyFilter !== "all") {
      filtered = filtered.filter(i => i.urgency === urgencyFilter);
    }
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "name_desc") return b.name.localeCompare(a.name);
      if (sortBy === "qty_desc") return b.recommended_qty - a.recommended_qty;
      return 0;
    });
    return sorted;
  }

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecommendations({ branch_id: recBranchFilter || undefined });
      setItems(data);
    } catch { toast.error("Gagal memuat rekomendasi"); setItems([]); }
    setLoading(false);
  }, [recBranchFilter]);

  const fetchLive = useCallback(async () => {
    setLiveLoading(true);
    try {
      const data = await getLiveRecommendations({ branch_id: recBranchFilter || undefined });
      setLiveData(data);
    } catch { /* silent — auto-refresh handles retry */ }
    setLiveLoading(false);
  }, [recBranchFilter]);

  useEffect(() => {
    if (tab === 'restock') fetchLive();
    if (tab === 'postponed') fetchRecs();
  }, [tab, fetchLive, fetchRecs]);~

  useEffect(() => {
    if (tab === 'restock') fetchLive();
    if (tab === 'postponed') fetchRecs();
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

  useAutoRefresh(tab === 'restock' ? fetchLive : fetchRecs, (tab === 'restock' || tab === 'postponed') ? 5 * 60 * 1000 : null, tab === 'restock' || tab === 'postponed');
  useAutoRefresh(fetchPOList, tab === 'po' ? 5 * 60 * 1000 : null, tab === 'po');

  useEffect(() => {
    if (!liveLoading && scrollTo && tab === 'restock') {
      const id = scrollTo === 'menipis' ? 'restock-high' : 'restock-critical';
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  }, [liveLoading, scrollTo, tab]);

  async function handlePOCreated(poId: string) {
    try {
      const detail = await getPurchaseOrderDetail(poId);
      setReceiptPO(detail);
      await Promise.all([fetchPOList(), fetchLive()]);
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
    const isPostponed = item.status === 'postponed';
    return (
      <Card className={`overflow-hidden ${isPostponed ? 'border-amber-300 dark:border-amber-700' : ''}`}>
        {isPostponed && <div className="h-1.5 bg-amber-400 dark:bg-amber-500" />}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</div><div className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.code} · {item.branch_name}</div></div>
            <div className="flex items-center gap-1.5">
              {isPostponed && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200">Ditunda</span>}
              <PriorityBadge priority={item.urgency} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className={`font-bold text-lg leading-none ${item.current_stock <= item.reorder_point ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.current_stock}</div><div className="text-slate-400 mt-1">Stok Saat Ini</div></div>
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
        liveLoading ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rekomendasi Restock</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
<Tooltip text="Refresh"><button onClick={fetchLive} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
  <RefreshCw size={14} className={`text-slate-400 ${liveLoading ? 'animate-spin' : ''}`} />
</button></Tooltip>
                <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(j => <RecommendCardSkeleton key={j} />)}
            </div>
          </div>
        ) : liveData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <PackageCheck size={28} className="text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Semua Stok Dalam Kondisi Aman</h3>
            <p className="text-sm text-slate-400 max-w-xs">Tidak ada item yang perlu direstock saat ini. Data akan diperbarui secara otomatis.</p>
          </div>
        ) : applyFilters(liveData).length === 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rekomendasi Restock</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter size={12} className="text-slate-400" />
                  <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                    <option value="all">Semua Urgensi</option>
                    <option value="critical">Kritis</option>
                    <option value="high">Menipis</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={12} className="text-slate-400" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                    <option value="qty_desc">Rekomendasi ↑</option>
                    <option value="name_asc">Nama A–Z</option>
                    <option value="name_desc">Nama Z–A</option>
                  </select>
                </div>
<Tooltip text="Refresh"><button onClick={fetchLive} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
  <RefreshCw size={14} className={`text-slate-400 ${liveLoading ? 'animate-spin' : ''}`} />
</button></Tooltip>
                <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <PackageSearch size={28} className="text-slate-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Tidak Ada Hasil</h3>
              <p className="text-sm text-slate-400 max-w-xs">Tidak ada item yang sesuai dengan filter saat ini.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-slate-500" />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">Rekomendasi Restock</h2>
                <span className="text-xs text-slate-400 font-mono">{liveData.length} item</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter size={12} className="text-slate-400" />
                  <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                    <option value="all">Semua Urgensi</option>
                    <option value="critical">Kritis</option>
                    <option value="high">Menipis</option>
                  </select>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown size={12} className="text-slate-400" />
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                    <option value="qty_desc">Rekomendasi ↑</option>
                    <option value="name_asc">Nama A–Z</option>
                    <option value="name_desc">Nama Z–A</option>
                  </select>
                </div>
<Tooltip text="Refresh"><button onClick={fetchLive} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
  <RefreshCw size={14} className={`text-slate-400 ${liveLoading ? 'animate-spin' : ''}`} />
</button></Tooltip>
                <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
              </div>
            </div>
            {(() => {
              const base = applyFilters(liveData);
              const sections = [
                { label: "Kritis", id: "restock-critical", items: base.filter(i => i.urgency === 'critical'), dot: "bg-red-500", pulse: true, badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
                { label: "Menipis", id: "restock-high", items: base.filter(i => i.urgency === 'high'), dot: "bg-amber-500", pulse: false, badge: "bg-amber-100 text-amber-700" },
              ];
              return sections.map(sec => (
                sec.items.length > 0 ? (
                  <div key={sec.label} id={sec.id}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${sec.dot} ${sec.pulse ? "animate-pulse" : ""}`} />
                      <h2 className="font-semibold text-slate-800 dark:text-slate-200">{sec.label}</h2>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sec.badge}`}>{sec.items.length} item</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{sec.items.map(item => <RecommendCard key={item.id} item={item} onStatusChange={fetchLive} />)}</div>
                  </div>
                ) : null
              ));
            })()}
          </div>
        )
      )}

      {/* Postponed Tab */}
      {tab === 'postponed' && (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(j => <RecommendCardSkeleton key={j} />)}
          </div>
        ) : (() => {
          const rawPostponed = items.filter(r => r.status === 'postponed');
          const filteredPostponed = applyFilters(rawPostponed);
          if (rawPostponed.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <Clock size={28} className="text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Tidak Ada Restock Ditunda</h3>
                <p className="text-sm text-slate-400 max-w-xs">Rekomendasi restock yang ditunda akan muncul di sini</p>
              </div>
            );
          }
          if (filteredPostponed.length === 0) {
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-500" />
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200">Restock Ditunda</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Filter size={12} className="text-slate-400" />
                      <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                        <option value="all">Semua Urgensi</option>
                        <option value="critical">Kritis</option>
                        <option value="high">Menipis</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown size={12} className="text-slate-400" />
                      <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                        <option value="qty_desc">Rekomendasi ↑</option>
                        <option value="name_asc">Nama A–Z</option>
                        <option value="name_desc">Nama Z–A</option>
                      </select>
                    </div>
<Tooltip text="Refresh"><button onClick={fetchRecs} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
  <RefreshCw size={14} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
</button></Tooltip>
                    <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <PackageSearch size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Tidak Ada Hasil</h3>
                  <p className="text-sm text-slate-400 max-w-xs">Tidak ada item yang sesuai dengan filter saat ini.</p>
                </div>
              </div>
            );
          }
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-slate-500" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-200">Restock Ditunda</h2>
                  <span className="text-xs text-slate-400 font-mono">{filteredPostponed.length} item</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter size={12} className="text-slate-400" />
                    <select value={urgencyFilter} onChange={e => setUrgencyFilter(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                      <option value="all">Semua Urgensi</option>
                      <option value="critical">Kritis</option>
                      <option value="high">Menipis</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={12} className="text-slate-400" />
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="text-xs px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none focus:border-blue-500">
                      <option value="qty_desc">Rekomendasi ↑</option>
                      <option value="name_asc">Nama A–Z</option>
                      <option value="name_desc">Nama Z–A</option>
                    </select>
                  </div>
                  <button onClick={fetchRecs} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                    <RefreshCw size={14} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                  <BranchSelect value={recBranchFilter} onChange={v => { setRecBranchFilter(v); }} role={userProfile?.role} userBranch={userProfile?.branch} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPostponed.map(item => <RecommendCard key={item.id} item={item} onStatusChange={fetchRecs} />)}
              </div>
            </div>
          );
        })()
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
            <div className="flex flex-wrap items-center gap-2">
              <BranchSelect value={poBranchFilter} onChange={setPOBranchFilter} role={userProfile?.role} userBranch={userProfile?.branch} />
              <Tooltip text="Refresh"><button onClick={fetchPOList} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                <RefreshCw size={11} className={`text-slate-400 transition-all ${poLoading ? 'animate-spin' : ''}`} />
              </button></Tooltip>
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

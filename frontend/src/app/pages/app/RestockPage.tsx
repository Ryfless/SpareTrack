import React, { useState, useEffect } from "react";
import { Truck, Loader2, ClipboardList, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Skeleton } from "../../components/shared/Skeleton";
import { ReceiptView } from "../../components/ReceiptView";
import { CreatePOModal } from "../../components/modals/CreatePOModal";
import { PostponeModal } from "../../components/modals/PostponeModal";
import { ConfirmApproveModal } from "../../components/modals/ConfirmApproveModal";
import {
  getRecommendations, getPurchaseOrders, getPurchaseOrderDetail,
  approvePurchaseOrder, generateRecommendations,
  type RestockRecommendation, type PurchaseOrder, type PurchaseOrderDetail,
} from "../../services/restock";

export function RestockPage() {
  const [items, setItems] = useState<RestockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [createPOItem, setCreatePOItem] = useState<RestockRecommendation | null>(null);
  const [postponeItem, setPostponeItem] = useState<RestockRecommendation | null>(null);

  const [receiptPO, setReceiptPO] = useState<PurchaseOrderDetail | null>(null);
  const [approvePO, setApprovePO] = useState<PurchaseOrderDetail | null>(null);
  const [approving, setApproving] = useState(false);

  const [poList, setPOList] = useState<PurchaseOrder[]>([]);
  const [poLoading, setPOLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRecommendations().catch(() => { toast.error("Gagal memuat rekomendasi"); return []; }),
      fetchPOList(),
    ]).then(([recs]) => {
      setItems(recs);
    }).finally(() => setLoading(false));
  }, []);

  async function fetchPOList() {
    setPOLoading(true);
    try {
      const res = await getPurchaseOrders({ limit: 50 });
      setPOList(res.data);
    } catch { /* ignore */ }
    setPOLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const data = await generateRecommendations();
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
      toast.success(`PO ${approvePO.po_number} disetujui — stok ditambahkan`);
      setApprovePO(null);
      await fetchPOList();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal approve PO');
    }
    setApproving(false);
  }

  function RecommendCard({ item }: { item: RestockRecommendation }) {
    const priorityMap: Record<string, string> = { critical: 'high', high: 'high', medium: 'medium', low: 'low', overstock: 'overstock' };
    return (
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{item.name}</div><div className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.code} · {item.branch_name}</div></div>
          <PriorityBadge priority={priorityMap[item.urgency] || 'medium'} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className={`font-bold text-lg leading-none ${item.current_stock <= item.min_stock ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.current_stock}</div><div className="text-slate-400 mt-1">Stok Saat Ini</div></div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center"><div className="font-bold text-lg leading-none text-slate-800 dark:text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.reorder_point}</div><div className="text-slate-400 mt-1">Reorder Point</div></div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center"><div className="font-bold text-lg leading-none text-blue-700 dark:text-blue-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>+{item.recommended_qty}</div><div className="text-slate-400 mt-1">Rekomendasi</div></div>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5 mb-3 leading-relaxed">{item.notes}</div>
        <div className="flex gap-2">
          <button onClick={() => setCreatePOItem(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Truck size={12} />Buat PO Restock</button>
          <button onClick={() => setPostponeItem(item)} className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all">Tunda</button>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2].map(i => (
          <div key={i}><Skeleton className="h-6 w-48 mb-3" /><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1, 2, 3].map(j => <Skeleton key={j} className="h-56" />)}</div></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CreatePOModal item={createPOItem} onClose={() => setCreatePOItem(null)} onCreated={handlePOCreated} />
      <PostponeModal item={postponeItem} onClose={() => setPostponeItem(null)} />
      <ConfirmApproveModal po={approvePO} submitting={approving} onConfirm={handleConfirmApprove} onClose={() => setApprovePO(null)} />
      {receiptPO && <ReceiptView po={receiptPO} onClose={() => setReceiptPO(null)} />}

      {/* Recommendations section */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <ClipboardList size={28} className="text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">Belum Ada Rekomendasi Restock</h3>
          <p className="text-sm text-slate-400 max-w-xs mb-6">Generate rekomendasi untuk menganalisis stok dan mengetahui item yang perlu direstock</p>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
            {generating ? 'Menggenerasi...' : 'Generate Rekomendasi'}
          </button>
        </div>
      ) : (
        [
          { label: "Restock Urgent", items: items.filter(r => r.urgency === "critical" || r.urgency === "high"), dot: "bg-red-500", pulse: true, badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" },
          { label: "Perlu Dipantau", items: items.filter(r => r.urgency === "medium"), dot: "bg-amber-500", pulse: false, badge: "bg-amber-100 text-amber-700" },
          { label: "Overstock Warning", items: items.filter(r => r.urgency === "overstock"), dot: "bg-purple-500", pulse: false, badge: "bg-purple-100 text-purple-700" },
        ].map(sec => (
          sec.items.length > 0 ? (
            <div key={sec.label}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full ${sec.dot} ${sec.pulse ? "animate-pulse" : ""}`} />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200">{sec.label}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${sec.badge}`}>{sec.items.length} item</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{sec.items.map(item => <RecommendCard key={item.id} item={item} />)}</div>
            </div>
          ) : null
        ))
      )}

      {/* Purchase Orders section */}
      <div className="mt-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList size={16} className="text-slate-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-200">Purchase Orders</h2>
          {poLoading && <Loader2 size={13} className="animate-spin text-slate-400" />}
        </div>
        <Card className="overflow-hidden">
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
                    : po.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-600';
                  return (
                    <tr key={po.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{po.po_number}</td>
                      <td className="px-4 py-3 text-slate-600">{po.supplier}</td>
                      <td className="px-4 py-3 text-slate-600">{po.branch}</td>
                      <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusBadge}`}>{po.status}</span></td>
                      <td className="px-4 py-3 text-slate-600" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Rp {(po.total_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(po.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3">
                        {po.status === 'pending' && (
                          <button onClick={async () => {
                            try {
                              const d = await getPurchaseOrderDetail(po.id);
                              setApprovePO(d);
                            } catch { toast.error("Gagal memuat detail PO"); }
                          }} className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 px-2.5 py-1.5 rounded-lg transition-all">
                            <CheckCircle size={12} />Approve
                          </button>
                        )}
                        {po.status === 'approved' && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle size={12} />Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

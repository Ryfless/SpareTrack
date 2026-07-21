import React, { useState, useEffect } from "react";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { PriorityBadge } from "../../components/shared/PriorityBadge";
import { Skeleton } from "../../components/shared/Skeleton";
import { CreatePOModal } from "../../components/modals/CreatePOModal";
import { PostponeModal } from "../../components/modals/PostponeModal";
import { getRecommendations, approveRecommendation, type RestockRecommendation } from "../../services/restock";

export function RestockPage() {
  const [items, setItems] = useState<RestockRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPOItem, setCreatePOItem] = useState<RestockRecommendation | null>(null);
  const [postponeItem, setPostponeItem] = useState<RestockRecommendation | null>(null);

  useEffect(() => {
    setLoading(true);
    getRecommendations()
      .then(setItems)
      .catch(() => toast.error("Gagal memuat rekomendasi restock"))
      .finally(() => setLoading(false));
  }, []);

  async function handleApprove(id: string) {
    try {
      await approveRecommendation(id);
      toast.success("Rekomendasi berhasil diapprove");
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'approved' } : i));
    } catch { toast.error("Gagal approve rekomendasi"); }
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
        {item.urgency !== "overstock" && item.status !== 'approved' && (
          <div className="flex gap-2">
            <button onClick={() => setCreatePOItem(item)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Truck size={12} />Buat PO Restock</button>
            <button onClick={() => handleApprove(item.id)} className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all">Approve</button>
            <button onClick={() => setPostponeItem(item)} className="py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all">Tunda</button>
          </div>
        )}
        {item.status === 'approved' && (
          <div className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2 text-center">✓ Sudah diapprove</div>
        )}
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
      <CreatePOModal item={createPOItem} onClose={() => setCreatePOItem(null)} />
      <PostponeModal item={postponeItem} onClose={() => setPostponeItem(null)} />
      {[
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
      ))}
    </div>
  );
}

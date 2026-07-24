import React, { useEffect, useState } from "react";
import { X, Package, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { getById, type SparepartDetail } from "../services/inventory";
import { StatusBadge } from "./shared/StatusBadge";
import { StokMasukModal } from "./modals/StokMasukModal";
import { StokKeluarModal } from "./modals/StokKeluarModal";


export function DetailDrawer({ partId, onClose }: { partId: string | null; onClose: () => void }) {
  const [part, setPart] = useState<SparepartDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [stokMasukOpen, setStokMasukOpen] = useState(false);
  const [stokKeluarOpen, setStokKeluarOpen] = useState(false);

  useEffect(() => {
    if (!partId) { setPart(null); return; }
    setLoading(true);
    getById(partId)
      .then(setPart)
      .catch(() => toast.error("Gagal memuat detail sparepart"))
      .finally(() => setLoading(false));
  }, [partId]);

  const movements = part?.recent_movements || [];
  const sparkData = movements.slice().reverse().slice(0, 7).map(m => Math.abs(m.quantity));
  const last7In = movements.filter(m => m.type === 'in').slice(0, 7).reduce((s, m) => s + m.quantity, 0);
  const last7Out = movements.filter(m => m.type === 'out').slice(0, 7).reduce((s, m) => s + Math.abs(m.quantity), 0);
  const trendUp = last7In > last7Out;

  return (
    <>
      {partId && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} style={{ backdropFilter: "blur(2px)" }} />}
      <StokMasukModal open={stokMasukOpen} onClose={() => setStokMasukOpen(false)} sparepart={part ?? undefined} />
      <StokKeluarModal open={stokKeluarOpen} onClose={() => setStokKeluarOpen(false)} sparepart={part ?? undefined} />
      <div className={`fixed top-0 right-0 h-full w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${partId ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{part?.name ?? (loading ? "Memuat..." : "Detail Sparepart")}</div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={15} /></button>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
        ) : part ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800"><Package size={24} className="text-blue-400" /></div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 mb-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.code}</div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">{part.name}</div>
                <div className="flex items-center gap-2 mt-1"><StatusBadge status={part.status} /><span className="text-xs text-slate-400">{part.category}</span></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ l: "Total", v: part.total_stock }, { l: "Min Stok", v: part.min_stock }, { l: "Reorder Pt", v: part.reorder_point }].map(m => (
                <div key={m.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.v}</div>
                  <div className="text-xs text-slate-400 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">Stok per Cabang</div>
              {part.stock_by_branch.map(b => (
                <div key={b.branch_id} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{b.branch_name}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{b.quantity}</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((b.quantity / 100) * 100, 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
              {[["Supplier", part.supplier], ["Harga", `Rp ${part.price.toLocaleString()}`], ["Lead Time", `${part.lead_time} hari`], ["Safety Stock", part.safety_stock.toString()]].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-slate-400">{l}</span><span className="font-medium text-slate-700 dark:text-slate-300">{v}</span></div>
              ))}
            </div>
            {sparkData.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pergerakan Stok (7 transaksi terakhir)</div>
                <ResponsiveContainer width="100%" height={90}>
                  <AreaChart data={sparkData.map((v, i) => ({ m: i, v }))} margin={{ top: 2, right: 0, left: -48, bottom: 0 }}>
                    <defs><linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} /><stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke="#1d4ed8" strokeWidth={2} fill="url(#dGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="space-y-2">
              {last7In > 0 || last7Out > 0 ? (
                <div className={`flex items-start gap-2 p-3 rounded-lg border ${trendUp ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-700 dark:text-amber-400"}`}>
                  {trendUp ? <TrendingUp size={13} className="mt-0.5 shrink-0" /> : <TrendingDown size={13} className="mt-0.5 shrink-0" />}
                  <p className="text-xs">7 transaksi terakhir: {last7In} masuk, {last7Out} keluar — {trendUp ? "cenderung meningkat" : "cenderung menurun"}</p>
                </div>
              ) : null}
              {part.status === "critical" && (
                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 text-red-700 dark:text-red-400">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /><p className="text-xs">Stok kritis — restock segera dibutuhkan</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Pilih sparepart untuk detail</div>
        )}
        {part && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-2">
            <button onClick={() => { setStokMasukOpen(true); }} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all">Stok Masuk</button>
            <button onClick={() => { setStokKeluarOpen(true); }} className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 active:scale-95 rounded-lg transition-all">Stok Keluar</button>
          </div>
        )}
      </div>
    </>
  );
}

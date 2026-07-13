import React from "react";
import { X, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { SPARE_PARTS } from "../data";
import { StatusBadge } from "./shared/StatusBadge";

export function DetailDrawer({ partId, onClose }: { partId: string | null; onClose: () => void }) {
  const part = SPARE_PARTS.find(s => s.id === partId);
  const sparkData = [60, 45, 70, 55, 80, 65, 75];
  return (
    <>
      {partId && <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} style={{ backdropFilter: "blur(2px)" }} />}
      <div className={`fixed top-0 right-0 h-full w-96 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ${partId ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200">{part?.name ?? "Detail Sparepart"}</div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={15} /></button>
        </div>
        {part ? (
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
              {[{ l: "Total", v: part.stockA + part.stockB + part.stockC }, { l: "Min Stok", v: part.minStock }, { l: "Reorder Pt", v: part.reorderPoint }].map(m => (
                <div key={m.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-slate-800 dark:text-slate-200 leading-none" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.v}</div>
                  <div className="text-xs text-slate-400 mt-1">{m.l}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2.5">Stok per Cabang</div>
              {[{ n: "Cabang A – Jakpus", v: part.stockA }, { n: "Cabang B – Bekasi", v: part.stockB }, { n: "Cabang C – Tangerang", v: part.stockC }].map(b => (
                <div key={b.n} className="mb-2.5">
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-500">{b.n}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{b.v}</span></div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((b.v / 100) * 100, 100)}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2 text-xs">
              {[["Supplier", part.supplier], ["Harga", `Rp ${part.price.toLocaleString()}`], ["Lead Time", `${part.leadTime} hari`], ["Safety Stock", part.safetyStock.toString()]].map(([l, v]) => (
                <div key={l} className="flex justify-between"><span className="text-slate-400">{l}</span><span className="font-medium text-slate-700 dark:text-slate-300">{v}</span></div>
              ))}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Pergerakan Stok (7 bln)</div>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={sparkData.map((v, i) => ({ m: i, v }))} margin={{ top: 2, right: 0, left: -48, bottom: 0 }}>
                  <defs><linearGradient id="dGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} /><stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} /></linearGradient></defs>
                  <Area type="monotone" dataKey="v" stroke="#1d4ed8" strokeWidth={2} fill="url(#dGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
                <TrendingUp size={13} className="mt-0.5 shrink-0" /><p className="text-xs">Permintaan naik 18% vs bulan lalu</p>
              </div>
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
            <button onClick={() => { toast.success(`Stok masuk — ${part.name}`); onClose(); }} className="flex-1 py-2 text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all">Stok Masuk</button>
            <button onClick={() => { toast.success(`Stok keluar — ${part.name}`); onClose(); }} className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 active:scale-95 rounded-lg transition-all">Stok Keluar</button>
          </div>
        )}
      </div>
    </>
  );
}

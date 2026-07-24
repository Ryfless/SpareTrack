import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { Skeleton } from "../../components/shared/Skeleton";
import { list as fetchBranches, getStocks, type Branch, type BranchStockItem } from "../../services/branches";

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchStocks, setBranchStocks] = useState<Record<string, BranchStockItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchBranches()
      .then(async (bList) => {
        setBranches(bList);
        const stockMap: Record<string, BranchStockItem[]> = {};
        await Promise.all(bList.map(async (b) => {
          try {
            const res = await getStocks(b.id);
            stockMap[b.id] = res.stocks;
          } catch { stockMap[b.id] = []; }
        }));
        setBranchStocks(stockMap);
      })
      .catch(() => toast.error("Gagal memuat data cabang"))
      .finally(() => setLoading(false));
  }, []);

  const heatParts = branches.length > 0 ? (branchStocks[branches[0]?.id] || []).slice(0, 6).map(s => s.name) : [];
  const heatVals = branches.map(b => (branchStocks[b.id] || []).slice(0, 6).map(s => s.quantity));
  const heatMax = heatVals.length > 0 ? heatParts.map((_, pi) => Math.max(...heatVals.map(v => v[pi] || 0), 1)) : [];

  const cellCls = (v: number, m: number) => {
    const r = v / m;
    return r < 0.3 ? "bg-red-100 dark:bg-red-900/30 text-red-700" : r < 0.65 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700";
  };

  if (loading) {
    return <div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}</div></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(b => {
          const stocks = branchStocks[b.id] || [];
          const critical = stocks.filter(s => s.status === "critical").length;
          const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
          const risk = critical > 3 ? "high" : "low";
          return (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div><div className="font-bold text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.city || '-'}</div></div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${risk === "high" ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${risk === "high" ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />{risk === "high" ? "Risiko Tinggi" : "Normal"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[{ l: "Total Stok", v: totalStock.toString(), r: false }, { l: "Item Kritis", v: critical.toString(), r: critical > 3 }, { l: "Total Item", v: stocks.length.toString(), r: false }].map(m => (
                  <div key={m.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"><div className={`text-lg font-bold leading-none ${m.r ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.v}</div><div className="text-xs text-slate-400 mt-1">{m.l}</div></div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
      {branches.length > 0 && heatParts.length > 0 && (
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Matrix Stok Antar Cabang</div>
          <div className="text-xs text-slate-400 mb-4">Heatmap kondisi stok item utama</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800"><th className="text-left pb-2 text-slate-400 font-semibold">Sparepart</th>{branches.map(b => <th key={b.id} className="text-center pb-2 text-slate-500 font-semibold">{b.name}</th>)}</tr></thead>
            <tbody>{heatParts.map((part, pi) => <tr key={part} className="border-b border-slate-50 dark:border-slate-800/50"><td className="py-2 text-slate-600 dark:text-slate-400 font-medium">{part}</td>{branches.map((_, ci) => <td key={ci} className="py-2 text-center"><span className={`px-2 py-0.5 rounded font-semibold ${cellCls(heatVals[ci][pi] || 0, heatMax[pi])}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{heatVals[ci][pi] || 0}</span></td>)}</tr>)}</tbody>
          </table>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {[["bg-emerald-100", "Aman"], ["bg-amber-100", "Menipis"], ["bg-red-100", "Kritis"]].map(([c, l]) => <div key={l} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${c}`} /><span className="text-slate-500">{l}</span></div>)}
          </div>
        </Card>
      )}
    </div>
  );
}

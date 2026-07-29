import React, { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { Skeleton } from "../../components/shared/Skeleton";
import { list as fetchBranches, getStocks, getSalesTrend, type Branch, type BranchStocksResponse, type SalesTrendItem } from "../../services/branches";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

function formatValue(v: number): string {
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1).replace('.', ',')} M`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace('.', ',')} Jt`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1).replace('.', ',')} Rb`;
  return v.toString();
}

export function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchData, setBranchData] = useState<Record<string, BranchStocksResponse>>({});
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [loading, setLoading] = useState(true);

  const branchStocks = Object.fromEntries(
    Object.entries(branchData).map(([id, d]) => [id, d.stocks])
  );

  useEffect(() => {
    setLoading(true);
    fetchBranches()
      .then(async (bList) => {
        setBranches(bList);
        const dataMap: Record<string, BranchStocksResponse> = {};
        await Promise.all(bList.map(async (b) => {
          try {
            dataMap[b.id] = await getStocks(b.id);
          } catch {
            dataMap[b.id] = { branch: b, stocks: [], total_value: 0, monthly_sales: 0, top_selling: [] };
          }
        }));
        setBranchData(dataMap);
        getSalesTrend().then(setSalesTrend).catch(() => {});
      })
      .catch(() => toast.error("Gagal memuat data cabang"))
      .finally(() => setLoading(false));
  }, []);

  const heatParts = branches.length > 0 ? (branchStocks[branches[0]?.id] || []).map(s => s.name) : [];
  const heatVals = branches.map(b => (branchStocks[b.id] || []).map(s => s.quantity));
  const heatMax = heatVals.length > 0 ? heatParts.map((_, pi) => Math.max(...heatVals.map(v => v[pi] || 0), 1)) : [];

  const cellCls = (v: number, m: number) => {
    const r = v / m;
    return r < 0.3 ? "bg-red-100 dark:bg-red-900/30 text-red-700" : r < 0.65 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700";
  };

  const BRANCH_COLORS = ['#1d4ed8', '#0d9488', '#22c55e', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2', '#d946ef'];

  const chartData = salesTrend.map(item => {
    const entry: Record<string, string | number> = { month_label: item.month_label };
    for (const tb of item.top_branches) {
      entry[tb.branch_name] = tb.total;
    }
    return entry;
  });

  const uniqueBranches: string[] = [];
  for (const item of salesTrend) {
    for (const tb of item.top_branches) {
      if (!uniqueBranches.includes(tb.branch_name)) {
        uniqueBranches.push(tb.branch_name);
      }
    }
  }

  uniqueBranches.sort((a, b) => a.localeCompare(b));

  const branchColorMap: Record<string, string> = {};
  uniqueBranches.forEach((name, i) => {
    branchColorMap[name] = BRANCH_COLORS[i % BRANCH_COLORS.length];
  });

  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</div>
        {payload
          .filter((p: any) => p.value > 0)
          .sort((a: any, b: any) => b.value - a.value)
          .map((p: any) => (
            <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
              <span className="ml-auto font-semibold text-slate-800 dark:text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
            </div>
          ))}
      </div>
    );
  };

  if (loading) {
    return <div className="space-y-5"><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-64" />)}</div></div>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(b => {
          const data = branchData[b.id];
          const stocks = data?.stocks || [];
          const critical = stocks.filter(s => s.status === "critical").length;
          const totalStock = stocks.reduce((sum, s) => sum + s.quantity, 0);
          const totalValue = data?.total_value || 0;
          const monthlySales = data?.monthly_sales || 0;
          const topSelling = data?.top_selling || [];
          const risk = critical > 3 ? "high" : "low";
          return (
            <Card key={b.id} className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div><div className="font-bold text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.city || '-'}</div></div>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${risk === "high" ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${risk === "high" ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />{risk === "high" ? "Risiko Tinggi" : "Normal"}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { l: "Total Stok", v: totalStock.toString(), r: false },
                  { l: "Item Kritis", v: critical.toString(), r: critical > 3 },
                  { l: "Nilai Inventory", v: `Rp ${formatValue(totalValue)}`, r: false },
                  { l: "Terjual/Bln", v: monthlySales.toString(), r: false },
                ].map(m => (
                  <div key={m.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"><div className={`text-lg font-bold leading-none ${m.r ? "text-red-600" : "text-slate-800 dark:text-slate-200"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.v}</div><div className="text-xs text-slate-400 mt-1">{m.l}</div></div>
                ))}
              </div>
              {topSelling.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <div className="text-xs font-semibold text-slate-500 mb-2">Top 3 Terlaris Bulan Ini</div>
                  <div className="space-y-1.5">
                    {topSelling.map((item, i) => (
                      <div key={item.sparepart_id} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{item.sparepart_name}</span>
                        <span className="ml-auto text-xs font-semibold text-slate-500" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.total} unit</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {branches.length > 0 && heatParts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {chartData.length > 0 && (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Grafik Penjualan 6 Bulan</div>
              <div className="text-xs text-slate-400 mb-4">Perbandingan penjualan per cabang</div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData} margin={{ top: 0, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    formatter={(value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>}
                  />
                  {uniqueBranches.map(name => (
                    <Bar key={name} dataKey={name} name={name} fill={branchColorMap[name]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Matrix Stok Antar Cabang</div>
            <div className="text-xs text-slate-400 mb-4">Heatmap kondisi stok item utama</div>
            <div className="max-h-[215px] overflow-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10"><th className="text-left pb-2 text-slate-400 font-semibold">Sparepart</th>{branches.map(b => <th key={b.id} className="text-center pb-2 text-slate-500 font-semibold">{b.name}</th>)}</tr></thead>
              <tbody>{heatParts.map((part, pi) => <tr key={part} className="border-b border-slate-50 dark:border-slate-800/50"><td className="py-2 text-slate-600 dark:text-slate-400 font-medium">{part}</td>{branches.map((_, ci) => <td key={ci} className="py-2 text-center"><span className={`px-2 py-0.5 rounded font-semibold ${cellCls(heatVals[ci][pi] || 0, heatMax[pi])}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{heatVals[ci][pi] || 0}</span></td>)}</tr>)}</tbody>
            </table>
          </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              {[["bg-emerald-100", "Aman"], ["bg-amber-100", "Menipis"], ["bg-red-100", "Kritis"]].map(([c, l]) => <div key={l} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${c}`} /><span className="text-slate-500">{l}</span></div>)}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

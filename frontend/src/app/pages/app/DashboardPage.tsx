import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Package, BarChart3, AlertTriangle, ShoppingCart, Zap, Layers, Building2, Target,
  Plus, ArrowDownRight, Activity, Truck,
  ChevronRight, MapPin, AlertCircle, Clock, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { Skeleton } from "../../components/shared/Skeleton";
import { ChartTip } from "../../components/shared/ChartTip";
import { getSummary, getRecentActivity, getDemandForecast, type DemandPoint } from "../../services/dashboard";
import { list as fetchBranches, getStocks, type BranchStocksResponse } from "../../services/branches";
import { getLiveRecommendations, type RestockRecommendation } from "../../services/restock";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { PageId } from "../../types";
import { getSalesTrend, type SalesTrendItem } from "../../services/branches";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function DashboardPage({ onNavigate, onAction }: { onNavigate: (p: PageId, f?: string) => void; onAction: (a: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ total_spareparts: 0, total_branches: 0, total_stock: 0, total_value: 0, critical_stock: 0, low_stock: 0, overstock: 0, safe: 0, total_recommendations: 0 });
  const [activities, setActivities] = useState<Array<{ id: string; description: string; action: string; created_at: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [branchKpis, setBranchKpis] = useState<Record<string, BranchStocksResponse>>({});
  const [urgentItems, setUrgentItems] = useState<RestockRecommendation[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrendItem[]>([]);
  const [demandData, setDemandData] = useState<DemandPoint[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, activities, branches] = await Promise.all([
        getSummary().catch(() => null),
        getRecentActivity().catch(() => []),
        fetchBranches().catch(() => []),
      ]);
      if (summary?.kpi) setKpi(summary.kpi);
      setActivities(activities as Array<{ id: string; description: string; action: string; created_at: string }>);
      setBranches(branches as Array<{ id: string; name: string; city: string }>);
      const kpiMap: Record<string, BranchStocksResponse> = {};
      await Promise.all(branches.slice(0, 3).map(async (b: { id: string }) => {
        try { kpiMap[b.id] = await getStocks(b.id); } catch { /* ignore */ }
      }));
      setBranchKpis(kpiMap);
      const recs = await getLiveRecommendations().catch(() => []);
      const byBranch: Record<string, RestockRecommendation[]> = {};
      for (const r of recs) {
        if (!byBranch[r.branch_id]) byBranch[r.branch_id] = [];
        byBranch[r.branch_id].push(r);
      }
      const topEach = Object.values(byBranch).map(bItems =>
        bItems.reduce((a, b) => a.recommended_qty > b.recommended_qty ? a : b)
      );
      topEach.sort((a, b) => b.recommended_qty - a.recommended_qty);
      setUrgentItems(topEach.slice(0, 3));
      getSalesTrend().then(setSalesTrend).catch(() => {});
      getDemandForecast().then(setDemandData).catch(() => {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function onRefresh() { loadData(); }
    window.addEventListener('sparetrack:refresh', onRefresh);
    return () => window.removeEventListener('sparetrack:refresh', onRefresh);
  }, [loadData]);

  useAutoRefresh(loadData, 60 * 1000, true);

  const kondisiTotal = kpi.safe + kpi.low_stock + kpi.critical_stock + kpi.overstock;

  const demandLabel = demandData.length > 0
    ? `Aktual vs prediksi ${demandData.filter(d => d.predicted !== null).length} bulan · ${demandData[0].month} – ${demandData[demandData.length - 1].month}`
    : 'Memuat...';

  const chartData = useMemo(() => {
    if (demandData.length === 0) return [];
    const result = demandData.map(d => ({ ...d }));
    let firstPred = -1;
    let lastActual = -1;
    for (let i = 0; i < result.length; i++) {
      if (result[i].predicted !== null && firstPred === -1) firstPred = i;
      if (result[i].actual !== null) lastActual = i;
    }
    if (lastActual >= 0 && firstPred > 0 && lastActual === firstPred - 1) {
      result[lastActual].predicted = result[lastActual].actual;
    }
    return result;
  }, [demandData]);

  function fmt(v: number): string {
    if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(v % 1_000_000_000 === 0 ? 0 : 1).replace('.', ',')} M`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace('.', ',')} Jt`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(v % 1_000 === 0 ? 0 : 1).replace('.', ',')} Rb`;
    return v.toString();
  }

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return `${mins} mnt lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} jam lalu`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} hari lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID');
  }

  function activityBadge(action: string, desc: string): { label: string; cls: string } {
    const qtyMatch = desc.match(/(\d+)\s*[x×]/) || desc.match(/(\d+)\s*item/);
    const qty = qtyMatch ? qtyMatch[1] : '';
    if (action === 'in' || action === 'receive_po') return { label: `+${qty || 0}`, cls: 'text-emerald-600 font-bold' };
    if (action === 'out' || action === 'cancel_po') return { label: `-${qty || 0}`, cls: 'text-red-600 font-bold' };
    if (action === 'transfer') return { label: `↔${qty || 0}`, cls: 'text-indigo-600 font-semibold' };
    if (action === 'adjustment') return { label: qty ? `±${qty}` : '±0', cls: 'text-amber-500 font-semibold' };
    if (['generate_restock', 'create_po', 'approve_po'].includes(action)) return { label: '~', cls: 'text-blue-500' };
    return { label: qty ? `+${qty}` : '~', cls: 'text-slate-400' };
  }

  const actionAlerts = [
    { icon: AlertCircle, label: "Stok Kritis", count: kpi.critical_stock, cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600", desc: "perlu restock segera", page: "restock" as PageId },
    { icon: AlertTriangle, label: "Stok Menipis", count: kpi.low_stock, cls: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600", desc: "di bawah reorder point", page: "restock" as PageId, filter: "menipis" },
    { icon: Truck, label: "Total Stok", count: kpi.total_stock, cls: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600", desc: "di seluruh cabang", page: "inventory" as PageId },
    { icon: Building2, label: "Cabang Aktif", count: branches.length, cls: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600", desc: "cabang terdaftar", page: "branches" as PageId },
  ];

  const quickActions = [
    { icon: Plus, label: "Tambah Sparepart", action: "add_item", cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 border-blue-100 dark:border-blue-800" },
    { icon: ArrowDownRight, label: "Stok Masuk", action: "stok_masuk", cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 hover:bg-emerald-100 border-emerald-100" },
    { icon: Activity, label: "Transfer Stok", action: "transfer", cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 hover:bg-indigo-100 border-indigo-100" },
    { icon: Truck, label: "Purchase Request", action: "po", cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 hover:bg-orange-100 border-orange-100" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <Skeleton className="h-24" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>
          <Skeleton className="h-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-56 lg:col-span-2" />
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Action Center */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Action Center</span>
          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-semibold">{kpi.critical_stock + kpi.low_stock} perlu perhatian</span>
          <RefreshCw size={11} className="ml-auto text-slate-400 animate-spin" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actionAlerts.map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page, (a as any).filter)} className={`flex items-start gap-3 p-3 rounded-xl border ${a.cls} transition-all hover:shadow-sm active:scale-95 text-left overflow-hidden`}>
              <a.icon size={16} className="mt-0.5 shrink-0" />
              <div className="min-w-0"><div className="text-xl font-bold leading-none mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.count}</div><div className="text-xs font-semibold truncate">{a.label}</div><div className="text-xs opacity-60 mt-0.5 truncate">{a.desc}</div></div>
            </button>
          ))}
        </div>
      </div>
      {/* Quick Actions */}
      <Card className="p-4">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {quickActions.map(a => (
            <button key={a.label} onClick={() => onAction(a.action)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${a.cls} transition-all active:scale-95`}>
              <a.icon size={18} /><span className="text-xs font-medium leading-tight text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Sparepart" value={kpi.total_spareparts} icon={Package} sub={`${kpi.total_stock} total stok`} trend={{ value: `${Math.round((kpi.total_spareparts || 0) > 0 ? ((kpi.total_stock) / kpi.total_spareparts) * 10 : 0)}%`, up: true }} sparkData={[10, 10, 11, 10, 11, 12, kpi.total_spareparts]} onClick={() => onNavigate("inventory")} />
        <KPICard label="Nilai Stok" value={`Rp ${((kpi.total_stock * 100000) / 1_000_000).toFixed(1)}M`} icon={BarChart3} sub={`di ${branches.length} cabang`} trend={{ value: "+8.4%", up: true }} sparkData={[70, 75, 72, 78, 80, 82, 83]} onClick={() => onNavigate("reports")} />
        <KPICard label="Item Bermasalah" value={kpi.low_stock + kpi.critical_stock} icon={AlertTriangle} sub={`${kpi.critical_stock} kritis · ${kpi.low_stock} menipis`} warning trend={{ value: "+2", up: false }} sparkData={[3, 4, 5, 4, 5, 6, kpi.low_stock + kpi.critical_stock]} onClick={() => onNavigate("inventory", "critical")} />
        <KPICard label="Restock Urgent" value={kpi.total_recommendations} icon={ShoppingCart} sub="prioritas tinggi" danger trend={{ value: "+1", up: false }} sparkData={[1, 2, 2, 3, 3, 3, kpi.total_recommendations]} onClick={() => onNavigate("restock")} />
      </div>
      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {branches.slice(0, 3).map(b => {
            const bkpi = branchKpis[b.id];
            const totalStok = bkpi ? bkpi.stocks.reduce((s, i) => s + i.quantity, 0) : 0;
            const critCount = bkpi ? bkpi.stocks.filter(i => i.status === 'critical').length : 0;
            return (
              <Card key={b.id} className="p-4 cursor-pointer hover:shadow-md transition-all" onClick={() => onNavigate("branches")}>
                <div className="flex items-start justify-between mb-3">
                  <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.city || '-'}</div></div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${critCount > 3 ? "bg-red-50 dark:bg-red-900/20 text-red-700" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${critCount > 3 ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`} />{critCount > 3 ? "Tinggi" : "Normal"}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Total Stok</span><span className="font-semibold text-slate-700 dark:text-slate-300">{bkpi ? totalStok : '-'} item</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Item Kritis</span><span className={`font-semibold ${critCount > 0 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>{bkpi ? critCount : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Nilai Inventori</span><span className="font-semibold text-slate-700 dark:text-slate-300">{bkpi ? `Rp ${fmt(bkpi.total_value)}` : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Terjual Bulan Ini</span><span className="font-semibold text-slate-700 dark:text-slate-300">{bkpi ? `${fmt(bkpi.monthly_sales)} unit` : '-'}</span></div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Kondisi Inventori</div>
            <div className="space-y-3">
              {[{ label: "Aman", count: kpi.safe, color: "bg-emerald-500", f: "safe" },
                { label: "Menipis", count: kpi.low_stock, color: "bg-amber-400", f: "low" },
                { label: "Kritis", count: kpi.critical_stock, color: "bg-red-500", f: "critical" },
                { label: "Overstock", count: kpi.overstock, color: "bg-purple-500", f: "overstock" },
              ].filter(i => i.count > 0).map(item => {
                return (
                  <div key={item.label} className="cursor-pointer group" onClick={() => onNavigate("inventory", item.f)}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors font-medium">{item.label}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{item.count}</span></div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / (kondisiTotal || 1)) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      {/* Row 1: Demand Forecast | Restock Urgent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Demand Forecast – Model XGBoost</div>
          <div className="text-xs text-slate-400 mb-4">{demandLabel}</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <defs>
                <linearGradient id="dfGrd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="actual" name="Aktual" stroke="#3b82f6" strokeWidth={2} fill="url(#dfGrd)" />
              <Area type="monotone" dataKey="predicted" name="Prediksi" stroke="#14b8a6" strokeWidth={2} strokeDasharray="5 4" fill="none" />
              <Legend wrapperStyle={{ fontSize:11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <div className="flex items-start justify-between mb-1">
            <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Restock Urgent</div><div className="text-xs text-slate-400 mt-0.5">{urgentItems.length} item perlu tindakan segera</div></div>
            <button className="text-xs font-semibold text-blue-600 hover:underline shrink-0" onClick={() => onNavigate("restock")}>Lihat semua <ChevronRight size={11} className="inline" /></button>
          </div>
          <div className="space-y-2.5 mt-4">
            {urgentItems.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Tidak ada item urgent</div>
            ) : urgentItems.map(item => (
              <div key={`${item.branch_id}-${item.sparepart_id}`} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                <div className="flex items-start gap-2.5 min-w-0">
                  <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{item.branch_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Stok: <span className="font-semibold text-red-600">{item.current_stock}</span> · Stockout {item.days_to_stockout}h lagi
                    </div>
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-600 font-mono shrink-0 ml-3">+{item.recommended_qty}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {/* Row 2: Penjualan per Cabang | Aktivitas Terkini */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {salesTrend.length > 0 && (() => {
          const BRANCH_COLORS = ['#1d4ed8', '#0d9488', '#22c55e', '#ca8a04', '#dc2626', '#7c3aed', '#0891b2', '#d946ef'];
          const chartData = salesTrend.map(item => {
            const entry: Record<string, string | number> = { month_label: item.month_label };
            for (const tb of item.top_branches) entry[tb.branch_name] = tb.total;
            return entry;
          });
          const uniqueBranches: string[] = [];
          for (const item of salesTrend) {
            for (const tb of item.top_branches) {
              if (!uniqueBranches.includes(tb.branch_name)) uniqueBranches.push(tb.branch_name);
            }
          }
          uniqueBranches.sort((a, b) => a.localeCompare(b));
          const branchColorMap: Record<string, string> = {};
          uniqueBranches.forEach((name, i) => { branchColorMap[name] = BRANCH_COLORS[i % BRANCH_COLORS.length]; });
          const SalesTooltip = ({ active, payload, label }: any) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</div>
                {payload.filter((p: any) => p.value > 0).sort((a: any, b: any) => b.value - a.value).map((p: any) => (
                  <div key={p.dataKey} className="flex items-center gap-2 py-0.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-600 dark:text-slate-400">{p.name}</span>
                    <span className="ml-auto font-semibold text-slate-800 dark:text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{p.value}</span>
                  </div>
                ))}
              </div>
            );
          };
          return (
            <Card className="p-5">
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Penjualan per Cabang</div>
              <div className="text-xs text-slate-400 mb-4">6 bulan terakhir (Unit)</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 0, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<SalesTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} formatter={(value) => <span className="text-slate-600 dark:text-slate-400">{value}</span>} />
                  {uniqueBranches.map(name => (
                    <Bar key={name} dataKey={name} name={name} fill={branchColorMap[name]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </Card>
          );
        })()}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aktivitas Terkini</div></div>
            <button className="text-xs text-blue-600 hover:underline" onClick={() => onNavigate("transactions")}>Semua <ChevronRight size={11} className="inline" /></button>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas</div>
            ) : activities.slice(0, 6).map(item => {
              const dot = ({ in: 'bg-emerald-500', receive_po: 'bg-emerald-500', out: 'bg-red-500', cancel_po: 'bg-red-500', transfer: 'bg-indigo-500', adjustment: 'bg-amber-500', create_po: 'bg-blue-500', approve_po: 'bg-blue-500', generate_restock: 'bg-blue-500' } as Record<string, string>)[item.action] || 'bg-slate-400';
              const badge = activityBadge(item.action, item.description);
              return (
                <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>{timeAgo(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs shrink-0 ml-3 font-mono ${badge.cls}`}>{badge.label}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

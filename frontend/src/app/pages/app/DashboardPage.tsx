import React, { useState, useEffect } from "react";
import {
  Package, BarChart3, AlertTriangle, ShoppingCart, Zap, Layers, Building2, Target,
  Plus, ArrowDownRight, Activity, Truck, Users,
  ChevronRight, MapPin, AlertCircle, Clock, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { Skeleton } from "../../components/shared/Skeleton";
import { ChartTip } from "../../components/shared/ChartTip";
import { getSummary, getRecentActivity } from "../../services/dashboard";
import { list as fetchBranches } from "../../services/branches";
import { getSeries } from "../../services/forecast";
import { getRecommendations } from "../../services/restock";
import type { PageId } from "../../types";

export function DashboardPage({ onNavigate, onAction }: { onNavigate: (p: PageId, f?: string) => void; onAction: (a: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState({ total_spareparts: 0, total_branches: 0, total_stock: 0, total_value: 0, critical_stock: 0, low_stock: 0 });
  const [activities, setActivities] = useState<Array<{ id: string; description: string; action: string; created_at: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string; city: string }>>([]);
  const [forecastData, setForecastData] = useState<Array<{ month: string; predicted_quantity: number }>>([]);
  const [urgentRestock, setUrgentRestock] = useState(0);
  const [restockItems, setRestockItems] = useState<Array<{ id: string; name: string; branch_name: string; days_to_stockout: number; recommended_qty: number; urgency: string }>>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSummary().then(s => { if (s?.kpi) setKpi(s.kpi); if (s?.monthly_trend) {} }),
      getRecentActivity().then(setActivities).catch(() => {}),
      fetchBranches().then(setBranches).catch(() => {}),
      getSeries({ limit: 12 }).then(s => setForecastData(s.map(f => ({ month: f.month.slice(0, 7), predicted_quantity: f.predicted_quantity })))).catch(() => {}),
      getRecommendations({ limit: 10 }).then(r => {
        setUrgentRestock(r.filter(i => i.urgency === 'high' || i.urgency === 'critical').length);
        setRestockItems(r.filter(i => i.urgency === 'high' || i.urgency === 'critical'));
      }).catch(() => {}),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const safe = kpi.total_spareparts - kpi.low_stock - kpi.critical_stock;
  const overstock = Math.max(0, kpi.total_spareparts - safe - kpi.low_stock - kpi.critical_stock);

  const actionAlerts = [
    { icon: AlertCircle, label: "Stok Kritis", count: kpi.critical_stock, cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600", desc: "perlu restock segera", page: "restock" as PageId },
    { icon: AlertTriangle, label: "Stok Menipis", count: kpi.low_stock, cls: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600", desc: "di bawah reorder point", page: "inventory" as PageId },
    { icon: Truck, label: "Total Stok", count: kpi.total_stock, cls: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600", desc: "di seluruh cabang", page: "inventory" as PageId },
    { icon: Building2, label: "Cabang Aktif", count: branches.length, cls: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600", desc: "cabang terdaftar", page: "branches" as PageId },
  ];

  const quickActions = [
    { icon: Plus, label: "Tambah Sparepart", action: "add_item", cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 border-blue-100 dark:border-blue-800" },
    { icon: ArrowDownRight, label: "Stok Masuk", action: "stok_masuk", cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 hover:bg-emerald-100 border-emerald-100" },
    { icon: Activity, label: "Transfer Stok", action: "transfer", cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 hover:bg-indigo-100 border-indigo-100" },
    { icon: Truck, label: "Purchase Request", action: "po", cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 hover:bg-orange-100 border-orange-100" },
    { icon: Users, label: "Tambah Supplier", action: "supplier", cls: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 hover:bg-purple-100 border-purple-100" },
    { icon: Building2, label: "Tambah Cabang", action: "branch", cls: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 hover:bg-teal-100 border-teal-100" },
  ];

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-20" />)}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4"><Skeleton className="h-64 lg:col-span-2" /><Skeleton className="h-64" /></div>
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
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actionAlerts.map(a => (
            <button key={a.label} onClick={() => onNavigate(a.page)} className={`flex items-start gap-3 p-3 rounded-xl border ${a.cls} transition-all hover:shadow-sm active:scale-95 text-left`}>
              <a.icon size={16} className="mt-0.5 shrink-0" />
              <div><div className="text-xl font-bold leading-none mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.count}</div><div className="text-xs font-semibold">{a.label}</div><div className="text-xs opacity-60 mt-0.5">{a.desc}</div></div>
            </button>
          ))}
        </div>
      </div>
      {/* Quick Actions */}
      <Card className="p-4">
        <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">Quick Actions</div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
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
        <KPICard label="Restock Urgent" value={urgentRestock} icon={ShoppingCart} sub="prioritas tinggi" danger trend={{ value: "+1", up: false }} sparkData={[1, 2, 2, 3, 3, 3, urgentRestock]} onClick={() => onNavigate("restock")} />
      </div>
      {/* Branch Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {branches.slice(0, 3).map(b => (
            <Card key={b.id} className="p-4" onClick={() => onNavigate("branches")}>
              <div className="flex items-start justify-between mb-3">
                <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.city || '-'}</div></div>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Normal
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Kondisi Inventori</div>
            <div className="space-y-3">
              {[{ label: "Aman", count: safe, color: "bg-emerald-500", f: "safe" },
                { label: "Menipis", count: kpi.low_stock, color: "bg-amber-400", f: "low" },
                { label: "Kritis", count: kpi.critical_stock, color: "bg-red-500", f: "critical" },
                { label: "Overstock", count: overstock, color: "bg-purple-500", f: "overstock" },
              ].filter(i => i.count > 0).map(item => {
                const total = kpi.total_spareparts || 1;
                return (
                  <div key={item.label} className="cursor-pointer group" onClick={() => onNavigate("inventory", item.f)}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors font-medium">{item.label}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{item.count}/{kpi.total_spareparts}</span></div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.count / total) * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Demand Forecast</div><div className="text-xs text-slate-400 mt-0.5">Prediksi permintaan</div></div>
            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full font-semibold border border-blue-100 dark:border-blue-800">Forecast</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={forecastData.length > 0 ? forecastData : [{ month: "Jan", predicted_quantity: 0 }]} margin={{ top: 0, right: 8, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="predicted_quantity" name="Prediksi" stroke="#0891b2" strokeWidth={2} strokeDasharray="5 4" fill="url(#gS)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aktivitas Terkini</div>
            <button className="text-xs text-blue-600 hover:underline" onClick={() => onNavigate("transactions")}>Semua <ChevronRight size={11} className="inline" /></button>
          </div>
          <div className="space-y-3">
            {activities.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Belum ada aktivitas</div>
            ) : activities.slice(0, 6).map(item => {
              const dot = item.action === "in" ? "bg-emerald-500" : item.action === "out" ? "bg-red-500" : item.action === "approve_restock" ? "bg-blue-500" : "bg-slate-400";
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                  <div className="min-w-0 flex-1"><div className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{item.description}</div><div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400"><span>{new Date(item.created_at).toLocaleDateString('id-ID')}</span></div></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Restock Urgent</div>
          <div className="space-y-2.5">
            {restockItems.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-4">Tidak ada item urgent</div>
            ) : restockItems.slice(0, 4).map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100/60 transition-colors cursor-pointer" onClick={() => onNavigate("restock")}>
                <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1"><div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div><div className="text-xs text-slate-400">{item.branch_name} · stockout {item.days_to_stockout}h lagi</div></div>
                <div className="text-sm font-bold text-blue-700 shrink-0">+{item.recommended_qty}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

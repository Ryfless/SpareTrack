import React from "react";
import {
  Package, BarChart3, AlertTriangle, ShoppingCart, Zap, Layers, Building2, Target,
  Plus, ArrowDownRight, Activity, Truck, Users,
  ChevronRight, MapPin, AlertCircle, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { ChartTip } from "../../components/shared/ChartTip";
import { SPARE_PARTS, restockRecommendations, forecastChartData, monthlyTrendData, recentActivity } from "../../data";
import type { PageId } from "../../types";

export function DashboardPage({ onNavigate, onAction }: { onNavigate: (p: PageId, f?: string) => void; onAction: (a: string) => void }) {
  const safe     = SPARE_PARTS.filter(s => s.status === "safe").length;
  const low      = SPARE_PARTS.filter(s => s.status === "low").length;
  const critical = SPARE_PARTS.filter(s => s.status === "critical").length;
  const overstock= SPARE_PARTS.filter(s => s.status === "overstock").length;
  const totalVal = SPARE_PARTS.reduce((sum, s) => sum + (s.stockA + s.stockB + s.stockC) * s.price, 0);
  const urgentRestock = restockRecommendations.filter(r => r.priority === "high").length;

  const actionAlerts = [
    { icon: AlertCircle, label: "Stok Kritis",      count: critical, cls: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600",      desc: "perlu restock segera",     page: "restock"   as PageId },
    { icon: Clock,       label: "Pending Approval", count: 2,        cls: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600", desc: "PO menunggu approval",   page: "restock"   as PageId },
    { icon: AlertTriangle,label:"Stok Menipis",     count: low,      cls: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600",desc:"di bawah reorder point",page: "inventory" as PageId },
    { icon: Truck,       label: "Terlambat",         count: 1,        cls: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600",desc:"pengiriman supplier",  page: "reports"   as PageId },
    { icon: Building2,   label: "Cabang Risiko",    count: 1,        cls: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600",    desc: "stok di bawah threshold",page: "branches"  as PageId },
  ];
  const quickActions = [
    { icon: Plus,         label: "Tambah Sparepart",  action: "add_item",   cls: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 border-blue-100 dark:border-blue-800"   },
    { icon: ArrowDownRight,label: "Stok Masuk",       action: "stok_masuk", cls: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 hover:bg-emerald-100 border-emerald-100"   },
    { icon: Activity,     label: "Transfer Stok",     action: "transfer",   cls: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 hover:bg-indigo-100 border-indigo-100"         },
    { icon: Truck,        label: "Purchase Request",  action: "po",         cls: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 hover:bg-orange-100 border-orange-100"         },
    { icon: Users,        label: "Tambah Supplier",   action: "supplier",   cls: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 hover:bg-purple-100 border-purple-100"         },
    { icon: Building2,    label: "Tambah Cabang",     action: "branch",     cls: "bg-teal-50 dark:bg-teal-900/20 text-teal-700 hover:bg-teal-100 border-teal-100"                   },
  ];
  return (
    <div className="space-y-5">
      {/* Action Center */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-amber-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Action Center</span>
          <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-semibold">{critical + 2 + low + 2} perlu perhatian</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
        <KPICard label="Total Sparepart"  value={SPARE_PARTS.length}             icon={Package}      sub="12 kategori aktif"         trend={{ value: "+2 bln ini", up: true }}  sparkData={[10,10,11,10,11,12,12]} onClick={() => onNavigate("inventory")} />
        <KPICard label="Nilai Stok"       value={`Rp ${(totalVal/1_000_000).toFixed(1)}M`} icon={BarChart3} sub="di 3 cabang"      trend={{ value: "+8.4%", up: true }}       sparkData={[70,75,72,78,80,82,83]} onClick={() => onNavigate("reports")} />
        <KPICard label="Item Bermasalah"  value={low + critical}                 icon={AlertTriangle} sub={`${critical} kritis · ${low} menipis`} warning trend={{ value: "+2", up: false }} sparkData={[3,4,5,4,5,6,5]} onClick={() => onNavigate("inventory","critical")} />
        <KPICard label="Restock Urgent"   value={urgentRestock}                  icon={ShoppingCart} sub="prioritas tinggi"           danger trend={{ value: "+1", up: false }}  sparkData={[1,2,2,3,3,3,3]} onClick={() => onNavigate("restock")} />
      </div>
      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Risiko Stockout"  value={critical}  icon={Zap}       sub="dalam 7 hari"          danger  trend={{ value: "+1", up: false }}   sparkData={[1,1,2,2,3,3,3]} onClick={() => onNavigate("restock")} />
        <KPICard label="Item Overstock"   value={overstock} icon={Layers}    sub="perlu redistribusi"    accent  trend={{ value: "stabil", up: true }} sparkData={[1,2,2,2,2,2,2]} onClick={() => onNavigate("inventory","overstock")} />
        <KPICard label="Cabang Aktif"     value={3}         icon={Building2} sub="operasional penuh"             trend={{ value: "100%", up: true }}   sparkData={[3,3,3,3,3,3,3]} onClick={() => onNavigate("branches")} />
        <KPICard label="Akurasi SMA"      value="91.2%"     icon={Target}    sub="MAPE 8.8%"              accent  trend={{ value: "+1.5%", up: true }} sparkData={[88,89,90,89,91,90,91]} onClick={() => toast.info("Model SMA · Periode 3 bulan")} />
      </div>
      {/* Branch + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { name: "Cabang A", loc: "Jakarta Pusat", total: 485, kritis: 2, nilai: "82.4", penjualan: 320, risk: "low" },
            { name: "Cabang B", loc: "Bekasi",        total: 362, kritis: 6, nilai: "56.8", penjualan: 245, risk: "high"},
            { name: "Cabang C", loc: "Tangerang",     total: 298, kritis: 1, nilai: "44.2", penjualan: 198, risk: "low" },
          ].map(b => (
            <Card key={b.name} className="p-4" onClick={() => onNavigate("branches")}>
              <div className="flex items-start justify-between mb-3">
                <div><div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.loc}</div></div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium ${b.risk==="high"?"bg-red-50 text-red-600":"bg-emerald-50 text-emerald-600"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${b.risk==="high"?"bg-red-500 animate-pulse":"bg-emerald-500"}`} />{b.risk==="high"?"Risiko":"Normal"}
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {[{l:"Total Stok",v:b.total.toString(),r:false},{l:"Item Kritis",v:b.kritis.toString(),r:b.kritis>3},{l:"Nilai Inv.",v:`Rp ${b.nilai}M`,r:false},{l:"Penjualan/bln",v:`${b.penjualan} unit`,r:false}].map(m => (
                  <div key={m.l} className="flex justify-between"><span className="text-slate-400">{m.l}</span><span className={`font-semibold ${m.r?"text-red-600":"text-slate-700 dark:text-slate-300"}`} style={{ fontFamily:"'JetBrains Mono', monospace" }}>{m.v}</span></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Kondisi Inventori</div>
            <div className="space-y-3">
              {[{label:"Aman",count:safe,color:"bg-emerald-500",f:"safe"},{label:"Menipis",count:low,color:"bg-amber-400",f:"low"},{label:"Kritis",count:critical,color:"bg-red-500",f:"critical"},{label:"Overstock",count:overstock,color:"bg-purple-500",f:"overstock"}].map(item => (
                <div key={item.label} className="cursor-pointer group" onClick={() => onNavigate("inventory", item.f)}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition-colors font-medium">{item.label}</span><span className="font-semibold text-slate-700 dark:text-slate-300">{item.count}/{SPARE_PARTS.length}</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full ${item.color}`} style={{ width:`${(item.count/SPARE_PARTS.length)*100}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">Performa Cabang</div>
            <div className="space-y-3">
              {[{name:"Cabang A – Jakpus",pct:95,color:"bg-blue-500"},{name:"Cabang B – Bekasi",pct:74,color:"bg-amber-500"},{name:"Cabang C – Tangerang",pct:88,color:"bg-emerald-500"}].map(b => (
                <div key={b.name}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 dark:text-slate-400">{b.name}</span><span className="font-bold text-slate-700 dark:text-slate-300">{b.pct}%</span></div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${b.color} rounded-full`} style={{ width:`${b.pct}%` }} /></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Demand Forecast – Model SMA</div><div className="text-xs text-slate-400 mt-0.5">Aktual vs prediksi SMA 3 bulan</div></div>
            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full font-semibold border border-blue-100 dark:border-blue-800">SMA</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={forecastChartData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.15} /><stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} /></linearGradient>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.15} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="period" tick={{ fontSize:10, fill:"#94a3b8" }} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Area type="monotone" dataKey="actual" name="Aktual"        stroke="#1d4ed8" strokeWidth={2} fill="url(#gA)" dot={false} />
              <Area type="monotone" dataKey="sma"    name="Prediksi SMA" stroke="#0891b2" strokeWidth={2} strokeDasharray="5 4" fill="url(#gS)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aktivitas Terkini</div>
            <button className="text-xs text-blue-600 hover:underline" onClick={() => onNavigate("transactions")}>Semua <ChevronRight size={11} className="inline" /></button>
          </div>
          <div className="space-y-3">
            {recentActivity.map(item => {
              const dot = item.type==="in"?"bg-emerald-500":item.type==="out"?"bg-red-500":item.type==="alert"?"bg-amber-500":item.type==="approval"?"bg-blue-500":"bg-slate-400";
              return (
                <div key={item.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${dot}`} />
                  <div className="min-w-0 flex-1"><div className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{item.text}</div><div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400"><span>{item.branch}</span><span>·</span><span>{item.time}</span></div></div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Penjualan per Cabang</div>
          <div className="text-xs text-slate-400 mb-4">6 bulan terakhir (unit)</div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={monthlyTrendData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="cabA" name="Cab. A" fill="#1d4ed8" radius={[3,3,0,0]} />
              <Bar dataKey="cabB" name="Cab. B" fill="#0891b2" radius={[3,3,0,0]} />
              <Bar dataKey="cabC" name="Cab. C" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div><div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Restock Urgent</div><div className="text-xs text-slate-400 mt-0.5">{urgentRestock} item prioritas tinggi</div></div>
            <button onClick={() => onNavigate("restock")} className="text-xs text-blue-600 hover:underline">Semua <ChevronRight size={11} className="inline" /></button>
          </div>
          <div className="space-y-2.5">
            {restockRecommendations.filter(r => r.priority==="high").map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 hover:bg-red-100/60 transition-colors cursor-pointer" onClick={() => onNavigate("restock")}>
                <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1"><div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</div><div className="text-xs text-slate-400">{item.branch} · stockout {item.daysToStockout}h lagi</div></div>
                <div className="text-sm font-bold text-blue-700 shrink-0">+{item.recommendedQty}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

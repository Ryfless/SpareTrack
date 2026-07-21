import React, { useState, useEffect } from "react";
import { Download, Calendar, BarChart3, Package, Star, Target, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { ChartTip } from "../../components/shared/ChartTip";
import { Skeleton } from "../../components/shared/Skeleton";
import { inputCls } from "../../config";
import { getSummary, type ReportSummary } from "../../services/reports";

function formatRp(n: number) {
  return `Rp ${(n / 1000000).toFixed(1)}M`;
}

export function ReportsPage() {
  const today = new Date();
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [startDate, setStartDate] = useState(sixMonthsAgo.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSummary({ start_date: startDate, end_date: endDate })
      .then(setData)
      .catch(() => toast.error("Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, [startDate, endDate]);

  const chartData = [
    { month:"Jan", rev:42.5, units:280 }, { month:"Feb", rev:48.2, units:305 },
    { month:"Mar", rev:51.6, units:335 }, { month:"Apr", rev:46.8, units:318 },
    { month:"Mei", rev:55.3, units:362 }, { month:"Jun", rev:58.1, units:378 },
  ];

  if (loading) {
    return <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  const mov = data?.stock_movements;
  const inv = data?.inventory;

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-slate-400" /><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${inputCls} w-auto`} /><span className="text-slate-400">–</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${inputCls} w-auto`} /></div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => toast.success("PDF sedang dibuat")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all"><Download size={13} />Export PDF</button>
            <button onClick={() => toast.success("Excel sedang diunduh")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Download size={13} />Export Excel</button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Masuk" value={mov?.total_in?.toLocaleString() ?? "0"} sub={mov ? `${mov.total_in - mov.total_out >= 0 ? "+" : ""}${(mov.total_in - mov.total_out).toLocaleString()} net` : "-"} icon={BarChart3} trend={mov ? { value: `+${((mov.total_in / (mov.total_out || 1)) * 100).toFixed(0)}%`, up: mov.total_in > mov.total_out } : undefined} />
        <KPICard label="Total Keluar" value={mov?.total_out?.toLocaleString() ?? "0"} sub="seluruh transaksi" icon={Package} />
        <KPICard label="Item Kritis" value={inv?.critical_items?.toString() ?? "0"} sub={`dari ${inv?.total_items ?? 0} item`} icon={AlertTriangle} accent />
        <KPICard label="Transfer" value={mov?.total_transfer?.toString() ?? "0"} sub="antar cabang" icon={Target} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Penjualan Bulanan</div>
          <div className="text-xs text-slate-400 mb-4">dalam juta rupiah</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} /><YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} /><Bar dataKey="rev" name="Penjualan (Jt)" fill="#1d4ed8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Unit Terjual</div>
          <div className="text-xs text-slate-400 mb-4">per bulan</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <defs><linearGradient id="rGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} /><YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} /><Area type="monotone" dataKey="units" name="Unit" stroke="#0891b2" strokeWidth={2} fill="url(#rGrd)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      {inv && inv.critical_list.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-red-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Item Stok Kritis ({inv.critical_list.length})</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">{["Sparepart","Kode","Cabang","Stok"].map(h => <th key={h} className="text-left pb-2">{h}</th>)}</tr></thead>
            <tbody>{inv.critical_list.map((c, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="py-2 font-medium text-slate-700 dark:text-slate-300">{c.name}</td>
                <td className="py-2 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.code}</td>
                <td className="py-2 text-xs text-slate-500">{c.branch}</td>
                <td className="py-2"><span className="text-red-600 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.quantity}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title:"Pertumbuhan Inventori", text: mov ? `Total inbound ${mov.total_in.toLocaleString()} unit, outbound ${mov.total_out.toLocaleString()} unit, net flow ${mov.net_flow >= 0 ? "+" : ""}${mov.net_flow.toLocaleString()} unit.` : "-", accent:"border-l-emerald-500" },
          { title:"Kondisi Stok Kritis",   text: inv ? `${inv.critical_items} item di bawah safety stock dari ${inv.total_items} total item. Segera lakukan restock.` : "-", accent:"border-l-amber-500"   },
          { title:"Transfer Antar Cabang", text: mov ? `${mov.total_transfer} transfer tercatat dalam periode ini.` : "-", accent:"border-l-blue-500"   },
        ].map(ins => (
          <Card key={ins.title} className={`p-4 border-l-4 ${ins.accent}`}>
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1.5">{ins.title}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ins.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

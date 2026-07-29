import React, { useState, useEffect, useMemo } from "react";
import { Download, CalendarDays, BarChart3, Package, Star, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { BranchSelect } from "../../components/shared/BranchSelect";
import { ChartTip } from "../../components/shared/ChartTip";
import { Skeleton } from "../../components/shared/Skeleton";
import { getSummary, exportPdf, exportExcel, type ReportSummary } from "../../services/reports";

interface Props {
  userProfile?: { role: string; branch: string } | null;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function monthVal(y: number, m: number) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

function monthBounds(mv: string) {
  const [y, m] = mv.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { start_date: `${mv}-01`, end_date: `${mv}-${String(lastDay).padStart(2, '0')}` };
}

export function ReportsPage({ userProfile }: Props) {
  const today = new Date();
  const curMonth = monthVal(today.getFullYear(), today.getMonth() + 1);
  const allMonths = useMemo(() => {
    const list = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      list.push({ label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, value: monthVal(d.getFullYear(), d.getMonth() + 1) });
    }
    return list;
  }, []);

  const [monthFrom, setMonthFrom] = useState(allMonths[0]?.value || curMonth);
  const [monthTo, setMonthTo] = useState(curMonth);
  const [data, setData] = useState<ReportSummary | null>(null);
  const [chartSource, setChartSource] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [branchFilter, setBranchFilter] = useState("");

  const fullRange = useMemo(() => {
    const from = allMonths[0]?.value || curMonth;
    const to = curMonth;
    return { start_date: monthBounds(from).start_date, end_date: monthBounds(to).end_date };
  }, []);

  useEffect(() => {
    setLoading(true);
    const { start_date, end_date } = monthBounds(monthFrom);
    const to = monthBounds(monthTo).end_date;
    const query: Record<string, string | undefined> = { start_date, end_date: to };
    if (branchFilter) query.branch_id = branchFilter;
    getSummary(query)
      .then(setData)
      .catch(() => toast.error("Gagal memuat laporan"))
      .finally(() => setLoading(false));
  }, [monthFrom, monthTo, branchFilter]);

  useEffect(() => {
    const q: Record<string, string | undefined> = { start_date: fullRange.start_date, end_date: fullRange.end_date };
    if (branchFilter) q.branch_id = branchFilter;
    getSummary(q).then(setChartSource).catch(() => {});
  }, [branchFilter]);

  function setThisMonth() {
    setMonthFrom(curMonth);
    setMonthTo(curMonth);
  }

  async function handleExport(type: 'pdf' | 'excel') {
    setExporting(type);
    try {
      const { start_date, end_date } = monthBounds(monthFrom);
      const to = monthBounds(monthTo).end_date;
      const query: Record<string, string | undefined> = { type: 'summary', start_date, end_date: to };
      if (branchFilter) query.branch_id = branchFilter;
      const blob = await (type === 'pdf' ? exportPdf : exportExcel)(query as any);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-summary-${Date.now()}.${type}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Laporan ${type.toUpperCase()} berhasil diunduh`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Gagal export ${type.toUpperCase()}`);
    }
    setExporting(null);
  }

  if (loading) {
    return <div className="space-y-5"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;
  }

  const mov = data?.stock_movements;
  const inv = data?.inventory;
  const chartData = chartSource?.monthly_trend || [];

  const latestHealth = data?.stock_health?.[data.stock_health.length - 1];
  const s = data?.safe_stock_ratio;

  const lowestCritical = inv?.critical_list?.length
    ? [...inv.critical_list].sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name))[0]
    : null;

  const rekomendasi = (() => {
    if (!s || !inv) return "-";
    const critCount = inv.critical_items || 0;
    const nama = lowestCritical ? `"${lowestCritical.name}"` : "";
    const stok = lowestCritical ? ` (stok ${lowestCritical.quantity})` : "";
    if (critCount > 0)
      return `Ada ${critCount} barang kritis. Segera lakukan pemesanan — ${nama} stok paling rendah${stok}.`;
    return "Stok seluruh cabang dalam kondisi terkendali. Lanjutkan pemantauan rutin.";
  })();

  const aktivitasBulanan = (() => {
    if (!chartData || chartData.length === 0) return "-";
    const total = chartData.reduce((sum, m) => sum + m.units, 0);
    const avg = Math.round(total / chartData.length);
    const peak = [...chartData].sort((a, b) => b.units - a.units)[0];
    if (chartData.length === 1)
      return `Total ${total} barang keluar pada bulan ini.`;
    return `Rata-rata ${avg} barang keluar per bulan. Puncak aktivitas terjadi pada ${peak.month} sebanyak ${peak.units} unit.`;
  })();

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
            <CalendarDays size={12} className="text-blue-600 shrink-0" />
            <select value={monthFrom} onChange={e => setMonthFrom(e.target.value)} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs outline-none cursor-pointer">
              {allMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <span className="text-slate-300">–</span>
            <select value={monthTo} onChange={e => setMonthTo(e.target.value)} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs outline-none cursor-pointer">
              {allMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <button onClick={setThisMonth} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${monthFrom === curMonth && monthTo === curMonth ? "bg-blue-700 text-white border-blue-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            Bulan Ini
          </button>
          <BranchSelect value={branchFilter} onChange={setBranchFilter} role={userProfile?.role} userBranch={userProfile?.branch} />
          <div className="ml-auto flex gap-2">
            <button onClick={() => handleExport('pdf')} disabled={exporting !== null} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}Export PDF
            </button>
            <button onClick={() => handleExport('excel')} disabled={exporting !== null} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {exporting === 'excel' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}Export Excel
            </button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Masuk" value={mov?.total_in?.toLocaleString() ?? "0"} sub={mov ? `${mov.total_in - mov.total_out >= 0 ? "+" : ""}${(mov.total_in - mov.total_out).toLocaleString()} net` : "-"} icon={BarChart3} trend={mov ? { value: `${mov.total_in > mov.total_out ? '+' : ''}${((mov.total_in / (mov.total_out || 1)) * 100).toFixed(0)}%`, up: mov.total_in > mov.total_out } : undefined} />
        <KPICard label="Total Keluar" value={mov?.total_out?.toLocaleString() ?? "0"} sub="seluruh transaksi" icon={Package} />
        <KPICard label="Terlaris" value={data?.top_sparepart?.name || "-"} sub={data?.top_sparepart?.name ? `${data.top_sparepart.avg_monthly} unit/bulan` : "tidak ada data"} icon={Star} />
        <KPICard label="Stok Aman" value={data?.safe_stock_ratio ? `${data.safe_stock_ratio.ratio}%` : "-"} sub={data?.safe_stock_ratio ? `${data.safe_stock_ratio.safe_count} dari ${data.safe_stock_ratio.total_items} item` : "-"} icon={CheckCircle} accent />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Distribusi Kesehatan Stok</div>
          <div className="text-xs text-slate-400 mb-4">jumlah item per status stok per bulan</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartSource?.stock_health || []} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} allowDecimals={false} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Bar stackId="health" dataKey="critical" name="Kritis" fill="#ff4b4b" />
              <Bar stackId="health" dataKey="low" name="Menipis" fill="#fbab22" />
              <Bar stackId="health" dataKey="safe" name="Aman" fill="#50c878" />
              <Bar stackId="health" dataKey="overstock" name="Overstock" fill="#5c61f6" radius={[4,4,0,0]} />
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
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400">{["Sparepart","Kode","Cabang","Stok"].map(h => <th key={h} className="text-left pb-2">{h}</th>)}</tr></thead>
            <tbody>{[...inv.critical_list].sort((a, b) => a.name.localeCompare(b.name) || a.branch.localeCompare(b.branch)).map((c, i) => (
              <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                <td className="py-2 font-medium text-slate-700 dark:text-slate-300">{c.name}</td>
                <td className="py-2 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.code}</td>
                <td className="py-2 text-xs text-slate-500">{c.branch}</td>
                <td className="py-2"><span className="text-red-600 font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.quantity}</span></td>
              </tr>
            ))}</tbody>
          </table>
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title:"Rekomendasi Otomatis", text: rekomendasi, accent:"border-l-emerald-500" },
          { title:"Aktivitas Bulanan", text: aktivitasBulanan, accent:"border-l-blue-500" },
          { title:"Kondisi Stok Keseluruhan", text: s ? `${s.ratio}% barang dalam kondisi aman (${s.safe_count} dari ${s.total_items}). ${latestHealth ? `${latestHealth.critical || 0} barang kritis, ${latestHealth.low || 0} menipis, ${latestHealth.overstock || 0} kelebihan stok.` : "Pantau distribusi kesehatan stok pada grafik."}` : "-", accent:"border-l-violet-500" },
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

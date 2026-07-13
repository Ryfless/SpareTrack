import React from "react";
import { Download, Calendar, BarChart3, Package, Star, Target } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "../../components/shared/Card";
import { KPICard } from "../../components/KPICard";
import { ChartTip } from "../../components/shared/ChartTip";
import { inputCls } from "../../config";

export function ReportsPage() {
  const data = [{ month:"Jan",rev:42.5,units:280 },{ month:"Feb",rev:48.2,units:305 },{ month:"Mar",rev:51.6,units:335 },{ month:"Apr",rev:46.8,units:318 },{ month:"Mei",rev:55.3,units:362 },{ month:"Jun",rev:58.1,units:378 }];
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-slate-400" /><input type="date" defaultValue="2025-01-01" className={`${inputCls} w-auto`} /><span className="text-slate-400">–</span><input type="date" defaultValue="2025-06-30" className={`${inputCls} w-auto`} /></div>
          <div className="ml-auto flex gap-2">
            <button onClick={() => toast.success("PDF sedang dibuat")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 active:scale-95 rounded-lg transition-all"><Download size={13} />Export PDF</button>
            <button onClick={() => toast.success("Excel sedang diunduh")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Download size={13} />Export Excel</button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Penjualan" value="Rp 302.5M" sub="Jan–Jun 2025" icon={BarChart3} trend={{ value:"+26.4%", up:true }} sparkData={[40,45,48,43,52,55,58]} />
        <KPICard label="Unit Terjual"    value="1.978"     sub="seluruh cabang" icon={Package} trend={{ value:"+18.2%", up:true }} sparkData={[250,270,290,280,310,330,360]} />
        <KPICard label="Item Terpopuler" value="Oli 10W-40" sub="485 unit/bln"  icon={Star} accent />
        <KPICard label="Akurasi SMA"     value="91.2%"     sub="MAPE 8.8%"      icon={Target} trend={{ value:"+1.5%", up:true }} sparkData={[88,89,90,89,91,90,91]} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Penjualan Bulanan</div>
          <div className="text-xs text-slate-400 mb-4">dalam juta rupiah</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} /><YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} /><Bar dataKey="rev" name="Penjualan (Jt)" fill="#1d4ed8" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Unit Terjual</div>
          <div className="text-xs text-slate-400 mb-4">per bulan</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <defs><linearGradient id="rGrd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0891b2" stopOpacity={0.2} /><stop offset="95%" stopColor="#0891b2" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" /><XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} /><YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} /><Area type="monotone" dataKey="units" name="Unit" stroke="#0891b2" strokeWidth={2} fill="url(#rGrd)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title:"Pertumbuhan Penjualan", text:"Q2 2025 naik 26.4% vs Q1, didorong Cabang A yang mencetak rekor penjualan Mei–Juni.",          accent:"border-l-emerald-500" },
          { title:"Efisiensi Inventori",   text:"Perputaran stok rata-rata 2.8× per bulan. Cabang B perlu optimasi karena item kritis meningkat.", accent:"border-l-amber-500"   },
          { title:"Akurasi Forecast SMA",  text:"Model SMA stabil di MAPE 8.8%. Paling akurat untuk kategori Pelumas dan Filter.",                  accent:"border-l-blue-500"   },
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

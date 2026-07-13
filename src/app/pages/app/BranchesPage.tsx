import React from "react";
import { MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "../../components/shared/Card";
import { ChartTip } from "../../components/shared/ChartTip";
import { monthlyTrendData } from "../../data";

export function BranchesPage() {
  const branches = [
    { name:"Cabang A", loc:"Jakarta Pusat", total:485, kritis:2, nilai:"82.4", penjualan:320, top:["Oli Mesin 10W-40","Filter Oli Universal","Busi NGK Iridium"], risk:"low" },
    { name:"Cabang B", loc:"Bekasi",        total:362, kritis:6, nilai:"56.8", penjualan:245, top:["Kampas Rem Depan","Oli Mesin 10W-40","Filter Udara"],          risk:"high"},
    { name:"Cabang C", loc:"Tangerang",     total:298, kritis:1, nilai:"44.2", penjualan:198, top:["Filter Oli Universal","Aki 12V 45Ah","Radiator Coolant"],       risk:"low" },
  ];
  const heatParts = ["Oli Mesin","Kampas Rem","V-Belt","Busi NGK","Filter Oli","Aki 45Ah"];
  const heatVals  = [[48,12,35],[8,4,11],[3,7,2],[120,95,110],[85,62,44],[22,18,9]];
  const heatMax   = [48,8,7,120,85,22];
  const cellCls = (v: number, m: number) => { const r = v/m; return r<0.3?"bg-red-100 dark:bg-red-900/30 text-red-700":r<0.65?"bg-amber-100 dark:bg-amber-900/30 text-amber-700":"bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700"; };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {branches.map(b => (
          <Card key={b.name} className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div><div className="font-bold text-slate-800 dark:text-slate-200">{b.name}</div><div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><MapPin size={9} />{b.loc}</div></div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${b.risk==="high"?"bg-red-50 dark:bg-red-900/20 text-red-700":"bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${b.risk==="high"?"bg-red-500 animate-pulse":"bg-emerald-500"}`} />{b.risk==="high"?"Risiko Tinggi":"Normal"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[{l:"Total Stok",v:b.total.toString(),r:false},{l:"Item Kritis",v:b.kritis.toString(),r:b.kritis>3},{l:"Nilai Inv.",v:`Rp ${b.nilai}M`,r:false},{l:"Penjualan/bln",v:`${b.penjualan} unit`,r:false}].map(m => (
                <div key={m.l} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3"><div className={`text-lg font-bold leading-none ${m.r?"text-red-600":"text-slate-800 dark:text-slate-200"}`} style={{ fontFamily:"'JetBrains Mono', monospace" }}>{m.v}</div><div className="text-xs text-slate-400 mt-1">{m.l}</div></div>
              ))}
            </div>
            <div className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Top Penjualan</div>
            {b.top.map((item, i) => <div key={item} className="flex items-center gap-2 mb-1.5"><div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</div><span className="text-xs text-slate-600 dark:text-slate-400">{item}</span></div>)}
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Perbandingan Penjualan</div>
          <div className="text-xs text-slate-400 mb-4">6 bulan terakhir</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyTrendData} margin={{ top:0, right:8, left:-28, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize:10, fill:"#94a3b8" }} />
              <YAxis tick={{ fontSize:10, fill:"#94a3b8" }} />
              <Tooltip content={<ChartTip />} /><Legend wrapperStyle={{ fontSize:11 }} />
              <Bar dataKey="cabA" name="Cab. A" fill="#1d4ed8" radius={[3,3,0,0]} />
              <Bar dataKey="cabB" name="Cab. B" fill="#0891b2" radius={[3,3,0,0]} />
              <Bar dataKey="cabC" name="Cab. C" fill="#10b981" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">Matrix Stok Antar Cabang</div>
          <div className="text-xs text-slate-400 mb-4">Heatmap kondisi stok item utama</div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800"><th className="text-left pb-2 text-slate-400 font-semibold">Sparepart</th><th className="text-center pb-2 text-slate-500 font-semibold">Cab. A</th><th className="text-center pb-2 text-slate-500 font-semibold">Cab. B</th><th className="text-center pb-2 text-slate-500 font-semibold">Cab. C</th></tr></thead>
            <tbody>{heatParts.map((part, pi) => <tr key={part} className="border-b border-slate-50 dark:border-slate-800/50"><td className="py-2 text-slate-600 dark:text-slate-400 font-medium">{part}</td>{heatVals[pi].map((val, ci) => <td key={ci} className="py-2 text-center"><span className={`px-2 py-0.5 rounded font-semibold ${cellCls(val, heatMax[pi])}`} style={{ fontFamily:"'JetBrains Mono', monospace" }}>{val}</span></td>)}</tr>)}</tbody>
          </table>
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {[["bg-emerald-100","Aman"],["bg-amber-100","Menipis"],["bg-red-100","Kritis"]].map(([c, l]) => <div key={l} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${c}`} /><span className="text-slate-500">{l}</span></div>)}
          </div>
        </Card>
      </div>
    </div>
  );
}

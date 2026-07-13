import React from "react";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { Sparkline } from "./shared/Sparkline";

export function KPICard({ label, value, sub, icon: Icon, trend, accent, danger, warning, onClick, sparkData }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType;
  trend?: { value: string; up: boolean }; accent?: boolean; danger?: boolean; warning?: boolean;
  onClick?: () => void; sparkData?: number[];
}) {
  const iconBg = danger ? "bg-red-100 text-red-600" : warning ? "bg-amber-100 text-amber-600" : accent ? "bg-cyan-100 text-cyan-600" : "bg-blue-100 text-blue-700";
  return (
    <div onClick={onClick} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-all ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-700 active:scale-95" : "hover:shadow-sm"}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}><Icon size={16} /></div>
        <div className="flex flex-col items-end gap-1">
          {trend && <div className={`flex items-center gap-0.5 text-xs font-medium ${trend.up ? "text-emerald-600" : "text-red-500"}`}>{trend.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{trend.value}</div>}
          {sparkData && <Sparkline data={sparkData} up={trend?.up ?? true} />}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200 leading-none mb-1">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
      {onClick && <div className="text-xs text-blue-500 mt-2 flex items-center gap-0.5">Lihat detail<ChevronRight size={10} /></div>}
    </div>
  );
}

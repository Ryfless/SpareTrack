import React, { useState, useEffect, useCallback } from "react";
import { ArrowDownRight, ArrowUpRight, Activity, ClipboardList, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { EmptyState } from "../../components/shared/EmptyState";
import { Skeleton } from "../../components/shared/Skeleton";
import { BranchSelect } from "../../components/shared/BranchSelect";
import { StokMasukModal } from "../../components/modals/StokMasukModal";
import { StokKeluarModal } from "../../components/modals/StokKeluarModal";
import { TransferModal } from "../../components/modals/TransferModal";
import { TRX_CFG } from "../../config";
import { list as fetchTransactions, type Transaction } from "../../services/transactions";
import type { ApiResponse } from "../../services/client";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

interface Props {
  userProfile?: { role: string; branch: string } | null;
}

const MONTHS = [
  { label: "Jan 2026", value: "2026-01" },
  { label: "Feb 2026", value: "2026-02" },
  { label: "Mar 2026", value: "2026-03" },
  { label: "Apr 2026", value: "2026-04" },
  { label: "Mei 2026", value: "2026-05" },
  { label: "Jun 2026", value: "2026-06" },
  { label: "Jul 2026", value: "2026-07" },
];

function getMonthBounds(monthVal: string) {
  const [y, m] = monthVal.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start_date: start, end_date: end + "T23:59:59Z" };
}

export function TransactionsPage({ userProfile }: Props) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("");
  const [page, setPage] = useState(1);
  const [monthFrom, setMonthFrom] = useState("");
  const [monthTo, setMonthTo] = useState("");
  const [stokMasukOpen, setStokMasukOpen] = useState(false);
  const [stokKeluarOpen, setStokKeluarOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 20,
      };
      if (typeFilter !== "all") params.type = typeFilter;
      if (branchFilter) params.branch_id = branchFilter;
      if (monthFrom) {
        const bounds = getMonthBounds(monthFrom);
        params.start_date = bounds.start_date;
      }
      if (monthTo) {
        const bounds = getMonthBounds(monthTo);
        params.end_date = bounds.end_date;
      }
      const res: ApiResponse<Transaction[]> = await fetchTransactions(params);
      setItems(res.data || []);
      if (res.meta) {
        setMeta({
          page: Number(res.meta.page) || 1,
          limit: Number(res.meta.limit) || 20,
          total: Number(res.meta.total) || 0,
          total_pages: Number(res.meta.total_pages) || 0,
        });
      }
    } catch {
      toast.error("Gagal memuat transaksi");
    }
    setLoading(false);
  }, [page, typeFilter, branchFilter, monthFrom, monthTo]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function onRefresh() { loadData(); }
    window.addEventListener('sparetrack:refresh', onRefresh);
    return () => window.removeEventListener('sparetrack:refresh', onRefresh);
  }, [loadData]);

  useAutoRefresh(loadData, 30 * 1000, true);

  function setThisMonth() {
    const now = new Date();
    const val = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    setMonthFrom(val);
    setMonthTo(val);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <StokMasukModal open={stokMasukOpen} onClose={() => setStokMasukOpen(false)} />
      <StokKeluarModal open={stokKeluarOpen} onClose={() => setStokKeluarOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-0.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          {["all", "in", "out", "transfer"].map(t => <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${typeFilter === t ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{t === "all" ? "Semua" : TRX_CFG[t]?.label ?? t}</button>)}
        </div>
        <BranchSelect value={branchFilter} onChange={(v) => { setBranchFilter(v); setPage(1); }} role={userProfile?.role} userBranch={userProfile?.branch} />
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm">
          <CalendarDays size={12} className="text-blue-600 shrink-0" />
          <select value={monthFrom} onChange={e => { setMonthFrom(e.target.value); setPage(1); }} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs outline-none cursor-pointer">
            <option value="">Dari</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <span className="text-slate-300">–</span>
          <select value={monthTo} onChange={e => { setMonthTo(e.target.value); setPage(1); }} className="bg-transparent text-slate-700 dark:text-slate-300 text-xs outline-none cursor-pointer">
            <option value="">Sampai</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <button onClick={setThisMonth} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${monthFrom && monthFrom === monthTo && monthFrom === "2026-07" ? "bg-blue-700 text-white border-blue-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          Bulan Ini
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setStokMasukOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all shadow-sm"><ArrowDownRight size={13} />Stok Masuk</button>
          <button onClick={() => setStokKeluarOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-lg transition-all shadow-sm"><ArrowUpRight size={13} />Stok Keluar</button>
          <button onClick={() => setTransferOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Activity size={13} />Transfer</button>
        </div>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">{["ID", "Tanggal", "Jenis", "Sparepart", "Cabang", "Qty", "Oleh"].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={ClipboardList} title="Tidak ada transaksi" description="Belum ada transaksi untuk filter yang dipilih." /></td></tr>
              ) : items.map(trx => {
                const cfg = TRX_CFG[trx.type]; const Icon = cfg?.icon ?? Activity;
                return <tr key={trx.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{trx.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400">{new Date(trx.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ${cfg?.cls}`}><Icon size={10} />{cfg?.label}</span></td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{trx.sparepart_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{trx.type === 'transfer' && trx.destination_branch_name ? `${trx.branch_name} → ${trx.destination_branch_name}` : trx.branch_name}</td>
                  <td className="px-4 py-3 text-center"><span className={`font-semibold text-sm ${trx.type === "in" ? "text-emerald-600" : trx.type === "out" ? "text-red-600" : "text-slate-600"}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{trx.type === "in" ? "+" : trx.type === "out" ? "−" : ""}{Math.abs(trx.quantity)}</span></td>
                  <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{trx.created_by}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        {meta.total_pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Halaman {meta.page} dari {meta.total_pages} ({meta.total} item)</span>
            <div className="flex items-center gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-2 py-1 border border-slate-200 dark:border-slate-700 rounded transition flex items-center gap-1 ${page <= 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}><ChevronLeft size={12} />Prev</button>
              <span className="px-3 py-1 bg-blue-700 text-white rounded text-xs font-semibold">{meta.page}</span>
              <button disabled={page >= meta.total_pages} onClick={() => setPage(p => Math.min(meta.total_pages, p + 1))} className={`px-2 py-1 border border-slate-200 dark:border-slate-700 rounded transition flex items-center gap-1 ${page >= meta.total_pages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}>Next<ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

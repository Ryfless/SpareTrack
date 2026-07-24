import React, { useState, useEffect, useCallback } from "react";
import { ArrowDownRight, ArrowUpRight, Activity, ClipboardList } from "lucide-react";
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
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

interface Props {
  userProfile?: { role: string; branch: string } | null;
}

export function TransactionsPage({ userProfile }: Props) {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("");
  const [stokMasukOpen, setStokMasukOpen] = useState(false);
  const [stokKeluarOpen, setStokKeluarOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = { limit: 50 };
      if (branchFilter) params.branch_id = branchFilter;
      const res = await fetchTransactions(params);
      setItems(res.data || []);
    } catch {
      toast.error("Gagal memuat transaksi");
    }
    setLoading(false);
  }, [branchFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function onRefresh() { loadData(); }
    window.addEventListener('sparetrack:refresh', onRefresh);
    return () => window.removeEventListener('sparetrack:refresh', onRefresh);
  }, [loadData]);

  useAutoRefresh(loadData, 30 * 1000, true);

  const filtered = items.filter(t => typeFilter === "all" || t.type === typeFilter);

  return (
    <div className="space-y-5">
      <StokMasukModal open={stokMasukOpen} onClose={() => setStokMasukOpen(false)} />
      <StokKeluarModal open={stokKeluarOpen} onClose={() => setStokKeluarOpen(false)} />
      <TransferModal open={transferOpen} onClose={() => setTransferOpen(false)} />
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-0.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
          {["all", "in", "out", "transfer"].map(t => <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${typeFilter === t ? "bg-blue-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>{t === "all" ? "Semua" : TRX_CFG[t]?.label ?? t}</button>)}
        </div>
        <BranchSelect value={branchFilter} onChange={setBranchFilter} role={userProfile?.role} userBranch={userProfile?.branch} />
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
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={ClipboardList} title="Tidak ada transaksi" description="Belum ada transaksi untuk filter yang dipilih." /></td></tr>
              ) : filtered.map(trx => {
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
      </Card>
    </div>
  );
}

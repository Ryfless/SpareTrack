import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Package, Search, Sliders, Plus, Download, Activity, Tag,
  X, Eye, Pencil, PackageSearch, ChevronLeft, ChevronRight, ArrowLeftRight, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { Skeleton } from "../../components/shared/Skeleton";
import { Tooltip } from "../../components/shared/Tooltip";
import { EditItemModal } from "../../components/modals/EditItemModal";
import { BulkTransferModal } from "../../components/modals/BulkTransferModal";
import { list as fetchInventory, exportCsv, type SparepartListItem } from "../../services/inventory";
import { list as getBranches, type Branch } from "../../services/branches";
import { getCategories, getSuppliers } from "../../services/references";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import type { ApiResponse } from "../../services/client";

export function InventoryPage({ onSelectPart, initialFilter = "all", filterBranch: externalBranch, onBranchChange, userProfile, currentRole, onAction }: { onSelectPart: (id: string) => void; initialFilter?: string; filterBranch?: string; onBranchChange?: (v: string) => void; userProfile?: { role: string; branch: string } | null; currentRole?: string; onAction?: (action: string) => void }) {
  const [items, setItems] = useState<SparepartListItem[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, total_pages: 0, counts: { total: 0, safe: 0, low: 0, critical: 0, overstock: 0 } });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [filterCat, setFilterCat] = useState("all");
  const [filterSup, setFilterSup] = useState("all");
  const [localBranch, setLocalBranch] = useState("all");
  const filterBranch = externalBranch ?? localBranch;
  const setFilterBranch = onBranchChange ?? setLocalBranch;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTransferOpen, setBulkTransferOpen] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const isBranchAdmin = currentRole === "branch_admin";

  useEffect(() => {
    Promise.all([
      getCategories().then(setCategories).catch(() => {}),
      getSuppliers().then(setSuppliers).catch(() => {}),
      getBranches().then(b => {
        setBranches(b);
        if (isBranchAdmin && userProfile?.branch) {
          const match = b.find(br => br.name === userProfile.branch || br.id === userProfile.branch);
          if (match) setFilterBranch(match.id);
        }
      }).catch(() => {}),
    ]);
  }, []);

  useEffect(() => {
    if (isBranchAdmin && userProfile?.branch && branches.length > 0) {
      const match = branches.find(br => br.name === userProfile.branch || br.id === userProfile.branch);
      if (match && filterBranch !== match.id) setFilterBranch(match.id);
    }
  }, [isBranchAdmin, userProfile?.branch, filterBranch, branches.length]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        limit: 20,
        search: debouncedSearch || undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
        category_id: filterCat !== "all" ? filterCat : undefined,
        supplier_id: filterSup !== "all" ? filterSup : undefined,
        branch_id: filterBranch !== "all" ? filterBranch : undefined,
        sort_by: sortBy,
        order: sortOrder,
      };
      const res: ApiResponse<SparepartListItem[]> = await fetchInventory(params);
      setItems(res.data || []);
      if (res.meta) {
        setMeta({
          page: Number(res.meta.page) || 1,
          limit: Number(res.meta.limit) || 20,
          total: Number(res.meta.total) || 0,
          total_pages: Number(res.meta.total_pages) || 0,
          counts: (res.meta.counts as typeof meta.counts) || meta.counts,
        });
      }
    } catch {
      toast.error("Gagal memuat data inventory");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, filterStatus, filterCat, filterSup, filterBranch, sortBy, sortOrder]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function onRefresh() { loadData(); }
    window.addEventListener('sparetrack:refresh', onRefresh);
    return () => window.removeEventListener('sparetrack:refresh', onRefresh);
  }, [loadData]);

  useAutoRefresh(loadData, 30 * 1000, true);

  function toggleSelect(id: string) { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); }
  function toggleAll() { selected.size === items.length ? setSelected(new Set()) : setSelected(new Set(items.map(p => p.id))); }

  const statusFilters = [
    { l: "Semua", f: "all", cls: "text-slate-800 dark:text-slate-200", key: "total" as const },
    { l: "Aman", f: "safe", cls: "text-emerald-600", key: "safe" as const },
    { l: "Menipis", f: "low", cls: "text-amber-600", key: "low" as const },
    { l: "Kritis", f: "critical", cls: "text-red-600", key: "critical" as const },
    { l: "Overstock", f: "overstock", cls: "text-purple-600", key: "overstock" as const },
  ];

  if (loading && items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-12" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <EditItemModal open={editItemId !== null} sparepartId={editItemId} onClose={() => setEditItemId(null)} onSuccess={loadData} />
      {selected.size > 0 && (
        <BulkTransferModal
          open={bulkTransferOpen}
          onClose={() => setBulkTransferOpen(false)}
          onSuccess={loadData}
          selectedItems={items.filter(i => selected.has(i.id))}
          userProfile={userProfile}
          currentRole={currentRole}
        />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {statusFilters.map(s => (
          <Card key={s.f} className={`p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${filterStatus === s.f ? "ring-2 ring-blue-500" : ""}`} onClick={() => { setFilterStatus(s.f); setPage(1); }}>
            <div className={`text-2xl font-bold ${s.cls}`}>{meta.counts[s.key]}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
          </Card>
        ))}
      </div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selected.size} item dipilih</span>
          <button onClick={() => setBulkTransferOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><ArrowLeftRight size={13} />Transfer Stok</button>
          <button onClick={() => setSelected(new Set())} className="ml-auto p-1.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
        </div>
      )}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sparepart atau kode..." className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition text-slate-800 dark:text-slate-200" />
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${filterOpen ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700" : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"}`}>
            <Sliders size={13} />Filter{(filterStatus !== "all" || filterCat !== "all" || filterSup !== "all" || filterBranch !== "all") && <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
          <button onClick={() => onAction?.("add_item")} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Plus size={13} />Tambah Item</button>
          <button onClick={async () => {
            try {
              const blob = await exportCsv({
                search: debouncedSearch || undefined,
                status: filterStatus !== "all" ? filterStatus : undefined,
                category_id: filterCat !== "all" ? filterCat : undefined,
                supplier_id: filterSup !== "all" ? filterSup : undefined,
                branch_id: filterBranch !== "all" ? filterBranch : undefined,
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inventory-export-${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              toast.success("CSV berhasil diexport");
            } catch {
              toast.error("Gagal export CSV");
            }
          }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 active:scale-95 rounded-lg transition-all"><Download size={13} />Export CSV</button>
          <RefreshCw size={13} className="text-slate-400 animate-spin" />
        </div>
        {filterOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[
              { l: "Status", v: filterStatus, set: (v: string) => { setFilterStatus(v); setPage(1); }, opts: [["all", "Semua Status"], ["safe", "Aman"], ["low", "Menipis"], ["critical", "Kritis"], ["overstock", "Overstock"]] as [string, string][] },
              { l: "Kategori", v: filterCat, set: (v: string) => { setFilterCat(v); setPage(1); }, opts: [["all", "Semua"], ...categories.map(c => [c.id, c.name] as [string, string])] },
              { l: "Supplier", v: filterSup, set: (v: string) => { setFilterSup(v); setPage(1); }, opts: [["all", "Semua"], ...suppliers.map(s => [s.id, s.name] as [string, string])] },
              ...(!isBranchAdmin ? [{ l: "Cabang", v: filterBranch, set: (v: string) => { setFilterBranch(v); setPage(1); }, opts: [["all", "Semua"], ...branches.map(b => [b.id, b.name] as [string, string])] }] : []),
              { l: "Urutkan", v: sortBy + "|" + sortOrder, set: (v: string) => { const [s, o] = v.split("|"); setSortBy(s); setSortOrder(o); setPage(1); }, opts: [["name|asc", "Nama A–Z"], ["name|desc", "Nama Z–A"], ["code|asc", "Kode A–Z"], ["price|asc", "Harga ↑"], ["price|desc", "Harga ↓"], ["status|asc", "Status A–Z"], ["supplier|asc", "Supplier A–Z"], ["category|asc", "Kategori A–Z"]] as [string, string][] },
            ].map(f => (
              <div key={f.l}><label className="block text-xs text-slate-500 mb-1">{f.l}</label>
                <select value={f.v} onChange={e => f.set(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500">
                  {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-end"><button onClick={() => { setFilterStatus("all"); setFilterCat("all"); setFilterSup("all"); if (!isBranchAdmin) setFilterBranch("all"); setPage(1); }} className="text-xs text-blue-600 hover:underline">Reset filter</button></div>
          </div>
        )}
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} className="rounded" /></th>
              {(() => {
                const branchNames = filterBranch === "all" && items.length > 0
                  ? items[0].stock_by_branch.map(b => b.branch_name).sort((a, b) => a.localeCompare(b))
                  : [];
                const cols = filterBranch === "all"
                  ? ["Kode", "Nama Sparepart", "Kategori", ...branchNames, "Total", "Status", ""]
                  : ["Kode", "Nama Sparepart", "Kategori", "Stok", "ROP", "Max", "Status", ""];
                return cols.map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>);
              })()}
            </tr></thead>
            <tbody>
              {items.length === 0
                ? <tr><td colSpan={filterBranch === "all" ? 6 + (items[0]?.stock_by_branch.length || branches.length) : 8}><EmptyState icon={PackageSearch} title="Tidak ada sparepart" description="Coba ubah filter atau tambahkan sparepart baru." action={{ label: "Tambah Sparepart", onClick: () => onAction?.("add_item") }} /></td></tr>
                : items.map(part => {
                    const branchNames = (items[0]?.stock_by_branch.map(b => b.branch_name) || []).sort((a, b) => a.localeCompare(b));
                    const stockByBranchName = Object.fromEntries(part.stock_by_branch.map(b => [b.branch_name, b.quantity]));
                    return (
                      <tr key={part.id} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors ${selected.has(part.id) ? "bg-blue-50/60 dark:bg-blue-900/20" : ""}`}>
                        <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(part.id); }}><input type="checkbox" checked={selected.has(part.id)} onChange={() => toggleSelect(part.id)} className="rounded" /></td>
                        <td className="px-4 py-3 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.code}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSelectPart(part.id)}>{part.name}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{part.category}</td>
                        {filterBranch === "all" ? (
                          <>
                            {branchNames.map(name => (
                              <td key={name} className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{stockByBranchName[name] ?? 0}</td>
                            ))}
                            <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.total_stock}</td>
                            <td className="px-4 py-3"><StatusBadge status={part.status} /></td>
                            <td className="px-4 py-3 flex gap-1"><Tooltip text="Lihat detail"><button onClick={() => onSelectPart(part.id)} className="p-1 rounded text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition"><Eye size={14} /></button></Tooltip><Tooltip text="Edit sparepart"><button onClick={(e) => { e.stopPropagation(); setEditItemId(part.id); }} className="p-1 rounded text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"><Pencil size={14} /></button></Tooltip></td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.stock_by_branch[0]?.quantity ?? 0}</td>
                            <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.stock_by_branch[0]?.reorder_point ?? 0}</td>
                            <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{part.stock_by_branch[0]?.max_stock ?? 0}</td>
                            <td className="px-4 py-3"><StatusBadge status={part.status} /></td>
                            <td className="px-4 py-3 flex gap-1"><Tooltip text="Lihat detail"><button onClick={() => onSelectPart(part.id)} className="p-1 rounded text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition"><Eye size={14} /></button></Tooltip><Tooltip text="Edit sparepart"><button onClick={(e) => { e.stopPropagation(); setEditItemId(part.id); }} className="p-1 rounded text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition"><Pencil size={14} /></button></Tooltip></td>
                          </>
                        )}
                      </tr>
                    );
                  })
              }
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

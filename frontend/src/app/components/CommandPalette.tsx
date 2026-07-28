import React, { useState, useEffect, useRef } from "react";
import {
  Search, ChevronRight, LayoutDashboard, Package, ShoppingCart, Building2,
  ArrowLeftRight, FileBarChart, Settings, Plus, ArrowDownRight, ArrowUpRight,
  Activity, Loader2,
} from "lucide-react";
import { StatusBadge } from "./shared/StatusBadge";
import { list as fetchInventory } from "../services/inventory";
import type { PageId } from "../types";

const CMD_PAGES = [
  { label: "Dashboard",         page: "dashboard"    as PageId, icon: LayoutDashboard },
  { label: "Inventory",         page: "inventory"    as PageId, icon: Package        },
  { label: "Restock",           page: "restock"      as PageId, icon: ShoppingCart   },
  { label: "Branch Monitoring", page: "branches"     as PageId, icon: Building2      },
  { label: "Transactions",      page: "transactions" as PageId, icon: ArrowLeftRight  },
  { label: "Reports",           page: "reports"      as PageId, icon: FileBarChart   },
  { label: "Settings",          page: "settings"     as PageId, icon: Settings       },
];
const CMD_ACTIONS = [
  { label: "Tambah Sparepart", icon: Plus,           action: "add_item"   },
  { label: "Stok Masuk",       icon: ArrowDownRight, action: "stok_masuk" },
  { label: "Stok Keluar",      icon: ArrowUpRight,   action: "stok_keluar"},
  { label: "Transfer Stok",    icon: Activity,       action: "transfer"   },
];

export function CommandPalette({ open, onClose, onNavigate, onAction, onSelectPart }: {
  open: boolean; onClose: () => void; onNavigate: (p: PageId) => void; onAction: (a: string) => void; onSelectPart?: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [apiParts, setApiParts] = useState<Array<{ id: string; name: string; code: string; status: string }>>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { if (open) { setQ(""); setIdx(0); setApiParts([]); setTimeout(() => ref.current?.focus(), 50); } }, [open]);

  useEffect(() => {
    if (q.length <= 1) { setApiParts([]); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingParts(true);
      try {
        const res = await fetchInventory({ search: q, limit: 4 });
        setApiParts((res.data || []).map(p => ({ id: p.id, name: p.name, code: p.code, status: p.status })));
      } catch { setApiParts([]); }
      setLoadingParts(false);
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  const nav = q ? CMD_PAGES.filter(p => p.label.toLowerCase().includes(q.toLowerCase())) : CMD_PAGES.slice(0, 4);
  const acts = q ? CMD_ACTIONS.filter(a => a.label.toLowerCase().includes(q.toLowerCase())) : CMD_ACTIONS;

  type Item = { type: "nav"|"act"|"part"; label: string; icon: React.ElementType; group: string; key: string; page?: PageId; action?: string; status?: string; code?: string };
  const all: Item[] = [
    ...nav.map(p  => ({ type: "nav"  as const, label: p.label, icon: p.icon,  group: "Navigasi",  key: p.page,   page: p.page })),
    ...acts.map(a => ({ type: "act"  as const, label: a.label, icon: a.icon,  group: "Aksi",      key: a.action, action: a.action })),
    ...apiParts.map(p=> ({ type: "part" as const, label: p.name,  icon: Package, group: "Sparepart", key: p.id,   status: p.status, code: p.code })),
  ];
  useEffect(() => setIdx(0), [q]);

  function select(item: Item) {
    if (item.type === "nav"  && item.page)   { onNavigate(item.page); }
    if (item.type === "act"  && item.action) { onAction(item.action); }
    if (item.type === "part") {
      onNavigate("inventory");
      onSelectPart?.(item.key);
    }
    onClose();
  }
  function onKD(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, all.length - 1)); }
    else if (e.key === "ArrowUp")  { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter")    { e.preventDefault(); if (all[idx]) select(all[idx]); }
    else if (e.key === "Escape")   { e.preventDefault(); onClose(); }
  }
  if (!open) return null;
  let lastGrp = "";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKD} placeholder="Cari halaman, aksi, atau sparepart..." className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400" />
          <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded border border-slate-200 dark:border-slate-700">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {all.length === 0 && !loadingParts
            ? <div className="px-4 py-8 text-center text-sm text-slate-400">Tidak ada hasil untuk "{q}"</div>
            : all.map((item, i) => {
                const showGrp = item.group !== lastGrp; lastGrp = item.group;
                return (
                  <div key={item.key}>
                    {showGrp && <div className="px-4 pt-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.group}</div>}
                    <button onClick={() => select(item)} onMouseEnter={() => setIdx(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left ${i === idx ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                      <item.icon size={15} className="shrink-0 opacity-60" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.type === "part" && item.code && <span className="text-xs text-slate-400 shrink-0" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{item.code}</span>}
                      {item.type === "part" && item.status && <StatusBadge status={item.status} />}
                      {item.type === "nav" && <ChevronRight size={13} className="opacity-40" />}
                    </button>
                  </div>
                );
              })
          }
          {loadingParts && all.filter(i => i.type === "part").length === 0 && (
            <div className="px-4 py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2"><Loader2 size={12} className="animate-spin" />Mencari sparepart...</div>
          )}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <span><kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↑↓</kbd> pilih</span>
          <span><kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">↵</kbd> buka</span>
          <span><kbd className="px-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Esc</kbd> tutup</span>
        </div>
      </div>
    </div>
  );
}

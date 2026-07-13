import React, { useState } from "react";
import {
  Package, Search, Sliders, Plus, Download, Activity, Tag,
  X, Eye, PackageSearch,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "../../components/shared/Card";
import { StatusBadge } from "../../components/shared/StatusBadge";
import { EmptyState } from "../../components/shared/EmptyState";
import { AddItemModal } from "../../components/modals/AddItemModal";
import { SPARE_PARTS } from "../../data";

export function InventoryPage({ onSelectPart, initialFilter = "all" }: { onSelectPart: (id: string) => void; initialFilter?: string }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [filterCat, setFilterCat] = useState("all");
  const [filterSup, setFilterSup] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const cats = Array.from(new Set(SPARE_PARTS.map(s => s.category)));
  const sups = Array.from(new Set(SPARE_PARTS.map(s => s.supplier)));

  const filtered = SPARE_PARTS.filter(s => {
    const q = search.toLowerCase();
    return (s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      && (filterStatus === "all" || s.status === filterStatus)
      && (filterCat === "all" || s.category === filterCat)
      && (filterSup === "all" || s.supplier === filterSup);
  });

  const counts = { total: SPARE_PARTS.length, safe: SPARE_PARTS.filter(s=>s.status==="safe").length, low: SPARE_PARTS.filter(s=>s.status==="low").length, critical: SPARE_PARTS.filter(s=>s.status==="critical").length, overstock: SPARE_PARTS.filter(s=>s.status==="overstock").length };
  function toggleSelect(id: string) { const n = new Set(selected); n.has(id)?n.delete(id):n.add(id); setSelected(n); }
  function toggleAll() { selected.size===filtered.length?setSelected(new Set()):setSelected(new Set(filtered.map(p=>p.id))); }

  return (
    <div className="space-y-4">
      <AddItemModal open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{l:"Total Item",v:counts.total,cls:"text-slate-800 dark:text-slate-200",f:"all"},{l:"Aman",v:counts.safe,cls:"text-emerald-600",f:"safe"},{l:"Menipis",v:counts.low,cls:"text-amber-600",f:"low"},{l:"Kritis",v:counts.critical,cls:"text-red-600",f:"critical"},{l:"Overstock",v:counts.overstock,cls:"text-purple-600",f:"overstock"}].map(s => (
          <Card key={s.l} className={`p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${filterStatus===s.f?"ring-2 ring-blue-500":""}`} onClick={() => setFilterStatus(s.f)}>
            <div className={`text-2xl font-bold ${s.cls}`}>{s.v}</div><div className="text-xs text-slate-400 mt-0.5">{s.l}</div>
          </Card>
        ))}
      </div>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">{selected.size} item dipilih</span>
          <div className="flex gap-2 ml-auto">
            {[{l:"Export",icon:Download},{l:"Transfer",icon:Activity},{l:"Print QR",icon:Tag}].map(a => (
              <button key={a.l} onClick={() => { toast.success(`${a.l} ${selected.size} item`); setSelected(new Set()); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white dark:bg-slate-800 border border-blue-200 hover:bg-blue-50 rounded-lg transition active:scale-95"><a.icon size={12} />{a.l}</button>
            ))}
            <button onClick={() => setSelected(new Set())} className="p-1.5 text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        </div>
      )}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sparepart atau kode..." className="w-full pl-8 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-700 transition text-slate-800 dark:text-slate-200" />
          </div>
          <button onClick={() => setFilterOpen(!filterOpen)} className={`flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition ${filterOpen?"bg-blue-50 dark:bg-blue-900/20 border-blue-300 text-blue-700":"bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"}`}>
            <Sliders size={13} />Filter{(filterStatus!=="all"||filterCat!=="all"||filterSup!=="all")&&<span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-lg transition-all shadow-sm"><Plus size={13} />Tambah Item</button>
        </div>
        {filterOpen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {[
              { l:"Status",  v:filterStatus, set:setFilterStatus, opts:[["all","Semua Status"],["safe","Aman"],["low","Menipis"],["critical","Kritis"],["overstock","Overstock"]] as [string,string][] },
              { l:"Kategori",v:filterCat,    set:setFilterCat,    opts:[["all","Semua"],...cats.map(c=>[c,c] as [string,string])] },
              { l:"Supplier",v:filterSup,    set:setFilterSup,    opts:[["all","Semua"],...sups.map(s=>[s,s] as [string,string])] },
            ].map(f => (
              <div key={f.l}><label className="block text-xs text-slate-500 mb-1">{f.l}</label>
                <select value={f.v} onChange={e => f.set(e.target.value)} className="w-full px-2 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500">
                  {f.opts.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            ))}
            <div className="flex items-end"><button onClick={() => { setFilterStatus("all"); setFilterCat("all"); setFilterSup("all"); }} className="text-xs text-blue-600 hover:underline">Reset filter</button></div>
          </div>
        )}
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <th className="px-4 py-3 w-8"><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} className="rounded" /></th>
              {["Kode","Nama Sparepart","Kategori","Stok A","Stok B","Stok C","Total","Min Stok","Status",""].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={10}><EmptyState icon={PackageSearch} title="Tidak ada sparepart" description="Coba ubah filter atau tambahkan sparepart baru." action={{ label:"Tambah Sparepart", onClick:()=>setAddOpen(true) }} /></td></tr>
                : filtered.map(part => (
                  <tr key={part.id} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors ${selected.has(part.id)?"bg-blue-50/60 dark:bg-blue-900/20":""}`}>
                    <td className="px-4 py-3" onClick={e => { e.stopPropagation(); toggleSelect(part.id); }}><input type="checkbox" checked={selected.has(part.id)} onChange={() => toggleSelect(part.id)} className="rounded" /></td>
                    <td className="px-4 py-3 text-xs text-slate-400" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSelectPart(part.id)}>{part.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{part.category}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.stockA}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.stockB}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-700 dark:text-slate-300" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.stockC}</td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-800 dark:text-slate-200" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.stockA+part.stockB+part.stockC}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-400" style={{ fontFamily:"'JetBrains Mono', monospace" }}>{part.minStock}</td>
                    <td className="px-4 py-3"><StatusBadge status={part.status} /></td>
                    <td className="px-4 py-3"><button onClick={() => onSelectPart(part.id)} className="p-1 rounded text-slate-300 hover:text-slate-600 dark:hover:text-slate-400 transition"><Eye size={14} /></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>{filtered.length} dari {SPARE_PARTS.length} item</span>
            <div className="flex items-center gap-1">
              <button className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition">Prev</button>
              <button className="px-2 py-1 bg-blue-700 text-white rounded">1</button>
              <button className="px-2 py-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition">Next</button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

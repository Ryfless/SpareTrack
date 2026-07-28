import React, { useState, useEffect, useMemo } from "react";
import { ArrowDownRight, Info, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { list as fetchInventory, getById } from "../../services/inventory";
import { list as fetchBranches } from "../../services/branches";
import { create as createTransaction } from "../../services/transactions";
import { inputCls } from "../../config";
import type { SparepartDetail } from "../../services/inventory";

export function StokMasukModal({ open, onClose, sparepart, userProfile, currentRole }: { open: boolean; onClose: () => void; sparepart?: SparepartDetail; userProfile?: { role: string; branch: string } | null; currentRole?: string }) {
  const [form, setForm] = useState({ sparepart_id: "", branch_id: "", jumlah: "", catatan: "" });
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<SparepartDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const isBranchAdmin = currentRole === "branch_admin";

  const activeSparepart = sparepart ?? detail;

  useEffect(() => {
    if (!open) return;
    setForm({ sparepart_id: sparepart?.id ?? "", branch_id: "", jumlah: "", catatan: "" });
    setDetail(null);
    setLoading(true);
    Promise.all([
      !sparepart ? fetchInventory({ limit: 200 }).then(r => setSpareparts((r.data || []).map(s => ({ id: s.id, name: s.name })))) : Promise.resolve(),
      fetchBranches().then(b => {
        setBranches(b);
        if (isBranchAdmin && userProfile?.branch) {
          const match = b.find(br => br.name === userProfile.branch || br.id === userProfile.branch);
          if (match) setForm(f => ({ ...f, branch_id: match.id }));
        }
      }),
    ]).catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [open, sparepart]);

  useEffect(() => {
    if (!open || sparepart || !form.sparepart_id) { setDetail(null); return; }
    setDetailLoading(true);
    getById(form.sparepart_id).then(setDetail).catch(() => {}).finally(() => setDetailLoading(false));
  }, [open, sparepart, form.sparepart_id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const selectedBranchStock = useMemo(() => {
    if (!activeSparepart || !form.branch_id) return null;
    const found = activeSparepart.stock_by_branch.find(b => b.branch_id === form.branch_id);
    if (found) return found;
    const branchName = branches.find(b => b.id === form.branch_id)?.name || '';
    return { branch_id: form.branch_id, branch_name: branchName, quantity: 0 };
  }, [activeSparepart, form.branch_id, branches]);

  async function submit() {
    if (!form.sparepart_id || !form.branch_id || !form.jumlah) { toast.error("Lengkapi data"); return; }
    setSubmitting(true);
    try {
      await createTransaction({ type: 'in', sparepart_id: form.sparepart_id, branch_id: form.branch_id, quantity: Number(form.jumlah), notes: form.catatan });
      toast.success('Stok masuk berhasil dicatat');
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
      onClose();
    } catch { toast.error("Gagal mencatat stok masuk"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Catat Stok Masuk" size="sm">
      <div className="space-y-4">
        {activeSparepart ? (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <div className="text-xs font-semibold text-blue-700 dark:text-blue-400">{activeSparepart.name}</div>
            <div className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{activeSparepart.code}</div>
          </div>
        ) : (
          <FormField label="Sparepart" required>
            {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
              : <select value={form.sparepart_id} onChange={set("sparepart_id")} className={inputCls}><option value="">Pilih sparepart</option>{spareparts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
          </FormField>
        )}
        <FormField label="Cabang" required>
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : isBranchAdmin ? (
              <div className="px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <Lock size={12} className="text-slate-400" />
                {branches.find(b => b.id === form.branch_id)?.name || "Memuat..."}
              </div>
            ) : (
              <select value={form.branch_id} onChange={set("branch_id")} className={inputCls}><option value="">Pilih cabang</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
            )}
        </FormField>
        {selectedBranchStock !== null && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span className="text-slate-500">Stok saat ini di {selectedBranchStock.branch_name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedBranchStock.quantity}</span>
          </div>
        )}
        <FormField label="Jumlah" required><input value={form.jumlah} onChange={set("jumlah")} type="number" min="1" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Catatan"><textarea value={form.catatan} onChange={set("catatan")} rows={2} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><ArrowDownRight size={15} />Simpan</>}
        </button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

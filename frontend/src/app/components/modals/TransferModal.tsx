import React, { useState, useEffect, useMemo } from "react";
import { Activity, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { list as fetchInventory, getById } from "../../services/inventory";
import { list as fetchBranches } from "../../services/branches";
import { create as createTransaction } from "../../services/transactions";
import { inputCls } from "../../config";
import type { SparepartDetail } from "../../services/inventory";

export function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ sparepart_id: "", dari_id: "", ke_id: "", jumlah: "", catatan: "" });
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [detail, setDetail] = useState<SparepartDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDetail(null);
    setLoading(true);
    Promise.all([
      fetchInventory({ limit: 200 }).then(r => setSpareparts((r.data || []).map(s => ({ id: s.id, name: s.name })))),
      fetchBranches().then(setBranches),
    ]).catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open || !form.sparepart_id) { setDetail(null); return; }
    setDetailLoading(true);
    getById(form.sparepart_id).then(setDetail).catch(() => {}).finally(() => setDetailLoading(false));
  }, [open, form.sparepart_id]);

  const sourceBranchStock = useMemo(() => {
    if (!detail || !form.dari_id) return null;
    const found = detail.stock_by_branch.find(b => b.branch_id === form.dari_id);
    if (found) return found;
    const branchName = branches.find(b => b.id === form.dari_id)?.name || '';
    return { branch_id: form.dari_id, branch_name: branchName, quantity: 0 };
  }, [detail, form.dari_id, branches]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.sparepart_id || !form.dari_id || !form.ke_id || !form.jumlah) { toast.error("Lengkapi data"); return; }
    if (form.dari_id === form.ke_id) { toast.error("Cabang asal dan tujuan tidak boleh sama"); return; }
    setSubmitting(true);
    try {
      await createTransaction({ type: 'transfer', sparepart_id: form.sparepart_id, branch_id: form.dari_id, quantity: Number(form.jumlah), destination_branch_id: form.ke_id, notes: form.catatan });
      toast.success('Transfer stok berhasil');
      setForm({ sparepart_id: "", dari_id: "", ke_id: "", jumlah: "", catatan: "" });
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
      onClose();
    } catch { toast.error("Gagal transfer stok"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Transfer Stok Antar Cabang" size="sm">
      <div className="space-y-4">
        <FormField label="Sparepart" required>
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={form.sparepart_id} onChange={set("sparepart_id")} className={inputCls}><option value="">Pilih sparepart</option>{spareparts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Dari" required>
            {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
              : <select value={form.dari_id} onChange={set("dari_id")} className={inputCls}><option value="">Asal</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
          </FormField>
          <FormField label="Ke" required>
            {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
              : <select value={form.ke_id} onChange={set("ke_id")} className={inputCls}><option value="">Tujuan</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
          </FormField>
        </div>
        {sourceBranchStock && (
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 text-xs">
            <Info size={12} className="text-blue-500 shrink-0" />
            <span className="text-slate-500">Stok di {sourceBranchStock.branch_name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{sourceBranchStock.quantity}</span>
          </div>
        )}
        <FormField label="Jumlah" required><input value={form.jumlah} onChange={set("jumlah")} type="number" min="1" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Catatan"><textarea value={form.catatan} onChange={set("catatan")} rows={2} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Activity size={15} />Konfirmasi</>}
        </button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

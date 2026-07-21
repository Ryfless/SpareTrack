import React, { useState, useEffect } from "react";
import { ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { list as fetchInventory } from "../../services/inventory";
import { list as fetchBranches } from "../../services/branches";
import { create as createTransaction } from "../../services/transactions";
import { inputCls } from "../../config";

export function StokMasukModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ sparepart_id: "", branch_id: "", jumlah: "", catatan: "" });
  const [spareparts, setSpareparts] = useState<Array<{ id: string; name: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetchInventory({ limit: 200 }).then(r => setSpareparts((r.data || []).map(s => ({ id: s.id, name: s.name })))),
      fetchBranches().then(setBranches),
    ]).catch(() => toast.error("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, [open]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.sparepart_id || !form.branch_id || !form.jumlah) { toast.error("Lengkapi data"); return; }
    setSubmitting(true);
    try {
      await createTransaction({ type: 'in', sparepart_id: form.sparepart_id, branch_id: form.branch_id, quantity: Number(form.jumlah), notes: form.catatan });
      toast.success('Stok masuk berhasil dicatat');
      setForm({ sparepart_id: "", branch_id: "", jumlah: "", catatan: "" });
      onClose();
    } catch { toast.error("Gagal mencatat stok masuk"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Catat Stok Masuk" size="sm">
      <div className="space-y-4">
        <FormField label="Sparepart" required>
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={form.sparepart_id} onChange={set("sparepart_id")} className={inputCls}><option value="">Pilih sparepart</option>{spareparts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        </FormField>
        <FormField label="Cabang" required>
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={form.branch_id} onChange={set("branch_id")} className={inputCls}><option value="">Pilih cabang</option>{branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>}
        </FormField>
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

import React, { useState, useEffect, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { getCategories, getSuppliers } from "../../services/references";
import { create as createSparepart } from "../../services/inventory";
import { inputCls } from "../../config";

export function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ code: "", name: "", category_id: "", supplier_id: "", price: "", lead_time: "", min_stock: "", reorder_point: "", safety_stock: "" });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getCategories().then(setCategories),
      getSuppliers().then(setSuppliers),
    ]).catch(() => toast.error("Gagal memuat data referensi"))
      .finally(() => setLoading(false));
  }, [open]);

  const toastThrottle = useRef(0);
  const MAX_LEN: Record<string, number> = { code: 20, name: 20 };
  const NUM_MAX: Record<string, number> = { price: 999999999, lead_time: 365, min_stock: 999999, reorder_point: 999999, safety_stock: 999999 };

  function throttledToast(msg: string) {
    const now = Date.now();
    if (now - toastThrottle.current > 3000) { toastThrottle.current = now; toast.error(msg); }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const val = e.target.value;
    if (k in MAX_LEN && val.length > MAX_LEN[k]) { throttledToast(`Maksimal ${MAX_LEN[k]} karakter`); return; }
    if (k in NUM_MAX && val !== '') {
      const num = Number(val);
      if (isNaN(num)) { throttledToast("Input tidak valid"); return; }
      if (num > NUM_MAX[k]) { throttledToast(`Maksimal ${Number(NUM_MAX[k]).toLocaleString('id-ID')}`); return; }
    }
    setForm(f => ({ ...f, [k]: val }));
  };

  async function submit() {
    if (!form.name || !form.code || !form.category_id) { toast.error("Kode, nama, dan kategori wajib diisi"); return; }
    setSubmitting(true);
    try {
      await createSparepart({
        code: form.code,
        name: form.name,
        category_id: form.category_id || undefined,
        supplier_id: form.supplier_id || undefined,
        price: form.price ? Number(form.price) : undefined,
        min_stock: form.min_stock ? Number(form.min_stock) : undefined,
        reorder_point: form.reorder_point ? Number(form.reorder_point) : undefined,
        safety_stock: form.safety_stock ? Number(form.safety_stock) : undefined,
        lead_time: form.lead_time ? Number(form.lead_time) : undefined,
      });
      toast.success(`Sparepart "${form.name}" berhasil ditambahkan`);
      setForm({ code: "", name: "", category_id: "", supplier_id: "", price: "", lead_time: "", min_stock: "", reorder_point: "", safety_stock: "" });
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
      onClose();
    } catch { toast.error("Gagal menambahkan sparepart"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Tambah Sparepart Baru" size="lg">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Kode Sparepart" required><input value={form.code} onChange={set("code")} placeholder="OLI-10W40" className={inputCls} /></FormField>
        <FormField label="Nama Sparepart" required><input value={form.name} onChange={set("name")} placeholder="Nama lengkap" className={inputCls} /></FormField>
        <FormField label="Kategori" required>
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={form.category_id} onChange={set("category_id")} className={inputCls}><option value="">Pilih kategori</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
        </FormField>
        <FormField label="Supplier">
          {loading ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={form.supplier_id} onChange={set("supplier_id")} className={inputCls}><option value="">Pilih supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        </FormField>
        <FormField label="Harga (Rp)"><input value={form.price} onChange={set("price")} type="number" min="0" max="999999999" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Lead Time (hari)"><input value={form.lead_time} onChange={set("lead_time")} type="number" min="0" max="365" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Min. Stok"><input value={form.min_stock} onChange={set("min_stock")} type="number" min="0" max="999999" className={inputCls} /></FormField>
        <FormField label="Reorder Point"><input value={form.reorder_point} onChange={set("reorder_point")} type="number" min="0" max="999999" className={inputCls} /></FormField>
        <FormField label="Safety Stock"><input value={form.safety_stock} onChange={set("safety_stock")} type="number" min="0" max="999999" className={inputCls} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Plus size={15} />Tambah Sparepart</>}
        </button>
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

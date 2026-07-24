import React, { useState, useEffect, useRef } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { getCategories, getSuppliers } from "../../services/references";
import { getById, update as updateSparepart } from "../../services/inventory";
import { inputCls } from "../../config";

export function EditItemModal({ open, sparepartId, onClose, onSuccess }: { open: boolean; sparepartId: string | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: "", category_id: "", supplier_id: "", price: "", min_stock: "", max_stock: "", reorder_point: "", safety_stock: "", lead_time: "", unit: "pcs" });
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !sparepartId) return;
    setLoading(true);
    Promise.all([
      getById(sparepartId),
      getCategories(),
      getSuppliers(),
    ]).then(([part, cats, sups]) => {
      setCategories(cats);
      setSuppliers(sups);
      setForm({
        name: part.name,
        category_id: part.category_id || "",
        supplier_id: part.supplier_id || "",
        price: part.price.toString(),
        min_stock: part.min_stock.toString(),
        max_stock: part.max_stock !== null ? part.max_stock.toString() : "",
        reorder_point: part.reorder_point.toString(),
        safety_stock: part.safety_stock.toString(),
        lead_time: part.lead_time.toString(),
        unit: part.unit || "pcs",
      });
    }).catch(() => toast.error("Gagal memuat data sparepart"))
      .finally(() => setLoading(false));
  }, [open, sparepartId]);

  const toastThrottle = useRef(0);
  const MAX_LEN: Record<string, number> = { name: 20 };
  const NUM_MAX: Record<string, number> = { price: 999999999, lead_time: 365, min_stock: 999999, max_stock: 999999, reorder_point: 999999, safety_stock: 999999 };

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
    if (!form.name) { toast.error("Nama sparepart wajib diisi"); return; }
    if (!form.category_id) { toast.error("Kategori wajib dipilih"); return; }
    if (Number(form.price) < 0 || Number(form.min_stock) < 0) { toast.error("Angka tidak boleh negatif"); return; }
    if (!sparepartId) return;

    setSubmitting(true);
    try {
      await updateSparepart(sparepartId, {
        name: form.name,
        category_id: form.category_id || undefined,
        supplier_id: form.supplier_id || undefined,
        price: form.price ? Number(form.price) : undefined,
        min_stock: form.min_stock ? Number(form.min_stock) : undefined,
        max_stock: form.max_stock ? Number(form.max_stock) : undefined,
        reorder_point: form.reorder_point ? Number(form.reorder_point) : undefined,
        safety_stock: form.safety_stock ? Number(form.safety_stock) : undefined,
        lead_time: form.lead_time ? Number(form.lead_time) : undefined,
        unit: form.unit || undefined,
      });
      toast.success(`Sparepart "${form.name}" berhasil diupdate`);
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
      onSuccess();
      onClose();
    } catch { toast.error("Gagal mengupdate sparepart"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Sparepart" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nama Sparepart" required>
              <input value={form.name} onChange={set("name")} placeholder="Nama lengkap sparepart" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Nama display untuk sparepart, maksimal 100 karakter</p>
            </FormField>
            <FormField label="Kategori" required>
              <select value={form.category_id} onChange={set("category_id")} className={inputCls}>
                <option value="">Pilih kategori</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5">Kelompok jenis sparepart</p>
            </FormField>
            <FormField label="Harga (Rp)">
              <input value={form.price} onChange={set("price")} type="number" min="0" max="999999999" placeholder="0" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Harga satuan sparepart</p>
            </FormField>
            <FormField label="Supplier">
              <select value={form.supplier_id} onChange={set("supplier_id")} className={inputCls}>
                <option value="">Pilih supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5">Pemasok utama sparepart ini</p>
            </FormField>
            <FormField label="Unit">
              <select value={form.unit} onChange={set("unit")} className={inputCls}>
                <option value="pcs">pcs</option>
                <option value="set">set</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-0.5">Satuan hitung sparepart</p>
            </FormField>
            <FormField label="Lead Time (hari)">
              <input value={form.lead_time} onChange={set("lead_time")} type="number" min="0" max="365" placeholder="0" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Estimasi hari pemesanan hingga tiba</p>
            </FormField>
            <FormField label="Min. Stok">
              <input value={form.min_stock} onChange={set("min_stock")} type="number" min="0" max="999999" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Batas minimal stok sebelum peringatan</p>
            </FormField>
            <FormField label="Max. Stok">
              <input value={form.max_stock} onChange={set("max_stock")} type="number" min="0" max="999999" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Batas maksimal stok (overstock)</p>
            </FormField>
            <FormField label="Reorder Point">
              <input value={form.reorder_point} onChange={set("reorder_point")} type="number" min="0" max="999999" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Titik stok yang memicu restock otomatis</p>
            </FormField>
            <FormField label="Safety Stock">
              <input value={form.safety_stock} onChange={set("safety_stock")} type="number" min="0" max="999999" className={inputCls} />
              <p className="text-[10px] text-slate-400 mt-0.5">Stok pengaman untuk antisipasi lonjakan</p>
            </FormField>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
              {submitting ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Save size={15} />Simpan Perubahan</>}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
          </div>
        </>
      )}
    </Modal>
  );
}

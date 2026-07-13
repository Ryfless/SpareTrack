import React, { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { CATEGORIES, SUPPLIERS } from "../../data";
import { inputCls } from "../../config";

export function AddItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ code: "", name: "", category: "", supplier: "", price: "", leadTime: "", minStock: "", reorderPoint: "", safetyStock: "", stockA: "", stockB: "", stockC: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  function submit() {
    if (!form.name || !form.code || !form.category) { toast.error("Kode, nama, dan kategori wajib diisi"); return; }
    toast.success(`Sparepart "${form.name}" berhasil ditambahkan`, { description: `Kode: ${form.code}` });
    onClose();
  }
  return (
    <Modal open={open} onClose={onClose} title="Tambah Sparepart Baru" size="lg">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Kode Sparepart" required><input value={form.code} onChange={set("code")} placeholder="OLI-10W40" className={inputCls} /></FormField>
        <FormField label="Nama Sparepart" required><input value={form.name} onChange={set("name")} placeholder="Nama lengkap" className={inputCls} /></FormField>
        <FormField label="Kategori" required><select value={form.category} onChange={set("category")} className={inputCls}><option value="">Pilih kategori</option>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></FormField>
        <FormField label="Supplier"><select value={form.supplier} onChange={set("supplier")} className={inputCls}><option value="">Pilih supplier</option>{SUPPLIERS.map(s => <option key={s}>{s}</option>)}</select></FormField>
        <FormField label="Harga (Rp)"><input value={form.price} onChange={set("price")} type="number" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Lead Time (hari)"><input value={form.leadTime} onChange={set("leadTime")} type="number" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Min. Stok"><input value={form.minStock} onChange={set("minStock")} type="number" className={inputCls} /></FormField>
        <FormField label="Reorder Point"><input value={form.reorderPoint} onChange={set("reorderPoint")} type="number" className={inputCls} /></FormField>
        <FormField label="Safety Stock"><input value={form.safetyStock} onChange={set("safetyStock")} type="number" className={inputCls} /></FormField>
      </div>
      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">Stok Awal per Cabang</div>
        <div className="grid grid-cols-3 gap-3">
          {[["stockA","Cabang A"],["stockB","Cabang B"],["stockC","Cabang C"]].map(([k, l]) => (
            <FormField key={k} label={l}><input value={form[k as keyof typeof form]} onChange={set(k)} type="number" placeholder="0" className={inputCls} /></FormField>
          ))}
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={submit} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all"><Plus size={15} />Tambah Sparepart</button>
        <button onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

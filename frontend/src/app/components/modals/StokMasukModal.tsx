import React, { useState } from "react";
import { ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { SPARE_PARTS, BRANCHES_LIST } from "../../data";
import { inputCls } from "../../config";

export function StokMasukModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ sparepart: "", cabang: "", jumlah: "", tanggal: new Date().toISOString().slice(0,10), catatan: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} title="Catat Stok Masuk" size="sm">
      <div className="space-y-4">
        <FormField label="Sparepart" required><select value={form.sparepart} onChange={set("sparepart")} className={inputCls}><option value="">Pilih sparepart</option>{SPARE_PARTS.map(s => <option key={s.id}>{s.name}</option>)}</select></FormField>
        <FormField label="Cabang" required><select value={form.cabang} onChange={set("cabang")} className={inputCls}><option value="">Pilih cabang</option>{BRANCHES_LIST.map(b => <option key={b}>{b}</option>)}</select></FormField>
        <FormField label="Jumlah" required><input value={form.jumlah} onChange={set("jumlah")} type="number" min="1" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Tanggal"><input value={form.tanggal} onChange={set("tanggal")} type="date" className={inputCls} /></FormField>
        <FormField label="Catatan"><textarea value={form.catatan} onChange={set("catatan")} rows={2} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => { if (!form.sparepart || !form.cabang || !form.jumlah) { toast.error("Lengkapi data"); return; } toast.success(`Stok masuk +${form.jumlah} ${form.sparepart}`, { description: form.cabang }); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all"><ArrowDownRight size={15} />Simpan</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { SPARE_PARTS, BRANCHES_LIST } from "../../data";
import { inputCls } from "../../config";

export function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ sparepart: "", dari: "", ke: "", jumlah: "", catatan: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <Modal open={open} onClose={onClose} title="Transfer Stok Antar Cabang" size="sm">
      <div className="space-y-4">
        <FormField label="Sparepart" required><select value={form.sparepart} onChange={set("sparepart")} className={inputCls}><option value="">Pilih sparepart</option>{SPARE_PARTS.map(s => <option key={s.id}>{s.name}</option>)}</select></FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Dari" required><select value={form.dari} onChange={set("dari")} className={inputCls}><option value="">Asal</option>{BRANCHES_LIST.map(b => <option key={b}>{b}</option>)}</select></FormField>
          <FormField label="Ke" required><select value={form.ke} onChange={set("ke")} className={inputCls}><option value="">Tujuan</option>{BRANCHES_LIST.map(b => <option key={b}>{b}</option>)}</select></FormField>
        </div>
        <FormField label="Jumlah" required><input value={form.jumlah} onChange={set("jumlah")} type="number" min="1" placeholder="0" className={inputCls} /></FormField>
        <FormField label="Catatan"><textarea value={form.catatan} onChange={set("catatan")} rows={2} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => { if (!form.sparepart || !form.dari || !form.ke || !form.jumlah) { toast.error("Lengkapi data"); return; } if (form.dari === form.ke) { toast.error("Cabang asal dan tujuan tidak boleh sama"); return; } toast.success(`Transfer ${form.jumlah}× ${form.sparepart}`, { description: `${form.dari} → ${form.ke}` }); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all"><Activity size={15} />Konfirmasi</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

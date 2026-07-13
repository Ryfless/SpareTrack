import React, { useState } from "react";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import type { RestockItem } from "../../data";
import { inputCls } from "../../config";

export function PostponeModal({ item, onClose }: { item: RestockItem | null; onClose: () => void }) {
  const [hingga, setHingga] = useState(""); const [alasan, setAlasan] = useState("");
  if (!item) return null;
  return (
    <Modal open={!!item} onClose={onClose} title="Tunda Restock" size="sm">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 mb-4 text-xs text-amber-700 dark:text-amber-400">{item.name} — {item.branch}</div>
      <div className="space-y-4">
        <FormField label="Tunda Hingga" required><input value={hingga} onChange={e => setHingga(e.target.value)} type="date" className={inputCls} /></FormField>
        <FormField label="Alasan"><textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={3} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => { if (!hingga) { toast.error("Pilih tanggal"); return; } toast.success(`Restock ${item.name} ditunda hingga ${hingga}`); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl transition-all"><CheckCircle size={15} />Konfirmasi</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

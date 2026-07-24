import React, { useState } from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { postponeRecommendation } from "../../services/restock";
import type { RestockRecommendation } from "../../services/restock";
import { inputCls } from "../../config";

function getDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PostponeModal({ item, onClose, onPostponed }: { item: RestockRecommendation | null; onClose: () => void; onPostponed?: () => void }) {
  const [hingga, setHingga] = useState(""); const [alasan, setAlasan] = useState(""); const [submitting, setSubmitting] = useState(false);
  if (!item) return null;
  async function handleConfirm() {
    if (!hingga) { toast.error("Pilih tanggal"); return; }
    const today = getDateStr(new Date());
    if (hingga <= today) { toast.error("Tanggal penundaan harus lebih dari hari ini"); return; }
    setSubmitting(true);
    try {
      await postponeRecommendation(item.id, alasan, hingga);
      toast.success(`${item.name} ditunda hingga ${hingga}`);
      onClose();
      if (onPostponed) onPostponed();
    } catch {
      toast.error("Gagal menunda rekomendasi");
    }
    setSubmitting(false);
  }
  return (
    <Modal open={!!item} onClose={onClose} title="Tunda Restock" size="sm">
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800 mb-4 text-xs text-amber-700 dark:text-amber-400">{item.name} — {item.branch_name}</div>
      <div className="space-y-4">
        <FormField label="Tunda Hingga" required><input value={hingga} onChange={e => setHingga(e.target.value)} type="date" className={inputCls} /></FormField>
        <FormField label="Alasan"><textarea value={alasan} onChange={e => setAlasan(e.target.value)} rows={3} className={`${inputCls} resize-none`} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={handleConfirm} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 active:scale-95 rounded-xl transition-all disabled:opacity-50">
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}Konfirmasi</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

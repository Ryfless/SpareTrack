import React, { useEffect, useState } from "react";
import { Truck, Info } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { SPARE_PARTS } from "../../data";
import type { RestockItem } from "../../data";
import { inputCls } from "../../config";

export function CreatePOModal({ item, onClose }: { item: RestockItem | null; onClose: () => void }) {
  const [qty, setQty] = useState(item?.recommendedQty.toString() ?? "");
  const [target, setTarget] = useState("");
  useEffect(() => { if (item) setQty(item.recommendedQty.toString()); }, [item]);
  if (!item) return null;
  const price = SPARE_PARTS.find(s => s.code === item.code)?.price ?? 0;
  const est = Number(qty) * price;
  return (
    <Modal open={!!item} onClose={onClose} title="Buat Purchase Order Restock">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">{item.name}</div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Kode: <strong>{item.code}</strong></span><span>Cabang: <strong>{item.branch}</strong></span>
          <span>Supplier: <strong>{item.supplier}</strong></span><span>Stok: <strong className="text-red-600">{item.currentStock}</strong></span>
        </div>
      </div>
      <div className="space-y-4">
        <FormField label="Jumlah Restock" required><input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" className={inputCls} /></FormField>
        {est > 0 && <div className="text-xs text-slate-500 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2"><Info size={12} className="text-blue-500" />Estimasi: <strong className="text-slate-700 dark:text-slate-300">Rp {est.toLocaleString()}</strong></div>}
        <FormField label="Target Tanggal Tiba" required><input value={target} onChange={e => setTarget(e.target.value)} type="date" className={inputCls} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={() => { if (!qty || !target) { toast.error("Lengkapi data"); return; } toast.success(`PO Restock ${item.name} dibuat`, { description: `${qty} unit → ${item.branch}` }); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all"><Truck size={15} />Kirim PO</button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

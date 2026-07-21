import React, { useEffect, useState } from "react";
import { Truck, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { getSuppliers } from "../../services/references";
import { createPurchaseOrder } from "../../services/restock";
import type { RestockRecommendation } from "../../services/restock";
import { inputCls } from "../../config";

export function CreatePOModal({ item, onClose }: { item: RestockRecommendation | null; onClose: () => void }) {
  const [qty, setQty] = useState(item?.recommended_qty.toString() ?? "");
  const [supplierId, setSupplierId] = useState("");
  const [target, setTarget] = useState("");
  const [suppliers, setSuppliers] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (item) { setQty(item.recommended_qty.toString()); } }, [item]);

  useEffect(() => {
    if (!item) return;
    setLoadingSuppliers(true);
    getSuppliers()
      .then(list => { setSuppliers(list); })
      .catch(() => toast.error("Gagal memuat supplier"))
      .finally(() => setLoadingSuppliers(false));
  }, [item]);

  if (!item) return null;
  const est = Number(qty) * item.price;

  async function submit() {
    if (!qty || !supplierId || !target) { toast.error("Lengkapi data (supplier, jumlah, target)"); return; }
    setSubmitting(true);
    try {
      await createPurchaseOrder({
        supplier_id: supplierId,
        branch_id: item.branch_id,
        notes: `Restock ${item.name} — target tiba ${target}`,
        items: [{ sparepart_id: item.sparepart_id, quantity: Number(qty), unit_price: item.price }],
        recommendation_id: item.id,
      });
      toast.success(`PO Restock ${item.name} dibuat`);
      onClose();
    } catch { toast.error("Gagal membuat PO"); }
    finally { setSubmitting(false); }
  }

  return (
    <Modal open={!!item} onClose={onClose} title="Buat Purchase Order Restock">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
        <div className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">{item.name}</div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Kode: <strong>{item.code}</strong></span><span>Cabang: <strong>{item.branch_name}</strong></span>
          <span>Stok: <strong className="text-red-600">{item.current_stock}</strong></span>
        </div>
      </div>
      <div className="space-y-4">
        <FormField label="Supplier" required>
          {loadingSuppliers ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 size={12} className="animate-spin" />Memuat...</div>
            : <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={inputCls}><option value="">Pilih supplier</option>{suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>}
        </FormField>
        <FormField label="Jumlah Restock" required><input value={qty} onChange={e => setQty(e.target.value)} type="number" min="1" className={inputCls} /></FormField>
        {est > 0 && <div className="text-xs text-slate-500 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-center gap-2"><Info size={12} className="text-blue-500" />Estimasi: <strong className="text-slate-700 dark:text-slate-300">Rp {est.toLocaleString()}</strong></div>}
        <FormField label="Target Tanggal Tiba" required><input value={target} onChange={e => setTarget(e.target.value)} type="date" className={inputCls} /></FormField>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={submit} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Menyimpan...</> : <><Truck size={15} />Kirim PO</>}
        </button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

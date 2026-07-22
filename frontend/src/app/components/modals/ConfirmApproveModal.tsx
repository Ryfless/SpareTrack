import { AlertTriangle, Loader2, Check } from "lucide-react";
import { Modal } from "../shared/Modal";
import type { PurchaseOrderDetail } from "../../services/restock";

interface ConfirmApproveModalProps {
  po: PurchaseOrderDetail | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmApproveModal({ po, submitting, onConfirm, onClose }: ConfirmApproveModalProps) {
  if (!po) return null;

  const totalItems = po.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Modal open={!!po} onClose={onClose} title="Konfirmasi Approve PO">
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start gap-3 mb-4">
        <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-amber-800 dark:text-amber-400">Konfirmasi Persetujuan</div>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            PO <strong>{po.po_number}</strong> akan disetujui dan stok akan otomatis ditambahkan ke inventory.
          </p>
        </div>
      </div>

      <div className="text-xs text-slate-500 space-y-1 mb-4">
        <div className="flex justify-between"><span>Supplier</span><span className="font-medium text-slate-700">{po.supplier}</span></div>
        <div className="flex justify-between"><span>Cabang</span><span className="font-medium text-slate-700">{po.branch}</span></div>
        <div className="flex justify-between"><span>Jumlah Item</span><span className="font-medium text-slate-700">{totalItems} unit</span></div>
        <div className="flex justify-between"><span>Total</span><span className="font-medium text-slate-700">Rp {(po.total_amount || 0).toLocaleString()}</span></div>
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={onConfirm} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Memproses...</> : <><Check size={15} />Approve & Tambah Stok</>}
        </button>
        <button onClick={onClose} disabled={submitting} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

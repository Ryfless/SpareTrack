import { PackageCheck, Loader2, Check } from "lucide-react";
import { Modal } from "../shared/Modal";
import type { PurchaseOrderDetail } from "../../services/restock";

interface ConfirmReceiveModalProps {
  po: PurchaseOrderDetail | null;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmReceiveModal({ po, submitting, onConfirm, onClose }: ConfirmReceiveModalProps) {
  if (!po) return null;

  const totalItems = po.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Modal open={!!po} onClose={onClose} title="Konfirmasi Terima PO">
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-start gap-3 mb-4">
        <PackageCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-blue-800 dark:text-blue-400">Konfirmasi Penerimaan</div>
          <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
            PO <strong>{po.po_number}</strong> akan diterima dan stok akan ditambahkan ke inventory cabang.
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
        <button onClick={onConfirm} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Memproses...</> : <><Check size={15} />Terima & Tambah Stok</>}
        </button>
        <button onClick={onClose} disabled={submitting} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

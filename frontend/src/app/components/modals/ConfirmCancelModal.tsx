import { AlertTriangle, Loader2, X } from "lucide-react";
import { Modal } from "../shared/Modal";

interface ConfirmCancelModalProps {
  poNumber: string;
  submitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmCancelModal({ poNumber, submitting, onConfirm, onClose }: ConfirmCancelModalProps) {
  return (
    <Modal open={!!poNumber} onClose={onClose} title="Konfirmasi Pembatalan">
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3 mb-4">
        <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-semibold text-red-800 dark:text-red-400">Konfirmasi Pembatalan</div>
          <p className="text-xs text-red-700 dark:text-red-500 mt-1">
            PO <strong>{poNumber}</strong> akan dibatalkan. Tindakan ini tidak dapat dikembalikan.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={onConfirm} disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 rounded-xl transition-all disabled:opacity-70">
          {submitting ? <><Loader2 size={15} className="animate-spin" />Memproses...</> : <><X size={15} />Batalkan PO</>}
        </button>
        <button onClick={onClose} disabled={submitting} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 rounded-xl transition">Tutup</button>
      </div>
    </Modal>
  );
}

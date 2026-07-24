import React, { useState, useEffect } from "react";
import { ArrowLeftRight, Save } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "../shared/Modal";
import { FormField } from "../shared/FormField";
import { inputCls } from "../../config";
import { bulkTransfer, type SparepartListItem } from "../../services/inventory";
import { list as getBranches, type Branch } from "../../services/branches";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedItems: SparepartListItem[];
}

export function BulkTransferModal({ open, onClose, onSuccess, selectedItems }: Props) {
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    getBranches().then(setAllBranches).catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setSourceBranchId("");
      setDestinationBranchId("");
      setNotes("");
      setQuantities({});
    }
  }, [open]);

  useEffect(() => {
    const init: Record<string, number> = {};
    selectedItems.forEach(item => {
      const stock = item.stock_by_branch.find(s => s.branch_id === sourceBranchId)?.quantity || 0;
      init[item.id] = Math.min(stock, 1);
    });
    setQuantities(init);
  }, [sourceBranchId, selectedItems]);

  const destBranches = allBranches.filter(b => b.id !== sourceBranchId);

  function setQty(id: string, val: number) {
    setQuantities(q => ({ ...q, [id]: Math.max(0, val) }));
  }

  function getMaxQty(id: string) {
    const item = selectedItems.find(i => i.id === id);
    if (!item) return 0;
    return item.stock_by_branch.find(s => s.branch_id === sourceBranchId)?.quantity || 0;
  }

  async function handleSubmit() {
    if (!sourceBranchId) {
      toast.error("Pilih cabang asal");
      return;
    }
    if (!destinationBranchId) {
      toast.error("Pilih cabang tujuan");
      return;
    }
    if (sourceBranchId === destinationBranchId) {
      toast.error("Cabang asal dan tujuan tidak boleh sama");
      return;
    }

    const items = selectedItems
      .map(item => ({
        sparepart_id: item.id,
        quantity: quantities[item.id] || 0,
      }))
      .filter(i => i.quantity > 0);

    if (items.length === 0) {
      toast.error("Tidak ada item dengan quantity > 0");
      return;
    }

    setSaving(true);
    try {
      const result = await bulkTransfer({
        items,
        source_branch_id: sourceBranchId,
        destination_branch_id: destinationBranchId,
        notes: notes || undefined,
      });
      toast.success(`${result.items_transferred} item berhasil ditransfer`);
      window.dispatchEvent(new CustomEvent('sparetrack:refresh'));
      onSuccess();
      onClose();
    } catch {
      toast.error("Gagal melakukan transfer");
    } finally {
      setSaving(false);
    }
  }

  const sourceBranchName = allBranches.find(b => b.id === sourceBranchId)?.name || "";

  return (
    <Modal open={open} onClose={onClose} title="Transfer Stok" size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          <ArrowLeftRight size={14} />
          <span>{selectedItems.length} item dipilih untuk transfer</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Cabang Asal" required>
            <select value={sourceBranchId} onChange={e => setSourceBranchId(e.target.value)} className={inputCls}>
              <option value="">-- Pilih Cabang Asal --</option>
              {allBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
          <FormField label="Cabang Tujuan" required>
            <select value={destinationBranchId} onChange={e => setDestinationBranchId(e.target.value)} className={inputCls}>
              <option value="">-- Pilih Cabang Tujuan --</option>
              {destBranches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </FormField>
        </div>
        <FormField label="Catatan">
          <input value={notes} onChange={e => setNotes(e.target.value)} className={inputCls} placeholder="Opsional" />
        </FormField>

        {sourceBranchId && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Kode</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500">Nama</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Stok di {sourceBranchName}</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500">Jumlah Transfer</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map(item => {
                  const maxQty = getMaxQty(item.id);
                  return (
                    <tr key={item.id} className="border-b border-slate-50 dark:border-slate-800/50">
                      <td className="px-4 py-2.5 text-xs text-slate-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.code}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300">{item.name}</td>
                      <td className="px-4 py-2.5 text-center text-sm text-slate-600 dark:text-slate-400">{maxQty}</td>
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={maxQty}
                          value={quantities[item.id] || 0}
                          onChange={e => setQty(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm text-center border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 bg-white dark:bg-slate-800 dark:text-slate-200"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-5">
        <button onClick={handleSubmit} disabled={saving || !sourceBranchId} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all disabled:opacity-50">
          <Save size={15} />{saving ? "Memproses..." : "Transfer Sekarang"}
        </button>
        <button onClick={onClose} className="px-4 text-sm font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 rounded-xl transition">Batal</button>
      </div>
    </Modal>
  );
}

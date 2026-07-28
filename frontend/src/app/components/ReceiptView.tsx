import { useRef, useEffect } from "react";
import { Download, X } from "lucide-react";
import { toast } from "sonner";
import type { PurchaseOrderDetail } from "../services/restock";

interface ReceiptViewProps {
  po: PurchaseOrderDetail;
  onClose: () => void;
}

const W = 580;
const LH = 20;
const M = 28;
const FONT = "12px 'Courier New', monospace";
const BOLD = "bold 12px 'Courier New', monospace";
const HDR = "bold 13px 'Courier New', monospace";

function render(ctx: CanvasRenderingContext2D, po: PurchaseOrderDetail) {
  let y = M;
  const cx = W / 2;
  const lx = M;
  const rx = W - M;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, 4000);

  ctx.font = BOLD; ctx.textAlign = 'center'; ctx.fillStyle = '#1e293b';
  ctx.fillText('SPARETRACK', cx, y); y += LH;
  ctx.font = FONT; ctx.fillStyle = '#64748b';
  ctx.fillText('Multi-Branch System', cx, y); y += LH;
  ctx.font = HDR; ctx.fillStyle = '#1e293b';
  ctx.fillText('PURCHASE ORDER', cx, y); y += LH + 6;
  dash(ctx, lx, y, rx); y += LH;

  const info: [string, string][] = [
    ['No. PO', po.po_number],
    ['Tanggal', new Date(po.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })],
    ['Supplier', po.supplier],
    ['Cabang', po.branch],
  ];
  if (po.notes) info.push(['Catatan', po.notes]);
  for (const [l, v] of info) {
    ctx.font = FONT; ctx.textAlign = 'left'; ctx.fillStyle = '#64748b'; ctx.fillText(l, lx, y);
    ctx.textAlign = 'right'; ctx.fillStyle = '#1e293b';
    const maxW = rx - lx - 10;
    const display = ctx.measureText(v).width > maxW ? v.slice(0, Math.floor(v.length * maxW / ctx.measureText(v).width) - 3) + '...' : v;
    ctx.fillText(display, rx, y); y += LH;
  }
  y += 4; dash(ctx, lx, y, rx); y += LH - 2;

  const tx = [lx, lx + 20, lx + 270, lx + 370, lx + 470];
  ctx.font = HDR; ctx.fillStyle = '#334155';
  ctx.textAlign = 'left'; ctx.fillText('#', tx[0], y);
  ctx.fillText('Item', tx[1], y);
  ctx.textAlign = 'right'; ctx.fillText('Qty', tx[2], y);
  ctx.fillText('Harga', tx[3], y);
  ctx.fillText('Total', tx[4], y);
  y += LH; line(ctx, lx, y, rx); y += 4;

  ctx.font = FONT; ctx.fillStyle = '#475569';
  for (const item of po.items) {
    const p = item;
    const lineY = y;

    ctx.textAlign = 'left';
    ctx.fillText(String(po.items.indexOf(item) + 1), tx[0], lineY);

    const nameStr = `${p.name} (${p.code})`;
    const maxNameW = tx[2] - tx[1] - 8;
    const displayName = ctx.measureText(nameStr).width > maxNameW ? nameStr.slice(0, Math.floor(nameStr.length * maxNameW / ctx.measureText(nameStr).width) - 3) + '...' : nameStr;
    ctx.fillText(displayName, tx[1], lineY);

    ctx.textAlign = 'right';
    ctx.fillText(`${p.quantity} ${p.unit}`, tx[2], lineY);
    ctx.fillText(`Rp ${(p.unit_price || 0).toLocaleString()}`, tx[3], lineY);
    ctx.font = BOLD; ctx.fillText(`Rp ${(p.total_price || 0).toLocaleString()}`, tx[4], lineY);
    ctx.font = FONT; y += LH;
  }
  y += 4; dash(ctx, lx, y, rx); y += LH - 2;

  const tq = po.items.reduce((s, i) => s + i.quantity, 0);
  ctx.font = HDR; ctx.fillStyle = '#1e293b';
  ctx.textAlign = 'left'; ctx.fillText(`Total Item: ${tq}`, lx, y);
  ctx.textAlign = 'right'; ctx.fillText(`Rp ${(po.total_amount || 0).toLocaleString()}`, rx, y);
  y += LH + 6; dash(ctx, lx, y, rx); y += LH - 2;

  ctx.textAlign = 'center'; ctx.font = FONT; ctx.fillStyle = '#64748b';
  ctx.fillText('Terima kasih', cx, y); y += LH;
  ctx.font = "11px 'Courier New', monospace"; ctx.fillStyle = '#94a3b8';
  ctx.fillText(`Dicetak: ${new Date().toLocaleString('id-ID')}`, cx, y);

  return y + M;
}

function line(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number, y2?: number) {
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y2 ?? y); ctx.stroke();
}

function dash(ctx: CanvasRenderingContext2D, x1: number, y: number, x2: number) {
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.setLineDash([]);
}

export function ReceiptView({ po, onClose }: ReceiptViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;
    const h = render(ctx, po);
    cvs.width = W * 2;
    cvs.height = h * 2;
    ctx.scale(2, 2);
    render(ctx, po);
  }, [po]);

  function handleDownload() {
    const cvs = canvasRef.current;
    if (!cvs) return;
    try {
      const link = document.createElement('a');
      link.download = `struk-${po.po_number}.png`;
      link.href = cvs.toDataURL('image/png');
      link.click();
      toast.success('Struk berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh struk');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <canvas ref={canvasRef} className="w-full" style={{ display: 'block' }} />
        <div className="flex gap-3 p-4 border-t border-slate-100">
          <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 active:scale-95 rounded-xl transition-all shadow-sm">
            <Download size={14} />Download Struk
          </button>
          <button onClick={onClose} className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all">
            <X size={14} />Kembali
          </button>
        </div>
      </div>
    </div>
  );
}

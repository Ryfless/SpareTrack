import { STATUS_CFG } from "../../config";

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status as keyof typeof STATUS_CFG];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.cls}`}><Icon size={10} />{cfg.label}</span>;
}

import { PRIORITY_CFG } from "../../config";

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low;
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border ${cfg.cls}`}>{cfg.label}</span>;
}

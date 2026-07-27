export const STOCK_STATUS = { CRITICAL: 'critical', LOW: 'low', SAFE: 'safe', OVERSTOCK: 'overstock' } as const;

export function computeStatus(quantity: number, safetyStock: number, reorderPoint: number, maxStock: number): string {
  if (quantity <= (safetyStock || 0)) return STOCK_STATUS.CRITICAL;
  if (quantity <= (reorderPoint || 0)) return STOCK_STATUS.LOW;
  if (quantity > (maxStock || 0)) return STOCK_STATUS.OVERSTOCK;
  return STOCK_STATUS.SAFE;
}

export function computeWorstStatus(statuses: string[]): string {
  const order = [STOCK_STATUS.CRITICAL, STOCK_STATUS.LOW, STOCK_STATUS.OVERSTOCK, STOCK_STATUS.SAFE];
  let worst = STOCK_STATUS.SAFE;
  for (const s of statuses) {
    if (order.indexOf(s as typeof order[number]) < order.indexOf(worst as typeof order[number])) worst = s;
  }
  return worst;
}

const STOCK_STATUS = { CRITICAL: 'critical', LOW: 'low', SAFE: 'safe', OVERSTOCK: 'overstock' };

function computeStatus(quantity, safetyStock, reorderPoint, maxStock) {
  if (quantity <= (safetyStock || 0)) return STOCK_STATUS.CRITICAL;
  if (quantity <= (reorderPoint || 0)) return STOCK_STATUS.LOW;
  if (quantity > (maxStock || 0)) return STOCK_STATUS.OVERSTOCK;
  return STOCK_STATUS.SAFE;
}

function computeWorstStatus(statuses) {
  const order = [STOCK_STATUS.CRITICAL, STOCK_STATUS.LOW, STOCK_STATUS.OVERSTOCK, STOCK_STATUS.SAFE];
  let worst = STOCK_STATUS.SAFE;
  for (const s of statuses) {
    if (order.indexOf(s) < order.indexOf(worst)) worst = s;
  }
  return worst;
}

module.exports = { computeStatus, computeWorstStatus, STOCK_STATUS };

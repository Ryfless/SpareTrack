const { computeStatus, computeWorstStatus, STOCK_STATUS } = require('../../utils/stockStatus');

describe('computeStatus', () => {
  it('returns critical when quantity <= safetyStock', () => {
    expect(computeStatus(5, 10, 20, 50)).toBe(STOCK_STATUS.CRITICAL);
  });

  it('returns critical when quantity is 0', () => {
    expect(computeStatus(0, 10, 20, 50)).toBe(STOCK_STATUS.CRITICAL);
  });

  it('returns low when quantity <= reorderPoint', () => {
    expect(computeStatus(15, 10, 20, 50)).toBe(STOCK_STATUS.LOW);
  });

  it('returns overstock when quantity > maxStock', () => {
    expect(computeStatus(60, 10, 20, 50)).toBe(STOCK_STATUS.OVERSTOCK);
  });

  it('returns safe when quantity is between reorderPoint and maxStock', () => {
    expect(computeStatus(30, 10, 20, 50)).toBe(STOCK_STATUS.SAFE);
  });

  it('handles null safetyStock — falls to reorderPoint check', () => {
    expect(computeStatus(5, null, 20, 50)).toBe(STOCK_STATUS.LOW);
  });

  it('handles null reorderPoint — falls to maxStock check', () => {
    expect(computeStatus(5, 10, null, 50)).toBe(STOCK_STATUS.CRITICAL);
  });

  it('handles null maxStock — defaults to 0, overstock if > 0', () => {
    expect(computeStatus(999, 10, 20, null)).toBe(STOCK_STATUS.OVERSTOCK);
  });
});

describe('computeWorstStatus', () => {
  it('returns critical as highest priority', () => {
    expect(computeWorstStatus(['safe', 'low', 'critical'])).toBe(STOCK_STATUS.CRITICAL);
  });

  it('returns low over safe', () => {
    expect(computeWorstStatus(['safe', 'low', 'overstock'])).toBe(STOCK_STATUS.LOW);
  });

  it('returns overstock if only safe and overstock', () => {
    expect(computeWorstStatus(['safe', 'overstock'])).toBe(STOCK_STATUS.OVERSTOCK);
  });

  it('returns safe if all safe', () => {
    expect(computeWorstStatus(['safe', 'safe'])).toBe(STOCK_STATUS.SAFE);
  });

  it('returns safe for empty array (default fallback)', () => {
    expect(computeWorstStatus([])).toBe(STOCK_STATUS.SAFE);
  });
});

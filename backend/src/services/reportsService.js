const { supabaseAdmin: supabase } = require('../config/supabase');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { computeStatus, STOCK_STATUS } = require('../utils/stockStatus');

function getMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function generateMonthEnds(start, end) {
  const result = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const endD = new Date(end);
  while (cur <= endD) {
    const me = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    result.push(me);
    cur.setMonth(cur.getMonth() + 1);
  }
  return result;
}

async function getStockHealth({ branch_id, start_date, end_date }) {
  const { data: stocks } = await supabase
    .from('branch_stocks')
    .select('sparepart_id, branch_id, quantity, safety_stock, reorder_point, max_stock')
    .order('sparepart_id');
  if (!stocks || stocks.length === 0) return [];

  const start = new Date(start_date || Date.now() - 30 * 86400000);
  const end = new Date(end_date || Date.now());
  const monthEnds = generateMonthEnds(start, end);
  if (monthEnds.length === 0) return [];

  // Rekonstruksi perlu movements SETELAH month-end terawal
  const afterFirst = new Date(monthEnds[0]);
  afterFirst.setDate(afterFirst.getDate() + 1);

  let movQ = supabase
    .from('stock_movements')
    .select('sparepart_id, branch_id, type, quantity, created_at')
    .gte('created_at', afterFirst.toISOString().split('T')[0]);

  const { data: movements } = await movQ;

  // Hitung net change per (sparepart, branch, month)
  const netByKey = {};
  for (const m of (movements || [])) {
    const mk = getMonthKey(new Date(m.created_at));
    const k = `${m.sparepart_id}|${m.branch_id}`;
    if (!netByKey[k]) netByKey[k] = {};
    if (!netByKey[k][mk]) netByKey[k][mk] = 0;
    if (m.type === 'in') netByKey[k][mk] += m.quantity;
    else if (m.type === 'out') netByKey[k][mk] -= Math.abs(m.quantity);
    else if (m.type === 'adjustment') netByKey[k][mk] += (m.quantity || 0);
    else if (m.type === 'transfer') netByKey[k][mk] -= Math.abs(m.quantity);
  }

  // Gabung semua month keys (data + chart)
  const chartMks = monthEnds.map(me => getMonthKey(me));
  const allMks = [...new Set([...chartMks, ...Object.values(netByKey).flatMap(n => Object.keys(n))])].sort();

  // Precompute cumulative setelah tiap month
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const healthMap = {};

  for (const stock of stocks) {
    if (branch_id && stock.branch_id !== branch_id) continue;
    const k = `${stock.sparepart_id}|${stock.branch_id}`;
    const nets = netByKey[k] || {};

    let totalAfter = 0;
    const cumAfter = {};
    for (let i = allMks.length - 1; i >= 0; i--) {
      cumAfter[allMks[i]] = totalAfter;
      totalAfter += (nets[allMks[i]] || 0);
    }

    for (const me of monthEnds) {
      const mk = getMonthKey(me);
      const stok = Math.max(0, Math.round(stock.quantity - (cumAfter[mk] || 0)));
      const status = computeStatus(stok, stock.safety_stock || 0, stock.reorder_point || 0, stock.max_stock || 0);

      if (!healthMap[mk]) {
        healthMap[mk] = { month: monthLabels[me.getMonth()], critical: 0, low: 0, safe: 0, overstock: 0 };
      }
      healthMap[mk][status]++;
    }
  }

  return Object.entries(healthMap).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
}

async function getSafeStockRatio(branch_id) {
  let q = supabase
    .from('branch_stocks')
    .select('quantity, safety_stock, reorder_point, max_stock');
  if (branch_id) q = q.eq('branch_id', branch_id);
  const { data: stocks } = await q;
  if (!stocks || stocks.length === 0) return { ratio: 0, safe_count: 0, total_items: 0 };

  let safe = 0;
  for (const s of stocks) {
    const status = computeStatus(s.quantity, s.safety_stock || 0, s.reorder_point || 0, s.max_stock || 0);
    if (status === STOCK_STATUS.SAFE) safe++;
  }
  return {
    ratio: Math.round((safe / stocks.length) * 100),
    safe_count: safe,
    total_items: stocks.length,
  };
}

async function summary(query) {
  const { branch_id, start_date, end_date } = query;

  const defaultStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const defaultEnd = new Date().toISOString();

  let movQuery = supabase
    .from('stock_movements')
    .select('type, quantity, created_at, branch_id, sparepart_id');

  if (branch_id) movQuery = movQuery.eq('branch_id', branch_id);
  movQuery = movQuery
    .gte('created_at', start_date || defaultStart)
    .lte('created_at', end_date || defaultEnd);

  const { data: movements } = await movQuery;

  const totalIn = movements?.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0) || 0;
  const totalOut = movements?.filter(m => m.type === 'out').reduce((s, m) => s + Math.abs(m.quantity), 0) || 0;
  const totalAdjustment = movements?.filter(m => m.type === 'adjustment').reduce((s, m) => s + m.quantity, 0) || 0;
  const totalTransfer = movements?.filter(m => m.type === 'transfer').length || 0;

  // Monthly trend for charts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const outMovements = (movements || []).filter(m => m.type === 'out');
  const spIds = [...new Set((movements || []).map(m => m.sparepart_id).filter(Boolean))];
  const { data: sparepartPrices } = await supabase
    .from('spareparts')
    .select('id, price')
    .in('id', spIds);
  const priceMap = Object.fromEntries((sparepartPrices || []).map(sp => [sp.id, sp.price || 0]));

  const trendMap = {};
  for (const m of outMovements) {
    const d = new Date(m.created_at);
    const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!trendMap[mk]) trendMap[mk] = { units: 0, revenue: 0 };
    trendMap[mk].units += m.quantity;
    trendMap[mk].revenue += m.quantity * (priceMap[m.sparepart_id] || 0);
  }

  const monthlyTrend = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, val]) => ({
      month: (() => { const [, m] = key.split('-'); return monthNames[parseInt(m) - 1]; })(),
      units: val.units,
      revenue: +(val.revenue / 1000000).toFixed(1),
    }));

  // Total items — respect branch filter
  let totalItems;
  if (branch_id) {
    const { count } = await supabase
      .from('branch_stocks')
      .select('sparepart_id', { count: 'exact', head: true })
      .eq('branch_id', branch_id);
    totalItems = count || 0;
  } else {
    const { count } = await supabase
      .from('spareparts')
      .select('id', { count: 'exact', head: true });
    totalItems = count || 0;
  }

  // Critical items — using safety_stock comparison
  let critQuery = supabase
    .from('branch_stocks')
    .select('*, spareparts(name, code), branches(name)');

  if (branch_id) critQuery = critQuery.eq('branch_id', branch_id);

  const { data: allBranchStocks } = await critQuery;

  const criticalItems = (allBranchStocks || []).filter(
    bs => computeStatus(bs.quantity, bs.safety_stock || 0, bs.reorder_point, bs.max_stock) === 'critical'
  );

  // Top 1 sparepart by sales volume
  const topGrouped = {};
  for (const m of outMovements) {
    topGrouped[m.sparepart_id] = (topGrouped[m.sparepart_id] || 0) + m.quantity;
  }
  const topEntry = Object.entries(topGrouped).sort(([, a], [, b]) => b - a)[0];

  let topSparepart = { name: '', total_sold: 0, avg_monthly: 0 };
  if (topEntry) {
    const { data: sp } = await supabase
      .from('spareparts')
      .select('name')
      .eq('id', topEntry[0])
      .single();
    const start = new Date(start_date || defaultStart);
    const end = new Date(end_date || defaultEnd);
    const monthCount = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1);
    topSparepart = {
      name: sp?.name || '',
      total_sold: topEntry[1],
      avg_monthly: Math.round(topEntry[1] / monthCount),
    };
  }

  const [stock_health, safe_stock_ratio] = await Promise.all([
    getStockHealth({ branch_id, start_date, end_date }),
    getSafeStockRatio(branch_id),
  ]);

  return {
    period: {
      start: start_date || defaultStart,
      end: end_date || defaultEnd,
    },
    stock_movements: {
      total_in: totalIn,
      total_out: totalOut,
      total_adjustment: totalAdjustment,
      total_transfer: totalTransfer,
      net_flow: totalIn - totalOut,
    },
    inventory: {
      total_items: totalItems,
      critical_items: criticalItems.length,
      critical_list: criticalItems.map(c => ({
        name: c.spareparts?.name || '',
        code: c.spareparts?.code || '',
        branch: c.branches?.name || '',
        quantity: c.quantity,
      })),
    },
    monthly_trend: monthlyTrend,
    top_sparepart: topSparepart,
    stock_health,
    safe_stock_ratio,
  };
}

function validateDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = (end - start) / (1000 * 60 * 60 * 24);
  if (diffDays > 30) {
    const err = new Error('Rentang tanggal maksimal 30 hari');
    err.status = 400;
    throw err;
  }
}

async function fetchTransactions(startDate, endDate, branchId) {
  let qry = supabase
    .from('stock_movements')
    .select('*, spareparts(name, code), branches(name)')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  if (branchId) qry = qry.eq('branch_id', branchId);

  const { data } = await qry;
  return data || [];
}

async function fetchCriticalItems() {
  const { data } = await supabase
    .from('branch_stocks')
    .select('*, spareparts(name, code), branches(name)')
    .order('quantity', { ascending: true });

  return (data || []).filter(
    bs => computeStatus(bs.quantity, bs.safety_stock || 0, bs.reorder_point, bs.max_stock) === 'critical'
  );
}

async function exportPdf(type, startDate, endDate, branchId) {
  validateDateRange(startDate, endDate);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const buffers = [];
  doc.on('data', c => buffers.push(c));

  return new Promise(async (resolve, reject) => {
    try {
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const label = type === 'summary' ? 'Ringkasan Laporan'
        : type === 'transactions' ? 'Transaksi Stok'
        : 'Item Stok Kritis';

      doc.fontSize(16).font('Helvetica-Bold').text('SpareTrack', { align: 'left' });
      doc.fontSize(10).font('Helvetica').fillColor('#666').text('Multi-Branch System — Laporan Export', { align: 'left' });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.5);
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#000').text(label);
      doc.fontSize(9).fillColor('#666').text(`Periode: ${new Date(startDate).toLocaleDateString('id-ID')} — ${new Date(endDate).toLocaleDateString('id-ID')}`);
      if (branchId) doc.text(`Cabang: ${branchId}`);
      doc.moveDown(1);

      if (type === 'summary') {
        const data = await summary({ start_date: startDate, end_date: endDate, branch_id: branchId });
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#000').text('Ringkasan Pergerakan Stok');
        doc.moveDown(0.3);
        const rows = [
          ['Total Masuk', String(data.stock_movements.total_in)],
          ['Total Keluar', String(data.stock_movements.total_out)],
          ['Penyesuaian', String(data.stock_movements.total_adjustment)],
          ['Transfer', String(data.stock_movements.total_transfer)],
          ['Net Flow', String(data.stock_movements.net_flow)],
        ];
        drawTable(doc, ['Metrik', 'Nilai'], rows);
        doc.moveDown(1);
        doc.fontSize(10).font('Helvetica-Bold').text('Ringkasan Inventori');
        doc.moveDown(0.3);
        const invRows = [
          ['Total Item', String(data.inventory.total_items)],
          ['Item Kritis', String(data.inventory.critical_items)],
        ];
        drawTable(doc, ['Metrik', 'Nilai'], invRows);

        if (data.inventory.critical_list.length > 0) {
          doc.moveDown(1);
          doc.fontSize(10).font('Helvetica-Bold').text('Item Stok Kritis');
          doc.moveDown(0.3);
          const critRows = data.inventory.critical_list.map(c => [c.name, c.code, c.branch, String(c.quantity)]);
          drawTable(doc, ['Sparepart', 'Kode', 'Cabang', 'Stok'], critRows);
        }
      } else if (type === 'transactions') {
        const transactions = await fetchTransactions(startDate, endDate, branchId);
        if (transactions.length === 0) {
          doc.fontSize(10).font('Helvetica').fillColor('#666').text('Tidak ada transaksi dalam periode ini.');
        } else {
          const tRows = transactions.map(t => [
            t.spareparts?.code || '-',
            t.spareparts?.name || '-',
            t.type,
            String(Math.abs(t.quantity)),
            t.branches?.name || '-',
            new Date(t.created_at).toLocaleDateString('id-ID'),
          ]);
          drawTable(doc, ['Kode', 'Sparepart', 'Tipe', 'Qty', 'Cabang', 'Tanggal'], tRows);
        }
      } else if (type === 'critical') {
        const items = await fetchCriticalItems();
        if (items.length === 0) {
          doc.fontSize(10).font('Helvetica').fillColor('#666').text('Tidak ada item kritis.');
        } else {
          const cRows = items.map(c => [
            c.spareparts?.code || '-',
            c.spareparts?.name || '-',
            c.branches?.name || '-',
            String(c.quantity),
            String(c.spareparts?.reorder_point || '-'),
          ]);
          drawTable(doc, ['Kode', 'Sparepart', 'Cabang', 'Stok', 'Reorder'], cRows);
        }
      }

      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.3);
      doc.fontSize(8).fillColor('#999').text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawTable(doc, headers, rows) {
  const colWidth = (545 - 50) / headers.length;
  const startX = 50;
  let y = doc.y;

  doc.fontSize(8).font('Helvetica-Bold').fillColor('#fff');
  doc.rect(startX, y, 545 - 50, 16).fill('#1d4ed8');
  doc.fillColor('#fff');
  headers.forEach((h, i) => {
    doc.text(h, startX + i * colWidth + 3, y + 4, { width: colWidth - 4, align: 'left' });
  });
  y += 16;

  doc.fontSize(8).font('Helvetica').fillColor('#333');
  for (const row of rows) {
    if (y > 750) {
      doc.addPage();
      y = 50;
    }
    const fill = rows.indexOf(row) % 2 === 0 ? '#f8fafc' : '#fff';
    doc.rect(startX, y, 545 - 50, 16).fill(fill);
    doc.fillColor('#333');
    row.forEach((cell, i) => {
      doc.text(String(cell), startX + i * colWidth + 3, y + 4, { width: colWidth - 4, align: 'left' });
    });
    y += 16;
  }

  doc.y = y;
}

async function exportExcel(type, startDate, endDate, branchId) {
  validateDateRange(startDate, endDate);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SpareTrack';
  const sheet = workbook.addWorksheet(type === 'summary' ? 'Ringkasan' : type === 'transactions' ? 'Transaksi' : 'Item Kritis');

  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D4ED8' } },
    border: {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    },
  };
  const cellStyle = {
    border: {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    },
  };

  if (type === 'summary') {
    const data = await summary({ start_date: startDate, end_date: endDate, branch_id: branchId });
    sheet.addRow(['Metrik', 'Nilai']);
    sheet.getRow(1).eachCell(c => { c.style = headerStyle; });
    sheet.addRow(['Total Masuk', data.stock_movements.total_in]);
    sheet.addRow(['Total Keluar', data.stock_movements.total_out]);
    sheet.addRow(['Penyesuaian', data.stock_movements.total_adjustment]);
    sheet.addRow(['Transfer', data.stock_movements.total_transfer]);
    sheet.addRow(['Net Flow', data.stock_movements.net_flow]);
    sheet.addRow([]);
    sheet.addRow(['Total Item', data.inventory.total_items]);
    sheet.addRow(['Item Kritis', data.inventory.critical_items]);
    const lastRowSummary = sheet.lastRow.number;
    for (let r = 2; r <= lastRowSummary; r++) {
      sheet.getRow(r).eachCell(c => { c.style = cellStyle; });
    }
    sheet.getColumn(1).width = 20;
    sheet.getColumn(2).width = 15;

    if (data.inventory.critical_list.length > 0) {
      sheet.addRow([]);
      sheet.addRow(['Sparepart', 'Kode', 'Cabang', 'Stok']);
      const headerRow = sheet.lastRow;
      headerRow.eachCell(c => { c.style = headerStyle; });
      data.inventory.critical_list.forEach(c => {
        sheet.addRow([c.name, c.code, c.branch, c.quantity]);
      });
      for (let r = headerRow.number + 1; r <= sheet.lastRow.number; r++) {
        sheet.getRow(r).eachCell(c => { c.style = cellStyle; });
      }
      sheet.getColumn(3).width = 15;
      sheet.getColumn(4).width = 10;
    }
  } else if (type === 'transactions') {
    const transactions = await fetchTransactions(startDate, endDate, branchId);
    sheet.addRow(['Kode', 'Sparepart', 'Tipe', 'Qty', 'Cabang', 'Tanggal']);
    sheet.getRow(1).eachCell(c => { c.style = headerStyle; });
    transactions.forEach(t => {
      sheet.addRow([
        t.spareparts?.code || '-',
        t.spareparts?.name || '-',
        t.type,
        Math.abs(t.quantity),
        t.branches?.name || '-',
        new Date(t.created_at).toLocaleDateString('id-ID'),
      ]);
    });
    for (let r = 2; r <= sheet.lastRow.number; r++) {
      sheet.getRow(r).eachCell(c => { c.style = cellStyle; });
    }
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 12;
    sheet.getColumn(4).width = 8;
    sheet.getColumn(5).width = 15;
    sheet.getColumn(6).width = 13;
  } else if (type === 'critical') {
    const items = await fetchCriticalItems();
    sheet.addRow(['Kode', 'Sparepart', 'Cabang', 'Stok', 'Reorder Point']);
    sheet.getRow(1).eachCell(c => { c.style = headerStyle; });
    items.forEach(c => {
      sheet.addRow([
        c.spareparts?.code || '-',
        c.spareparts?.name || '-',
        c.branches?.name || '-',
        c.quantity,
        c.spareparts?.reorder_point || '-',
      ]);
    });
    for (let r = 2; r <= sheet.lastRow.number; r++) {
      sheet.getRow(r).eachCell(c => { c.style = cellStyle; });
    }
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 8;
    sheet.getColumn(5).width = 13;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

module.exports = { summary, exportPdf, exportExcel };

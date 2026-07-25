export const BRANCHES_LIST = ["Cabang A - Jakpus", "Cabang B - Bekasi", "Cabang C - Tangerang"];
export const BRANCHES = ["Semua Cabang", ...BRANCHES_LIST];
export const CATEGORIES = ["Pelumas", "Filter", "Rem", "Kelistrikan", "Transmisi", "Pengapian", "Suspensi", "Kopling", "Pendingin", "Mesin"];
export const SUPPLIERS = ["Pertamina", "Sakura", "Bendix", "GS Astra", "Gates", "NGK", "KYB", "Exedy", "SKF", "Toyota Genuine", "Dayco"];

export const SPARE_PARTS = [
  { id: "SP001", code: "OLI-10W40", name: "Oli Mesin 10W-40",      category: "Pelumas",    supplier: "Pertamina",     price: 85000,  stockA: 48,  stockB: 12,  stockC: 35,  minStock: 20, reorderPoint: 30, safetyStock: 15, status: "low",      leadTime: 3  },
  { id: "SP002", code: "FIL-OLI",   name: "Filter Oli Universal",   category: "Filter",     supplier: "Sakura",        price: 45000,  stockA: 85,  stockB: 62,  stockC: 44,  minStock: 25, reorderPoint: 35, safetyStock: 18, status: "safe",     leadTime: 5  },
  { id: "SP003", code: "KMP-REM",   name: "Kampas Rem Depan",       category: "Rem",        supplier: "Bendix",        price: 125000, stockA: 8,   stockB: 4,   stockC: 11,  minStock: 15, reorderPoint: 20, safetyStock: 10, status: "critical", leadTime: 7  },
  { id: "SP004", code: "AKI-45AH",  name: "Aki 12V 45Ah",          category: "Kelistrikan",supplier: "GS Astra",      price: 380000, stockA: 22,  stockB: 18,  stockC: 9,   minStock: 10, reorderPoint: 15, safetyStock: 8,  status: "safe",     leadTime: 4  },
  { id: "SP005", code: "VBT-STD",   name: "V-Belt Standard",        category: "Transmisi",  supplier: "Gates",         price: 95000,  stockA: 3,   stockB: 7,   stockC: 2,   minStock: 12, reorderPoint: 18, safetyStock: 8,  status: "critical", leadTime: 6  },
  { id: "SP006", code: "BSI-NGK",   name: "Busi NGK Iridium",       category: "Pengapian",  supplier: "NGK",           price: 65000,  stockA: 120, stockB: 95,  stockC: 110, minStock: 30, reorderPoint: 45, safetyStock: 20, status: "overstock",leadTime: 3  },
  { id: "SP007", code: "FIL-UDR",   name: "Filter Udara",           category: "Filter",     supplier: "Sakura",        price: 55000,  stockA: 35,  stockB: 28,  stockC: 42,  minStock: 20, reorderPoint: 28, safetyStock: 12, status: "safe",     leadTime: 4  },
  { id: "SP008", code: "SHK-DEP",   name: "Shock Absorber Depan",   category: "Suspensi",   supplier: "KYB",           price: 285000, stockA: 6,   stockB: 14,  stockC: 9,   minStock: 8,  reorderPoint: 12, safetyStock: 5,  status: "low",      leadTime: 10 },
  { id: "SP009", code: "KMP-KPL",   name: "Kampas Kopling",         category: "Kopling",    supplier: "Exedy",         price: 350000, stockA: 15,  stockB: 8,   stockC: 20,  minStock: 8,  reorderPoint: 12, safetyStock: 6,  status: "safe",     leadTime: 8  },
  { id: "SP010", code: "BRG-ROD",   name: "Bearing Roda Depan",     category: "Suspensi",   supplier: "SKF",           price: 195000, stockA: 4,   stockB: 2,   stockC: 6,   minStock: 8,  reorderPoint: 12, safetyStock: 5,  status: "critical", leadTime: 9  },
  { id: "SP011", code: "CLT-RAD",   name: "Radiator Coolant",       category: "Pendingin",  supplier: "Toyota Genuine",price: 48000,  stockA: 88,  stockB: 75,  stockC: 92,  minStock: 25, reorderPoint: 35, safetyStock: 15, status: "overstock",leadTime: 3  },
  { id: "SP012", code: "TBL-TIM",   name: "Timing Belt Kit",        category: "Mesin",      supplier: "Dayco",         price: 450000, stockA: 12,  stockB: 9,   stockC: 7,   minStock: 6,  reorderPoint: 10, safetyStock: 5,  status: "low",      leadTime: 12 },
];

export const restockRecommendations = [
  { id: 1, name: "Kampas Rem Depan",    code: "KMP-REM", branch: "Cabang A",    currentStock: 8,   forecastDemand: 45, safetyStock: 10, reorderPoint: 20, recommendedQty: 50, priority: "high",      reason: "Stok di bawah safety stock, demand naik 22% bulan ini",             daysToStockout: 5,   supplier: "Bendix"        },
  { id: 2, name: "V-Belt Standard",     code: "VBT-STD", branch: "Cabang A",    currentStock: 3,   forecastDemand: 28, safetyStock: 8,  reorderPoint: 18, recommendedQty: 35, priority: "high",      reason: "Stok kritis, potensi stockout dalam 3 hari ke depan",               daysToStockout: 3,   supplier: "Gates"         },
  { id: 3, name: "Bearing Roda Depan",  code: "BRG-ROD", branch: "Cabang B",    currentStock: 2,   forecastDemand: 18, safetyStock: 5,  reorderPoint: 12, recommendedQty: 20, priority: "high",      reason: "Stok sangat rendah, lead time 9 hari perlu diantisipasi",           daysToStockout: 4,   supplier: "SKF"           },
  { id: 4, name: "Oli Mesin 10W-40",    code: "OLI-10W40",branch: "Cabang B",   currentStock: 12,  forecastDemand: 38, safetyStock: 15, reorderPoint: 30, recommendedQty: 40, priority: "medium",    reason: "Stok mendekati reorder point",                                       daysToStockout: 12,  supplier: "Pertamina"     },
  { id: 5, name: "Shock Absorber Depan",code: "SHK-DEP", branch: "Cabang A",    currentStock: 6,   forecastDemand: 15, safetyStock: 5,  reorderPoint: 12, recommendedQty: 15, priority: "medium",    reason: "Mendekati reorder point, lead time 10 hari",                         daysToStockout: 14,  supplier: "KYB"           },
  { id: 6, name: "Timing Belt Kit",     code: "TBL-TIM", branch: "Cabang C",    currentStock: 7,   forecastDemand: 12, safetyStock: 5,  reorderPoint: 10, recommendedQty: 12, priority: "medium",    reason: "Perlu restock sebelum lead time 12 hari berlalu",                    daysToStockout: 18,  supplier: "Dayco"         },
  { id: 7, name: "Busi NGK Iridium",    code: "BSI-NGK", branch: "Semua",       currentStock: 325, forecastDemand: 85, safetyStock: 20, reorderPoint: 45, recommendedQty: 0,  priority: "overstock", reason: "Stok jauh di atas kebutuhan, pertimbangkan redistribusi",           daysToStockout: 120, supplier: "NGK"           },
  { id: 8, name: "Radiator Coolant",    code: "CLT-RAD", branch: "Semua",       currentStock: 255, forecastDemand: 72, safetyStock: 15, reorderPoint: 35, recommendedQty: 0,  priority: "overstock", reason: "Overstock signifikan, jangan restock dulu",                         daysToStockout: 106, supplier: "Toyota Genuine"},
];

export type RestockItem = typeof restockRecommendations[0];

export const monthlyTrendData = [
  { month: "Jan", cabA: 280, cabB: 210, cabC: 165 }, { month: "Feb", cabA: 305, cabB: 228, cabC: 178 },
  { month: "Mar", cabA: 322, cabB: 215, cabC: 192 }, { month: "Apr", cabA: 310, cabB: 245, cabC: 188 },
  { month: "Mei", cabA: 340, cabB: 262, cabC: 204 }, { month: "Jun", cabA: 320, cabB: 245, cabC: 198 },
];

export const recentActivity = [
  { id: 1, type: "in",       text: "Stok masuk: 50× Oli Mesin 10W-40",          branch: "Cabang A",  time: "10 mnt lalu" },
  { id: 2, type: "out",      text: "Stok keluar: 5× Kampas Rem Depan",          branch: "Cabang B",  time: "25 mnt lalu" },
  { id: 3, type: "transfer", text: "Transfer: 10× Busi NGK ke Cabang C",        branch: "Cab. A→C",  time: "1 jam lalu"  },
  { id: 4, type: "alert",    text: "Peringatan: V-Belt Standard kritis",         branch: "Cabang A",  time: "2 jam lalu"  },
  { id: 5, type: "approval", text: "PO #045 disetujui Admin Pusat",              branch: "Semua",     time: "3 jam lalu"  },
  { id: 6, type: "in",       text: "Stok masuk: 20× Filter Udara",              branch: "Cabang C",  time: "5 jam lalu"  },
];

export const transactions = [
  { id: "TRX001", date: "06 Jul 2025", type: "in",         sparepart: "Oli Mesin 10W-40",    branch: "Cabang A",  qty: 50,  by: "Admin Pusat" },
  { id: "TRX002", date: "06 Jul 2025", type: "out",        sparepart: "Kampas Rem Depan",    branch: "Cabang B",  qty: 5,   by: "Admin B"     },
  { id: "TRX003", date: "05 Jul 2025", type: "transfer",   sparepart: "Busi NGK Iridium",    branch: "Cab. A→C",  qty: 10,  by: "Admin Pusat" },
  { id: "TRX004", date: "05 Jul 2025", type: "out",        sparepart: "V-Belt Standard",     branch: "Cabang A",  qty: 2,   by: "Admin A"     },
  { id: "TRX005", date: "05 Jul 2025", type: "in",         sparepart: "Filter Udara",        branch: "Cabang C",  qty: 20,  by: "Admin C"     },
  { id: "TRX006", date: "04 Jul 2025", type: "adjustment", sparepart: "Bearing Roda Depan",  branch: "Cabang B",  qty: -1,  by: "Admin B"     },
  { id: "TRX007", date: "04 Jul 2025", type: "out",        sparepart: "Aki 12V 45Ah",        branch: "Cabang A",  qty: 3,   by: "Admin A"     },
  { id: "TRX008", date: "04 Jul 2025", type: "in",         sparepart: "Shock Absorber Depan",branch: "Cabang B",  qty: 8,   by: "Admin Pusat" },
  { id: "TRX009", date: "03 Jul 2025", type: "out",        sparepart: "Timing Belt Kit",     branch: "Cabang C",  qty: 1,   by: "Admin C"     },
  { id: "TRX010", date: "03 Jul 2025", type: "transfer",   sparepart: "Filter Oli Universal",branch: "Cab. B→A",  qty: 15,  by: "Admin Pusat" },
];

import React from "react";
import {
  LayoutDashboard, Package, ShoppingCart, Building2, ArrowLeftRight,
  FileBarChart, Settings, CheckCircle, AlertTriangle, AlertCircle,
  ArrowUpRight, ArrowDownRight, Activity, RefreshCcw, Shield,
  BarChart3, Zap, Layers, Target,
} from "lucide-react";
import type { Role, PageId } from "../types";

export const inputCls = "w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-white dark:bg-slate-800 dark:text-slate-200 transition";

export const STATUS_CFG = {
  safe:      { label: "Aman",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle  },
  low:       { label: "Menipis",   cls: "bg-amber-50 text-amber-700 border-amber-200",       icon: AlertTriangle },
  critical:  { label: "Kritis",    cls: "bg-red-50 text-red-700 border-red-200",             icon: AlertCircle  },
  overstock: { label: "Overstock", cls: "bg-purple-50 text-purple-700 border-purple-200",   icon: ArrowUpRight },
};

export const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  critical:  { label: "Kritis",   cls: "bg-red-50 text-red-700 border-red-200"             },
  high:      { label: "Menipis",  cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  medium:    { label: "Medium",   cls: "bg-amber-50 text-amber-700 border-amber-200"       },
  low:       { label: "Low",      cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overstock: { label: "Overstock",cls: "bg-purple-50 text-purple-700 border-purple-200"   },
};

export const TRX_CFG: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  in:         { label: "Stok Masuk",    cls: "bg-emerald-50 text-emerald-700", icon: ArrowDownRight },
  out:        { label: "Stok Keluar",   cls: "bg-red-50 text-red-700",         icon: ArrowUpRight   },
  transfer:   { label: "Transfer",      cls: "bg-blue-50 text-blue-700",       icon: Activity       },
  adjustment: { label: "Penyesuaian",   cls: "bg-purple-50 text-purple-700",   icon: RefreshCcw     },
};

export const ROLE_CFG: Record<Role, { label: string; cls: string; pages: PageId[] }> = {
  super_admin:  { label: "Super Admin",  cls: "bg-blue-100 text-blue-700",    pages: ["dashboard","inventory","restock","branches","transactions","reports","settings"] },
  branch_admin: { label: "Admin Cabang", cls: "bg-emerald-100 text-emerald-700", pages: ["dashboard","inventory","restock","transactions"] },
};

export const NAV_SECTIONS = [
  { title: "MAIN",       items: [{ id: "dashboard"    as PageId, label: "Dashboard",         icon: LayoutDashboard }] },
  { title: "OPERATIONS", items: [{ id: "inventory"    as PageId, label: "Inventory",          icon: Package        },
                                  { id: "restock"      as PageId, label: "Restock",            icon: ShoppingCart   },
                                  { id: "transactions" as PageId, label: "Transactions",       icon: ArrowLeftRight }] },
  { title: "MONITORING", items: [{ id: "branches"     as PageId, label: "Branch Monitoring",  icon: Building2      }], roles: ["super_admin" as Role] },
  { title: "REPORTS",    items: [{ id: "reports"      as PageId, label: "Reports",            icon: FileBarChart   }], roles: ["super_admin" as Role] },
  { title: "SYSTEM",     items: [{ id: "settings"     as PageId, label: "Settings",           icon: Settings       }], roles: ["super_admin" as Role] },
];

export const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard", inventory: "Inventory Management", restock: "Restock Recommendation",
  branches: "Branch Monitoring", transactions: "Transactions", reports: "Reports", settings: "Settings",
};

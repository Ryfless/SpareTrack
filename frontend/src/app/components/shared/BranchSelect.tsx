import React, { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { list as getBranches, type Branch } from "../../services/branches";

interface Props {
  value: string;
  onChange: (branchId: string) => void;
  className?: string;
  role?: string;
  userBranch?: string;
}

export function BranchSelect({ value, onChange, className = "", role, userBranch }: Props) {
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
  }, []);

  const isBranchAdmin = role === "branch_admin";

  useEffect(() => {
    if (isBranchAdmin && userBranch) {
      const match = branches.find(b => b.name === userBranch || b.id === userBranch);
      if (match && value !== match.id) {
        onChange(match.id);
      }
    }
  }, [isBranchAdmin, userBranch, branches, value, onChange]);

  const displayBranches = isBranchAdmin
    ? branches.filter(b => b.name === userBranch || b.id === userBranch)
    : branches;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm ${className}`}>
      <Building2 size={12} className="text-blue-600 shrink-0" />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={isBranchAdmin}
        className="bg-transparent text-slate-700 dark:text-slate-300 text-sm outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {!isBranchAdmin && <option value="">Semua Cabang</option>}
        {displayBranches.map(b => (
          <option key={b.id} value={b.id}>{b.name}</option>
        ))}
      </select>
    </div>
  );
}

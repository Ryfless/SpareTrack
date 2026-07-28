import React from "react";

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""} ${className}`}>
      {children}
    </div>
  );
}

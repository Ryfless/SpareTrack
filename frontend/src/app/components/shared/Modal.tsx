import React, { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, size = "md", children }: {
  open: boolean; onClose: () => void; title: string; size?: "sm" | "md" | "lg"; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const mw = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-md";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: "blur(4px)" }}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full ${mw} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white dark:bg-slate-900 flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl z-10">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"><X size={15} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

import React from "react";
import { Plus } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType; title: string; description: string; action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800">
        <Icon size={28} className="text-blue-400" />
      </div>
      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <button onClick={action.onClick} className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition active:scale-95">
          <Plus size={14} />{action.label}
        </button>
      )}
    </div>
  );
}

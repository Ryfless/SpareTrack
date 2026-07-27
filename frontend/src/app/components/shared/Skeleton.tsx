export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />;
}

export function RecommendCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
          </div>
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-full w-14" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center space-y-1.5">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mx-auto" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 mx-auto" />
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2 text-center space-y-1.5">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-8 mx-auto" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 mx-auto" />
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center space-y-1.5">
            <div className="h-6 bg-blue-200 dark:bg-blue-700/40 rounded w-8 mx-auto" />
            <div className="h-3 bg-blue-200 dark:bg-blue-700/40 rounded w-16 mx-auto" />
          </div>
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 bg-blue-200 dark:bg-blue-700/40 rounded-lg flex-1" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg w-16" />
        </div>
      </div>
    </div>
  );
}

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

const components: Components = {
  h2: ({ children }) => (
    <div className="flex items-start gap-2.5 py-3 px-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg mb-3">
      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">{children}</span>
    </div>
  ),
  p: ({ children }) => (
    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-700 dark:text-slate-300">{children}</strong>
  ),
  ul: ({ children }) => (
    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-2 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1 mb-2 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2">
      <span className="text-blue-400 mt-0.5 shrink-0">•</span>
      <span>{children}</span>
    </li>
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3 last:mb-0">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-50 dark:bg-slate-800/50">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{children}</th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">{children}</td>
  ),
  hr: () => <hr className="my-3 border-slate-100 dark:border-slate-800 last:hidden" />,
  code: ({ className, children }) => {
    if (className?.includes('language-')) {
      return <code className="block bg-slate-800 text-slate-200 text-[11px] px-3 py-2 rounded-lg mb-2 overflow-x-auto">{children}</code>;
    }
    return <code className="text-[11px] bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1 py-0.5 rounded">{children}</code>;
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="px-4 pb-3 space-y-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

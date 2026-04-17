'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { matchesSearch } from '@/lib/search-normalizer';
import { Search } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface SearchComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Override the default partial-match filter */
  filter?: (option: ComboboxOption, query: string) => boolean;
  /** Notified whenever the search query string changes (for parent-side ranking) */
  onQueryChange?: (query: string) => void;
  className?: string;
}

export function SearchCombobox({
  value,
  onChange,
  options,
  placeholder = '検索...',
  disabled,
  filter,
  onQueryChange,
  className,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((opt) =>
    filter
      ? filter(opt, query)
      : matchesSearch(opt.label, query) ||
        (opt.sublabel ? matchesSearch(opt.sublabel, query) : false),
  );

  return (
    <div ref={wrapRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm',
          'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className="truncate">
          {selected ? selected.label : <span className="text-slate-400">{placeholder}</span>}
        </span>
        <Search className="size-4 text-slate-400 shrink-0 ml-2" />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => {
                const v = e.target.value;
                setQuery(v);
                onQueryChange?.(v);
              }}
              placeholder="検索キーワードを入力"
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-xs text-slate-400">候補がありません</li>
            )}
            {filtered.slice(0, 50).map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-blue-50',
                    opt.value === value && 'bg-blue-50 font-semibold',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div className="text-xs text-slate-500 truncate">{opt.sublabel}</div>
                      )}
                    </div>
                    {opt.badge && (
                      <span className="shrink-0 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.5">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

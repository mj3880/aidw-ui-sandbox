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
    <div ref={wrapRef} className={cn('searchbox', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'input flex items-center justify-between text-left',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <span className="truncate">
          {selected ? (
            selected.label
          ) : (
            <span style={{ color: 'var(--text-subtle)' }}>{placeholder}</span>
          )}
        </span>
        <Search className="size-4 shrink-0 ml-2" style={{ color: 'var(--text-subtle)' }} />
      </button>

      {open && !disabled && (
        <div className="search-results">
          <div className="p-2" style={{ borderBottom: '1px solid var(--border)' }}>
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
              className="input"
              style={{ padding: '6px 10px', fontSize: 13 }}
            />
          </div>
          <ul>
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px]" style={{ color: 'var(--text-subtle)' }}>
                候補がありません
              </li>
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
                  className={cn('search-item', opt.value === value && 'priority')}
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && <div className="code truncate">{opt.sublabel}</div>}
                  </div>
                  {opt.badge && <span className="pri-tag">{opt.badge}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

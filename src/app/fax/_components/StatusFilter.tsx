'use client';

import { cn } from '@/lib/utils';

export type FilterValue = 'all' | 'pending' | 'in_progress' | 'done';

const ITEMS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'すべて' },
  { value: 'pending', label: '未対応' },
  { value: 'in_progress', label: '対応中' },
  { value: 'done', label: '対応済み' },
];

export function StatusFilter({
  value,
  onChange,
}: {
  value: FilterValue;
  onChange: (v: FilterValue) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 bg-white p-1 shadow-sm">
      {ITEMS.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={cn(
            'rounded px-3 py-1.5 text-sm font-medium transition',
            value === it.value
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

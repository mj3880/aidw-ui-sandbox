'use client';

import { cn } from '@/lib/utils';
import { STATUS_LABEL, type RequestStatus } from '@/types/request';

export type FilterValue = 'all' | RequestStatus;

const ITEMS: { value: FilterValue; label: string }[] = [
  { value: 'all', label: 'すべて' },
  ...(Object.entries(STATUS_LABEL) as [RequestStatus, string][]).map(
    ([value, label]) => ({ value, label }),
  ),
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
